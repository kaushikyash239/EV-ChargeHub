package com.evchargehub_backend.repository;

import com.evchargehub_backend.entity.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BookingRepository extends MongoRepository<Booking,String> {

List<Booking> findByStationIdAndBookingDate(
        String stationId,
        LocalDate bookingDate
);

List<Booking> findByUserId(String userId);

boolean existsByStationIdAndBookingDateAndStartTimeLessThanAndEndTimeGreaterThan(
        String stationId,
        LocalDate bookingDate,
        LocalTime endTime,
        LocalTime startTime

);



}
