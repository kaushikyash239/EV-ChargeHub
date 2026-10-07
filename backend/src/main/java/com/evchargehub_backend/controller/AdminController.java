package com.evchargehub_backend.controller;

import com.evchargehub_backend.entity.Booking;
import com.evchargehub_backend.entity.User;
import com.evchargehub_backend.repository.BookingRepository;
import com.evchargehub_backend.repository.ChargingStationRepository;
import com.evchargehub_backend.repository.UserRepository;
import com.evchargehub_backend.service.OpenChargeMapService;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@io.swagger.v3.oas.annotations.security.SecurityRequirement(
        name = "bearerAuth"
)
public class AdminController {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final ChargingStationRepository chargingStationRepository;
    private final OpenChargeMapService openChargeMapService;

    public AdminController(
            UserRepository userRepository,
            BookingRepository bookingRepository,
            ChargingStationRepository chargingStationRepository,
            OpenChargeMapService openChargeMapService) {

        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.chargingStationRepository = chargingStationRepository;
        this.openChargeMapService = openChargeMapService;
    }


    // ==========================================
    // ADMIN DASHBOARD STATS
    // ==========================================
    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {

        long totalUsers =
                userRepository.count();

        long totalStations =
                chargingStationRepository.count();

        long totalBookings =
                bookingRepository.count();

        long availableStations =
                chargingStationRepository
                        .findByAvailableTrue()
                        .size();

        return ResponseEntity.ok(
                Map.of(
                        "totalUsers", totalUsers,
                        "totalStations", totalStations,
                        "totalBookings", totalBookings,
                        "availableStations", availableStations
                )
        );
    }


    // ==========================================
    // GET ALL USERS
    // ==========================================
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {

        List<Map<String, Object>> users =
                new java.util.ArrayList<>();

        for (User user : userRepository.findAll()) {

            Map<String, Object> userData =
                    new java.util.HashMap<>();

            String id = "";

            ObjectId objectId = user.getId();

            if (objectId != null) {
                id = objectId.toHexString();
            }

            userData.put("id", id);

            userData.put(
                    "name",
                    user.getName() != null
                            ? user.getName()
                            : ""
            );

            userData.put(
                    "email",
                    user.getEmail() != null
                            ? user.getEmail()
                            : ""
            );

            userData.put(
                    "role",
                    user.getRole() != null
                            ? user.getRole()
                            : "USER"
            );

            users.add(userData);
        }

        return ResponseEntity.ok(users);
    }


    // ==========================================
    // GET ALL BOOKINGS
    // ==========================================
    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getAllBookings() {

        return ResponseEntity.ok(
                bookingRepository.findAll()
        );
    }


    // ==========================================
    // IMPORT REAL STATIONS
    // ==========================================
    @PostMapping("/import-real")
    public ResponseEntity<String> importRealStations() {

        int count =
                openChargeMapService
                        .importIndiaStations()
                        .size();

        return ResponseEntity.ok(
                count + " real stations imported successfully"
        );
    }
}