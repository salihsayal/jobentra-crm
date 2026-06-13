package com.jobentra.crm.service;

import com.jobentra.crm.model.Candidate;
import com.jobentra.crm.model.CandidateDocument;
import com.jobentra.crm.repository.CandidateDocumentRepository;
import com.jobentra.crm.repository.CandidateRepository;
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
import java.util.UUID;

@Service
public class CandidateDocumentService {

    private final CandidateDocumentRepository documentRepository;
    private final CandidateRepository candidateRepository;
    private final Path basePath;

    public CandidateDocumentService(
            CandidateDocumentRepository documentRepository,
            CandidateRepository candidateRepository,
            @Value("${candidate.files.path:/data/candidates}") String basePath) {
        this.documentRepository = documentRepository;
        this.candidateRepository = candidateRepository;
        this.basePath = Paths.get(basePath);
    }

    public List<CandidateDocument> listDocuments(UUID candidateId) {
        return documentRepository.findByCandidateIdOrderByCreatedAtDesc(candidateId);
    }

    public CandidateDocument uploadDocument(UUID candidateId, MultipartFile file, String category) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + candidateId));

        String uuidName = UUID.randomUUID().toString();
        String originalFilename = file.getOriginalFilename();
        String ext = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf('.'));
        }
        String storedFilename = uuidName + ext;

        Path candidateDir = basePath.resolve(candidateId.toString());
        try {
            Files.createDirectories(candidateDir);
            Path targetPath = candidateDir.resolve(storedFilename);
            file.transferTo(targetPath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }

        CandidateDocument doc = new CandidateDocument();
        doc.setCandidateId(candidateId);
        doc.setFilename(storedFilename);
        doc.setOriginalFilename(originalFilename != null ? originalFilename : storedFilename);
        doc.setFileSize(file.getSize());
        doc.setMimeType(file.getContentType());
        doc.setCategory(category != null && !category.isBlank() ? category : "OTHER");

        return documentRepository.save(doc);
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
