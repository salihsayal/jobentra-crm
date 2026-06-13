package com.jobentra.crm.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateTimelineEventRequest {

    @NotBlank
    private String eventType;

    @NotBlank
    private String title;

    private String description;

    private String userName;

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
}
