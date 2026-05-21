package com.jobentra.crm.service;

import com.jobentra.crm.model.Billing;
import com.jobentra.crm.model.Candidate;
import com.jobentra.crm.model.Customer;
import com.jobentra.crm.model.Job;
import com.jobentra.crm.model.enums.BillingStatus;
import com.jobentra.crm.repository.BillingRepository;
import com.jobentra.crm.repository.CandidateRepository;
import com.jobentra.crm.repository.CustomerRepository;
import com.jobentra.crm.repository.JobRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class BillingService {

    private final BillingRepository billingRepository;
    private final CustomerRepository customerRepository;
    private final CandidateRepository candidateRepository;
    private final JobRepository jobRepository;

    public BillingService(BillingRepository billingRepository,
                          CustomerRepository customerRepository,
                          CandidateRepository candidateRepository,
                          JobRepository jobRepository) {
        this.billingRepository = billingRepository;
        this.customerRepository = customerRepository;
        this.candidateRepository = candidateRepository;
        this.jobRepository = jobRepository;
    }

    public Page<Billing> searchBillings(String search, String status, UUID customerId, Pageable pageable) {
        BillingStatus statusEnum = parseStatus(status);
        return billingRepository.searchBillings(search, statusEnum, customerId, pageable);
    }

    public Optional<Billing> getBillingById(UUID id) {
        return billingRepository.findById(id);
    }

    public Billing createBilling(Billing billing, UUID customerId, UUID candidateId, UUID jobId) {
        if (billingRepository.findByInvoiceNumber(billing.getInvoiceNumber()).isPresent()) {
            throw new RuntimeException("Invoice number already exists: " + billing.getInvoiceNumber());
        }

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + customerId));
        billing.setCustomer(customer);

        if (candidateId != null) {
            Candidate candidate = candidateRepository.findById(candidateId)
                    .orElseThrow(() -> new RuntimeException("Candidate not found: " + candidateId));
            billing.setCandidate(candidate);
        }

        if (jobId != null) {
            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));
            billing.setJob(job);
        }

        return billingRepository.save(billing);
    }

    public Billing updateBilling(UUID id, Billing updated, UUID customerId, UUID candidateId, UUID jobId) {
        Billing existing = billingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Billing not found: " + id));

        if (!existing.getInvoiceNumber().equals(updated.getInvoiceNumber()) &&
                billingRepository.findByInvoiceNumber(updated.getInvoiceNumber()).isPresent()) {
            throw new RuntimeException("Invoice number already taken: " + updated.getInvoiceNumber());
        }

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + customerId));
        existing.setCustomer(customer);

        if (candidateId != null) {
            Candidate candidate = candidateRepository.findById(candidateId)
                    .orElseThrow(() -> new RuntimeException("Candidate not found: " + candidateId));
            existing.setCandidate(candidate);
        } else {
            existing.setCandidate(null);
        }

        if (jobId != null) {
            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));
            existing.setJob(job);
        } else {
            existing.setJob(null);
        }

        existing.setInvoiceNumber(updated.getInvoiceNumber());
        existing.setAmount(updated.getAmount());
        existing.setCurrency(updated.getCurrency());
        existing.setStatus(updated.getStatus());
        existing.setDueDate(updated.getDueDate());

        return billingRepository.save(existing);
    }

    public void deleteBilling(UUID id) {
        billingRepository.deleteById(id);
    }

    private BillingStatus parseStatus(String status) {
        if (status == null || status.isEmpty()) return null;
        try {
            return BillingStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
