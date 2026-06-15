package com.jobentra.crm.service;

import com.jobentra.crm.model.Candidate;
import com.jobentra.crm.model.CandidateDocument;
import com.jobentra.crm.repository.CandidateDocumentRepository;
import com.jobentra.crm.repository.CandidateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CandidateDocumentService {

    private final CandidateDocumentRepository documentRepository;
    private final CandidateRepository candidateRepository;
    private final AiServiceClient aiServiceClient;
    private final CandidateService candidateService;
    private final Path basePath;
    private static final Logger log = LoggerFactory.getLogger(CandidateDocumentService.class);

    public CandidateDocumentService(
            CandidateDocumentRepository documentRepository,
            CandidateRepository candidateRepository,
            AiServiceClient aiServiceClient,
            CandidateService candidateService,
            @Value("${candidate.files.path:/data/candidates}") String basePath) {
        this.documentRepository = documentRepository;
        this.candidateRepository = candidateRepository;
        this.aiServiceClient = aiServiceClient;
        this.candidateService = candidateService;
        this.basePath = Paths.get(basePath);
    }

    public List<CandidateDocument> listDocuments(UUID candidateId) {
        return documentRepository.findByCandidateIdOrderByCreatedAtDesc(candidateId);
    }

    public CandidateDocument uploadDocument(UUID candidateId, MultipartFile file, String category) {
        candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + candidateId));

        String uuidName = UUID.randomUUID().toString();
        String originalFilename = file.getOriginalFilename();
        String ext = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf('.'));
        }
        String storedFilename = uuidName + ext;

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file: " + e.getMessage(), e);
        }

        Path candidateDir = basePath.resolve(candidateId.toString());
        try {
            Files.createDirectories(candidateDir);
            Path targetPath = candidateDir.resolve(storedFilename);
            Files.write(targetPath, fileBytes);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }

        CandidateDocument doc = new CandidateDocument();
        doc.setCandidateId(candidateId);
        doc.setFilename(storedFilename);
        doc.setOriginalFilename(originalFilename != null ? originalFilename : storedFilename);
        doc.setFileSize((long) fileBytes.length);
        doc.setMimeType(file.getContentType());
        doc.setCategory(category != null && !category.isBlank() ? category : "OTHER");

        CandidateDocument saved = documentRepository.save(doc);

        if ("CV".equalsIgnoreCase(category)) {
            try {
                Map<String, Object> skillsResult = aiServiceClient.extractSkills(fileBytes, originalFilename);
                @SuppressWarnings("unchecked")
                List<String> extractedSkills = (List<String>) skillsResult.get("skills");
                if (extractedSkills != null && !extractedSkills.isEmpty()) {
                    Candidate candidate = candidateRepository.findById(candidateId).orElse(null);
                    if (candidate != null) {
                        String existing = candidate.getSkills() != null ? candidate.getSkills() : "";
                        StringBuilder merged = new StringBuilder(existing);
                        for (String skill : extractedSkills) {
                            if (!existing.toLowerCase().contains(skill.toLowerCase())) {
                                if (merged.length() > 0) merged.append(", ");
                                merged.append(skill);
                            }
                        }
                        candidate.setSkills(merged.toString());
                        candidateRepository.save(candidate);
                        log.info("AI-extracted {} skills for candidate {}", extractedSkills.size(), candidateId);
                    }
                }
            } catch (Exception e) {
                log.warn("Skill extraction failed for candidate {}: {}", candidateId, e.getMessage());
            }
        }

        return saved;
    }

    public Resource downloadDocument(UUID candidateId, UUID documentId) {
        CandidateDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));

        if (!doc.getCandidateId().equals(candidateId)) {
            throw new RuntimeException("Document does not belong to candidate");
        }

        Path filePath = basePath.resolve(candidateId.toString()).resolve(doc.getFilename());
        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new RuntimeException("File not found on disk");
        } catch (MalformedURLException e) {
            throw new RuntimeException("Failed to read file: " + e.getMessage(), e);
        }
    }

    public void deleteDocument(UUID candidateId, UUID documentId) {
        CandidateDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));

        if (!doc.getCandidateId().equals(candidateId)) {
            throw new RuntimeException("Document does not belong to candidate");
        }

        Path filePath = basePath.resolve(candidateId.toString()).resolve(doc.getFilename());
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file: " + e.getMessage(), e);
        }

        documentRepository.delete(doc);
    }
}
