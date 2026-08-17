package com.jobentra.crm.repository;

import com.jobentra.crm.model.CandidateWorkExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CandidateWorkExperienceRepository extends JpaRepository<CandidateWorkExperience, UUID> {
    List<CandidateWorkExperience> findByCandidateIdOrderByCreatedAtDesc(UUID candidateId);
}
