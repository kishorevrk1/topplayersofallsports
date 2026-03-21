package com.topplayersofallsports.playerservice.repository;

import com.topplayersofallsports.playerservice.entity.EloMatchup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface EloMatchupRepository extends JpaRepository<EloMatchup, Long> {

    @Query("SELECT m FROM EloMatchup m WHERE m.ratingDayId = :ratingDayId AND m.voterUserId = :userId")
    List<EloMatchup> findByRatingDayAndVoter(
        @Param("ratingDayId") Long ratingDayId,
        @Param("userId") String userId);

    @Query("SELECT COUNT(m) FROM EloMatchup m WHERE m.ratingDayId = :ratingDayId AND m.voterUserId = :userId")
    long countByRatingDayAndVoter(
        @Param("ratingDayId") Long ratingDayId,
        @Param("userId") String userId);

    @Query("SELECT COUNT(DISTINCT m.voterUserId) FROM EloMatchup m WHERE m.ratingDayId = :ratingDayId")
    long countDistinctVotersByRatingDay(@Param("ratingDayId") Long ratingDayId);

    @Query("SELECT COUNT(m) FROM EloMatchup m WHERE m.ratingDayId = :ratingDayId")
    long countByRatingDay(@Param("ratingDayId") Long ratingDayId);

    boolean existsByRatingDayIdAndVoterUserIdAndPlayer1IdAndPlayer2Id(
        Long ratingDayId, String voterUserId, Long player1Id, Long player2Id);
}
