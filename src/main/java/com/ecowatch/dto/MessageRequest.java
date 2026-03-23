package com.ecowatch.dto;

public class MessageRequest {
    private Long receiverId;
    private String content;

    public MessageRequest() {}

    public Long getReceiverId() { return receiverId; }
    public void setReceiverId(Long receiverId) { this.receiverId = receiverId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
