package com.jobentra.crm.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtFilter.class);

    private static final long RENEWAL_GRACE_MS = 5 * 60_000L;

    private static final String SESSION_ENDPOINT = "/api/auth/session";
    private static final String RENEW_ENDPOINT = "/api/auth/renew";

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String token = extractFromCookie(request);

        if (token == null) {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                token = header.substring(7);
            }
        }

        if (token != null && jwtUtil.validateToken(token)) {
            String email = jwtUtil.getEmailFromToken(token);
            String role = jwtUtil.getRoleFromToken(token);
            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(email, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);

            renewTokenIfNeeded(request, response, token, email, role);
        }

        chain.doFilter(request, response);
    }

    private void renewTokenIfNeeded(HttpServletRequest request, HttpServletResponse response,
                                    String token, String email, String role) {
        if (SESSION_ENDPOINT.equals(request.getRequestURI())
                || RENEW_ENDPOINT.equals(request.getRequestURI())) {
            return;
        }
        long grace = Math.min(RENEWAL_GRACE_MS, jwtUtil.getExpirationMs() / 3);
        if (token != null && jwtUtil.getRemainingMs(token) > jwtUtil.getExpirationMs() - grace) {
            return;
        }
        String freshToken = jwtUtil.generateToken(email, role);
        response.addHeader(HttpHeaders.SET_COOKIE, jwtUtil.buildAuthCookie(freshToken).toString());
        if (log.isDebugEnabled()) {
            log.debug("Renewed JWT for {} on {}", email, request.getRequestURI());
        }
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
