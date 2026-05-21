package com.jobentra.crm.repository;

import com.jobentra.crm.model.Customer;
import com.jobentra.crm.model.Job;
import com.jobentra.crm.model.enums.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {

    @Query("SELECT j FROM Job j WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(j.title) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR j.status = :status) AND " +
           "(:customerId IS NULL OR j.customer.id = :customerId)")
    Page<Job> searchJobs(@Param("search") String search,
                         @Param("status") JobStatus status,
                         @Param("customerId") UUID customerId,
                         Pageable pageable);
}
