package com.topplayersofallsports.playerservice.repository;

import com.topplayersofallsports.playerservice.entity.RankingHistory;
import com.topplayersofallsports.playerservice.entity.Sport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RankingHistoryRepository extends JpaRepository<RankingHistory, Long> {

    List<RankingHistory> findByPlayerIdOrderByCreatedAtDesc(Long playerId);

    List<RankingHistory> findBySportAndMonthOrderByRankAfterAsc(Sport sport, String month);
}
