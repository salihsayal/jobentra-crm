package com.jobentra.crm.service;

import com.jobentra.crm.model.Customer;
import com.jobentra.crm.model.Job;
import com.jobentra.crm.model.enums.CustomerStatus;
import com.jobentra.crm.model.enums.JobStatus;
import com.jobentra.crm.repository.CustomerRepository;
import com.jobentra.crm.repository.JobRepository;
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
class JobServiceTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private JobService jobService;

    private UUID jobId;
    private UUID customerId;
    private Job job;
    private Customer customer;

    @BeforeEach
    void setUp() {
        jobId = UUID.randomUUID();
        customerId = UUID.randomUUID();

        customer = new Customer();
        customer.setId(customerId);
        customer.setCompanyName("Acme Corp");
        customer.setEmail("john@acme.com");
        customer.setStatus(CustomerStatus.ACTIVE);

        job = new Job();
        job.setId(jobId);
        job.setTitle("Senior Backend Developer");
        job.setDescription("5+ years Java experience.");
        job.setStatus(JobStatus.OPEN);
        job.setSalaryRange("80,000 - 110,000 EUR");
        job.setCustomer(customer);
    }

    @Test
    void searchJobs_shouldReturnFilteredPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Job> page = new PageImpl<>(List.of(job), pageable, 1);

        when(jobRepository.searchJobs("senior", JobStatus.OPEN, customerId, pageable)).thenReturn(page);

        Page<Job> result = jobService.searchJobs("senior", "OPEN", customerId, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Senior Backend Developer");
    }

    @Test
    void searchJobs_shouldHandleNullStatusAndCustomerId() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Job> page = new PageImpl<>(List.of(job), pageable, 1);

        when(jobRepository.searchJobs("senior", null, null, pageable)).thenReturn(page);

        Page<Job> result = jobService.searchJobs("senior", null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getJobById_shouldReturnJob_whenFound() {
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

        Optional<Job> result = jobService.getJobById(jobId);

        assertThat(result).isPresent();
        assertThat(result.get().getTitle()).isEqualTo("Senior Backend Developer");
    }

    @Test
    void getJobById_shouldReturnEmpty_whenNotFound() {
        when(jobRepository.findById(jobId)).thenReturn(Optional.empty());

        Optional<Job> result = jobService.getJobById(jobId);

        assertThat(result).isEmpty();
    }

    @Test
    void createJob_shouldSave_whenCustomerFound() {
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(jobRepository.save(any(Job.class))).thenReturn(job);

        Job newJob = new Job();
        newJob.setTitle("New Job");

        Job result = jobService.createJob(newJob, customerId);

        assertThat(result.getCustomer()).isNotNull();
        assertThat(result.getCustomer().getCompanyName()).isEqualTo("Acme Corp");
        verify(jobRepository).save(any(Job.class));
    }

    @Test
    void createJob_shouldThrow_whenCustomerNotFound() {
        UUID unknownId = UUID.randomUUID();
        when(customerRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> jobService.createJob(new Job(), unknownId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Customer not found");

        verify(jobRepository, never()).save(any());
    }

    @Test
    void updateJob_shouldUpdate_whenFound() {
        Job updated = new Job();
        updated.setTitle("Updated Title");
        updated.setDescription("Updated description");
        updated.setStatus(JobStatus.CLOSED);
        updated.setSalaryRange("90,000 - 120,000 EUR");

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(jobRepository.save(job)).thenReturn(job);

        Job result = jobService.updateJob(jobId, updated, customerId);

        assertThat(result.getTitle()).isEqualTo("Updated Title");
        assertThat(result.getDescription()).isEqualTo("Updated description");
        assertThat(result.getStatus()).isEqualTo(JobStatus.CLOSED);
        assertThat(result.getSalaryRange()).isEqualTo("90,000 - 120,000 EUR");
        verify(jobRepository).save(job);
    }

    @Test
    void updateJob_shouldThrow_whenJobNotFound() {
        when(jobRepository.findById(jobId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> jobService.updateJob(jobId, new Job(), customerId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Job not found");

        verify(jobRepository, never()).save(any());
    }

    @Test
    void updateJob_shouldThrow_whenCustomerNotFound() {
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        UUID unknownId = UUID.randomUUID();
        when(customerRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> jobService.updateJob(jobId, new Job(), unknownId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Customer not found");

        verify(jobRepository, never()).save(any());
    }

    @Test
    void deleteJob_shouldDelegateToRepository() {
        doNothing().when(jobRepository).deleteById(jobId);

        jobService.deleteJob(jobId);

        verify(jobRepository).deleteById(jobId);
    }
}
