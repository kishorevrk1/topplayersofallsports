package com.topplayersofallsports.playerservice.repository;

import com.topplayersofallsports.playerservice.entity.Nomination;
import com.topplayersofallsports.playerservice.entity.Sport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface NominationRepository extends JpaRepository<Nomination, Long> {

    List<Nomination> findByRatingDayIdAndSport(Long ratingDayId, Sport sport);

    boolean existsByRatingDayIdAndNominatedByUserIdAndSport(
        Long ratingDayId, String userId, Sport sport);

    @Query("SELECT n FROM Nomination n WHERE n.ratingDayId = :ratingDayId AND n.supportVotes >= :minVotes AND n.status = 'PENDING'")
    List<Nomination> findQualifyingNominations(
        @Param("ratingDayId") Long ratingDayId,
        @Param("minVotes") int minVotes);
}
