package com.ecowatch.controller;

import com.ecowatch.dto.MessageRequest;
import com.ecowatch.entity.Message;
import com.ecowatch.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestHeader("userId") Long senderId, @RequestBody MessageRequest request) {
        try {
            Message message = messageService.sendMessage(senderId, request);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", message);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Service Error: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/inbox")
    public ResponseEntity<?> getInbox(@RequestHeader("userId") Long userId) {
        try {
            List<Message> messages = messageService.getMessagesForUser(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", messages);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/sent")
    public ResponseEntity<?> getSent(@RequestHeader("userId") Long userId) {
        try {
            List<Message> messages = messageService.getSentMessages(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", messages);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
