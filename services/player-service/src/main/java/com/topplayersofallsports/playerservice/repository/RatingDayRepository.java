package com.topplayersofallsports.playerservice.repository;

import com.topplayersofallsports.playerservice.entity.RatingDay;
import com.topplayersofallsports.playerservice.entity.Sport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RatingDayRepository extends JpaRepository<RatingDay, Long> {

    Optional<RatingDay> findBySportAndMonth(Sport sport, String month);

    Optional<RatingDay> findBySportAndStatus(Sport sport, RatingDay.Status status);

    List<RatingDay> findByStatus(RatingDay.Status status);

    List<RatingDay> findBySportOrderByCreatedAtDesc(Sport sport);

    List<RatingDay> findBySportAndStatusOrderByCreatedAtDesc(Sport sport, RatingDay.Status status);
}
