package com.evchargehub_backend.controller;

import com.evchargehub_backend.dto.NearbyStationResponse;
import com.evchargehub_backend.entity.ChargingStation;
import com.evchargehub_backend.service.ChargingStationService;
import com.evchargehub_backend.service.OpenChargeMapService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stations")
@io.swagger.v3.oas.annotations.security.SecurityRequirement(
        name = "bearerAuth"
)
public class ChargingStationController {

    private final ChargingStationService chargingStationService;

    private final OpenChargeMapService openChargeMapService;

    public ChargingStationController(
            ChargingStationService chargingStationService,
            OpenChargeMapService openChargeMapService) {

        this.chargingStationService = chargingStationService;
        this.openChargeMapService = openChargeMapService;
    }
   

    @PostMapping
    public ResponseEntity<ChargingStation> addStation(@RequestBody ChargingStation station ){
        return ResponseEntity.ok(chargingStationService.addStation(station));
    }

    @GetMapping
    public ResponseEntity<List<ChargingStation>> getAllStations(){
        return ResponseEntity.ok(chargingStationService.getAllStations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChargingStation> getStationById(@PathVariable String id){
        return ResponseEntity.ok(chargingStationService.getStationById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChargingStation> updateStation(
            @PathVariable String id,
            @RequestBody ChargingStation station) {
        return ResponseEntity.ok(
                chargingStationService.updateStation(id,station)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteStation(
            @PathVariable String id) {
        chargingStationService.deleteStation(id);

        return ResponseEntity.ok("Charging station deleted successfully");
    }

@GetMapping("/filter/charger")
    public ResponseEntity<List<ChargingStation>> getStationByChargerType(@RequestParam String type){
        return ResponseEntity.ok(chargingStationService.getStationByChargerType(type));
}


@GetMapping("/filter/available")
public ResponseEntity<List<ChargingStation>> getAvailableStations(){
    return ResponseEntity.ok(chargingStationService.getAvailableStations());
}

@GetMapping("/filter/location")
public ResponseEntity<List<ChargingStation>> getStationByLocation(@RequestParam String location){
    return ResponseEntity.ok(chargingStationService.getStationByLocation(location));
}

@GetMapping("/nearby")
public List<NearbyStationResponse> getNearbyStation(@RequestParam double latitude,
                                                    @RequestParam double longitude){
        return chargingStationService.getNearbyStation(latitude,longitude);
}

    @GetMapping("/import-real")
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