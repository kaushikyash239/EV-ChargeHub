package com.evchargehub_backend.service.controller;

import com.evchargehub_backend.controller.BookingController;
import com.evchargehub_backend.entity.Booking;
import com.evchargehub_backend.exception.BadRequestException;
import com.evchargehub_backend.exception.ConflictException;
import com.evchargehub_backend.exception.ResourceNotFoundException;
import com.evchargehub_backend.security.JwtUtil;
import com.evchargehub_backend.service.BookingService;
import com.evchargehub_backend.service.CustomUserDetailsService;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@WebMvcTest(BookingController.class)
public class BookingControllerTest {

    @MockitoBean
    private BookingService bookingService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private MockMvc mockMvc;


    // =========================================================
    // 1. Successful Create Booking
    // =========================================================

    @Test
    void testCreateBookingSuccessfully() throws Exception {

        Booking booking = new Booking();

        booking.setBookingId("BOOKING001");
        booking.setUserId("USER001");
        booking.setStationId("STATION001");
        booking.setBookingDate(LocalDate.now().plusDays(1));
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setEndTime(LocalTime.of(11, 0));
        booking.setStatus("CONFIRMED");

        Mockito.when(
                bookingService.createBooking(
                        Mockito.any(Booking.class),
                        Mockito.anyString()
                )
        ).thenReturn(booking);

        mockMvc.perform(
                        MockMvcRequestBuilders
                                .post("/bookings")
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .user("user")
                                )
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .csrf()
                                )
                                .contentType("application/json")
                                .content("""
                                        {
                                            "userId": "USER001",
                                            "stationId": "STATION001",
                                            "bookingDate": "2026-08-17",
                                            "startTime": "10:00:00",
                                            "endTime": "11:00:00"
                                        }
                                        """)
                )
                .andExpect(
                        MockMvcResultMatchers.status().isOk()
                )
                .andExpect(
                        MockMvcResultMatchers
                                .jsonPath("$.bookingId")
                                .value("BOOKING001")
                )
                .andExpect(
                        MockMvcResultMatchers
                                .jsonPath("$.status")
                                .value("CONFIRMED")
                );

        Mockito.verify(
                bookingService
        ).createBooking(
                Mockito.any(Booking.class),
                Mockito.anyString()
        );
    }


    // =========================================================
    // 2. Get Bookings By User
    // =========================================================

    @Test
    void testGetBookingsByUser() throws Exception {

        Booking booking1 = new Booking();
        booking1.setBookingId("BOOKING001");
        booking1.setUserId("USER001");
        booking1.setStatus("CONFIRMED");

        Booking booking2 = new Booking();
        booking2.setBookingId("BOOKING002");
        booking2.setUserId("USER001");
        booking2.setStatus("CANCELLED");

        Mockito.when(
                bookingService.getBookingsByUserId(
                        Mockito.eq("USER001"),
                        Mockito.anyString()
                )
        ).thenReturn(
                List.of(booking1, booking2)
        );

        mockMvc.perform(
                        MockMvcRequestBuilders
                                .get("/bookings/user/USER001")
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .user("user")
                                )
                )
                .andExpect(
                        MockMvcResultMatchers.status().isOk()
                )
                .andExpect(
                        MockMvcResultMatchers.jsonPath("$").isArray()
                )
                .andExpect(
                        MockMvcResultMatchers
                                .jsonPath("$.length()")
                                .value(2)
                )
                .andExpect(
                        MockMvcResultMatchers
                                .jsonPath("$[0].bookingId")
                                .value("BOOKING001")
                );

        Mockito.verify(
                bookingService
        ).getBookingsByUserId(
                Mockito.eq("USER001"),
                Mockito.anyString()
        );
    }

    // =========================================================
    // 3. Get Available Slots
    // =========================================================

    @Test
    void testGetAvailableSlots() throws Exception {

        List<String> slots = List.of(
                "08:00-09:00",
                "09:00-10:00",
                "11:00-12:00"
        );

        Mockito.when(
                bookingService.getAvailableSlots(
                        "STATION001",
                        LocalDate.of(2026, 8, 17)
                )
        ).thenReturn(slots);

        mockMvc.perform(
                        MockMvcRequestBuilders
                                .get("/bookings/available-slots")
                                .param(
                                        "stationId",
                                        "STATION001"
                                )
                                .param(
                                        "date",
                                        "2026-08-17"
                                )
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .user("user")
                                )
                )
                .andExpect(
                        MockMvcResultMatchers.status().isOk()
                )
                .andExpect(
                        MockMvcResultMatchers
                                .jsonPath("$")
                                .isArray()
                )
                .andExpect(
                        MockMvcResultMatchers
                                .jsonPath("$.length()")
                                .value(3)
                )
                .andExpect(
                        MockMvcResultMatchers
                                .jsonPath("$[0]")
                                .value("08:00-09:00")
                );

        Mockito.verify(
                bookingService
        ).getAvailableSlots(
                "STATION001",
                LocalDate.of(2026, 8, 17)
        );
    }


    // =========================================================
    // 4. Successful Cancel Booking
    // =========================================================

    @Test
    void testCancelBookingSuccessfully() throws Exception {

        Booking booking = new Booking();

        booking.setBookingId("BOOKING001");
        booking.setUserId("USER001");
        booking.setStationId("STATION001");
        booking.setStatus("CANCELLED");

        Mockito.when(
                bookingService.cancelBooking(
                        Mockito.eq("BOOKING001"),
                        Mockito.anyString()
                )
        ).thenReturn(booking);

        mockMvc.perform(
                        MockMvcRequestBuilders
                                .delete("/bookings/BOOKING001")
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .user("user")
                                )
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .csrf()
                                )
                )
                .andExpect(
                        MockMvcResultMatchers.status().isOk()
                )
                .andExpect(
                        MockMvcResultMatchers
                                .jsonPath("$.bookingId")
                                .value("BOOKING001")
                )
                .andExpect(
                        MockMvcResultMatchers
                                .jsonPath("$.status")
                                .value("CANCELLED")
                );

        Mockito.verify(
                bookingService
        ).cancelBooking(
                Mockito.eq("BOOKING001"),
                Mockito.anyString()
        );
    }


    // =========================================================
    // 5. Booking Conflict → 409
    // =========================================================

    @Test
    void testCreateBookingWhenSlotAlreadyBooked() throws Exception {

        Mockito.when(
                bookingService.createBooking(
                        Mockito.any(Booking.class),
                        Mockito.anyString()
                )
        ).thenThrow(
                new ConflictException(
                        "This time slot is already booked!"
                )
        );

        mockMvc.perform(
                        MockMvcRequestBuilders
                                .post("/bookings")
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .user("user")
                                )
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .csrf()
                                )
                                .contentType("application/json")
                                .content("""
                                        {
                                            "userId": "USER001",
                                            "stationId": "STATION001",
                                            "bookingDate": "2026-08-17",
                                            "startTime": "10:00:00",
                                            "endTime": "11:00:00"
                                        }
                                        """)
                )
                .andExpect(
                        MockMvcResultMatchers.status().isConflict()
                )
                .andExpect(
                        MockMvcResultMatchers
                                .jsonPath("$.error")
                                .value(
                                        "This time slot is already booked!"
                                )
                );
    }


    // =========================================================
    // 6. Station Not Found → 404
    // =========================================================

    @Test
    void testCreateBookingWhenStationNotFound() throws Exception {

        Mockito.when(
                bookingService.createBooking(
                        Mockito.any(Booking.class),
                        Mockito.anyString()
                )
        ).thenThrow(
                new ResourceNotFoundException(
                        "Charging Station not found!"
                )
        );

        mockMvc.perform(
                        MockMvcRequestBuilders
                                .post("/bookings")
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .user("user")
                                )
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .csrf()
                                )
                                .contentType("application/json")
                                .content("""
                                        {
                                            "userId": "USER001",
                                            "stationId": "INVALID_STATION",
                                            "bookingDate": "2026-08-17",
                                            "startTime": "10:00:00",
                                            "endTime": "11:00:00"
                                        }
                                        """)
                )
                .andExpect(
                        MockMvcResultMatchers.status().isNotFound()
                )
                .andExpect(
                        MockMvcResultMatchers
                                .jsonPath("$.error")
                                .value(
                                        "Charging Station not found!"
                                )
                );
    }


    // =========================================================
    // 7. Invalid Booking → 400
    // =========================================================

    @Test
    void testCreateBookingWithInvalidData() throws Exception {

        Mockito.when(
                bookingService.createBooking(
                        Mockito.any(Booking.class),
                        Mockito.anyString()
                )
        ).thenThrow(
                new BadRequestException(
                        "End Time must be after Start Time"
                )
        );

        mockMvc.perform(
                        MockMvcRequestBuilders
                                .post("/bookings")
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .user("user")
                                )
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .csrf()
                                )
                                .contentType("application/json")
                                .content("""
                                        {
                                            "userId": "USER001",
                                            "stationId": "STATION001",
                                            "bookingDate": "2026-08-17",
                                            "startTime": "11:00:00",
                                            "endTime": "10:00:00"
                                        }
                                        """)
                )
                .andExpect(
                        MockMvcResultMatchers.status().isBadRequest()
                )
                .andExpect(
                        MockMvcResultMatchers
                                .jsonPath("$.error")
                                .value(
                                        "End Time must be after Start Time"
                                )
                );
    }
}