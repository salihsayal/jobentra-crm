package com.jobentra.crm.service;

import com.jobentra.crm.model.Billing;
import com.jobentra.crm.model.Candidate;
import com.jobentra.crm.model.Customer;
import com.jobentra.crm.model.Job;
import com.jobentra.crm.model.enums.BillingStatus;
import com.jobentra.crm.model.enums.CandidateStatus;
import com.jobentra.crm.model.enums.CustomerStatus;
import com.jobentra.crm.model.enums.JobStatus;
import com.jobentra.crm.repository.BillingRepository;
import com.jobentra.crm.repository.CandidateRepository;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillingServiceTest {

    @Mock
    private BillingRepository billingRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CandidateRepository candidateRepository;

    @Mock
    private JobRepository jobRepository;

    @InjectMocks
    private BillingService billingService;

    private UUID billingId;
    private UUID customerId;
    private UUID candidateId;
    private UUID jobId;
    private Billing billing;
    private Customer customer;
    private Candidate candidate;
    private Job job;

    @BeforeEach
    void setUp() {
        billingId = UUID.randomUUID();
        customerId = UUID.randomUUID();
        candidateId = UUID.randomUUID();
        jobId = UUID.randomUUID();

        customer = new Customer();
        customer.setId(customerId);
        customer.setCompanyName("Acme Corp");
        customer.setEmail("john@acme.com");
        customer.setStatus(CustomerStatus.ACTIVE);

        candidate = new Candidate();
        candidate.setId(candidateId);
        candidate.setFirstName("Alice");
        candidate.setLastName("Johnson");
        candidate.setEmail("alice@example.com");
        candidate.setStatus(CandidateStatus.PLACED);

        job = new Job();
        job.setId(jobId);
        job.setTitle("Senior Developer");
        job.setStatus(JobStatus.OPEN);
        job.setCustomer(customer);

        billing = new Billing();
        billing.setId(billingId);
        billing.setInvoiceNumber("INV-2025-001");
        billing.setCustomer(customer);
        billing.setCandidate(candidate);
        billing.setJob(job);
        billing.setAmount(new BigDecimal("15000.00"));
        billing.setCurrency("EUR");
        billing.setStatus(BillingStatus.PAID);
        billing.setDueDate(LocalDate.of(2025, 4, 15));
    }

    @Test
    void searchBillings_shouldReturnFilteredPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Billing> page = new PageImpl<>(List.of(billing), pageable, 1);

        when(billingRepository.searchBillings("INV", BillingStatus.PAID, customerId, pageable)).thenReturn(page);

        Page<Billing> result = billingService.searchBillings("INV", "PAID", customerId, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getInvoiceNumber()).isEqualTo("INV-2025-001");
    }

    @Test
    void searchBillings_shouldHandleNullStatusAndCustomerId() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Billing> page = new PageImpl<>(List.of(billing), pageable, 1);

        when(billingRepository.searchBillings(null, null, null, pageable)).thenReturn(page);

        Page<Billing> result = billingService.searchBillings(null, null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getBillingById_shouldReturnBilling_whenFound() {
        when(billingRepository.findById(billingId)).thenReturn(Optional.of(billing));

        Optional<Billing> result = billingService.getBillingById(billingId);

        assertThat(result).isPresent();
        assertThat(result.get().getInvoiceNumber()).isEqualTo("INV-2025-001");
    }

    @Test
    void getBillingById_shouldReturnEmpty_whenNotFound() {
        when(billingRepository.findById(billingId)).thenReturn(Optional.empty());

        Optional<Billing> result = billingService.getBillingById(billingId);

        assertThat(result).isEmpty();
    }

    @Test
    void createBilling_shouldSave_whenAllReferencesValid() {
        when(billingRepository.findByInvoiceNumber("INV-2025-001")).thenReturn(Optional.empty());
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(candidateRepository.findById(candidateId)).thenReturn(Optional.of(candidate));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        when(billingRepository.save(any(Billing.class))).thenReturn(billing);

        Billing result = billingService.createBilling(billing, customerId, candidateId, jobId);

        assertThat(result.getCustomer().getCompanyName()).isEqualTo("Acme Corp");
        assertThat(result.getCandidate().getFirstName()).isEqualTo("Alice");
        assertThat(result.getJob().getTitle()).isEqualTo("Senior Developer");
        verify(billingRepository).save(billing);
    }

    @Test
    void createBilling_shouldSave_whenCandidateAndJobAreNull() {
        Billing simple = new Billing();
        simple.setInvoiceNumber("INV-2025-002");
        simple.setAmount(new BigDecimal("500.00"));

        when(billingRepository.findByInvoiceNumber("INV-2025-002")).thenReturn(Optional.empty());
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(billingRepository.save(any(Billing.class))).thenReturn(simple);

        Billing result = billingService.createBilling(simple, customerId, null, null);

        assertThat(result.getCustomer()).isNotNull();
        assertThat(result.getCandidate()).isNull();
        assertThat(result.getJob()).isNull();
    }

    @Test
    void createBilling_shouldThrow_whenInvoiceNumberExists() {
        when(billingRepository.findByInvoiceNumber("INV-2025-001")).thenReturn(Optional.of(billing));

        assertThatThrownBy(() -> billingService.createBilling(billing, customerId, null, null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invoice number already exists");

        verify(billingRepository, never()).save(any());
    }

    @Test
    void createBilling_shouldThrow_whenCustomerNotFound() {
        UUID unknownId = UUID.randomUUID();
        when(billingRepository.findByInvoiceNumber("INV-2025-001")).thenReturn(Optional.empty());
        when(customerRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> billingService.createBilling(billing, unknownId, null, null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Customer not found");
    }

    @Test
    void createBilling_shouldThrow_whenCandidateNotFound() {
        UUID unknownId = UUID.randomUUID();
        when(billingRepository.findByInvoiceNumber("INV-2025-001")).thenReturn(Optional.empty());
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(candidateRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> billingService.createBilling(billing, customerId, unknownId, null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Candidate not found");
    }

    @Test
    void updateBilling_shouldUpdateAllFields() {
        Billing updated = new Billing();
        updated.setInvoiceNumber("INV-2025-001");
        updated.setAmount(new BigDecimal("25000.00"));
        updated.setCurrency("USD");
        updated.setStatus(BillingStatus.SENT);
        updated.setDueDate(LocalDate.of(2025, 6, 1));

        Customer newCustomer = new Customer();
        newCustomer.setId(UUID.randomUUID());
        newCustomer.setCompanyName("New Corp");
        newCustomer.setEmail("new@corp.com");

        when(billingRepository.findById(billingId)).thenReturn(Optional.of(billing));
        when(customerRepository.findById(newCustomer.getId())).thenReturn(Optional.of(newCustomer));
        when(billingRepository.save(billing)).thenReturn(billing);

        Billing result = billingService.updateBilling(billingId, updated, newCustomer.getId(), null, null);

        assertThat(result.getAmount()).isEqualByComparingTo(new BigDecimal("25000.00"));
        assertThat(result.getCurrency()).isEqualTo("USD");
        assertThat(result.getStatus()).isEqualTo(BillingStatus.SENT);
        assertThat(result.getDueDate()).isEqualTo(LocalDate.of(2025, 6, 1));
        assertThat(result.getCustomer().getCompanyName()).isEqualTo("New Corp");
        assertThat(result.getCandidate()).isNull();
        assertThat(result.getJob()).isNull();
    }

    @Test
    void updateBilling_shouldThrow_whenNotFound() {
        when(billingRepository.findById(billingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> billingService.updateBilling(billingId, billing, customerId, null, null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Billing not found");
    }

    @Test
    void updateBilling_shouldThrow_whenInvoiceNumberConflict() {
        Billing updated = new Billing();
        updated.setInvoiceNumber("INV-2025-999");
        updated.setAmount(BigDecimal.TEN);

        when(billingRepository.findById(billingId)).thenReturn(Optional.of(billing));
        when(billingRepository.findByInvoiceNumber("INV-2025-999")).thenReturn(Optional.of(new Billing()));

        assertThatThrownBy(() -> billingService.updateBilling(billingId, updated, customerId, null, null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invoice number already taken");
    }

    @Test
    void updateBilling_shouldAllowSameInvoiceNumber() {
        Billing updated = new Billing();
        updated.setInvoiceNumber("INV-2025-001");
        updated.setAmount(BigDecimal.TEN);

        when(billingRepository.findById(billingId)).thenReturn(Optional.of(billing));
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(billingRepository.save(billing)).thenReturn(billing);

        Billing result = billingService.updateBilling(billingId, updated, customerId, null, null);

        assertThat(result).isNotNull();
    }

    @Test
    void deleteBilling_shouldDelegateToRepository() {
        doNothing().when(billingRepository).deleteById(billingId);

        billingService.deleteBilling(billingId);

        verify(billingRepository).deleteById(billingId);
    }
}
