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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ChargingStationRepository chargingStationRepository;

    private final UserRepository userRepository;

    public BookingService(BookingRepository bookingRepository,ChargingStationRepository chargingStationRepository,
                          UserRepository userRepository){
        this.bookingRepository=bookingRepository;
        this.chargingStationRepository=chargingStationRepository;
        this.userRepository=userRepository;
    }

    public Booking createBooking(Booking booking, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User Not Found"));

        booking.setUserId(user.getId().toHexString());

        // 1. Check station exists
        ChargingStation station = chargingStationRepository
                .findById(booking.getStationId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Charging Station not Found!"
                        ));

        // 2. Check available charging slot
        if (station.getAvailableSlots() <= 0) {
            throw new ConflictException(
                    "No charging slots are available at this station!"
            );
        }

        // 3. Validate booking date
        if (booking.getBookingDate() == null) {
            throw new BadRequestException(
                    "Booking Date is Required"
            );
        }

        if (booking.getBookingDate().isBefore(LocalDate.now())) {
            throw new BadRequestException(
                    "Booking Date cannot be in the Past"
            );
        }

        // 4. Validate time
        if (booking.getStartTime() == null ||
                booking.getEndTime() == null) {

            throw new BadRequestException(
                    "Start Time and End Time are Required"
            );
        }

        if (!booking.getEndTime().isAfter(booking.getStartTime())) {
            throw new BadRequestException(
                    "End Time must be after Start Time"
            );
        }

        if (booking.getBookingDate().isEqual(LocalDate.now())
                && !booking.getStartTime().isAfter(LocalTime.now())) {

            throw new BadRequestException(
                    "Booking Start Time must be in the Future"
            );
        }

        // 5. Check overlapping booking
        boolean alreadyBooked =
                bookingRepository
                        .existsByStationIdAndBookingDateAndStartTimeLessThanAndEndTimeGreaterThan(
                                booking.getStationId(),
                                booking.getBookingDate(),
                                booking.getEndTime(),
                                booking.getStartTime()
                        );

        if (alreadyBooked) {
            throw new ConflictException(
                    "This time slot is already booked!"
            );
        }

        // 6. Set booking status
        booking.setStatus("CONFIRMED");

        // 7. Set creation date
        booking.setCreatedAt(LocalDate.now());

        // 8. Save booking
        Booking savedBooking = bookingRepository.save(booking);

        // 9. Decrease available slots
        station.setAvailableSlots(
                station.getAvailableSlots() - 1
        );

        // 10. If no slots remain, mark station unavailable
        if (station.getAvailableSlots() <= 0) {
            station.setAvailable(false);
        }

        chargingStationRepository.save(station);

        return savedBooking;
    }

    public List<Booking> getBookingsByUserId(
            String userId,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User Not Found"));

        if (!user.getId().toString().equals(userId)) {
            throw new AccessDeniedException(
                    "You are not allowed to view these bookings"
            );
        }

        return bookingRepository.findByUserId(userId);
    }


    //cancel booking

    public Booking cancelBooking(String bookingId, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User Not Found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Booking Not Found!"
                        ));

        if (!booking.getUserId().equals(user.getId().toHexString())) {
            throw new AccessDeniedException(
                    "You are not allowed to cancel this booking"
            );
        }

        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            throw new BadRequestException(
                    "Booking is already cancelled"
            );
        }

        booking.setStatus("CANCELLED");

        Booking cancelledBooking =
                bookingRepository.save(booking);

        // Find station
        ChargingStation station =
                chargingStationRepository
                        .findById(booking.getStationId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Charging Station not Found!"
                                ));

        // Increase available slots
        station.setAvailableSlots(
                station.getAvailableSlots() + 1
        );

        // Mark station available again
        station.setAvailable(true);

        chargingStationRepository.save(station);

        return cancelledBooking;
    }

//get available slots

    public List<String> getAvailableSlots(String stationId,  LocalDate date){

//1. validate station Id

        if (stationId == null || stationId.isBlank()){
            throw new BadRequestException("Station ID is Required");
        }

//2. validate date

        if (date == null){
            throw new BadRequestException("Date is required");
        }

//3. Past date Check

       if (date.isBefore(LocalDate.now())){
           throw new BadRequestException("Cannot check slots for a past date ");
       }
//4. Check Station exists

        chargingStationRepository.findById(stationId).orElseThrow(() -> new ResourceNotFoundException("Charging station not Found!  "));

//5. Get booking for station and date

        List<Booking> bookings= bookingRepository.findByStationIdAndBookingDate(stationId,date);

        List<String> availableSlots = new ArrayList<>();

//6. charging station working hour

        LocalTime start = LocalTime.of(8,0);
        LocalTime end = LocalTime.of(20,0);

        while(start.isBefore(end)) {

            LocalTime slotStart = start;
            LocalTime slotEnd = start.plusHours(1);

    //for today's date, skip past slots

            if (date.isEqual(LocalDate.now())
            && !slotEnd.isAfter(LocalTime.now())){
                start = slotEnd;
                continue;
            }

            //check overlapping bookings
            boolean booked = bookings.stream()
                    .filter(booking -> !"CANCELLED".equalsIgnoreCase(booking.getStatus()))
                    .anyMatch(booking ->
                                    slotStart.isBefore(booking.getEndTime())
                    && slotEnd.isAfter(booking.getStartTime())
                    );

            if (!booked){
                availableSlots.add(
                        start + "-" + slotEnd
                );

            }

            start = slotEnd;

        }

        return availableSlots;
    }

}
