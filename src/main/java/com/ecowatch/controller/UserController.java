package com.ecowatch.controller;
 
import com.ecowatch.entity.User;
import com.ecowatch.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
 
import java.util.List;
import java.util.Map;
 
@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*")
public class UserController {
 
    private final UserService userService;
 
    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }
 
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
 
    @PutMapping("/{id}/status")
    public ResponseEntity<User> updateStatus(@PathVariable("id") Long id, @RequestBody Map<String, Boolean> body) {
        return ResponseEntity.ok(userService.updateUserStatus(id, body.get("active")));
    }
 
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable("id") Long id, @RequestBody Map<String, String> body) {
        String name = body.get("name");
        com.ecowatch.entity.Role role = com.ecowatch.entity.Role.valueOf(body.get("role"));
        return ResponseEntity.ok(userService.updateUser(id, name, role));
    }
}
