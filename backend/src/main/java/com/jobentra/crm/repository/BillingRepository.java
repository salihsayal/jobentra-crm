package com.jobentra.crm.repository;

import com.jobentra.crm.model.Billing;
import com.jobentra.crm.model.enums.BillingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BillingRepository extends JpaRepository<Billing, UUID> {
    Optional<Billing> findByInvoiceNumber(String invoiceNumber);

    @Query("SELECT b FROM Billing b WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(b.invoiceNumber) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:customerId IS NULL OR b.customer.id = :customerId)")
    Page<Billing> searchBillings(@Param("search") String search,
                                 @Param("status") BillingStatus status,
                                 @Param("customerId") UUID customerId,
                                 Pageable pageable);
}
