package com.jobentra.crm.service;

import com.jobentra.crm.model.Customer;
import com.jobentra.crm.model.enums.CustomerStatus;
import com.jobentra.crm.repository.CustomerRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private CustomerService customerService;

    private UUID customerId;
    private Customer customer;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        customer = new Customer();
        customer.setId(customerId);
        customer.setCompanyName("Acme Corp");
        customer.setContactPerson("John Smith");
        customer.setEmail("john@acme.com");
        customer.setPhone("+1-555-0101");
        customer.setIndustry("Technology");
        customer.setStatus(CustomerStatus.ACTIVE);
    }

    @Test
    void searchCustomers_shouldReturnFilteredPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Customer> page = new PageImpl<>(List.of(customer), pageable, 1);

        when(customerRepository.searchCustomers("acme", CustomerStatus.ACTIVE, "Technology", pageable))
                .thenReturn(page);

        Page<Customer> result = customerService.searchCustomers("acme", "ACTIVE", "Technology", pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getCompanyName()).isEqualTo("Acme Corp");
        verify(customerRepository).searchCustomers("acme", CustomerStatus.ACTIVE, "Technology", pageable);
    }

    @Test
    void searchCustomers_shouldHandleNullStatusAndIndustry() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Customer> page = new PageImpl<>(List.of(customer), pageable, 1);

        when(customerRepository.searchCustomers("acme", null, null, pageable)).thenReturn(page);

        Page<Customer> result = customerService.searchCustomers("acme", null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void searchCustomers_shouldHandleEmptySearch() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Customer> page = new PageImpl<>(List.of(customer), pageable, 1);

        when(customerRepository.searchCustomers("", null, null, pageable)).thenReturn(page);

        Page<Customer> result = customerService.searchCustomers("", null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getCustomerById_shouldReturnCustomer_whenFound() {
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));

        Optional<Customer> result = customerService.getCustomerById(customerId);

        assertThat(result).isPresent();
        assertThat(result.get().getCompanyName()).isEqualTo("Acme Corp");
    }

    @Test
    void getCustomerById_shouldReturnEmpty_whenNotFound() {
        when(customerRepository.findById(customerId)).thenReturn(Optional.empty());

        Optional<Customer> result = customerService.getCustomerById(customerId);

        assertThat(result).isEmpty();
    }

    @Test
    void createCustomer_shouldSave_whenEmailUnique() {
        when(customerRepository.findByEmail("john@acme.com")).thenReturn(Optional.empty());
        when(customerRepository.save(customer)).thenReturn(customer);

        Customer result = customerService.createCustomer(customer);

        assertThat(result.getEmail()).isEqualTo("john@acme.com");
        verify(customerRepository).findByEmail("john@acme.com");
        verify(customerRepository).save(customer);
    }

    @Test
    void createCustomer_shouldThrow_whenEmailExists() {
        when(customerRepository.findByEmail("john@acme.com")).thenReturn(Optional.of(customer));

        assertThatThrownBy(() -> customerService.createCustomer(customer))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email already exists");

        verify(customerRepository, never()).save(any());
    }

    @Test
    void updateCustomer_shouldUpdate_whenFound() {
        Customer updated = new Customer();
        updated.setCompanyName("Acme Updated");
        updated.setContactPerson("Jane Doe");
        updated.setEmail("john@acme.com");
        updated.setPhone("+1-555-9999");
        updated.setIndustry("Finance");
        updated.setStatus(CustomerStatus.INACTIVE);

        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(customerRepository.save(customer)).thenReturn(customer);

        Customer result = customerService.updateCustomer(customerId, updated);

        assertThat(result.getCompanyName()).isEqualTo("Acme Updated");
        assertThat(result.getContactPerson()).isEqualTo("Jane Doe");
        assertThat(result.getPhone()).isEqualTo("+1-555-9999");
        assertThat(result.getIndustry()).isEqualTo("Finance");
        assertThat(result.getStatus()).isEqualTo(CustomerStatus.INACTIVE);
        verify(customerRepository).save(customer);
    }

    @Test
    void updateCustomer_shouldThrow_whenNotFound() {
        when(customerRepository.findById(customerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customerService.updateCustomer(customerId, customer))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Customer not found");

        verify(customerRepository, never()).save(any());
    }

    @Test
    void updateCustomer_shouldThrow_whenEmailConflictWithAnother() {
        Customer updated = new Customer();
        updated.setEmail("other@acme.com");
        updated.setCompanyName("Test");

        Customer otherCustomer = new Customer();
        otherCustomer.setId(UUID.randomUUID());
        otherCustomer.setEmail("other@acme.com");

        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(customerRepository.findByEmail("other@acme.com")).thenReturn(Optional.of(otherCustomer));

        assertThatThrownBy(() -> customerService.updateCustomer(customerId, updated))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email already taken");

        verify(customerRepository, never()).save(any());
    }

    @Test
    void updateCustomer_shouldAllowSameEmail() {
        Customer updated = new Customer();
        updated.setEmail("john@acme.com");
        updated.setCompanyName("Acme Corp");

        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(customerRepository.save(customer)).thenReturn(customer);

        Customer result = customerService.updateCustomer(customerId, updated);

        assertThat(result).isNotNull();
        verify(customerRepository).save(customer);
    }

    @Test
    void deleteCustomer_shouldDelegateToRepository() {
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        doNothing().when(customerRepository).delete(customer);

        customerService.deleteCustomer(customerId);

        verify(customerRepository).delete(customer);
    }
}
