package com.jobentra.crm.service;

import com.jobentra.crm.model.Candidate;
import com.jobentra.crm.model.enums.CandidateStatus;
import com.jobentra.crm.repository.CandidateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CandidateServiceTest {

    @Mock
    private CandidateRepository candidateRepository;

    @InjectMocks
    private CandidateService candidateService;

    private UUID candidateId;
    private Candidate candidate;

    @BeforeEach
    void setUp() {
        candidateId = UUID.randomUUID();
        candidate = new Candidate();
        candidate.setId(candidateId);
        candidate.setFirstName("Alice");
        candidate.setLastName("Johnson");
        candidate.setEmail("alice@example.com");
        candidate.setPhone("+1-555-0201");
        candidate.setStatus(CandidateStatus.IN_PROCESS);
        candidate.setSkills(List.of("Java", "Spring Boot", "PostgreSQL"));
    }

    @Test
    void searchCandidates_shouldReturnFilteredPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Candidate> page = new PageImpl<>(List.of(candidate), pageable, 1);

        when(candidateRepository.searchCandidates("alice", CandidateStatus.IN_PROCESS, pageable))
                .thenReturn(page);

        Page<Candidate> result = candidateService.searchCandidates("alice", "IN_PROCESS", pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getFirstName()).isEqualTo("Alice");
    }

    @Test
    void searchCandidates_shouldHandleNullStatus() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Candidate> page = new PageImpl<>(List.of(candidate), pageable, 1);

        when(candidateRepository.searchCandidates("alice", null, pageable)).thenReturn(page);

        Page<Candidate> result = candidateService.searchCandidates("alice", null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void searchCandidates_shouldHandleEmptySearch() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Candidate> page = new PageImpl<>(List.of(candidate), pageable, 1);

        when(candidateRepository.searchCandidates("", null, pageable)).thenReturn(page);

        Page<Candidate> result = candidateService.searchCandidates("", null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getCandidateById_shouldReturnCandidate_whenFound() {
        when(candidateRepository.findById(candidateId)).thenReturn(Optional.of(candidate));

        Optional<Candidate> result = candidateService.getCandidateById(candidateId);

        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo("alice@example.com");
    }

    @Test
    void getCandidateById_shouldReturnEmpty_whenNotFound() {
        when(candidateRepository.findById(candidateId)).thenReturn(Optional.empty());

        Optional<Candidate> result = candidateService.getCandidateById(candidateId);

        assertThat(result).isEmpty();
    }

    @Test
    void createCandidate_shouldSave_whenEmailUnique() {
        when(candidateRepository.findByEmail("alice@example.com")).thenReturn(Optional.empty());
        when(candidateRepository.save(candidate)).thenReturn(candidate);

        Candidate result = candidateService.createCandidate(candidate);

        assertThat(result.getEmail()).isEqualTo("alice@example.com");
        verify(candidateRepository).findByEmail("alice@example.com");
        verify(candidateRepository).save(candidate);
    }

    @Test
    void createCandidate_shouldThrow_whenEmailExists() {
        when(candidateRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(candidate));

        assertThatThrownBy(() -> candidateService.createCandidate(candidate))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email already exists");

        verify(candidateRepository, never()).save(any());
    }

    @Test
    void updateCandidate_shouldUpdate_whenFound() {
        Candidate updated = new Candidate();
        updated.setFirstName("Alice Updated");
        updated.setLastName("Johnson");
        updated.setEmail("alice@example.com");
        updated.setPhone("+1-555-9999");
        updated.setStatus(CandidateStatus.PLACED);
        updated.setSkills(List.of("Python"));

        when(candidateRepository.findById(candidateId)).thenReturn(Optional.of(candidate));
        when(candidateRepository.save(candidate)).thenReturn(candidate);

        Candidate result = candidateService.updateCandidate(candidateId, updated);

        assertThat(result.getFirstName()).isEqualTo("Alice Updated");
        assertThat(result.getPhone()).isEqualTo("+1-555-9999");
        assertThat(result.getStatus()).isEqualTo(CandidateStatus.PLACED);
        assertThat(result.getSkills()).containsExactly("Python");
        verify(candidateRepository).save(candidate);
    }

    @Test
    void updateCandidate_shouldThrow_whenNotFound() {
        when(candidateRepository.findById(candidateId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> candidateService.updateCandidate(candidateId, candidate))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Candidate not found");

        verify(candidateRepository, never()).save(any());
    }

    @Test
    void updateCandidate_shouldThrow_whenEmailConflictWithAnother() {
        Candidate updated = new Candidate();
        updated.setEmail("other@example.com");
        updated.setFirstName("Test");

        Candidate otherCandidate = new Candidate();
        otherCandidate.setId(UUID.randomUUID());
        otherCandidate.setEmail("other@example.com");

        when(candidateRepository.findById(candidateId)).thenReturn(Optional.of(candidate));
        when(candidateRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherCandidate));

        assertThatThrownBy(() -> candidateService.updateCandidate(candidateId, updated))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email already taken");

        verify(candidateRepository, never()).save(any());
    }

    @Test
    void updateCandidate_shouldAllowSameEmail() {
        Candidate updated = new Candidate();
        updated.setEmail("alice@example.com");
        updated.setFirstName("Alice");

        when(candidateRepository.findById(candidateId)).thenReturn(Optional.of(candidate));
        when(candidateRepository.save(candidate)).thenReturn(candidate);

        Candidate result = candidateService.updateCandidate(candidateId, updated);

        assertThat(result).isNotNull();
    }

    @Test
    void deleteCandidate_shouldDelegateToRepository() {
        when(candidateRepository.findById(candidateId)).thenReturn(Optional.of(candidate));
        doNothing().when(candidateRepository).delete(candidate);

        candidateService.deleteCandidate(candidateId);

        verify(candidateRepository).delete(candidate);
    }
}
