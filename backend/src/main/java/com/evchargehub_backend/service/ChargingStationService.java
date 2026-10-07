package com.evchargehub_backend.service;

import com.evchargehub_backend.dto.NearbyStationResponse;
import com.evchargehub_backend.entity.ChargingStation;
import com.evchargehub_backend.exception.ResourceNotFoundException;
import com.evchargehub_backend.repository.ChargingStationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChargingStationService {
    private final ChargingStationRepository chargingStationRepository;
    private final OpenChargeMapService openChargeMapService;

    public ChargingStationService(
            ChargingStationRepository chargingStationRepository,
            OpenChargeMapService openChargeMapService) {

        this.chargingStationRepository = chargingStationRepository;
        this.openChargeMapService = openChargeMapService;
    }

    public ChargingStation  addStation(ChargingStation station){
        return chargingStationRepository.save(station);
    }

    public List<ChargingStation> getAllStations(){
        return chargingStationRepository.findAll();
    }

    public ChargingStation getStationById(String id){
        return chargingStationRepository.findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("Charging Station not Found"));

    }

    public ChargingStation updateStation (String id,ChargingStation updatedStation){
        ChargingStation existingStation = chargingStationRepository.findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("Charging Station Not Found!"));

        existingStation.setStationName(updatedStation.getStationName());
        existingStation.setLocation(updatedStation.getLocation());
        existingStation.setLatitude(updatedStation.getLatitude());
        existingStation.setLongitude(updatedStation.getLongitude());
        existingStation.setChargerType(updatedStation.getChargerType());
        existingStation.setTotalSlots(updatedStation.getTotalSlots());
        existingStation.setAvailableSlots(updatedStation.getAvailableSlots());
        existingStation.setAvailable(updatedStation.isAvailable());
        existingStation.setPricePerUnit(updatedStation.getPricePerUnit());

        return chargingStationRepository.save(existingStation);
    }

    public void deleteStation(String id){
        if (!chargingStationRepository.existsById(id)){
            throw new ResourceNotFoundException("Charging Station Not Found");
        }
        chargingStationRepository.deleteById(id);
    }
//=========================
//  SEARCH & FILTER
//=========================
    public List<ChargingStation> getStationByChargerType(String chargerType){
        return chargingStationRepository.findByChargerTypeIgnoreCase(chargerType);
    }

    public List<ChargingStation> getAvailableStations() {
        return chargingStationRepository.findByAvailableTrue();
    }

    public List<ChargingStation> getStationByLocation(String location){
        return chargingStationRepository.findByLocationContainingIgnoreCase(location);
    }
    //============================
    //   Distance-Based Search
   //=============================
    public List<NearbyStationResponse> getNearbyStation(
            double userLatitude,
            double userLongitude) {

        List<ChargingStation> stations =
                openChargeMapService.getNearbyIndiaStations(
                        userLatitude,
                        userLongitude,
                        50
                );

        double radius = 6371;

        return stations.stream()
                .map(station -> {

                    double latDistance =
                            Math.toRadians(
                                    station.getLatitude() - userLatitude
                            );

                    double lonDistance =
                            Math.toRadians(
                                    station.getLongitude() - userLongitude
                            );

                    double a =
                            Math.sin(latDistance / 2)
                                    * Math.sin(latDistance / 2)
                                    + Math.cos(Math.toRadians(userLatitude))
                                    * Math.cos(Math.toRadians(station.getLatitude()))
                                    * Math.sin(lonDistance / 2)
                                    * Math.sin(lonDistance / 2);

                    double c =
                            2 * Math.atan2(
                                    Math.sqrt(a),
                                    Math.sqrt(1 - a)
                            );

                    double distance = radius * c;

                    return new NearbyStationResponse(station, distance);
                })
                .filter(response -> response.getDistance() <= 50)
                .sorted((a, b) ->
                        Double.compare(
                                a.getDistance(),
                                b.getDistance()
                        ))
                .toList();
    }
}
