package com.jobentra.crm.controller;

import com.jobentra.crm.dto.CreateJobRequest;
import com.jobentra.crm.dto.UpdateJobRequest;
import com.jobentra.crm.model.Job;
import com.jobentra.crm.model.enums.JobStatus;
import com.jobentra.crm.service.JobService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @GetMapping
    public ResponseEntity<Page<Job>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID customerId,
            Pageable pageable) {
        return ResponseEntity.ok(jobService.searchJobs(search, status, customerId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Job> getById(@PathVariable UUID id) {
        return jobService.getJobById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateJobRequest request) {
        try {
            Job job = new Job();
            job.setTitle(request.getTitle());
            job.setDescription(request.getDescription());
            if (request.getStatus() != null && !request.getStatus().isEmpty()) {
                job.setStatus(JobStatus.valueOf(request.getStatus().toUpperCase()));
            }
            job.setSalaryRange(request.getSalaryRange());

            UUID customerId = UUID.fromString(request.getCustomerId());
            return ResponseEntity.ok(jobService.createJob(job, customerId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status or customer ID: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @Valid @RequestBody UpdateJobRequest request) {
        try {
            Job updated = new Job();
            updated.setTitle(request.getTitle());
            updated.setDescription(request.getDescription());
            if (request.getStatus() != null && !request.getStatus().isEmpty()) {
                updated.setStatus(JobStatus.valueOf(request.getStatus().toUpperCase()));
            }
            updated.setSalaryRange(request.getSalaryRange());

            UUID customerId = UUID.fromString(request.getCustomerId());
            return ResponseEntity.ok(jobService.updateJob(id, updated, customerId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status or customer ID: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        jobService.deleteJob(id);
        return ResponseEntity.noContent().build();
    }
}
