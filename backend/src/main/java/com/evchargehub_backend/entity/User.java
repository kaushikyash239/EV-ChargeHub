package com.evchargehub_backend.entity;

import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "users")
public class User {

    @Id
    private ObjectId id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;

    private String role;  //user /admin


    // Password Reset fields
    private String resetToken;

    private LocalDateTime tokenExpiry;
}
