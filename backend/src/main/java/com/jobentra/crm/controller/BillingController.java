package com.jobentra.crm.controller;

import com.jobentra.crm.dto.CreateBillingRequest;
import com.jobentra.crm.dto.UpdateBillingRequest;
import com.jobentra.crm.model.Billing;
import com.jobentra.crm.model.enums.BillingStatus;
import com.jobentra.crm.service.BillingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/billings")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping
    public ResponseEntity<Page<Billing>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID customerId,
            Pageable pageable) {
        return ResponseEntity.ok(billingService.searchBillings(search, status, customerId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Billing> getById(@PathVariable UUID id) {
        return billingService.getBillingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateBillingRequest request) {
        try {
            Billing billing = new Billing();
            billing.setInvoiceNumber(request.getInvoiceNumber());
            billing.setAmount(request.getAmount());
            billing.setCurrency(request.getCurrency() != null ? request.getCurrency() : "EUR");
            if (request.getStatus() != null && !request.getStatus().isEmpty()) {
                billing.setStatus(BillingStatus.valueOf(request.getStatus().toUpperCase()));
            }
            billing.setDueDate(request.getDueDate());

            UUID customerId = UUID.fromString(request.getCustomerId());
            UUID candidateId = request.getCandidateId() != null ? UUID.fromString(request.getCandidateId()) : null;
            UUID jobId = request.getJobId() != null ? UUID.fromString(request.getJobId()) : null;

            return ResponseEntity.ok(billingService.createBilling(billing, customerId, candidateId, jobId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid parameter: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @Valid @RequestBody UpdateBillingRequest request) {
        try {
            Billing updated = new Billing();
            updated.setInvoiceNumber(request.getInvoiceNumber());
            updated.setAmount(request.getAmount());
            updated.setCurrency(request.getCurrency() != null ? request.getCurrency() : "EUR");
            if (request.getStatus() != null && !request.getStatus().isEmpty()) {
                updated.setStatus(BillingStatus.valueOf(request.getStatus().toUpperCase()));
            }
            updated.setDueDate(request.getDueDate());

            UUID customerId = UUID.fromString(request.getCustomerId());
            UUID candidateId = request.getCandidateId() != null ? UUID.fromString(request.getCandidateId()) : null;
            UUID jobId = request.getJobId() != null ? UUID.fromString(request.getJobId()) : null;

            return ResponseEntity.ok(billingService.updateBilling(id, updated, customerId, candidateId, jobId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid parameter: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        billingService.deleteBilling(id);
        return ResponseEntity.noContent().build();
    }
}
