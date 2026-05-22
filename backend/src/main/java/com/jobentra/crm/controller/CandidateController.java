package com.jobentra.crm.controller;

import com.jobentra.crm.dto.CreateCandidateRequest;
import com.jobentra.crm.dto.UpdateCandidateRequest;
import com.jobentra.crm.model.Candidate;
import com.jobentra.crm.model.enums.CandidateStatus;
import com.jobentra.crm.service.AiServiceClient;
import com.jobentra.crm.service.CandidateService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/candidates")
public class CandidateController {

    private final CandidateService candidateService;
    private final AiServiceClient aiServiceClient;

    public CandidateController(CandidateService candidateService, AiServiceClient aiServiceClient) {
        this.candidateService = candidateService;
        this.aiServiceClient = aiServiceClient;
    }

    @GetMapping
    public ResponseEntity<Page<Candidate>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return ResponseEntity.ok(candidateService.searchCandidates(search, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Candidate> getById(@PathVariable UUID id) {
        return candidateService.getCandidateById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateCandidateRequest request) {
        try {
            Candidate candidate = new Candidate();
            candidate.setFirstName(request.getFirstName());
            candidate.setLastName(request.getLastName());
            candidate.setEmail(request.getEmail());
            candidate.setPhone(request.getPhone());
            if (request.getStatus() != null && !request.getStatus().isEmpty()) {
                candidate.setStatus(CandidateStatus.valueOf(request.getStatus().toUpperCase()));
            }
            candidate.setSkills(request.getSkills());
            candidate.setLocation(request.getLocation());
            candidate.setMobility(request.getMobility() != null && request.getMobility());
            candidate.setAvailability(request.getAvailability());
            candidate.setJob(request.getJob());
            return ResponseEntity.ok(candidateService.createCandidate(candidate));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + request.getStatus()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @Valid @RequestBody UpdateCandidateRequest request) {
        try {
            Candidate updated = new Candidate();
            updated.setFirstName(request.getFirstName());
            updated.setLastName(request.getLastName());
            updated.setEmail(request.getEmail());
            updated.setPhone(request.getPhone());
            if (request.getStatus() != null && !request.getStatus().isEmpty()) {
                updated.setStatus(CandidateStatus.valueOf(request.getStatus().toUpperCase()));
            }
            updated.setSkills(request.getSkills());
            updated.setLocation(request.getLocation());
            updated.setMobility(request.getMobility() != null && request.getMobility());
            updated.setAvailability(request.getAvailability());
            updated.setJob(request.getJob());
            return ResponseEntity.ok(candidateService.updateCandidate(id, updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + request.getStatus()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{candidateId}/generate-profile")
    public ResponseEntity<?> generateProfile(@PathVariable UUID candidateId) {
        var candidate = candidateService.getCandidateById(candidateId);
        if (candidate.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Candidate c = candidate.get();

        Map<String, Object> candidateData = new LinkedHashMap<>();
        candidateData.put("memberId", c.getId().toString());
        candidateData.put("firstName", c.getFirstName());
        candidateData.put("lastName", c.getLastName());
        candidateData.put("email", c.getEmail());
        candidateData.put("phone", c.getPhone() != null ? c.getPhone() : "");
        candidateData.put("status", c.getStatus().name());
        candidateData.put("notes", c.getSkills() != null ? String.join(", ", c.getSkills()) : "");

        Map<String, Object> result = aiServiceClient.generateProfilePdf(candidateData);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        try {
            candidateService.deleteCandidate(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<?> archive(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(candidateService.archiveCandidate(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/unarchive")
    public ResponseEntity<?> unarchive(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(candidateService.unarchiveCandidate(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
