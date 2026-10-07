package com.evchargehub_backend.service.controller;

import com.evchargehub_backend.controller.ChargingStationController;
import com.evchargehub_backend.entity.ChargingStation;
import com.evchargehub_backend.security.JwtUtil;
import com.evchargehub_backend.service.ChargingStationService;
import com.evchargehub_backend.service.CustomUserDetailsService;
import com.evchargehub_backend.service.OpenChargeMapService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.util.List;

@WebMvcTest(ChargingStationController.class)
public class ChargingStationControllerTest {

    @MockitoBean
    private ChargingStationService chargingStationService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OpenChargeMapService openChargeMapService;

    @Test
    void testGetAllStations() throws Exception{

        ChargingStation station1= new ChargingStation();
        station1.setStationName("Station A");

        ChargingStation station2= new ChargingStation();
        station2.setStationName("Station B");

        Mockito.when(
                chargingStationService.getAllStations()
        ).thenReturn(List.of(station1,station2));

        mockMvc.perform(
                MockMvcRequestBuilders
                        .get("/stations")
                        .with(SecurityMockMvcRequestPostProcessors.user("user"))
        )
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$").isArray())
                .andExpect(MockMvcResultMatchers.jsonPath("$.length()").value(2));

    }

    @Test
    void testCreateStationAsUserForbidden() throws Exception {

        ChargingStation station= new ChargingStation();
        station.setStationName("User Station");

        mockMvc.perform(
                MockMvcRequestBuilders
                        .post("/stations")
                        .with(SecurityMockMvcRequestPostProcessors.user("user"))
                        .contentType("application/json")
                        .content("""
                                {
                                "stationName": "User Station"
                                }
                                """)
        )
                .andExpect(
                        MockMvcResultMatchers.status().isForbidden()
                );

        Mockito.verify(
                chargingStationService,
                Mockito.never()
        ).addStation(Mockito.any(ChargingStation.class));


    }

    @Test
    void testCreateStationAsAdminAllowed() throws Exception {

        ChargingStation station = new ChargingStation();
        station.setStationName("Admin Station");

        ChargingStation savedStation = new ChargingStation();
        savedStation.setStationName("Admin Station");

        Mockito.when(
                chargingStationService.addStation(Mockito.any(ChargingStation.class))
        ).thenReturn(savedStation);

        mockMvc.perform(
                        MockMvcRequestBuilders
                                .post("/stations")
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .user("admin")
                                                .roles("ADMIN")
                                )
                                .with(
                                        SecurityMockMvcRequestPostProcessors.csrf()
                                )
                                .contentType("application/json")
                                .content("""
                            {
                                "stationName": "Admin Station"
                            }
                            """)
                )
                .andExpect(
                        MockMvcResultMatchers.status().isOk()
                );

        Mockito.verify(
                chargingStationService
        ).addStation(Mockito.any(ChargingStation.class));
    }

    @Test
    void testUpdateStationAsUserForbidden() throws Exception {

        mockMvc.perform(
                        MockMvcRequestBuilders
                                .put("/stations/STATION001")
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .user("user")
                                )
                                .contentType("application/json")
                                .content("""
                            {
                                "stationName": "Updated Station"
                            }
                            """)
                )
                .andExpect(
                        MockMvcResultMatchers.status().isForbidden()
                );

        Mockito.verify(
                chargingStationService,
                Mockito.never()
        ).updateStation(
                Mockito.anyString(),
                Mockito.any(ChargingStation.class)
        );
    }

    @Test
    void testUpdateStationAsAdminAllowed() throws Exception {

        ChargingStation updatedStation = new ChargingStation();
        updatedStation.setStationName("Updated Station");

        Mockito.when(
                chargingStationService.updateStation(
                        Mockito.eq("STATION001"),
                        Mockito.any(ChargingStation.class)
                )
        ).thenReturn(updatedStation);

        mockMvc.perform(
                        MockMvcRequestBuilders
                                .put("/stations/STATION001")
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .user("admin")
                                                .roles("ADMIN")
                                )
                                .with(SecurityMockMvcRequestPostProcessors.csrf())

                                .contentType("application/json")
                                .content("""
                            {
                                "stationName": "Updated Station"
                            }
                            """)
                )
                .andExpect(
                        MockMvcResultMatchers.status().isOk()
                );

        Mockito.verify(
                chargingStationService
        ).updateStation(
                Mockito.eq("STATION001"),
                Mockito.any(ChargingStation.class)
        );
    }

    @Test
    void testDeleteStationAsUserForbidden() throws Exception {

        mockMvc.perform(
                        MockMvcRequestBuilders
                                .delete("/stations/STATION001")
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .user("user")
                                )
                )
                .andExpect(
                        MockMvcResultMatchers.status().isForbidden()
                );

        Mockito.verify(
                chargingStationService,
                Mockito.never()
        ).deleteStation(Mockito.anyString());
    }

    @Test
    void testDeleteStationAsAdminAllowed() throws Exception {

        mockMvc.perform(
                        MockMvcRequestBuilders
                                .delete("/stations/STATION001")
                                .with(
                                        SecurityMockMvcRequestPostProcessors
                                                .user("admin")
                                                .roles("ADMIN")
                                )
                                .with(SecurityMockMvcRequestPostProcessors.csrf())
                )
                .andExpect(
                        MockMvcResultMatchers.status().isOk()
                );

        Mockito.verify(
                chargingStationService
        ).deleteStation("STATION001");
    }

    @Test
    void testGetAllStationsWithoutAuthentication() throws Exception {

        mockMvc.perform(
                        MockMvcRequestBuilders
                                .get("/stations")
                )
                .andExpect(
                        MockMvcResultMatchers.status().isUnauthorized()
                );

        Mockito.verify(
                chargingStationService,
                Mockito.never()
        ).getAllStations();
    }
}
