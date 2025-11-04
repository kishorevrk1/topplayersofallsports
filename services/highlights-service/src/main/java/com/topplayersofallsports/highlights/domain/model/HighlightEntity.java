package com.topplayersofallsports.highlights.domain.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity tag linking highlights to sports entities (teams, players, leagues).
 * Enables efficient querying by entity.
 */
@Entity
@Table(name = "highlight_entities", indexes = {
    @Index(name = "idx_highlight_entities_type_id", columnList = "entity_type, entity_id"),
    @Index(name = "idx_highlight_entities_highlight", columnList = "highlight_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HighlightEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "highlight_id", nullable = false)
    private Highlight highlight;

    @Column(name = "entity_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private EntityType entityType;

    @Column(name = "entity_id", nullable = false, length = 100)
    private String entityId;

    public enum EntityType {
        TEAM,
        PLAYER,
        LEAGUE,
        GAME
    }
}
