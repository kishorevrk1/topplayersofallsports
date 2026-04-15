package com.topplayersofallsports.playerservice.repository;

import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.PlayerStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerStatsRepository extends JpaRepository<PlayerStats, Long> {
    
    List<PlayerStats> findByPlayer(Player player);
    
    Optional<PlayerStats> findByPlayerAndSeason(Player player, String season);
    
    List<PlayerStats> findByPlayerOrderBySeasonDesc(Player player);
}
