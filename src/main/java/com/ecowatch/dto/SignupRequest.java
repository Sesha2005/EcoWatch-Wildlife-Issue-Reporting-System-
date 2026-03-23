package com.ecowatch.dto;

import com.ecowatch.entity.Role;

public class SignupRequest {
    private String name;
    private String email;
    private String password;
    private Role role; // Added role selection for ease of testing, normally users are just CITIZEN

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
