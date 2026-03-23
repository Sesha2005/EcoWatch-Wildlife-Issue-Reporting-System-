package com.ecowatch.dto;

public class FeedbackRequest {
    private String feedback;
    private int rating;

    public FeedbackRequest() {}

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
}
