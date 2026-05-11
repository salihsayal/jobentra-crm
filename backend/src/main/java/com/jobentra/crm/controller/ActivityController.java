package com.jobentra.crm.controller;

import com.jobentra.crm.dto.CreateActivityRequest;
import com.jobentra.crm.model.Activity;
import com.jobentra.crm.model.Member;
import com.jobentra.crm.repository.ActivityRepository;
import com.jobentra.crm.repository.MemberRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/members/{memberId}/activities")
public class ActivityController {

    private final ActivityRepository activityRepository;
    private final MemberRepository memberRepository;

    public ActivityController(ActivityRepository activityRepository, MemberRepository memberRepository) {
        this.activityRepository = activityRepository;
        this.memberRepository = memberRepository;
    }

    @GetMapping
    public ResponseEntity<List<Activity>> getActivities(@PathVariable UUID memberId) {
        return ResponseEntity.ok(activityRepository.findByMemberIdOrderByCreatedAtDesc(memberId));
    }

    @PostMapping
    public ResponseEntity<?> create(@PathVariable UUID memberId,
                                    @Valid @RequestBody CreateActivityRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found: " + memberId));

        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        Activity activity = new Activity();
        activity.setMember(member);
        activity.setType(request.getType());
        activity.setContent(request.getContent());
        activity.setCreatedBy(email);

        return ResponseEntity.ok(activityRepository.save(activity));
    }
}
