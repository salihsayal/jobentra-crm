package com.jobentra.crm.controller;

import com.jobentra.crm.dto.CreateCandidateRequest;
import com.jobentra.crm.dto.CreateTimelineEventRequest;
import com.jobentra.crm.dto.UpdateCandidateRequest;
import com.jobentra.crm.model.Candidate;
import com.jobentra.crm.model.CandidateDocument;
import com.jobentra.crm.model.CandidateTimelineEvent;
import com.jobentra.crm.model.enums.CandidateStatus;
import com.jobentra.crm.model.enums.TimelineEventType;
import com.jobentra.crm.service.AiServiceClient;
import com.jobentra.crm.service.CandidateDocumentService;
import com.jobentra.crm.service.CandidateService;
import com.jobentra.crm.service.CandidateTimelineService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/candidates")
public class CandidateController {

    private final CandidateService candidateService;
    private final AiServiceClient aiServiceClient;
    private final CandidateDocumentService documentService;
    private final CandidateTimelineService timelineService;

    public CandidateController(CandidateService candidateService, AiServiceClient aiServiceClient,
                                CandidateDocumentService documentService, CandidateTimelineService timelineService) {
        this.candidateService = candidateService;
        this.aiServiceClient = aiServiceClient;
        this.documentService = documentService;
        this.timelineService = timelineService;
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

    @GetMapping("/{id}/documents")
    public ResponseEntity<?> listDocuments(@PathVariable UUID id) {
        try {
            candidateService.getCandidateById(id)
                    .orElseThrow(() -> new RuntimeException("Candidate not found: " + id));
            List<CandidateDocument> docs = documentService.listDocuments(id);
            return ResponseEntity.ok(docs);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/documents")
    public ResponseEntity<?> uploadDocument(@PathVariable UUID id,
                                             @RequestParam("file") MultipartFile file,
                                             @RequestParam(value = "category", defaultValue = "OTHER") String category) {
        try {
            CandidateDocument doc = documentService.uploadDocument(id, file, category);
            return ResponseEntity.ok(doc);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/documents/{docId}")
    public ResponseEntity<?> downloadDocument(@PathVariable UUID id, @PathVariable UUID docId) {
        try {
            Resource resource = documentService.downloadDocument(id, docId);
            CandidateDocument doc = documentService.listDocuments(id).stream()
                    .filter(d -> d.getId().equals(docId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Document not found"));
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(doc.getMimeType() != null ? doc.getMimeType() : "application/octet-stream"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getOriginalFilename() + "\"")
                    .body(resource);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/documents/{docId}")
    public ResponseEntity<?> deleteDocument(@PathVariable UUID id, @PathVariable UUID docId) {
        try {
            documentService.deleteDocument(id, docId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<?> listTimelineEvents(@PathVariable UUID id) {
        try {
            candidateService.getCandidateById(id)
                    .orElseThrow(() -> new RuntimeException("Candidate not found: " + id));
            List<CandidateTimelineEvent> events = timelineService.listEvents(id);
            return ResponseEntity.ok(events);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/timeline")
    public ResponseEntity<?> createTimelineEvent(@PathVariable UUID id,
                                                  @Valid @RequestBody CreateTimelineEventRequest request) {
        try {
            TimelineEventType type;
            try {
                type = TimelineEventType.valueOf(request.getEventType().toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid event type: " + request.getEventType()));
            }
            CandidateTimelineEvent event = timelineService.createEvent(
                    id, type, request.getTitle(), request.getDescription(), request.getUserName());
            return ResponseEntity.ok(event);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
