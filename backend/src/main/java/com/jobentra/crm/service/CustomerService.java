package com.jobentra.crm.service;

import com.jobentra.crm.model.Customer;
import com.jobentra.crm.model.enums.CustomerStatus;
import com.jobentra.crm.repository.CustomerRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public Page<Customer> searchCustomers(String search, String status, String industry, Pageable pageable) {
        CustomerStatus statusEnum = parseStatus(status);
        return customerRepository.searchCustomers(search, statusEnum, industry, pageable);
    }

    public Optional<Customer> getCustomerById(UUID id) {
        return customerRepository.findById(id);
    }

    public Customer createCustomer(Customer customer) {
        if (customerRepository.findByEmail(customer.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists: " + customer.getEmail());
        }
        return customerRepository.save(customer);
    }

    public Customer updateCustomer(UUID id, Customer updated) {
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));

        if (!existing.getEmail().equals(updated.getEmail()) &&
                customerRepository.findByEmail(updated.getEmail()).isPresent()) {
            throw new RuntimeException("Email already taken: " + updated.getEmail());
        }

        existing.setCompanyName(updated.getCompanyName());
        existing.setContactPerson(updated.getContactPerson());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setIndustry(updated.getIndustry());
        existing.setStatus(updated.getStatus());

        return customerRepository.save(existing);
    }

    public void deleteCustomer(UUID id) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));
        try {
            customerRepository.delete(c);
            customerRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Customer is referenced by jobs or billings. Delete those first.");
        }
    }

    public Customer archiveCustomer(UUID id) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));
        c.setArchived(true);
        return customerRepository.save(c);
    }

    public Customer unarchiveCustomer(UUID id) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + id));
        c.setArchived(false);
        return customerRepository.save(c);
    }

    private CustomerStatus parseStatus(String status) {
        if (status == null || status.isEmpty()) return null;
        try {
            return CustomerStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
