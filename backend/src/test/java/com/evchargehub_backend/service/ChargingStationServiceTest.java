package com.evchargehub_backend.service;

import com.evchargehub_backend.dto.NearbyStationResponse;
import com.evchargehub_backend.entity.ChargingStation;
import com.evchargehub_backend.exception.ResourceNotFoundException;
import com.evchargehub_backend.repository.ChargingStationRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;

public class ChargingStationServiceTest {

    @Mock
    private ChargingStationRepository chargingStationRepository;

    @Mock
    private OpenChargeMapService openChargeMapService;

    private ChargingStationService chargingStationService;

    @BeforeEach
    void setUp(){
        MockitoAnnotations.openMocks(this);

        chargingStationService= new ChargingStationService(chargingStationRepository,openChargeMapService);

    }

    @Test
    void testGetAllStations(){

        ChargingStation station1= new ChargingStation();

        ChargingStation station2= new ChargingStation();

        List<ChargingStation> stations= List.of(station1,station2);

        Mockito.when(
                chargingStationRepository.findAll())
                .thenReturn(stations);

        List<ChargingStation> result = chargingStationService.getAllStations();

        Assertions.assertNotNull(result);
        Assertions.assertEquals(2,result.size());
        Assertions.assertSame(station1,result.get(0));
        Assertions.assertSame(station2,result.get(1));

        Mockito.verify(chargingStationRepository)
                .findAll();

    }

    @Test
    void testGetStationByIdSuccessfully(){
        ChargingStation station= new ChargingStation();

        Mockito.when(
                chargingStationRepository.findById("STATION001")
        ).thenReturn(Optional.of(station));

        ChargingStation result= chargingStationService.getStationById("STATION001");

        Assertions.assertNotNull(result);
        Assertions.assertSame(station,result);

        Mockito.verify(chargingStationRepository)
                .findById("STATION001");
    }

    @Test
    void testGetStationByIdWhenNotFound() {

        Mockito.when(
                chargingStationRepository.findById("INVALID_ID")
        ).thenReturn(Optional.empty());

        Assertions.assertThrows(
                ResourceNotFoundException.class,
                () -> chargingStationService.getStationById("INVALID_ID")
        );

        Mockito.verify(chargingStationRepository)
                .findById("INVALID_ID");
    }

    @Test
    void testAddStationSuccessfully() {

        ChargingStation station = new ChargingStation();

        Mockito.when(
                chargingStationRepository.save(station)
        ).thenReturn(station);

        ChargingStation result =
                chargingStationService.addStation(station);

        Assertions.assertNotNull(result);
        Assertions.assertSame(station, result);

        Mockito.verify(chargingStationRepository)
                .save(station);
    }

    @Test
    void testUpdateStationSuccessfully() {

        ChargingStation existingStation = new ChargingStation();
        existingStation.setStationName("Old Station");

        ChargingStation updatedStation = new ChargingStation();
        updatedStation.setStationName("New Station");
        updatedStation.setLocation("Delhi");
        updatedStation.setLatitude(28.6300);
        updatedStation.setLongitude(77.2200);
        updatedStation.setChargerType("DC");
        updatedStation.setTotalSlots(10);
        updatedStation.setAvailableSlots(8);
        updatedStation.setAvailable(true);
        updatedStation.setPricePerUnit(15.0);

        Mockito.when(
                chargingStationRepository.findById("STATION001")
        ).thenReturn(Optional.of(existingStation));

        Mockito.when(
                chargingStationRepository.save(existingStation)
        ).thenReturn(existingStation);

        ChargingStation result =
                chargingStationService.updateStation(
                        "STATION001",
                        updatedStation
                );

        Assertions.assertNotNull(result);
        Assertions.assertEquals(
                "New Station",
                result.getStationName()
        );
        Assertions.assertEquals(
                "Delhi",
                result.getLocation()
        );
        Assertions.assertEquals(
                28.6300,
                result.getLatitude()
        );
        Assertions.assertEquals(
                77.2200,
                result.getLongitude()
        );

        Mockito.verify(chargingStationRepository)
                .findById("STATION001");

        Mockito.verify(chargingStationRepository)
                .save(existingStation);
    }

    @Test
    void testUpdateStationWhenNotFound() {

        ChargingStation updatedStation= new ChargingStation();

        Mockito.when(
                chargingStationRepository.findById("INVALID_ID")
        ).thenReturn(Optional.empty());

        Assertions.assertThrows(
                ResourceNotFoundException.class,
                ()-> chargingStationService.updateStation(
                        "INVALID_ID",
                        updatedStation
                )
        );

        Mockito.verify(chargingStationRepository)
                .findById("INVALID_ID");

        Mockito.verify(
                chargingStationRepository,
                Mockito.never()
        ).save(Mockito.any(ChargingStation.class));
    }

