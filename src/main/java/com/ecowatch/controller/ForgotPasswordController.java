package com.ecowatch.controller;

import com.ecowatch.service.EmailService;
import com.ecowatch.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class ForgotPasswordController {

    private final EmailService emailService;
    private final UserService userService;

    @Autowired
    public ForgotPasswordController(EmailService emailService, UserService userService) {
        this.emailService = emailService;
        this.userService = userService;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
        }

        if (!userService.userExists(email)) {
            return ResponseEntity.status(404).body(Map.of("message", "Account with this email not found."));
        }

        try {
            String otp = userService.generateAndSaveOtp(email);
            emailService.sendOtp(email, otp);
            return ResponseEntity.ok(Map.of("message", "OTP sent successfully to your email."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "message", "Failed to send OTP. Please check email settings.",
                "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");

        if (userService.validateOtp(email, otp)) {
            return ResponseEntity.ok(Map.of("message", "OTP verified. You can now reset your password."));
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired OTP."));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        String newPassword = body.get("newPassword");

        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters."));
        }

        // Final verification before reset
        if (userService.validateOtp(email, otp)) {
            if (userService.updatePassword(email, newPassword)) {
                return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
            } else {
                return ResponseEntity.status(404).body(Map.of("message", "User not found."));
            }
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired OTP session."));
        }
    }
}
