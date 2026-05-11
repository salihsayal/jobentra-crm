package com.jobentra.crm.service;

import com.jobentra.crm.model.Member;
import com.jobentra.crm.repository.MemberRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class MemberService {

    private final MemberRepository memberRepository;

    public MemberService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public Page<Member> searchMembers(String search, String status, Pageable pageable) {
        return memberRepository.searchMembers(search, status, pageable);
    }

    public Optional<Member> getMemberById(UUID id) {
        return memberRepository.findById(id);
    }

    public Member createMember(Member member) {
        if (memberRepository.findByEmail(member.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists: " + member.getEmail());
        }
        return memberRepository.save(member);
    }

    public Member updateMember(UUID id, Member updated) {
        Member existing = memberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Member not found: " + id));

        if (!existing.getEmail().equals(updated.getEmail()) &&
                memberRepository.findByEmail(updated.getEmail()).isPresent()) {
            throw new RuntimeException("Email already taken: " + updated.getEmail());
        }

        existing.setFirstName(updated.getFirstName());
        existing.setLastName(updated.getLastName());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setStatus(updated.getStatus());
        existing.setNotes(updated.getNotes());

        return memberRepository.save(existing);
    }

    public void deleteMember(UUID id) {
        memberRepository.deleteById(id);
    }
}