    @Test
    void testDeleteStationSuccessfully(){

        Mockito.when(
                chargingStationRepository.existsById("STATION001")
        ).thenReturn(true);

        chargingStationService.deleteStation("STATION001");

        Mockito.verify(
                chargingStationRepository
        ).existsById("STATION001");

        Mockito.verify(
                chargingStationRepository
        ).deleteById("STATION001");
    }

    @Test
    void testDeleteStationWhenNotFound() {

        Mockito.when(
                chargingStationRepository.existsById("INVALID_ID")
        ).thenReturn(false);

        Assertions.assertThrows(
                ResourceNotFoundException.class,
                () -> chargingStationService.deleteStation("INVALID_ID")
        );

        Mockito.verify(
                chargingStationRepository
        ).existsById("INVALID_ID");

        Mockito.verify(
                chargingStationRepository,
                Mockito.never()
        ).deleteById(Mockito.anyString());
    }

    @Test
    void testGetStationByChargerType() {
        ChargingStation station1= new ChargingStation();

        station1.setChargerType("DC");

        ChargingStation station2= new ChargingStation();

        station2.setChargerType("DC");

        List<ChargingStation> stations= List.of(station1,station2);

        Mockito.when(
                chargingStationRepository
                        .findByChargerTypeIgnoreCase("DC")
        ).thenReturn(stations);

        List<ChargingStation> result= chargingStationService.getStationByChargerType("DC");

        Assertions.assertNotNull(result);
        Assertions.assertEquals(2,result.size());
        Assertions.assertSame(station1,result.get(0));
        Assertions.assertSame(station2, result.get(1));

        Mockito.verify(
                chargingStationRepository
        ).findByChargerTypeIgnoreCase("DC");
    }

    @Test
    void testGetAvailableStations() {

        ChargingStation station1 = new ChargingStation();
        station1.setAvailable(true);

        ChargingStation station2 = new ChargingStation();
        station2.setAvailable(true);

        List<ChargingStation> stations =
                List.of(station1, station2);

        Mockito.when(
                chargingStationRepository.findByAvailableTrue()
        ).thenReturn(stations);

        List<ChargingStation> result =
                chargingStationService.getAvailableStations();

        Assertions.assertNotNull(result);
        Assertions.assertEquals(2, result.size());
        Assertions.assertSame(station1, result.get(0));
        Assertions.assertSame(station2, result.get(1));

        Mockito.verify(
                chargingStationRepository
        ).findByAvailableTrue();
    }

    @Test
    void testGetStationByLocation() {

        ChargingStation station1 = new ChargingStation();
        station1.setLocation("Delhi");

        ChargingStation station2 = new ChargingStation();
        station2.setLocation("Delhi");

        List<ChargingStation> stations =
                List.of(station1, station2);

        Mockito.when(
                chargingStationRepository
                        .findByLocationContainingIgnoreCase("Delhi")
        ).thenReturn(stations);

        List<ChargingStation> result =
                chargingStationService.getStationByLocation("Delhi");

        Assertions.assertNotNull(result);
        Assertions.assertEquals(2, result.size());
        Assertions.assertSame(station1, result.get(0));
        Assertions.assertSame(station2, result.get(1));

        Mockito.verify(
                chargingStationRepository
        ).findByLocationContainingIgnoreCase("Delhi");
    }

    @Test
    void testGetNearbyStation() {

        double userLatitude = 28.6300;
        double userLongitude = 77.2200;

        ChargingStation nearestStation = new ChargingStation();
        nearestStation.setLatitude(28.6315);
        nearestStation.setLongitude(77.2167);

        ChargingStation secondStation = new ChargingStation();
        secondStation.setLatitude(28.6500);
        secondStation.setLongitude(77.2300);

        ChargingStation farStation = new ChargingStation();
        farStation.setLatitude(29.5000);
        farStation.setLongitude(77.5000);

        Mockito.when(
                openChargeMapService.getNearbyIndiaStations(
                        userLatitude,
                        userLongitude,
                        50
                )
        ).thenReturn(
                List.of(
                        secondStation,
                        farStation,
                        nearestStation
                )
        );

        List<NearbyStationResponse> result =
                chargingStationService.getNearbyStation(
                        userLatitude,
                        userLongitude
                );

        Assertions.assertNotNull(result);

        Assertions.assertEquals(2, result.size());

        Assertions.assertSame(
                nearestStation,
                result.get(0).getStation()
        );

        Assertions.assertSame(
                secondStation,
                result.get(1).getStation()
        );

        Assertions.assertTrue(
                result.get(0).getDistance()
                        < result.get(1).getDistance()
        );

        Mockito.verify(openChargeMapService)
                .getNearbyIndiaStations(
                        userLatitude,
                        userLongitude,
                        50
                );
    }
}
