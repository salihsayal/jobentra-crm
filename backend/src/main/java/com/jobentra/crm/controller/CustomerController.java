package com.jobentra.crm.controller;

import com.jobentra.crm.dto.CreateCustomerRequest;
import com.jobentra.crm.dto.UpdateCustomerRequest;
import com.jobentra.crm.model.Customer;
import com.jobentra.crm.model.enums.CustomerStatus;
import com.jobentra.crm.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public ResponseEntity<Page<Customer>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String industry,
            Pageable pageable) {
        return ResponseEntity.ok(customerService.searchCustomers(search, status, industry, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getById(@PathVariable UUID id) {
        return customerService.getCustomerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateCustomerRequest request) {
        try {
            Customer customer = new Customer();
            customer.setCompanyName(request.getCompanyName());
            customer.setContactPerson(request.getContactPerson());
            customer.setEmail(request.getEmail());
            customer.setPhone(request.getPhone());
            customer.setIndustry(request.getIndustry());
            if (request.getStatus() != null && !request.getStatus().isEmpty()) {
                customer.setStatus(CustomerStatus.valueOf(request.getStatus().toUpperCase()));
            }
            return ResponseEntity.ok(customerService.createCustomer(customer));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + request.getStatus()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @Valid @RequestBody UpdateCustomerRequest request) {
        try {
            Customer updated = new Customer();
            updated.setCompanyName(request.getCompanyName());
            updated.setContactPerson(request.getContactPerson());
            updated.setEmail(request.getEmail());
            updated.setPhone(request.getPhone());
            updated.setIndustry(request.getIndustry());
            if (request.getStatus() != null && !request.getStatus().isEmpty()) {
                updated.setStatus(CustomerStatus.valueOf(request.getStatus().toUpperCase()));
            }
            return ResponseEntity.ok(customerService.updateCustomer(id, updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + request.getStatus()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        try {
            customerService.deleteCustomer(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<?> archive(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(customerService.archiveCustomer(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/unarchive")
    public ResponseEntity<?> unarchive(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(customerService.unarchiveCustomer(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
