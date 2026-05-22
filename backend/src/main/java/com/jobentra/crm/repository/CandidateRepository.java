package com.jobentra.crm.repository;

import com.jobentra.crm.model.Candidate;
import com.jobentra.crm.model.enums.CandidateStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, UUID> {
    Optional<Candidate> findByEmail(String email);

    Page<Candidate> findByStatus(CandidateStatus status, Pageable pageable);

    @Query("SELECT DISTINCT c FROM Candidate c LEFT JOIN c.skills s WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR c.status = :status)")
    Page<Candidate> searchCandidates(@Param("search") String search,
                                     @Param("status") CandidateStatus status,
                                     Pageable pageable);
}
