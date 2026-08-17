package com.jobentra.crm.service;

import com.jobentra.crm.model.CandidateWorkExperience;
import com.jobentra.crm.repository.CandidateRepository;
import com.jobentra.crm.repository.CandidateWorkExperienceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class CandidateWorkExperienceService {

    private final CandidateWorkExperienceRepository workExperienceRepository;
    private final CandidateRepository candidateRepository;

    public CandidateWorkExperienceService(CandidateWorkExperienceRepository workExperienceRepository,
                                          CandidateRepository candidateRepository) {
        this.workExperienceRepository = workExperienceRepository;
        this.candidateRepository = candidateRepository;
    }

    public List<CandidateWorkExperience> listWorkExperience(UUID candidateId) {
        return workExperienceRepository.findByCandidateIdOrderByCreatedAtDesc(candidateId);
    }

    public CandidateWorkExperience createWorkExperience(UUID candidateId, CandidateWorkExperience entry) {
        candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + candidateId));
        entry.setCandidateId(candidateId);
        return workExperienceRepository.save(entry);
    }

    public CandidateWorkExperience updateWorkExperience(UUID candidateId, UUID entryId, CandidateWorkExperience updated) {
        CandidateWorkExperience existing = findOwned(candidateId, entryId);
        existing.setJobTitle(updated.getJobTitle());
        existing.setCompany(updated.getCompany());
        existing.setStartDate(updated.getStartDate());
        existing.setEndDate(updated.getEndDate());
        existing.setDescription(updated.getDescription());
        return workExperienceRepository.save(existing);
    }

    public void deleteWorkExperience(UUID candidateId, UUID entryId) {
        CandidateWorkExperience existing = findOwned(candidateId, entryId);
        workExperienceRepository.delete(existing);
    }

    private CandidateWorkExperience findOwned(UUID candidateId, UUID entryId) {
        CandidateWorkExperience entry = workExperienceRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Work experience entry not found: " + entryId));
        if (!entry.getCandidateId().equals(candidateId)) {
            throw new RuntimeException("Work experience entry does not belong to candidate");
        }
        return entry;
    }
}
