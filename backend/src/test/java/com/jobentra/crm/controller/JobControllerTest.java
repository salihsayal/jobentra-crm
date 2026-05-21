package com.jobentra.crm.controller;

import com.jobentra.crm.config.JwtUtil;
import com.jobentra.crm.model.Customer;
import com.jobentra.crm.model.Job;
import com.jobentra.crm.model.enums.CustomerStatus;
import com.jobentra.crm.model.enums.JobStatus;
import com.jobentra.crm.repository.BillingRepository;
import com.jobentra.crm.repository.CandidateRepository;
import com.jobentra.crm.repository.CustomerRepository;
import com.jobentra.crm.repository.JobRepository;
import com.jobentra.crm.service.JobService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(JobController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser
class JobControllerTest {

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private CustomerRepository customerRepository;

    @MockBean
    private CandidateRepository candidateRepository;

    @MockBean
    private JobRepository jobRepository;

    @MockBean
    private BillingRepository billingRepository;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private JobService jobService;

    private final UUID jobId = UUID.randomUUID();
    private final UUID customerId = UUID.randomUUID();

    @Test
    void getAll_shouldReturnPage() throws Exception {
        Job job = buildJob();
        Page<Job> page = new PageImpl<>(List.of(job), PageRequest.of(0, 10), 1);
        when(jobService.searchJobs(eq("senior"), eq("OPEN"), eq(customerId), any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/jobs")
                        .param("search", "senior")
                        .param("status", "OPEN")
                        .param("customerId", customerId.toString())
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Senior Backend Developer"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getById_shouldReturnJob_whenFound() throws Exception {
        when(jobService.getJobById(jobId)).thenReturn(Optional.of(buildJob()));

        mockMvc.perform(get("/api/jobs/{id}", jobId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Senior Backend Developer"))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    void getById_shouldReturnNotFound_whenNotFound() throws Exception {
        when(jobService.getJobById(jobId)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/jobs/{id}", jobId))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_shouldReturnJob_whenValid() throws Exception {
        when(jobService.createJob(any(Job.class), eq(customerId))).thenReturn(buildJob());

        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Senior Backend Developer",
                "description", "5+ years Java experience.",
                "customerId", customerId.toString(),
                "status", "OPEN",
                "salaryRange", "80,000 - 110,000 EUR"
        ));

        mockMvc.perform(post("/api/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Senior Backend Developer"))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    void create_shouldReturnBadRequest_whenCustomerNotFound() throws Exception {
        when(jobService.createJob(any(Job.class), eq(customerId)))
                .thenThrow(new RuntimeException("Customer not found: " + customerId));

        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Senior Backend Developer",
                "customerId", customerId.toString()
        ));

        mockMvc.perform(post("/api/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Customer not found: " + customerId));
    }

    @Test
    void create_shouldReturnBadRequest_whenInvalidStatus() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Senior Backend Developer",
                "customerId", customerId.toString(),
                "status", "INVALID"
        ));

        mockMvc.perform(post("/api/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("No enum constant")));
    }

    @Test
    void create_shouldReturnBadRequest_whenMissingRequiredFields() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("title", ""));

        mockMvc.perform(post("/api/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_shouldReturnUpdatedJob_whenValid() throws Exception {
        Job updated = buildJob();
        updated.setTitle("Updated Title");
        when(jobService.updateJob(eq(jobId), any(Job.class), eq(customerId))).thenReturn(updated);

        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Updated Title",
                "description", "Updated description",
                "customerId", customerId.toString(),
                "status", "CLOSED",
                "salaryRange", "90,000 - 120,000 EUR"
        ));

        mockMvc.perform(put("/api/jobs/{id}", jobId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Title"));
    }

    @Test
    void update_shouldReturnBadRequest_whenNotFound() throws Exception {
        when(jobService.updateJob(eq(jobId), any(Job.class), eq(customerId)))
                .thenThrow(new RuntimeException("Job not found: " + jobId));

        String body = objectMapper.writeValueAsString(Map.of(
                "title", "Updated Title",
                "customerId", customerId.toString()
        ));

        mockMvc.perform(put("/api/jobs/{id}", jobId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Job not found: " + jobId));
    }

    @Test
    void delete_shouldReturnNoContent() throws Exception {
        doNothing().when(jobService).deleteJob(jobId);

        mockMvc.perform(delete("/api/jobs/{id}", jobId))
                .andExpect(status().isNoContent());

        verify(jobService).deleteJob(jobId);
    }

    private Job buildJob() {
        Customer customer = new Customer();
        customer.setId(customerId);
        customer.setCompanyName("Acme Corp");
        customer.setEmail("john@acme.com");
        customer.setStatus(CustomerStatus.ACTIVE);

        Job job = new Job();
        job.setId(jobId);
        job.setTitle("Senior Backend Developer");
        job.setDescription("5+ years Java experience.");
        job.setStatus(JobStatus.OPEN);
        job.setSalaryRange("80,000 - 110,000 EUR");
        job.setCustomer(customer);
        return job;
    }
}
