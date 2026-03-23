package com.ecowatch.dto;

import com.ecowatch.entity.Role;

public class AuthResponse {
    private String token; // Usually JWT, but here could just be success message if Session-based, or
                          // token placeholder. Let's make it a token or simple string message
    private Role role;
    private String message;
    private Long userId;

    public AuthResponse(String token, Role role, String message, Long userId) {
        this.token = token;
        this.role = role;
        this.message = message;
        this.userId = userId;
    }

    public AuthResponse(Role role, String message, Long userId) {
        this.role = role;
        this.message = message;
        this.userId = userId;
    }

    // Getters and Setters
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
