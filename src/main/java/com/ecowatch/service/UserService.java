package com.ecowatch.service;

import com.ecowatch.dto.SignupRequest;
import com.ecowatch.dto.LoginRequest;
import com.ecowatch.entity.Role;
import com.ecowatch.entity.User;
import com.ecowatch.exception.UserAlreadyExistsException;
import com.ecowatch.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User registerUser(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("A user with this email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        // If a role is provided, set it, otherwise default to CITIZEN
        user.setRole(request.getRole() != null ? request.getRole() : Role.CITIZEN);
        user.setActive(true);

        return userRepository.save(user);
    }

    public Optional<User> authenticateUser(LoginRequest request) {
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            // Check if password matches AND account is active
            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                if (Boolean.TRUE.equals(user.getActive())) {
                    return userOptional;
                }
            }
        }
        return Optional.empty();
    }

    public User updateUserStatus(Long userId, Boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(active);
        return userRepository.save(user);
    }

    public User updateUser(Long id, String name, Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setName(name);
        user.setRole(role);
        return userRepository.save(user);
    }
    
    public boolean userExists(String email) {
        return userRepository.existsByEmail(email);
    }

    public String generateAndSaveOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10)); // 10 minutes expiry
        userRepository.save(user);
        return otp;
    }

    public boolean validateOtp(String email, String otp) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return user.getOtp() != null && 
                   user.getOtp().equals(otp) && 
                   user.getOtpExpiry().isAfter(LocalDateTime.now());
        }
        return false;
    }

    public boolean updatePassword(String email, String rawNewPassword) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPassword(passwordEncoder.encode(rawNewPassword));
            user.setOtp(null); // Clear OTP after use
            user.setOtpExpiry(null);
            userRepository.save(user);
            return true;
        }
        return false;
    }
}
