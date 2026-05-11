package com.jobentra.crm.repository;

import com.jobentra.crm.model.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MemberRepository extends JpaRepository<Member, UUID> {
    Optional<Member> findByEmail(String email);

    Page<Member> findByStatus(String status, Pageable pageable);

    long countByStatus(String status);

    long countByCreatedAtAfter(LocalDateTime since);

    @Query("SELECT m FROM Member m WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(m.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR :status = '' OR m.status = :status)")
    Page<Member> searchMembers(@Param("search") String search,
                               @Param("status") String status,
                               Pageable pageable);
}
