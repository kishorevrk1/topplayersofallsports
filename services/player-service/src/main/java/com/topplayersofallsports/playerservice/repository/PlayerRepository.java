package com.topplayersofallsports.playerservice.repository;

import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.Sport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    
    Optional<Player> findByApiPlayerId(String apiPlayerId);
    
    List<Player> findBySport(Sport sport);
    
    @Query("SELECT p FROM Player p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Player> searchByName(String name);
    
    List<Player> findBySportOrderByIdDesc(Sport sport);
    
    long countBySport(Sport sport);
    
    // Deduplication queries
    Optional<Player> findByCanonicalId(String canonicalId);
    
    @Query("SELECT p FROM Player p WHERE p.normalizedName = :normalizedName AND p.sport = :sport")
    List<Player> findByNormalizedNameAndSport(String normalizedName, Sport sport);
    
    @Query("SELECT p FROM Player p JOIN p.aliases a WHERE LOWER(a) = LOWER(:alias) AND p.sport = :sport")
    List<Player> findByAlias(String alias, Sport sport);
    
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Player p WHERE LOWER(p.displayName) = LOWER(:displayName) AND p.sport = :sport")
    boolean existsByDisplayNameIgnoreCaseAndSport(String displayName, Sport sport);
    
    // Ranking queries for top 50 system
    @Query("SELECT COUNT(p) FROM Player p WHERE p.sport = :sport AND p.currentRank IS NOT NULL")
    long countBySportAndCurrentRankIsNotNull(Sport sport);
    
    @Query("SELECT p FROM Player p WHERE p.sport = :sport AND p.currentRank IS NOT NULL ORDER BY p.currentRank ASC")
    List<Player> findBySportAndCurrentRankIsNotNullOrderByCurrentRankAsc(Sport sport);
    
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Player p WHERE LOWER(p.name) = LOWER(:name) AND p.sport = :sport AND p.currentRank IS NOT NULL")
    boolean existsByNameIgnoreCaseAndSportAndCurrentRankIsNotNull(String name, Sport sport);
    
    @Query("SELECT p FROM Player p WHERE p.sport = :sport AND p.currentRank IS NOT NULL AND p.isActive = true ORDER BY p.rankingScore DESC")
    List<Player> findActiveBySportOrderByRankingScoreDesc(Sport sport);
    
    @Query("SELECT p FROM Player p WHERE p.sport = :sport AND p.isActive = true AND p.currentRank <= 50 ORDER BY p.currentRank ASC")
    List<Player> findTop50ActivePlayersBySport(Sport sport);
    
    // Top 100 All-Time Greatest Players queries
    @Query("SELECT p FROM Player p WHERE p.sport = :sport AND p.currentRank IS NOT NULL AND p.currentRank <= 100 ORDER BY p.currentRank ASC")
    List<Player> findTop100BySport(Sport sport);
    
    @Query("SELECT p FROM Player p WHERE p.sport = :sport AND p.currentRank IS NOT NULL ORDER BY p.currentRank ASC")
    List<Player> findAllRankedPlayersBySport(Sport sport);

    @Query("SELECT p FROM Player p WHERE p.sport = :sport AND p.currentRank IS NOT NULL ORDER BY p.eloScore DESC")
    List<Player> findTop100BySportOrderByEloDesc(@Param("sport") Sport sport);

    @Query("SELECT p FROM Player p WHERE p.sport = :sport AND p.currentRank = :rank")
    Optional<Player> findByRankAndSport(Integer rank, Sport sport);

    // Full-text search across name, team, nationality with optional sport filter
    @Query("SELECT p FROM Player p WHERE " +
           "(:sport IS NULL OR CAST(p.sport AS string) = :sport) AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           " LOWER(COALESCE(p.team, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           " LOWER(COALESCE(p.nationality, '')) LIKE LOWER(CONCAT('%', :q, '%')))" +
           " ORDER BY p.currentRank ASC NULLS LAST")
    Page<Player> searchPlayers(
        @Param("q") String q,
        @Param("sport") String sport,
        Pageable pageable
    );
}
