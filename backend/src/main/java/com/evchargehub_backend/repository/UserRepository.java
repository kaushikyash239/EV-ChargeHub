package com.evchargehub_backend.repository;

import com.evchargehub_backend.entity.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, ObjectId> {

    Optional<User> findByEmail(String email);

// Reset Token ke sath User dhoondne ke liye
    Optional<User> findByResetToken(String resetToken);
}
