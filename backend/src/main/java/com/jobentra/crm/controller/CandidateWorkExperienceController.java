package com.jobentra.crm.controller;

import com.jobentra.crm.dto.CreateWorkExperienceRequest;
import com.jobentra.crm.model.CandidateWorkExperience;
import com.jobentra.crm.service.CandidateWorkExperienceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/candidates/{candidateId}/work-experience")
public class CandidateWorkExperienceController {

    private final CandidateWorkExperienceService workExperienceService;

    public CandidateWorkExperienceController(CandidateWorkExperienceService workExperienceService) {
        this.workExperienceService = workExperienceService;
    }

    @GetMapping
    public ResponseEntity<?> list(@PathVariable UUID candidateId) {
        try {
            List<CandidateWorkExperience> entries = workExperienceService.listWorkExperience(candidateId);
            return ResponseEntity.ok(entries);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@PathVariable UUID candidateId,
                                    @Valid @RequestBody CreateWorkExperienceRequest request) {
        try {
            CandidateWorkExperience entry = new CandidateWorkExperience();
            entry.setJobTitle(request.getJobTitle());
            entry.setCompany(request.getCompany());
            entry.setStartDate(request.getStartDate());
            entry.setEndDate(request.getEndDate());
            entry.setDescription(request.getDescription());
            return ResponseEntity.ok(workExperienceService.createWorkExperience(candidateId, entry));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{entryId}")
    public ResponseEntity<?> update(@PathVariable UUID candidateId,
                                    @PathVariable UUID entryId,
                                    @Valid @RequestBody CreateWorkExperienceRequest request) {
        try {
            CandidateWorkExperience updated = new CandidateWorkExperience();
            updated.setJobTitle(request.getJobTitle());
            updated.setCompany(request.getCompany());
            updated.setStartDate(request.getStartDate());
            updated.setEndDate(request.getEndDate());
            updated.setDescription(request.getDescription());
            return ResponseEntity.ok(workExperienceService.updateWorkExperience(candidateId, entryId, updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{entryId}")
    public ResponseEntity<?> delete(@PathVariable UUID candidateId, @PathVariable UUID entryId) {
        try {
            workExperienceService.deleteWorkExperience(candidateId, entryId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
