package com.jobentra.crm.service;

import com.jobentra.crm.model.CandidateTimelineEvent;
import com.jobentra.crm.model.enums.TimelineEventType;
import com.jobentra.crm.repository.CandidateRepository;
import com.jobentra.crm.repository.CandidateTimelineEventRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class CandidateTimelineService {

    private final CandidateTimelineEventRepository eventRepository;
    private final CandidateRepository candidateRepository;

    public CandidateTimelineService(
            CandidateTimelineEventRepository eventRepository,
            CandidateRepository candidateRepository) {
        this.eventRepository = eventRepository;
        this.candidateRepository = candidateRepository;
    }

    public List<CandidateTimelineEvent> listEvents(UUID candidateId) {
        return eventRepository.findByCandidateIdOrderByCreatedAtDesc(candidateId);
    }

    public CandidateTimelineEvent createEvent(UUID candidateId, TimelineEventType eventType,
                                               String title, String description, String userName) {
        candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + candidateId));

        CandidateTimelineEvent event = new CandidateTimelineEvent();
        event.setCandidateId(candidateId);
        event.setEventType(eventType);
        event.setTitle(title);
        event.setDescription(description);
        event.setUserName(userName);

        return eventRepository.save(event);
    }
}
