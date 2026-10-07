package com.evchargehub_backend.config;

import com.evchargehub_backend.entity.ChargingStation;
import com.evchargehub_backend.repository.ChargingStationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedChargingStations(ChargingStationRepository repository){
        return args -> {
            if (repository.count()>0){
                return;
            }
            ChargingStation station1 = new ChargingStation();

            station1.setStationName("Adani EV Point");
            station1.setLocation("Connought Place, Delhi");
            station1.setLatitude(28.6315);
            station1.setLongitude(77.2167);
            station1.setChargerType("CCS");
            station1.setTotalSlots(6);
            station1.setAvailableSlots(4);
            station1.setAvailable(true);
            station1.setPricePerUnit(15.0);

            repository.save(station1);

            ChargingStation station2= new ChargingStation();

            station2.setStationName("EV ChargeHub Point");
            station2.setLocation("Sector 18,Noida");
            station2.setLatitude(28.5672);
            station2.setLongitude(77.3219);
            station2.setChargerType("Type-2");
            station2.setTotalSlots(4);
            station2.setAvailableSlots(2);
            station2.setAvailable(true);
            station2.setPricePerUnit(12.0);

            repository.save(station2);

            ChargingStation station3= new ChargingStation();

                    station3.setStationName("Shayam Charging Point");
            station3.setLocation("Indirapuram, Ghaziabad");
            station3.setLatitude(28.6415);
            station3.setLongitude(77.3715);
            station3.setChargerType("CCS");
            station3.setTotalSlots(8);
            station3.setAvailableSlots(0);
            station3.setAvailable(false);
            station3.setPricePerUnit(14.0);

            repository.save(station3);

            System.out.println("Station inserted successfully!");
        };
    }
}
