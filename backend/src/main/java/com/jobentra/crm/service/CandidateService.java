package com.jobentra.crm.service;

import com.jobentra.crm.model.Candidate;
import com.jobentra.crm.model.enums.CandidateStatus;
import com.jobentra.crm.repository.CandidateRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class CandidateService {

    private final CandidateRepository candidateRepository;

    public CandidateService(CandidateRepository candidateRepository) {
        this.candidateRepository = candidateRepository;
    }

    public Page<Candidate> searchCandidates(String search, String status, Pageable pageable) {
        CandidateStatus statusEnum = parseStatus(status);
        return candidateRepository.searchCandidates(search, statusEnum, pageable);
    }

    public Optional<Candidate> getCandidateById(UUID id) {
        return candidateRepository.findById(id);
    }

    public Candidate createCandidate(Candidate candidate) {
        if (candidateRepository.findByEmail(candidate.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists: " + candidate.getEmail());
        }
        return candidateRepository.save(candidate);
    }

    public Candidate updateCandidate(UUID id, Candidate updated) {
        Candidate existing = candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + id));

        if (!existing.getEmail().equals(updated.getEmail()) &&
                candidateRepository.findByEmail(updated.getEmail()).isPresent()) {
            throw new RuntimeException("Email already taken: " + updated.getEmail());
        }

        existing.setFirstName(updated.getFirstName());
        existing.setLastName(updated.getLastName());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setStatus(updated.getStatus());
        existing.setSkills(updated.getSkills());

        return candidateRepository.save(existing);
    }

    public void deleteCandidate(UUID id) {
        candidateRepository.deleteById(id);
    }

    private CandidateStatus parseStatus(String status) {
        if (status == null || status.isEmpty()) return null;
        try {
            return CandidateStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
