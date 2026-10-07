package com.evchargehub_backend.repository;

import com.evchargehub_backend.entity.ChargingStation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChargingStationRepository extends MongoRepository<ChargingStation, String> {

    List<ChargingStation> findByChargerTypeIgnoreCase(String chargerType);

    List<ChargingStation> findByAvailableTrue();

    List<ChargingStation> findByLocationContainingIgnoreCase(String location);

}
