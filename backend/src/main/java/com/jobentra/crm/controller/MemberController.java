package com.jobentra.crm.controller;

import com.jobentra.crm.dto.CreateMemberRequest;
import com.jobentra.crm.dto.UpdateMemberRequest;
import com.jobentra.crm.model.Member;
import com.jobentra.crm.service.MemberService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportCsv(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        Page<Member> page = memberService.searchMembers(search, status, Pageable.unpaged());
        StringBuilder csv = new StringBuilder();
        csv.append("firstName,lastName,email,phone,status,createdAt\n");
        for (Member m : page.getContent()) {
            csv.append(escapeCsv(m.getFirstName())).append(",");
            csv.append(escapeCsv(m.getLastName())).append(",");
            csv.append(escapeCsv(m.getEmail())).append(",");
            csv.append(escapeCsv(m.getPhone() != null ? m.getPhone() : "")).append(",");
            csv.append(m.getStatus()).append(",");
            csv.append(m.getCreatedAt()).append("\n");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header("Content-Disposition", "attachment; filename=members.csv")
                .body(csv.toString());
    }

    @GetMapping
    public ResponseEntity<Page<Member>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return ResponseEntity.ok(memberService.searchMembers(search, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Member> getById(@PathVariable UUID id) {
        return memberService.getMemberById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateMemberRequest request) {
        try {
            Member member = new Member();
            member.setFirstName(request.getFirstName());
            member.setLastName(request.getLastName());
            member.setEmail(request.getEmail());
            member.setPhone(request.getPhone());
            member.setStatus(request.getStatus() != null ? request.getStatus() : "active");
            member.setNotes(request.getNotes());
            return ResponseEntity.ok(memberService.createMember(member));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @Valid @RequestBody UpdateMemberRequest request) {
        try {
            Member updated = new Member();
            updated.setFirstName(request.getFirstName());
            updated.setLastName(request.getLastName());
            updated.setEmail(request.getEmail());
            updated.setPhone(request.getPhone());
            updated.setStatus(request.getStatus());
            updated.setNotes(request.getNotes());
            return ResponseEntity.ok(memberService.updateMember(id, updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        memberService.deleteMember(id);
        return ResponseEntity.noContent().build();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
