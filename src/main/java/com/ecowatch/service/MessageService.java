package com.ecowatch.service;

import com.ecowatch.dto.MessageRequest;
import com.ecowatch.entity.Message;
import com.ecowatch.entity.User;
import com.ecowatch.repository.MessageRepository;
import com.ecowatch.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    public Message sendMessage(Long senderId, MessageRequest request) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        Message message = new Message();
        message.setSenderId(senderId);
        message.setSenderName(sender.getName());
        message.setSenderRole(sender.getRole());
        message.setReceiverId(request.getReceiverId());
        message.setContent(request.getContent());

        return messageRepository.save(message);
    }

    public List<Message> getMessagesForUser(Long userId) {
        return messageRepository.findByReceiverId(userId);
    }

    public List<Message> getSentMessages(Long userId) {
        return messageRepository.findBySenderId(userId);
    }
}
