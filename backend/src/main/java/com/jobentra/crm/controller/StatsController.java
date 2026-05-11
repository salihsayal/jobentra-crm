package com.jobentra.crm.controller;

import com.jobentra.crm.repository.ActivityRepository;
import com.jobentra.crm.repository.MemberRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final MemberRepository memberRepository;
    private final ActivityRepository activityRepository;

    public StatsController(MemberRepository memberRepository, ActivityRepository activityRepository) {
        this.memberRepository = memberRepository;
        this.activityRepository = activityRepository;
    }

    @GetMapping("/members/count")
    public ResponseEntity<Map<String, Long>> memberCounts() {
        long total = memberRepository.count();
        long active = memberRepository.countByStatus("active");
        long inactive = memberRepository.countByStatus("inactive");
        long lead = memberRepository.countByStatus("lead");
        return ResponseEntity.ok(Map.of(
                "total", total,
                "active", active,
                "inactive", inactive,
                "lead", lead
        ));
    }

    @GetMapping("/members/recent")
    public ResponseEntity<Map<String, Object>> recentMembers(
            @RequestParam(defaultValue = "7") int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        long count = memberRepository.countByCreatedAtAfter(since);
        return ResponseEntity.ok(Map.of("count", count, "days", days));
    }

    @GetMapping("/activities/recent")
    public ResponseEntity<Map<String, Object>> recentActivities(
            @RequestParam(defaultValue = "7") int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        long count = activityRepository.countByCreatedAtAfter(since);
        return ResponseEntity.ok(Map.of("count", count, "days", days));
    }
}
