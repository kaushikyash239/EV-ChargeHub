package com.evchargehub_backend.dto;

import com.evchargehub_backend.entity.ChargingStation;

public class NearbyStationResponse {

    private ChargingStation station;
    private double distance;

    public NearbyStationResponse(ChargingStation station,double distance){
        this.station=station;
        this.distance=distance;
    }

    public ChargingStation getStation() {
        return station;
    }

    public double getDistance() {
        return Math.round(distance  * 100.0) / 100.0;
    }
}

