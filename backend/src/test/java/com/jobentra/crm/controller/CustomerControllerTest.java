package com.jobentra.crm.controller;

import com.jobentra.crm.config.JwtUtil;
import com.jobentra.crm.model.Customer;
import com.jobentra.crm.model.enums.CustomerStatus;
import com.jobentra.crm.repository.BillingRepository;
import com.jobentra.crm.repository.CandidateRepository;
import com.jobentra.crm.repository.CustomerRepository;
import com.jobentra.crm.repository.JobRepository;
import com.jobentra.crm.service.CustomerService;
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

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CustomerController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser
class CustomerControllerTest {

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
    private CustomerService customerService;

    private final UUID customerId = UUID.randomUUID();

    @Test
    void getAll_shouldReturnPage() throws Exception {
        Customer customer = buildCustomer();
        Page<Customer> page = new PageImpl<>(List.of(customer), PageRequest.of(0, 10), 1);
        when(customerService.searchCustomers(eq("acme"), eq("ACTIVE"), eq("Technology"), any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/customers")
                        .param("search", "acme")
                        .param("status", "ACTIVE")
                        .param("industry", "Technology")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].companyName").value("Acme Corp"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getById_shouldReturnCustomer_whenFound() throws Exception {
        Customer customer = buildCustomer();
        when(customerService.getCustomerById(customerId)).thenReturn(Optional.of(customer));

        mockMvc.perform(get("/api/customers/{id}", customerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value("Acme Corp"))
                .andExpect(jsonPath("$.email").value("john@acme.com"));
    }

    @Test
    void getById_shouldReturnNotFound_whenNotFound() throws Exception {
        when(customerService.getCustomerById(customerId)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/customers/{id}", customerId))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_shouldReturnCustomer_whenValid() throws Exception {
        Customer customer = buildCustomer();
        when(customerService.createCustomer(any(Customer.class))).thenReturn(customer);

        String body = objectMapper.writeValueAsString(Map.of(
                "companyName", "Acme Corp",
                "contactPerson", "John Smith",
                "email", "john@acme.com",
                "phone", "+1-555-0101",
                "industry", "Technology",
                "status", "ACTIVE"
        ));

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value("Acme Corp"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void create_shouldReturnBadRequest_whenDuplicateEmail() throws Exception {
        when(customerService.createCustomer(any(Customer.class)))
                .thenThrow(new RuntimeException("Email already exists: john@acme.com"));

        String body = objectMapper.writeValueAsString(Map.of(
                "companyName", "Acme Corp",
                "email", "john@acme.com"
        ));

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email already exists: john@acme.com"));
    }

    @Test
    void create_shouldReturnBadRequest_whenInvalidStatus() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "companyName", "Acme Corp",
                "email", "john@acme.com",
                "status", "INVALID"
        ));

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid status: INVALID"));
    }

    @Test
    void create_shouldReturnBadRequest_whenMissingRequiredFields() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("companyName", ""));

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_shouldReturnUpdatedCustomer_whenValid() throws Exception {
        Customer updated = buildCustomer();
        updated.setCompanyName("Acme Updated");
        when(customerService.updateCustomer(eq(customerId), any(Customer.class))).thenReturn(updated);

        String body = objectMapper.writeValueAsString(Map.of(
                "companyName", "Acme Updated",
                "contactPerson", "John Smith",
                "email", "john@acme.com",
                "phone", "+1-555-0101",
                "industry", "Technology",
                "status", "ACTIVE"
        ));

        mockMvc.perform(put("/api/customers/{id}", customerId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value("Acme Updated"));
    }

    @Test
    void update_shouldReturnBadRequest_whenNotFound() throws Exception {
        when(customerService.updateCustomer(eq(customerId), any(Customer.class)))
                .thenThrow(new RuntimeException("Customer not found: " + customerId));

        String body = objectMapper.writeValueAsString(Map.of(
                "companyName", "Acme Corp",
                "email", "john@acme.com"
        ));

        mockMvc.perform(put("/api/customers/{id}", customerId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Customer not found: " + customerId));
    }

    @Test
    void update_shouldReturnBadRequest_whenInvalidStatus() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "companyName", "Acme Corp",
                "email", "john@acme.com",
                "status", "INVALID"
        ));

        mockMvc.perform(put("/api/customers/{id}", customerId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid status: INVALID"));
    }

    @Test
    void delete_shouldReturnNoContent() throws Exception {
        doNothing().when(customerService).deleteCustomer(customerId);

        mockMvc.perform(delete("/api/customers/{id}", customerId))
                .andExpect(status().isNoContent());

        verify(customerService).deleteCustomer(customerId);
    }

    private Customer buildCustomer() {
        Customer customer = new Customer();
        customer.setId(customerId);
        customer.setCompanyName("Acme Corp");
        customer.setContactPerson("John Smith");
        customer.setEmail("john@acme.com");
        customer.setPhone("+1-555-0101");
        customer.setIndustry("Technology");
        customer.setStatus(CustomerStatus.ACTIVE);
        return customer;
    }
}
