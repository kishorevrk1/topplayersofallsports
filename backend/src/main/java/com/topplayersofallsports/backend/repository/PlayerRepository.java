package com.topplayersofallsports.backend.repository;

import com.topplayersofallsports.backend.model.Player;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for Player entity operations
 */
@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    
    /**
     * Find players by sport
     */
    Page<Player> findBySportAndIsActiveTrueOrderByNameAsc(Player.SportType sport, Pageable pageable);
    
    /**
     * Find players by team
     */
    Page<Player> findByTeamAndIsActiveTrueOrderByNameAsc(String team, Pageable pageable);
    
    /**
     * Find players by position
     */
    Page<Player> findByPositionAndIsActiveTrueOrderByNameAsc(String position, Pageable pageable);
    
    /**
     * Find featured players
     */
    @Query("SELECT p FROM Player p WHERE p.isFeatured = true AND p.isActive = true ORDER BY p.viewCount DESC")
    List<Player> findFeaturedPlayers();
    
    /**
     * Search players by name
     */
    @Query("SELECT p FROM Player p WHERE p.isActive = true AND " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "ORDER BY p.name ASC")
    Page<Player> searchPlayersByName(@Param("search") String search, Pageable pageable);
    
    /**
     * Search players by name, team, or position
     */
    @Query("SELECT p FROM Player p WHERE p.isActive = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.team) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.position) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY p.name ASC")
    Page<Player> searchPlayers(@Param("search") String search, Pageable pageable);
    
    /**
     * Find most viewed players
     */
    @Query("SELECT p FROM Player p WHERE p.isActive = true ORDER BY p.viewCount DESC")
    Page<Player> findMostViewed(Pageable pageable);
    
    /**
     * Find players by nationality
     */
    Page<Player> findByNationalityAndIsActiveTrueOrderByNameAsc(String nationality, Pageable pageable);
    
    /**
     * Find top players by sport (based on view count)
     */
    @Query("SELECT p FROM Player p WHERE p.sport = :sport AND p.isActive = true ORDER BY p.viewCount DESC")
    Page<Player> findTopPlayersBySport(@Param("sport") Player.SportType sport, Pageable pageable);
    
    /**
     * Count players by sport
     */
    long countBySportAndIsActiveTrue(Player.SportType sport);
    
    /**
     * Count players by team
     */
    long countByTeamAndIsActiveTrue(String team);
    
    /**
     * Find players with upcoming contract expiry
     */
    @Query("SELECT p FROM Player p WHERE p.isActive = true AND p.contractUntil IS NOT NULL AND " +
           "p.contractUntil BETWEEN CURRENT_DATE AND DATEADD(YEAR, 1, CURRENT_DATE) ORDER BY p.contractUntil ASC")
    List<Player> findPlayersWithUpcomingContractExpiry();
}
