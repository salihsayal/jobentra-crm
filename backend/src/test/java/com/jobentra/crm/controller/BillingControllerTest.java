package com.jobentra.crm.controller;

import com.jobentra.crm.config.JwtUtil;
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
import com.jobentra.crm.service.BillingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BillingController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser
class BillingControllerTest {

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private CustomerRepository customerRepository;

    @MockBean
    private CandidateRepository candidateRepository;

    @MockBean
    private JobRepository jobRepository;

    @MockBean
    private BillingRepository billingRepository;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BillingService billingService;

    private final UUID billingId = UUID.randomUUID();
    private final UUID customerId = UUID.randomUUID();
    private final UUID candidateId = UUID.randomUUID();
    private final UUID jobId = UUID.randomUUID();

    @Test
    void getAll_shouldReturnPage() throws Exception {
        Billing billing = buildBilling();
        Page<Billing> page = new PageImpl<>(List.of(billing), PageRequest.of(0, 10), 1);
        when(billingService.searchBillings(eq("INV"), eq("PAID"), eq(customerId), any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/billings")
                        .param("search", "INV")
                        .param("status", "PAID")
                        .param("customerId", customerId.toString())
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].invoiceNumber").value("INV-2025-001"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getById_shouldReturnBilling_whenFound() throws Exception {
        when(billingService.getBillingById(billingId)).thenReturn(Optional.of(buildBilling()));

        mockMvc.perform(get("/api/billings/{id}", billingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.invoiceNumber").value("INV-2025-001"))
                .andExpect(jsonPath("$.amount").value(15000.00));
    }

    @Test
    void getById_shouldReturnNotFound_whenNotFound() throws Exception {
        when(billingService.getBillingById(billingId)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/billings/{id}", billingId))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_shouldReturnBilling_whenValid() throws Exception {
        when(billingService.createBilling(any(Billing.class), eq(customerId), eq(candidateId), eq(jobId)))
                .thenReturn(buildBilling());

        String body = objectMapper.writeValueAsString(Map.of(
                "invoiceNumber", "INV-2025-001",
                "customerId", customerId.toString(),
                "candidateId", candidateId.toString(),
                "jobId", jobId.toString(),
                "amount", 15000.00,
                "currency", "EUR",
                "status", "PAID",
                "dueDate", "2025-04-15"
        ));

        mockMvc.perform(post("/api/billings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.invoiceNumber").value("INV-2025-001"))
                .andExpect(jsonPath("$.status").value("PAID"));
    }

    @Test
    void create_shouldDefaultCurrencyToEur_whenNotProvided() throws Exception {
        Billing created = buildBilling();
        when(billingService.createBilling(any(Billing.class), eq(customerId), eq(null), eq(null)))
                .thenReturn(created);

        String body = objectMapper.writeValueAsString(Map.of(
                "invoiceNumber", "INV-2025-001",
                "customerId", customerId.toString(),
                "amount", 15000.00
        ));

        mockMvc.perform(post("/api/billings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    @Test
    void create_shouldReturnBadRequest_whenInvoiceNumberExists() throws Exception {
        when(billingService.createBilling(any(Billing.class), eq(customerId), eq(null), eq(null)))
                .thenThrow(new RuntimeException("Invoice number already exists: INV-2025-001"));

        String body = objectMapper.writeValueAsString(Map.of(
                "invoiceNumber", "INV-2025-001",
                "customerId", customerId.toString(),
                "amount", 15000.00
        ));

        mockMvc.perform(post("/api/billings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invoice number already exists: INV-2025-001"));
    }

    @Test
    void create_shouldReturnBadRequest_whenInvalidStatus() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "invoiceNumber", "INV-2025-001",
                "customerId", customerId.toString(),
                "amount", 15000.00,
                "status", "INVALID"
        ));

        mockMvc.perform(post("/api/billings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("No enum constant")));
    }

    @Test
    void create_shouldReturnBadRequest_whenMissingRequiredFields() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("invoiceNumber", ""));

        mockMvc.perform(post("/api/billings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_shouldReturnUpdatedBilling_whenValid() throws Exception {
        Billing updated = buildBilling();
        updated.setInvoiceNumber("INV-2025-999");
        when(billingService.updateBilling(eq(billingId), any(Billing.class), eq(customerId), eq(null), eq(null)))
                .thenReturn(updated);

        String body = objectMapper.writeValueAsString(Map.of(
                "invoiceNumber", "INV-2025-999",
                "customerId", customerId.toString(),
                "amount", 25000.00
        ));

        mockMvc.perform(put("/api/billings/{id}", billingId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.invoiceNumber").value("INV-2025-999"));
    }

    @Test
    void update_shouldReturnBadRequest_whenNotFound() throws Exception {
        when(billingService.updateBilling(eq(billingId), any(Billing.class), eq(customerId), eq(null), eq(null)))
                .thenThrow(new RuntimeException("Billing not found: " + billingId));

        String body = objectMapper.writeValueAsString(Map.of(
                "invoiceNumber", "INV-2025-001",
                "customerId", customerId.toString(),
                "amount", 25000.00
        ));

        mockMvc.perform(put("/api/billings/{id}", billingId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Billing not found: " + billingId));
    }

    @Test
    void delete_shouldReturnNoContent() throws Exception {
        doNothing().when(billingService).deleteBilling(billingId);

        mockMvc.perform(delete("/api/billings/{id}", billingId))
                .andExpect(status().isNoContent());

        verify(billingService).deleteBilling(billingId);
    }

    private Billing buildBilling() {
        Customer customer = new Customer();
        customer.setId(customerId);
        customer.setCompanyName("Acme Corp");
        customer.setEmail("john@acme.com");
        customer.setStatus(CustomerStatus.ACTIVE);

        Candidate candidate = new Candidate();
        candidate.setId(candidateId);
        candidate.setFirstName("Alice");
        candidate.setLastName("Johnson");
        candidate.setEmail("alice@example.com");
        candidate.setStatus(CandidateStatus.PLACED);

        Job job = new Job();
        job.setId(jobId);
        job.setTitle("Senior Developer");
        job.setStatus(JobStatus.OPEN);
        job.setCustomer(customer);

        Billing billing = new Billing();
        billing.setId(billingId);
        billing.setInvoiceNumber("INV-2025-001");
        billing.setCustomer(customer);
        billing.setCandidate(candidate);
        billing.setJob(job);
        billing.setAmount(new BigDecimal("15000.00"));
        billing.setCurrency("EUR");
        billing.setStatus(BillingStatus.PAID);
        billing.setDueDate(LocalDate.of(2025, 4, 15));
        return billing;
    }
}
