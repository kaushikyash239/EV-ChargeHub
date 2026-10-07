package com.evchargehub_backend.service;

import com.evchargehub_backend.entity.Booking;
import com.evchargehub_backend.entity.ChargingStation;
import com.evchargehub_backend.entity.User;
import com.evchargehub_backend.exception.BadRequestException;
import com.evchargehub_backend.exception.ConflictException;
import com.evchargehub_backend.exception.ResourceNotFoundException;
import com.evchargehub_backend.repository.BookingRepository;
import com.evchargehub_backend.repository.ChargingStationRepository;
import com.evchargehub_backend.repository.UserRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ChargingStationRepository chargingStationRepository;

    @Mock
    private UserRepository userRepository;

    private BookingService bookingService;

    @BeforeEach
    void setUp() {

        MockitoAnnotations.openMocks(this);

        bookingService = new BookingService(
                bookingRepository,
                chargingStationRepository,
                userRepository
        );
    }

    // =========================================================
    // 1. Successful Booking
    // =========================================================

    @Test
    void testCreateBookingSuccessfully() {

        User user = new User();
        user.setId(new ObjectId());
        user.setEmail("user@gmail.com");

        Mockito.when(
                userRepository.findByEmail("user@gmail.com")
        ).thenReturn(Optional.of(user));

        Booking booking = new Booking();

        booking.setStationId("STATION001");
        booking.setBookingDate(LocalDate.now().plusDays(1));
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setEndTime(LocalTime.of(11, 0));

        ChargingStation station = new ChargingStation();

        station.setStationName("Test Charging Station");
        station.setTotalSlots(10);
        station.setAvailableSlots(5);
        station.setAvailable(true);

        Mockito.when(
                chargingStationRepository.findById("STATION001")
        ).thenReturn(Optional.of(station));

        Mockito.when(
                bookingRepository
                        .existsByStationIdAndBookingDateAndStartTimeLessThanAndEndTimeGreaterThan(
                                "STATION001",
                                booking.getBookingDate(),
                                booking.getEndTime(),
                                booking.getStartTime()
                        )
        ).thenReturn(false);

        Mockito.when(
                bookingRepository.save(Mockito.any(Booking.class))
        ).thenReturn(booking);

        Mockito.when(
                chargingStationRepository.save(Mockito.any(ChargingStation.class))
        ).thenReturn(station);

        Booking result = bookingService.createBooking(
                booking,
                "user@gmail.com"
        );

        Assertions.assertNotNull(result);

        Assertions.assertEquals(
                "CONFIRMED",
                result.getStatus()
        );

        Assertions.assertEquals(
                LocalDate.now(),
                result.getCreatedAt()
        );

        Assertions.assertEquals(
                user.getId().toHexString(),
                result.getUserId()
        );

        // Available slots should decrease from 5 to 4
        Assertions.assertEquals(
                4,
                station.getAvailableSlots()
        );

        Assertions.assertTrue(
                station.isAvailable()
        );

        Mockito.verify(
                bookingRepository
        ).save(booking);

        Mockito.verify(
                chargingStationRepository
        ).save(station);
    }

    // =========================================================
    // 2. User Not Found
    // =========================================================

    @Test
    void testCreateBookingWhenUserNotFound() {

        Booking booking = new Booking();

        Mockito.when(
                userRepository.findByEmail("unknown@gmail.com")
        ).thenReturn(Optional.empty());

        Assertions.assertThrows(
                ResourceNotFoundException.class,
                () -> bookingService.createBooking(
                        booking,
                        "unknown@gmail.com"
                )
        );

        Mockito.verify(
                bookingRepository,
                Mockito.never()
        ).save(Mockito.any(Booking.class));
    }

    // =========================================================
    // 3. Station Not Found
    // =========================================================

    @Test
    void testCreateBookingWhenStationNotFound() {

        User user = new User();
        user.setId(new ObjectId());
        user.setEmail("user@gmail.com");

        Mockito.when(
                userRepository.findByEmail("user@gmail.com")
        ).thenReturn(Optional.of(user));

        Booking booking = new Booking();

        booking.setStationId("INVALID_STATION");
        booking.setBookingDate(LocalDate.now().plusDays(1));
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setEndTime(LocalTime.of(11, 0));

        Mockito.when(
                chargingStationRepository.findById("INVALID_STATION")
        ).thenReturn(Optional.empty());

        Assertions.assertThrows(
                ResourceNotFoundException.class,
                () -> bookingService.createBooking(
                        booking,
                        "user@gmail.com"
                )
        );

        Mockito.verify(
                bookingRepository,
                Mockito.never()
        ).save(Mockito.any(Booking.class));
    }

    // =========================================================
    // 4. Slot Already Booked
    // =========================================================

    @Test
    void testCreateBookingWhenSlotAlreadyBooked() {

        User user = new User();
        user.setId(new ObjectId());
        user.setEmail("user@gmail.com");

        Mockito.when(
                userRepository.findByEmail("user@gmail.com")
        ).thenReturn(Optional.of(user));

        Booking booking = new Booking();

        booking.setStationId("STATION001");
        booking.setBookingDate(LocalDate.now().plusDays(1));
        booking.setStartTime(LocalTime.of(10, 30));
        booking.setEndTime(LocalTime.of(11, 30));

        ChargingStation station = new ChargingStation();

        Mockito.when(
                chargingStationRepository.findById("STATION001")
        ).thenReturn(Optional.of(station));

        Mockito.when(
                bookingRepository
                        .existsByStationIdAndBookingDateAndStartTimeLessThanAndEndTimeGreaterThan(
                                "STATION001",
                                booking.getBookingDate(),
                                booking.getEndTime(),
                                booking.getStartTime()
                        )
        ).thenReturn(true);

        Assertions.assertThrows(
                ConflictException.class,
                () -> bookingService.createBooking(
                        booking,
                        "user@gmail.com"
                )
        );

        Mockito.verify(
                bookingRepository,
                Mockito.never()
        ).save(Mockito.any(Booking.class));
    }

    // =========================================================
    // 5. Past Date
    // =========================================================

    @Test
    void testCreateBookingWhenDateIsInPast() {

        User user = new User();
        user.setId(new ObjectId());
        user.setEmail("user@gmail.com");

        Mockito.when(
                userRepository.findByEmail("user@gmail.com")
        ).thenReturn(Optional.of(user));

        Booking booking = new Booking();

        booking.setStationId("STATION001");
        booking.setBookingDate(LocalDate.now().minusDays(1));
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setEndTime(LocalTime.of(11, 0));

        ChargingStation station = new ChargingStation();

        station.setTotalSlots(10);
        station.setAvailableSlots(5);
        station.setAvailable(true);

        Mockito.when(
                chargingStationRepository.findById("STATION001")
        ).thenReturn(Optional.of(station));

        Assertions.assertThrows(
                BadRequestException.class,
                () -> bookingService.createBooking(
                        booking,
                        "user@gmail.com"
                )
        );

        Mockito.verify(
                bookingRepository,
                Mockito.never()
        ).save(Mockito.any(Booking.class));

        Mockito.verify(
                chargingStationRepository,
                Mockito.never()
        ).save(Mockito.any(ChargingStation.class));
    }
    // =========================================================
    // 6. Invalid Time
    // =========================================================

    @Test
    void testCreateBookingWhenTimeIsInvalid() {

        User user = new User();
        user.setId(new ObjectId());
        user.setEmail("user@gmail.com");

        Mockito.when(
                userRepository.findByEmail("user@gmail.com")
        ).thenReturn(Optional.of(user));

        Booking booking = new Booking();

        booking.setStationId("STATION001");
        booking.setBookingDate(LocalDate.now().plusDays(1));
        booking.setStartTime(LocalTime.of(11, 0));
        booking.setEndTime(LocalTime.of(10, 0));

        ChargingStation station = new ChargingStation();

        station.setTotalSlots(10);
        station.setAvailableSlots(5);
        station.setAvailable(true);

        Mockito.when(
                chargingStationRepository.findById("STATION001")
        ).thenReturn(Optional.of(station));

        Assertions.assertThrows(
                BadRequestException.class,
                () -> bookingService.createBooking(
                        booking,
                        "user@gmail.com"
                )
        );

        Mockito.verify(
                bookingRepository,
                Mockito.never()
        ).save(Mockito.any(Booking.class));

        Mockito.verify(
                chargingStationRepository,
                Mockito.never()
        ).save(Mockito.any(ChargingStation.class));
    }

    // =========================================================
    // 7. User Can Cancel Own Booking
    // =========================================================

    @Test
    void testCancelBookingSuccessfully() {

        User user = new User();
        user.setId(new ObjectId());
        user.setEmail("user@gmail.com");

        Mockito.when(
                userRepository.findByEmail("user@gmail.com")
        ).thenReturn(Optional.of(user));

        Booking booking = new Booking();

        booking.setBookingId("BOOKING001");
        booking.setUserId(user.getId().toHexString());
        booking.setStationId("STATION001");
        booking.setStatus("CONFIRMED");

        Mockito.when(
                bookingRepository.findById("BOOKING001")
        ).thenReturn(Optional.of(booking));

        Mockito.when(
                bookingRepository.save(Mockito.any(Booking.class))
        ).thenReturn(booking);

        // Mock charging station
        ChargingStation station = new ChargingStation();
        station.setTotalSlots(10);
        station.setAvailableSlots(5);
        station.setAvailable(true);

        Mockito.when(
                chargingStationRepository.findById("STATION001")
        ).thenReturn(Optional.of(station));

        Mockito.when(
                chargingStationRepository.save(Mockito.any(ChargingStation.class))
        ).thenReturn(station);

        Booking result = bookingService.cancelBooking(
                "BOOKING001",
                "user@gmail.com"
        );

        Assertions.assertNotNull(result);

        Assertions.assertEquals(
                "CANCELLED",
                result.getStatus()
        );

        // Available slot should increase from 5 to 6
        Assertions.assertEquals(
                6,
                station.getAvailableSlots()
        );

        // Station should become available
        Assertions.assertTrue(
                station.isAvailable()
        );

        Mockito.verify(
                bookingRepository
        ).save(booking);

        Mockito.verify(
                chargingStationRepository
        ).findById("STATION001");

        Mockito.verify(
                chargingStationRepository
        ).save(station);
    }

    // =========================================================
    // 8. Already Cancelled
    // =========================================================

    @Test
    void testCancelBookingWhenAlreadyCancelled() {

        User user = new User();
        user.setId(new ObjectId());
        user.setEmail("user@gmail.com");

        Mockito.when(
                userRepository.findByEmail("user@gmail.com")
        ).thenReturn(Optional.of(user));

        Booking booking = new Booking();

        booking.setBookingId("BOOKING001");
        booking.setUserId(user.getId().toString());
        booking.setStatus("CANCELLED");

        Mockito.when(
                bookingRepository.findById("BOOKING001")
        ).thenReturn(Optional.of(booking));

        Assertions.assertThrows(
                BadRequestException.class,
                () -> bookingService.cancelBooking(
                        "BOOKING001",
                        "user@gmail.com"
                )
        );

        Mockito.verify(
                bookingRepository,
                Mockito.never()
        ).save(Mockito.any(Booking.class));
    }

    // =========================================================
    // 9. User Cannot Cancel Another User's Booking
    // =========================================================

    @Test
    void testCancelBookingWhenUserIsNotOwner() {

        User loggedInUser = new User();
        loggedInUser.setId(new ObjectId());
        loggedInUser.setEmail("user1@gmail.com");

        Mockito.when(
                userRepository.findByEmail("user1@gmail.com")
        ).thenReturn(Optional.of(loggedInUser));

        Booking booking = new Booking();

        booking.setBookingId("BOOKING001");

        // Different user ID
        booking.setUserId(
                new ObjectId().toString()
        );

        booking.setStatus("CONFIRMED");

        Mockito.when(
                bookingRepository.findById("BOOKING001")
        ).thenReturn(Optional.of(booking));

        Assertions.assertThrows(
                AccessDeniedException.class,
                () -> bookingService.cancelBooking(
                        "BOOKING001",
                        "user1@gmail.com"
                )
        );

        Mockito.verify(
                bookingRepository,
                Mockito.never()
        ).save(Mockito.any(Booking.class));
    }

    // =========================================================
    // 10. Available Slot With Confirmed Booking
    // =========================================================

    @Test
    void testGetAvailableSlotsWithBookedSlot() {

        String stationId = "STATION001";

        LocalDate date =
                LocalDate.now().plusDays(1);

        Booking booking = new Booking();

        booking.setStationId(stationId);
        booking.setBookingDate(date);
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setEndTime(LocalTime.of(11, 0));
        booking.setStatus("CONFIRMED");

        Mockito.when(
                chargingStationRepository.findById(stationId)
        ).thenReturn(
                Optional.of(new ChargingStation())
        );

        Mockito.when(
                bookingRepository.findByStationIdAndBookingDate(
                        stationId,
                        date
                )
        ).thenReturn(
                List.of(booking)
        );

        List<String> availableSlots =
                bookingService.getAvailableSlots(
                        stationId,
                        date
                );

        Assertions.assertFalse(
                availableSlots.contains("10:00-11:00")
        );

        Assertions.assertTrue(
                availableSlots.contains("09:00-10:00")
        );

        Assertions.assertTrue(
                availableSlots.contains("11:00-12:00")
        );
    }

    // =========================================================
    // 11. Cancelled Booking Makes Slot Available
    // =========================================================

    @Test
    void testGetAvailableSlotsWithCancelledBooking() {

        String stationId = "STATION001";

        LocalDate date =
                LocalDate.now().plusDays(1);

        Booking booking = new Booking();

        booking.setStationId(stationId);
        booking.setBookingDate(date);
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setEndTime(LocalTime.of(11, 0));
        booking.setStatus("CANCELLED");

        Mockito.when(
                chargingStationRepository.findById(stationId)
        ).thenReturn(
                Optional.of(new ChargingStation())
        );

        Mockito.when(
                bookingRepository.findByStationIdAndBookingDate(
                        stationId,
                        date
                )
        ).thenReturn(
                List.of(booking)
        );

        List<String> availableSlots =
                bookingService.getAvailableSlots(
                        stationId,
                        date
                );

        Assertions.assertTrue(
                availableSlots.contains("10:00-11:00")
        );
    }
}