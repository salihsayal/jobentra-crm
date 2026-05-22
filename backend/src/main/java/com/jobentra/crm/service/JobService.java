package com.jobentra.crm.service;

import com.jobentra.crm.model.Customer;
import com.jobentra.crm.model.Job;
import com.jobentra.crm.model.enums.JobStatus;
import com.jobentra.crm.repository.CustomerRepository;
import com.jobentra.crm.repository.JobRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final CustomerRepository customerRepository;

    public JobService(JobRepository jobRepository, CustomerRepository customerRepository) {
        this.jobRepository = jobRepository;
        this.customerRepository = customerRepository;
    }

    public Page<Job> searchJobs(String search, String status, UUID customerId, Pageable pageable) {
        JobStatus statusEnum = parseStatus(status);
        return jobRepository.searchJobs(search, statusEnum, customerId, pageable);
    }

    public Optional<Job> getJobById(UUID id) {
        return jobRepository.findById(id);
    }

    public Job createJob(Job job, UUID customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + customerId));
        job.setCustomer(customer);
        return jobRepository.save(job);
    }

    public Job updateJob(UUID id, Job updated, UUID customerId) {
        Job existing = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found: " + id));

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + customerId));

        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setCustomer(customer);
        existing.setStatus(updated.getStatus());
        existing.setSalaryRange(updated.getSalaryRange());

        return jobRepository.save(existing);
    }

    public void deleteJob(UUID id) {
        Job j = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found: " + id));
        try {
            jobRepository.delete(j);
            jobRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Job is referenced by billing records. Delete those first.");
        }
    }

    public Job archiveJob(UUID id) {
        Job j = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found: " + id));
        j.setArchived(true);
        return jobRepository.save(j);
    }

    public Job unarchiveJob(UUID id) {
        Job j = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found: " + id));
        j.setArchived(false);
        return jobRepository.save(j);
    }

    private JobStatus parseStatus(String status) {
        if (status == null || status.isEmpty()) return null;
        try {
            return JobStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
