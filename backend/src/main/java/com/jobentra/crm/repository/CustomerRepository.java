package com.jobentra.crm.repository;

import com.jobentra.crm.model.Customer;
import com.jobentra.crm.model.enums.CustomerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Optional<Customer> findByEmail(String email);

    Page<Customer> findByStatus(CustomerStatus status, Pageable pageable);
    Page<Customer> findByIndustry(String industry, Pageable pageable);

    @Query("SELECT c FROM Customer c WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(c.companyName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.contactPerson) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:industry IS NULL OR :industry = '' OR c.industry = :industry)")
    Page<Customer> searchCustomers(@Param("search") String search,
                                   @Param("status") CustomerStatus status,
                                   @Param("industry") String industry,
                                   Pageable pageable);
}
