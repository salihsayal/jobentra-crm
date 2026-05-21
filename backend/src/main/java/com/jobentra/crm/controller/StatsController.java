package com.jobentra.crm.controller;

import com.jobentra.crm.repository.BillingRepository;
import com.jobentra.crm.repository.CandidateRepository;
import com.jobentra.crm.repository.CustomerRepository;
import com.jobentra.crm.repository.JobRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final CustomerRepository customerRepository;
    private final CandidateRepository candidateRepository;
    private final JobRepository jobRepository;
    private final BillingRepository billingRepository;

    public StatsController(CustomerRepository customerRepository,
                           CandidateRepository candidateRepository,
                           JobRepository jobRepository,
                           BillingRepository billingRepository) {
        this.customerRepository = customerRepository;
        this.candidateRepository = candidateRepository;
        this.jobRepository = jobRepository;
        this.billingRepository = billingRepository;
    }

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Long>> overview() {
        long totalCustomers = customerRepository.count();
        long totalCandidates = candidateRepository.count();
        long openJobs = jobRepository.count();
        long totalBillings = billingRepository.count();
        return ResponseEntity.ok(Map.of(
                "totalCustomers", totalCustomers,
                "totalCandidates", totalCandidates,
                "openJobs", openJobs,
                "totalBillings", totalBillings
        ));
    }
}
