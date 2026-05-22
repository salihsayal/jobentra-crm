package com.jobentra.crm.service;

import com.jobentra.crm.model.Candidate;
import com.jobentra.crm.model.enums.CandidateStatus;
import com.jobentra.crm.repository.CandidateRepository;
import org.springframework.dao.DataIntegrityViolationException;
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
        existing.setLocation(updated.getLocation());
        existing.setMobility(updated.isMobility());
        existing.setAvailability(updated.getAvailability());
        existing.setJob(updated.getJob());

        return candidateRepository.save(existing);
    }

    public void deleteCandidate(UUID id) {
        Candidate c = candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + id));
        try {
            candidateRepository.delete(c);
            candidateRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Candidate is referenced by billing records. Delete those first.");
        }
    }

    public Candidate archiveCandidate(UUID id) {
        Candidate c = candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + id));
        c.setArchived(true);
        return candidateRepository.save(c);
    }

    public Candidate unarchiveCandidate(UUID id) {
        Candidate c = candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + id));
        c.setArchived(false);
        return candidateRepository.save(c);
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
