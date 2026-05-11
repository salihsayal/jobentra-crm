package com.jobentra.crm.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateActivityRequest {

    @NotBlank
    private String type;

    @NotBlank
    private String content;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
