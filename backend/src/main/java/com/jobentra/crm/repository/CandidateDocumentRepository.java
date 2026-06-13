package com.jobentra.crm.repository;

import com.jobentra.crm.model.CandidateDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CandidateDocumentRepository extends JpaRepository<CandidateDocument, UUID> {
    List<CandidateDocument> findByCandidateIdOrderByCreatedAtDesc(UUID candidateId);
}
