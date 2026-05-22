package com.jobentra.crm.controller;

import com.jobentra.crm.config.JwtUtil;
import com.jobentra.crm.model.Candidate;
import com.jobentra.crm.model.enums.CandidateStatus;
import com.jobentra.crm.repository.BillingRepository;
import com.jobentra.crm.repository.CandidateRepository;
import com.jobentra.crm.repository.CustomerRepository;
import com.jobentra.crm.repository.JobRepository;
import com.jobentra.crm.service.AiServiceClient;
import com.jobentra.crm.service.CandidateService;
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

@WebMvcTest(CandidateController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser
class CandidateControllerTest {

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
    private CandidateService candidateService;

    @MockBean
    private AiServiceClient aiServiceClient;

    private final UUID candidateId = UUID.randomUUID();

    @Test
    void getAll_shouldReturnPage() throws Exception {
        Candidate candidate = buildCandidate();
        Page<Candidate> page = new PageImpl<>(List.of(candidate), PageRequest.of(0, 10), 1);
        when(candidateService.searchCandidates(eq("alice"), eq("IN_PROCESS"), any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/candidates")
                        .param("search", "alice")
                        .param("status", "IN_PROCESS")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].firstName").value("Alice"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getById_shouldReturnCandidate_whenFound() throws Exception {
        when(candidateService.getCandidateById(candidateId)).thenReturn(Optional.of(buildCandidate()));

        mockMvc.perform(get("/api/candidates/{id}", candidateId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Alice"))
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.skills").value("Java, Spring Boot, PostgreSQL"));
    }

    @Test
    void getById_shouldReturnNotFound_whenNotFound() throws Exception {
        when(candidateService.getCandidateById(candidateId)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/candidates/{id}", candidateId))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_shouldReturnCandidate_whenValid() throws Exception {
        when(candidateService.createCandidate(any(Candidate.class))).thenReturn(buildCandidate());

        String body = objectMapper.writeValueAsString(Map.of(
                "firstName", "Alice",
                "lastName", "Johnson",
                "email", "alice@example.com",
                "phone", "+1-555-0201",
                "status", "IN_PROCESS",
                "skills", "Java, Spring Boot"
        ));

        mockMvc.perform(post("/api/candidates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Alice"))
                .andExpect(jsonPath("$.status").value("IN_PROCESS"));
    }

    @Test
    void create_shouldReturnBadRequest_whenDuplicateEmail() throws Exception {
        when(candidateService.createCandidate(any(Candidate.class)))
                .thenThrow(new RuntimeException("Email already exists: alice@example.com"));

        String body = objectMapper.writeValueAsString(Map.of(
                "firstName", "Alice",
                "lastName", "Johnson",
                "email", "alice@example.com"
        ));

        mockMvc.perform(post("/api/candidates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email already exists: alice@example.com"));
    }

    @Test
    void create_shouldReturnBadRequest_whenInvalidStatus() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "firstName", "Alice",
                "lastName", "Johnson",
                "email", "alice@example.com",
                "status", "INVALID"
        ));

        mockMvc.perform(post("/api/candidates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid status: INVALID"));
    }

    @Test
    void create_shouldReturnBadRequest_whenMissingRequiredFields() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("firstName", ""));

        mockMvc.perform(post("/api/candidates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_shouldReturnUpdatedCandidate_whenValid() throws Exception {
        Candidate updated = buildCandidate();
        updated.setFirstName("Alice Updated");
        when(candidateService.updateCandidate(eq(candidateId), any(Candidate.class))).thenReturn(updated);

        String body = objectMapper.writeValueAsString(Map.of(
                "firstName", "Alice Updated",
                "lastName", "Johnson",
                "email", "alice@example.com",
                "phone", "+1-555-0201",
                "status", "IN_PROCESS",
                "skills", "Java"
        ));

        mockMvc.perform(put("/api/candidates/{id}", candidateId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Alice Updated"));
    }

    @Test
    void update_shouldReturnBadRequest_whenNotFound() throws Exception {
        when(candidateService.updateCandidate(eq(candidateId), any(Candidate.class)))
                .thenThrow(new RuntimeException("Candidate not found: " + candidateId));

        String body = objectMapper.writeValueAsString(Map.of(
                "firstName", "Alice",
                "lastName", "Johnson",
                "email", "alice@example.com"
        ));

        mockMvc.perform(put("/api/candidates/{id}", candidateId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Candidate not found: " + candidateId));
    }

    @Test
    void generateProfile_shouldReturnPdfUrl_whenFound() throws Exception {
        when(candidateService.getCandidateById(candidateId)).thenReturn(Optional.of(buildCandidate()));
        when(aiServiceClient.generateProfilePdf(any()))
                .thenReturn(Map.of("pdf_url", "http://localhost:8000/generated/profile-test.pdf", "status", "generated"));

        mockMvc.perform(post("/api/candidates/{candidateId}/generate-profile", candidateId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pdf_url").value("http://localhost:8000/generated/profile-test.pdf"))
                .andExpect(jsonPath("$.status").value("generated"));
    }

    @Test
    void generateProfile_shouldReturnNotFound_whenCandidateNotFound() throws Exception {
        when(candidateService.getCandidateById(candidateId)).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/candidates/{candidateId}/generate-profile", candidateId))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_shouldReturnNoContent() throws Exception {
        doNothing().when(candidateService).deleteCandidate(candidateId);

        mockMvc.perform(delete("/api/candidates/{id}", candidateId))
                .andExpect(status().isNoContent());

        verify(candidateService).deleteCandidate(candidateId);
    }

    private Candidate buildCandidate() {
        Candidate candidate = new Candidate();
        candidate.setId(candidateId);
        candidate.setFirstName("Alice");
        candidate.setLastName("Johnson");
        candidate.setEmail("alice@example.com");
        candidate.setPhone("+1-555-0201");
        candidate.setStatus(CandidateStatus.IN_PROCESS);
        candidate.setSkills("Java, Spring Boot, PostgreSQL");
        return candidate;
    }
}
