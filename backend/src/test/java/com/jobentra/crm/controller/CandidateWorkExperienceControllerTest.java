package com.jobentra.crm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobentra.crm.config.JwtUtil;
import com.jobentra.crm.model.CandidateWorkExperience;
import com.jobentra.crm.service.CandidateWorkExperienceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CandidateWorkExperienceController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser
class CandidateWorkExperienceControllerTest {

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private CandidateWorkExperienceService workExperienceService;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private final UUID candidateId = UUID.randomUUID();
    private final UUID entryId = UUID.randomUUID();

    @Test
    void list_shouldReturnEntries() throws Exception {
        CandidateWorkExperience entry = buildEntry();
        when(workExperienceService.listWorkExperience(candidateId)).thenReturn(List.of(entry));

        mockMvc.perform(get("/api/candidates/{candidateId}/work-experience", candidateId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].jobTitle").value("Software Engineer"))
                .andExpect(jsonPath("$[0].company").value("Acme GmbH"));
    }

    @Test
    void create_shouldReturnEntry_whenValid() throws Exception {
        when(workExperienceService.createWorkExperience(eq(candidateId), any(CandidateWorkExperience.class)))
                .thenReturn(buildEntry());

        String body = objectMapper.writeValueAsString(Map.of(
                "jobTitle", "Software Engineer",
                "company", "Acme GmbH",
                "startDate", "03.2020",
                "endDate", "12.2023",
                "description", "Developed backend services."
        ));

        mockMvc.perform(post("/api/candidates/{candidateId}/work-experience", candidateId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobTitle").value("Software Engineer"))
                .andExpect(jsonPath("$.company").value("Acme GmbH"));
    }

    @Test
    void create_shouldReturnBadRequest_whenMissingJobTitle() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("company", "Acme GmbH"));

        mockMvc.perform(post("/api/candidates/{candidateId}/work-experience", candidateId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_shouldReturnBadRequest_whenCandidateNotFound() throws Exception {
        when(workExperienceService.createWorkExperience(eq(candidateId), any(CandidateWorkExperience.class)))
                .thenThrow(new RuntimeException("Candidate not found: " + candidateId));

        String body = objectMapper.writeValueAsString(Map.of("jobTitle", "Software Engineer"));

        mockMvc.perform(post("/api/candidates/{candidateId}/work-experience", candidateId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Candidate not found: " + candidateId));
    }

    @Test
    void update_shouldReturnUpdatedEntry_whenValid() throws Exception {
        CandidateWorkExperience updated = buildEntry();
        updated.setJobTitle("Senior Software Engineer");
        when(workExperienceService.updateWorkExperience(eq(candidateId), eq(entryId), any(CandidateWorkExperience.class)))
                .thenReturn(updated);

        String body = objectMapper.writeValueAsString(Map.of(
                "jobTitle", "Senior Software Engineer",
                "company", "Acme GmbH"
        ));

        mockMvc.perform(put("/api/candidates/{candidateId}/work-experience/{entryId}", candidateId, entryId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobTitle").value("Senior Software Engineer"));
    }

    @Test
    void update_shouldReturnBadRequest_whenNotOwned() throws Exception {
        when(workExperienceService.updateWorkExperience(eq(candidateId), eq(entryId), any(CandidateWorkExperience.class)))
                .thenThrow(new RuntimeException("Work experience entry does not belong to candidate"));

        String body = objectMapper.writeValueAsString(Map.of("jobTitle", "Software Engineer"));

        mockMvc.perform(put("/api/candidates/{candidateId}/work-experience/{entryId}", candidateId, entryId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Work experience entry does not belong to candidate"));
    }

    @Test
    void delete_shouldReturnNoContent() throws Exception {
        doNothing().when(workExperienceService).deleteWorkExperience(candidateId, entryId);

        mockMvc.perform(delete("/api/candidates/{candidateId}/work-experience/{entryId}", candidateId, entryId))
                .andExpect(status().isNoContent());

        verify(workExperienceService).deleteWorkExperience(candidateId, entryId);
    }

    private CandidateWorkExperience buildEntry() {
        CandidateWorkExperience entry = new CandidateWorkExperience();
        entry.setId(entryId);
        entry.setCandidateId(candidateId);
        entry.setJobTitle("Software Engineer");
        entry.setCompany("Acme GmbH");
        entry.setStartDate("03.2020");
        entry.setEndDate("12.2023");
        entry.setDescription("Developed backend services.");
        return entry;
    }
}
