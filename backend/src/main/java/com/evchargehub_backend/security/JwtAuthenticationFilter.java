package com.evchargehub_backend.security;

import com.evchargehub_backend.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;

    public JwtAuthenticationFilter(
            JwtUtil jwtUtil,
            CustomUserDetailsService customUserDetailsService) {

        this.jwtUtil = jwtUtil;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String requestUri = request.getRequestURI();
        String method = request.getMethod();

        String authHeader = request.getHeader("Authorization");

        // ==============================
        // DEBUG
        // ==============================
        System.out.println(
                "========================================"
        );

        System.out.println(
                "JWT REQUEST: " + method + " " + requestUri
        );

        System.out.println(
                "AUTH HEADER EXISTS: " + (authHeader != null)
        );

        // ==============================
        // Authorization header check
        // ==============================
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {

            System.out.println(
                    "NO BEARER TOKEN FOUND"
            );

            filterChain.doFilter(request, response);
            return;
        }

        // ==============================
        // Extract token
        // ==============================
        String token = authHeader.substring(7).trim();

        if (token.isBlank()) {

            System.out.println(
                    "JWT TOKEN IS EMPTY"
            );

            filterChain.doFilter(request, response);
            return;
        }

        try {

            // ==============================
            // Validate token
            // ==============================
            boolean valid = jwtUtil.validateToken(token);

            System.out.println(
                    "JWT VALID: " + valid
            );

            if (valid) {

                // ==============================
                // Extract email
                // ==============================
                String email = jwtUtil.extractEmail(token);

                System.out.println(
                        "JWT USER EMAIL: " + email
                );

                if (email == null || email.isBlank()) {

                    System.out.println(
                            "JWT EMAIL IS EMPTY"
                    );

                    filterChain.doFilter(request, response);
                    return;
                }

                // ==============================
                // Load user
                // ==============================
                UserDetails userDetails =
                        customUserDetailsService
                                .loadUserByUsername(email);

                System.out.println(
                        "USER FOUND: " + userDetails.getUsername()
                );

                System.out.println(
                        "USER AUTHORITIES: "
                                + userDetails.getAuthorities()
                );

                // ==============================
                // Create authentication
                // ==============================
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );

                // ==============================
                // Put authentication in context
                // ==============================
                SecurityContextHolder
                        .getContext()
                        .setAuthentication(authentication);

                System.out.println(
                        "SECURITY CONTEXT AUTHENTICATED: "
                                + SecurityContextHolder
                                .getContext()
                                .getAuthentication()
                );

            } else {

                System.out.println(
                        "JWT TOKEN INVALID"
                );
            }

        } catch (Exception e) {

            System.out.println(
                    "JWT FILTER ERROR: "
                            + e.getMessage()
            );

            e.printStackTrace();

            /*
             * Important:
             * Invalid token ko silently ignore kar rahe hain.
             * Spring Security protected endpoint par baad me
             * authentication required hone par 401/403 dega.
             */
        }

        filterChain.doFilter(request, response);

        System.out.println(
                "JWT FILTER COMPLETED: "
                        + method
                        + " "
                        + requestUri
        );
    }
}