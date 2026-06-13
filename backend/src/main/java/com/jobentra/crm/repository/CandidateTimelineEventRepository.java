package com.jobentra.crm.repository;

import com.jobentra.crm.model.CandidateTimelineEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CandidateTimelineEventRepository extends JpaRepository<CandidateTimelineEvent, UUID> {
    List<CandidateTimelineEvent> findByCandidateIdOrderByCreatedAtDesc(UUID candidateId);
}
