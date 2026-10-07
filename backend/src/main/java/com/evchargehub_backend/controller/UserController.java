package com.evchargehub_backend.controller;

import com.evchargehub_backend.dto.LoginRequest;
import com.evchargehub_backend.entity.User;
import com.evchargehub_backend.repository.UserRepository;
import com.evchargehub_backend.security.JwtUtil;
import com.evchargehub_backend.service.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final JwtUtil jwtUtil;

    private final EmailService emailService;

    public UserController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil,
                          EmailService emailService){
        this.userRepository=userRepository;
        this.passwordEncoder=passwordEncoder;
        this.jwtUtil=jwtUtil;
        this.emailService=emailService;
    }



    @PostMapping("/register")
    public User register(@RequestBody User user){
        user.setRole("USER");
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest){
        Optional<User> user=userRepository.findByEmail(loginRequest.getEmail());

        if (user.isPresent()){
            boolean isPasswordMatched = passwordEncoder.matches(
                    loginRequest.getPassword(),
                    user.get().getPassword()
            );

            if(isPasswordMatched){
                String token= jwtUtil.generateToken(user.get().getEmail());

                return ResponseEntity.ok(token);
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Invalid Email or Password");
    }

    @GetMapping("/me")
    public ResponseEntity<?> currentUser(Authentication authentication) {

        return userRepository.findByEmail(authentication.getName())
                .map(user -> {

                    return ResponseEntity.ok(
                            java.util.Map.of(
                                    "id", user.getId().toHexString(),
                                    "name", user.getName(),
                                    "email", user.getEmail(),
                                    "role", user.getRole()
                            )
                    );

                })
                .orElseGet(() ->
                        ResponseEntity.status(HttpStatus.NOT_FOUND).build()
                );
    }

    // ================= FORGOT PASSWORD ENDPOINTS =================

    // 1. Request Reset Token/OTP
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestParam("email") String email) {

        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("User not found with this email");
        }

        User user = userOptional.get();

        String resetToken = UUID.randomUUID().toString();

        user.setResetToken(resetToken);
        user.setTokenExpiry(LocalDateTime.now().plusMinutes(15));

        userRepository.save(user);

        String resetLink =
                "http://127.0.0.1:5500/EV-Chargehub/index.html?token="
                        + resetToken;

        try {
            emailService.sendResetPasswordEmail(email, resetLink);
        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Reset token generated, but email could not be sent.");
        }

        return ResponseEntity.ok(
                "Password reset link has been sent to your email."
        );
    }

    // 2. Reset New Password
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestParam("token") String token,
                                                @RequestParam("newPassword") String newPassword) {

        Optional<User> userOptional = userRepository.findByResetToken(token);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid reset token!");
        }

        User user = userOptional.get();

        // Token Expiry Check
        if (user.getTokenExpiry() != null && user.getTokenExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Reset token has expired!");
        }

        // Encrypt and update new password
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setTokenExpiry(null);

        userRepository.save(user);

        return ResponseEntity.ok("Password reset successfully! You can login now.");
    }

}
