package com.jobentra.crm.service;

import com.jobentra.crm.model.Candidate;
import com.jobentra.crm.model.CandidateDocument;
import com.jobentra.crm.model.CandidateWorkExperience;
import com.jobentra.crm.repository.CandidateDocumentRepository;
import com.jobentra.crm.repository.CandidateRepository;
import com.jobentra.crm.repository.CandidateWorkExperienceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class CvExtractionService {

    private static final Logger log = LoggerFactory.getLogger(CvExtractionService.class);

    private static final int MAX_SKILLS = 50;

    private final CandidateDocumentRepository documentRepository;
    private final CandidateRepository candidateRepository;
    private final CandidateWorkExperienceRepository workExperienceRepository;
    private final AiServiceClient aiServiceClient;
    private final Path basePath;

    public CvExtractionService(CandidateDocumentRepository documentRepository,
                               CandidateRepository candidateRepository,
                               CandidateWorkExperienceRepository workExperienceRepository,
                               AiServiceClient aiServiceClient,
                               @Value("${candidate.files.path:/data/candidates}") String basePath) {
        this.documentRepository = documentRepository;
        this.candidateRepository = candidateRepository;
        this.workExperienceRepository = workExperienceRepository;
        this.aiServiceClient = aiServiceClient;
        this.basePath = Paths.get(basePath);
    }

    @Async("cvExtractionExecutor")
    public void processDocument(UUID candidateId, UUID documentId) {
        CandidateDocument doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) {
            log.warn("CV extraction skipped: document {} not found", documentId);
            return;
        }

        doc.setExtractionStatus("PROCESSING");
        documentRepository.save(doc);

        try {
            Path filePath = basePath.resolve(candidateId.toString()).resolve(doc.getFilename());
            if (!Files.exists(filePath)) {
                throw new RuntimeException("File not found on disk: " + filePath);
            }
            byte[] fileBytes = Files.readAllBytes(filePath);

            Map<String, Object> result = aiServiceClient.extractCv(
                    fileBytes, doc.getOriginalFilename(), candidateId.toString());

            List<String> skills = asStringList(result.get("skills"));
            List<Map<String, Object>> workExperience = asMapList(result.get("workExperience"));

            if (!skills.isEmpty()) {
                mergeSkills(candidateId, skills);
            }

            int appended = appendWorkExperiences(candidateId, workExperience);

            doc.setExtractionStatus("DONE");
            documentRepository.save(doc);
            log.info("CV extraction done for candidate {}: {} skills merged, {} work experience entries appended",
                    candidateId, skills.size(), appended);
        } catch (Exception e) {
            log.error("CV extraction failed for candidate {} document {}: {}",
                    candidateId, documentId, e.getMessage());
            try {
                doc.setExtractionStatus("FAILED");
                documentRepository.save(doc);
            } catch (Exception saveEx) {
                log.error("Could not mark document {} as FAILED: {}", documentId, saveEx.getMessage());
            }
        }
    }

    private void mergeSkills(UUID candidateId, List<String> newSkills) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + candidateId));

        Set<String> merged = new LinkedHashSet<>();
        if (candidate.getSkills() != null) {
            Arrays.stream(candidate.getSkills().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .forEach(s -> merged.add(s));
        }
        for (String skill : newSkills) {
            String trimmed = skill.trim();
            if (trimmed.isEmpty()) continue;
            boolean duplicate = merged.stream().anyMatch(existing ->
                    existing.equalsIgnoreCase(trimmed));
            if (!duplicate && merged.size() < MAX_SKILLS) {
                merged.add(trimmed);
            }
        }

        candidate.setSkills(String.join(", ", merged));
        candidateRepository.save(candidate);
    }

    private int appendWorkExperiences(UUID candidateId, List<Map<String, Object>> entries) {
        List<CandidateWorkExperience> existing = workExperienceRepository
                .findByCandidateIdOrderByCreatedAtDesc(candidateId);

        int appended = 0;
        for (Map<String, Object> entry : entries) {
            String jobTitle = asString(entry.get("jobTitle"));
            String company = asString(entry.get("company"));
            String startDate = asString(entry.get("startDate"));
            String endDate = asString(entry.get("endDate"));
            String description = asString(entry.get("description"));

            if (jobTitle.isBlank()) continue;

            boolean duplicate = existing.stream().anyMatch(e ->
                    jobTitle.equalsIgnoreCase(e.getJobTitle())
                            && (company == null || company.isBlank() || company.equalsIgnoreCase(
                                    e.getCompany() == null ? "" : e.getCompany()))
                            && (startDate == null || startDate.isBlank() || startDate.equalsIgnoreCase(
                                    e.getStartDate() == null ? "" : e.getStartDate())));
            if (duplicate) continue;

            CandidateWorkExperience we = new CandidateWorkExperience();
            we.setCandidateId(candidateId);
            we.setJobTitle(jobTitle);
            we.setCompany(company.isBlank() ? null : company);
            we.setStartDate(startDate.isBlank() ? null : startDate);
            we.setEndDate(endDate.isBlank() ? null : endDate);
            we.setDescription(description.isBlank() ? null : description);
            workExperienceRepository.save(we);
            appended++;
        }
        return appended;
    }

    private static String asString(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    @SuppressWarnings("unchecked")
    private static List<String> asStringList(Object value) {
        if (value instanceof List<?> list) {
            List<String> result = new ArrayList<>();
            for (Object item : list) {
                String s = asString(item);
                if (!s.isEmpty()) result.add(s);
            }
            return result;
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> asMapList(Object value) {
        if (value instanceof List<?> list) {
            List<Map<String, Object>> result = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map) {
                    result.add((Map<String, Object>) item);
                }
            }
            return result;
        }
        return List.of();
    }
}
