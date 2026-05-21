package com.jobentra.crm.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UpdateCustomerRequest {

    @NotBlank
    private String companyName;

    private String contactPerson;

    @NotBlank
    @Email
    private String email;

    private String phone;
    private String industry;
    private String status;

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
