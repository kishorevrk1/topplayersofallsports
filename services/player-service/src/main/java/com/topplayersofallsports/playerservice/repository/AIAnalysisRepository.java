package com.topplayersofallsports.playerservice.repository;

import com.topplayersofallsports.playerservice.entity.AIAnalysis;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.Sport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AIAnalysisRepository extends JpaRepository<AIAnalysis, Long> {
    
    Optional<AIAnalysis> findByPlayer(Player player);
    
    @Query("SELECT a FROM AIAnalysis a JOIN a.player p WHERE p.sport = :sport ORDER BY a.aiRating DESC")
    List<AIAnalysis> findTopPlayersBySport(Sport sport);
    
    @Query("SELECT a FROM AIAnalysis a ORDER BY a.aiRating DESC")
    List<AIAnalysis> findAllOrderByRatingDesc();
}
