package com.jobentra.crm.controller;

import com.jobentra.crm.config.JwtUtil;
import com.jobentra.crm.dto.LoginRequest;
import com.jobentra.crm.dto.LoginResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtUtil jwtUtil;

    @Value("${demo.email}")
    private String demoEmail;

    @Value("${demo.password}")
    private String demoPassword;

    public AuthController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        if (demoEmail.equals(request.getEmail()) &&
            demoPassword.equals(request.getPassword())) {

            String token = jwtUtil.generateToken(request.getEmail(), "ADMIN");

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, jwtUtil.buildAuthCookie(token).toString())
                    .body(new LoginResponse(token, "Login successful", jwtUtil.getExpirationMs()));
        }

        return ResponseEntity.status(401)
                .body(Map.of("error", "Invalid credentials"));
    }

    @GetMapping("/session")
    public ResponseEntity<?> session(HttpServletRequest request) {
        String token = extractFromCookie(request);
        if (token == null) {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                token = header.substring(7);
            }
        }
        if (token == null || !jwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "No active session"));
        }
        return ResponseEntity.ok(Map.of(
                "remainingMs", jwtUtil.getRemainingMs(token),
                "idleTimeoutMs", jwtUtil.getExpirationMs()
        ));
    }

    @PostMapping("/renew")
    public ResponseEntity<?> renew(HttpServletRequest request) {
        String token = extractFromCookie(request);
        if (token == null || !jwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "No active session"));
        }
        String freshToken = jwtUtil.generateToken(
                jwtUtil.getEmailFromToken(token),
                jwtUtil.getRoleFromToken(token));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtUtil.buildAuthCookie(freshToken).toString())
                .body(Map.of(
                        "remainingMs", jwtUtil.getRemainingMs(freshToken),
                        "idleTimeoutMs", jwtUtil.getExpirationMs()
                ));
    }

    private String extractFromCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
