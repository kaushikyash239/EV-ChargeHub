package com.evchargehub_backend.controller;

import com.evchargehub_backend.entity.Booking;
import com.evchargehub_backend.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/bookings")
@io.swagger.v3.oas.annotations.security.SecurityRequirement(
        name = "bearerAuth"
)
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(
            @RequestBody Booking booking,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(bookingService.createBooking(booking,email));

    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> getBookingByUserId(
            @PathVariable String userId,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                bookingService.getBookingsByUserId(userId, email)
        );
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<Booking> cancelBooking(
            @PathVariable String bookingId,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                bookingService.cancelBooking(bookingId, email)
        );
    }
    //get available slots
    @GetMapping("/available-slots")
    public ResponseEntity<List<String>> getAvailableSlots(@RequestParam String stationId,@RequestParam LocalDate date){

        return ResponseEntity.ok(bookingService.getAvailableSlots(stationId,date));
    }
}
