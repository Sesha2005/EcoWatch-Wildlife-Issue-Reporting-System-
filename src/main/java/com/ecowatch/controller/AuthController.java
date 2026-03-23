package com.ecowatch.controller;

import com.ecowatch.dto.AuthResponse;
import com.ecowatch.dto.LoginRequest;
import com.ecowatch.dto.SignupRequest;
import com.ecowatch.entity.User;
import com.ecowatch.exception.UserAlreadyExistsException;
import com.ecowatch.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;

    @Autowired
    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody SignupRequest request) {
        try {
            User savedUser = userService.registerUser(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new AuthResponse(savedUser.getRole(), "User registered successfully", savedUser.getId()));
        } catch (UserAlreadyExistsException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new AuthResponse(null, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new AuthResponse(null, "Registration failed", null));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        Optional<User> authenticatedUser = userService.authenticateUser(request);

        if (authenticatedUser.isPresent()) {
            User user = authenticatedUser.get();
            // A real app would generate a JWT token here
            String dummyToken = "dummy-jwt-token-for-" + user.getEmail();
            return ResponseEntity.ok(new AuthResponse(dummyToken, user.getRole(), "Login successful", user.getId()));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(null, "Invalid email or password", null));
        }
    }
}
