package com.jobentra.crm.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateJobRequest {

    @NotBlank
    private String title;

    private String description;

    @NotBlank
    private String customerId;

    private String status;
    private String salaryRange;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSalaryRange() { return salaryRange; }
    public void setSalaryRange(String salaryRange) { this.salaryRange = salaryRange; }
}
