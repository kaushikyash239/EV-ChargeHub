package com.evchargehub_backend.service;

import com.evchargehub_backend.entity.ChargingStation;
import com.evchargehub_backend.repository.ChargingStationRepository;
import tools.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

@Service
public class OpenChargeMapService {

    private final ChargingStationRepository chargingStationRepository;
    private final RestClient restClient;

    @Value("${openchargemap.api-key}")
    private String apiKey;

    public OpenChargeMapService(
            ChargingStationRepository chargingStationRepository) {

        this.chargingStationRepository = chargingStationRepository;

        this.restClient = RestClient.builder()
                .baseUrl("https://api.openchargemap.io/v3")
                .build();
    }

    public List<ChargingStation> importIndiaStations() {

        JsonNode response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/poi/")
                        .queryParam("output", "json")
                        .queryParam("countrycode", "IN")
                        .queryParam("maxresults", 100)
                        .queryParam("compact", false)
                        .queryParam("verbose", false)
                        .queryParam("key", apiKey)
                        .build())
                .retrieve()
                .body(JsonNode.class);

        List<ChargingStation> importedStations = new ArrayList<>();

        if (response == null || !response.isArray()) {
            return importedStations;
        }

        for (JsonNode item : response) {

            JsonNode address = item.path("AddressInfo");

            if (address.isMissingNode()) {
                continue;
            }

            String title = address.path("Title").asText("");

            double latitude =
                    address.path("Latitude").asDouble(0);

            double longitude =
                    address.path("Longitude").asDouble(0);

            if (title.isBlank() || latitude == 0 || longitude == 0) {
                continue;
            }

            String addressLine =
                    address.path("AddressLine1").asText("");

            String town =
                    address.path("Town").asText("");

            String state =
                    address.path("StateOrProvince").asText("");

            String location = String.join(
                            ", ",
                            List.of(addressLine, town, state)
                    ).replaceAll(",\\s*,", ",")
                    .replaceAll("^,\\s*|,\\s*$", "");

            String chargerType = "Unknown";

            JsonNode connections =
                    item.path("Connections");

            if (connections.isArray() && !connections.isEmpty()) {

                JsonNode firstConnection =
                        connections.get(0);

                String type =
                        firstConnection
                                .path("ConnectionType")
                                .path("Title")
                                .asText("");

                if (!type.isBlank()) {
                    chargerType = type;
                }
            }

            boolean operational =
                    item.path("StatusType")
                            .path("IsOperational")
                            .asBoolean(true);

            int totalSlots =
                    item.path("NumberOfPoints").asInt(1);

            if (totalSlots <= 0) {
                totalSlots = 1;
            }

            ChargingStation station =
                    new ChargingStation();

            station.setStationName(title);
            station.setLocation(location);
            station.setLatitude(latitude);
            station.setLongitude(longitude);
            station.setChargerType(chargerType);
            station.setTotalSlots(totalSlots);

            /*
             * Open Charge Map location data does not provide
             * live slot occupancy for our application.
             *
             * Therefore this is registry-based availability,
             * not live availability.
             */
            station.setAvailableSlots(
                    operational ? totalSlots : 0
            );

            station.setAvailable(operational);

            /*
             * Price is not reliably provided by OCM.
             * Keep project price as 0 until a pricing source
             * is integrated.
             */
            station.setPricePerUnit(15);

            ChargingStation savedStation =
                    chargingStationRepository.save(station);

            importedStations.add(savedStation);
        }

        return importedStations;
    }

    public List<ChargingStation> getNearbyIndiaStations(
            double latitude,
            double longitude,
            double distanceKm) {

        JsonNode response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/poi/")
                        .queryParam("output", "json")
                        .queryParam("countrycode", "IN")
                        .queryParam("latitude", latitude)
                        .queryParam("longitude", longitude)
                        .queryParam("distance", distanceKm)
                        .queryParam("distanceunit", "KM")
                        .queryParam("maxresults", 100)
                        .queryParam("compact", false)
                        .queryParam("verbose", false)
                        .queryParam("key", apiKey)
                        .build())
                .retrieve()
                .body(JsonNode.class);

        List<ChargingStation> stations = new ArrayList<>();

        if (response == null || !response.isArray()) {
            return stations;
        }

        for (JsonNode item : response) {

            JsonNode address = item.path("AddressInfo");

            if (address.isMissingNode()) {
                continue;
            }

            String title = address.path("Title").asText("");

            double stationLatitude =
                    address.path("Latitude").asDouble(0);

            double stationLongitude =
                    address.path("Longitude").asDouble(0);

            if (title.isBlank()
                    || stationLatitude == 0
                    || stationLongitude == 0) {
                continue;
            }

            String addressLine =
                    address.path("AddressLine1").asText("");

            String town =
                    address.path("Town").asText("");

            String state =
                    address.path("StateOrProvince").asText("");

            String location = String.join(
                            ", ",
                            List.of(addressLine, town, state)
                    )
                    .replaceAll(",\\s*,", ",")
                    .replaceAll("^,\\s*|,\\s*$", "");

            String chargerType = "Unknown";

            JsonNode connections =
                    item.path("Connections");

            if (connections.isArray() && !connections.isEmpty()) {

                JsonNode firstConnection =
                        connections.get(0);

                String type =
                        firstConnection
                                .path("ConnectionType")
                                .path("Title")
                                .asText("");

                if (!type.isBlank()) {
                    chargerType = type;
                }
            }

            boolean operational =
                    item.path("StatusType")
                            .path("IsOperational")
                            .asBoolean(true);

            int totalSlots =
                    item.path("NumberOfPoints").asInt(1);

            if (totalSlots <= 0) {
                totalSlots = 1;
            }

            ChargingStation station =
                    new ChargingStation();

            station.setStationName(title);
            station.setLocation(location);
            station.setLatitude(stationLatitude);
            station.setLongitude(stationLongitude);
            station.setChargerType(chargerType);
            station.setTotalSlots(totalSlots);

            station.setAvailableSlots(
                    operational ? totalSlots : 0
            );

            station.setAvailable(operational);
            station.setPricePerUnit(15.0);

            stations.add(station);
        }

        // ONE bulk database operation instead of save() for every station
        return chargingStationRepository.saveAll(stations);
    }
}