package com.jobentra.crm.service;

import com.jobentra.crm.model.Candidate;
import com.jobentra.crm.model.CandidateWorkExperience;
import com.jobentra.crm.repository.CandidateRepository;
import com.jobentra.crm.repository.CandidateWorkExperienceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CandidateWorkExperienceServiceTest {

    @Mock
    private CandidateWorkExperienceRepository workExperienceRepository;

    @Mock
    private CandidateRepository candidateRepository;

    @InjectMocks
    private CandidateWorkExperienceService workExperienceService;

    private UUID candidateId;
    private UUID entryId;
    private Candidate candidate;
    private CandidateWorkExperience entry;

    @BeforeEach
    void setUp() {
        candidateId = UUID.randomUUID();
        entryId = UUID.randomUUID();

        candidate = new Candidate();
        candidate.setId(candidateId);
        candidate.setFirstName("Alice");
        candidate.setLastName("Johnson");
        candidate.setEmail("alice@example.com");

        entry = new CandidateWorkExperience();
        entry.setId(entryId);
        entry.setCandidateId(candidateId);
        entry.setJobTitle("Software Engineer");
        entry.setCompany("Acme GmbH");
        entry.setStartDate("03.2020");
        entry.setEndDate("12.2023");
        entry.setDescription("Developed backend services.");
    }

    @Test
    void listWorkExperience_shouldReturnEntries() {
        when(workExperienceRepository.findByCandidateIdOrderByCreatedAtDesc(candidateId))
                .thenReturn(List.of(entry));

        List<CandidateWorkExperience> result = workExperienceService.listWorkExperience(candidateId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getJobTitle()).isEqualTo("Software Engineer");
    }

    @Test
    void createWorkExperience_shouldSave_whenCandidateExists() {
        when(candidateRepository.findById(candidateId)).thenReturn(Optional.of(candidate));
        when(workExperienceRepository.save(any(CandidateWorkExperience.class))).thenReturn(entry);

        CandidateWorkExperience result = workExperienceService.createWorkExperience(candidateId, entry);

        assertThat(result.getCandidateId()).isEqualTo(candidateId);
        verify(workExperienceRepository).save(entry);
    }

    @Test
    void createWorkExperience_shouldThrow_whenCandidateNotFound() {
        when(candidateRepository.findById(candidateId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workExperienceService.createWorkExperience(candidateId, entry))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Candidate not found");

        verify(workExperienceRepository, never()).save(any());
    }

    @Test
    void updateWorkExperience_shouldUpdate_whenOwned() {
        CandidateWorkExperience updated = new CandidateWorkExperience();
        updated.setJobTitle("Senior Software Engineer");
        updated.setCompany("Acme GmbH");
        updated.setStartDate("03.2020");
        updated.setEndDate("heute");
        updated.setDescription("Led backend team.");

        when(workExperienceRepository.findById(entryId)).thenReturn(Optional.of(entry));
        when(workExperienceRepository.save(entry)).thenReturn(entry);

        CandidateWorkExperience result = workExperienceService.updateWorkExperience(candidateId, entryId, updated);

        assertThat(result.getJobTitle()).isEqualTo("Senior Software Engineer");
        assertThat(result.getEndDate()).isEqualTo("heute");
        verify(workExperienceRepository).save(entry);
    }

    @Test
    void updateWorkExperience_shouldThrow_whenNotOwned() {
        CandidateWorkExperience other = new CandidateWorkExperience();
        other.setId(entryId);
        other.setCandidateId(UUID.randomUUID());

        when(workExperienceRepository.findById(entryId)).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> workExperienceService.updateWorkExperience(candidateId, entryId, entry))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("does not belong to candidate");

        verify(workExperienceRepository, never()).save(any());
    }

    @Test
    void deleteWorkExperience_shouldDelete_whenOwned() {
        when(workExperienceRepository.findById(entryId)).thenReturn(Optional.of(entry));
        doNothing().when(workExperienceRepository).delete(entry);

        workExperienceService.deleteWorkExperience(candidateId, entryId);

        verify(workExperienceRepository).delete(entry);
    }

    @Test
    void deleteWorkExperience_shouldThrow_whenNotFound() {
        when(workExperienceRepository.findById(entryId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workExperienceService.deleteWorkExperience(candidateId, entryId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");

        verify(workExperienceRepository, never()).delete(any());
    }
}
