package com.topplayersofallsports.playerservice.exception;

/**
 * Exception thrown when an entity is not found in the database
 */
public class EntityNotFoundException extends RuntimeException {
    
    public EntityNotFoundException(String message) {
        super(message);
    }
    
    public EntityNotFoundException(String entityType, Long id) {
        super(String.format("%s not found with id: %d", entityType, id));
    }
    
    public EntityNotFoundException(String entityType, String identifier) {
        super(String.format("%s not found: %s", entityType, identifier));
    }
}
