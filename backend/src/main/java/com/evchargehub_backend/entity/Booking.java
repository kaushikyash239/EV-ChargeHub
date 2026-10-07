package com.evchargehub_backend.entity;

import lombok.Data;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Document(collection = "bookings")
public class Booking {

    @Id
    private String bookingId;

    private String userId;

    private String stationId;

    private LocalDate bookingDate;

    private LocalTime startTime;

    private LocalTime endTime;

    private String status;

    private LocalDate createdAt;
}
