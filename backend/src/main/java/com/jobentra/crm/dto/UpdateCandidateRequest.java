package com.jobentra.crm.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UpdateCandidateRequest {

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @NotBlank
    @Email
    private String email;

    private String phone;
    private String status;
    private String skills;
    private String location;
    private Boolean mobility;
    private String availability;
    private String job;

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Boolean getMobility() { return mobility; }
    public void setMobility(Boolean mobility) { this.mobility = mobility; }

    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }

    public String getJob() { return job; }
    public void setJob(String job) { this.job = job; }
}
