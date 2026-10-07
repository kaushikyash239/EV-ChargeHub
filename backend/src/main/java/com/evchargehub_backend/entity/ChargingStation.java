package com.evchargehub_backend.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "charging_stations" )
public class ChargingStation {

    @Id
    private String id;

    private String stationName;

    private  String location;

    private double latitude;

    private double longitude;

    private String chargerType;

    private int totalSlots;

    private int availableSlots;

    private boolean available;

    private double pricePerUnit;
}
