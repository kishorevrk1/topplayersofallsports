package com.topplayersofallsports.highlights.domain.util;

import com.topplayersofallsports.highlights.domain.model.Highlight;
import lombok.extern.slf4j.Slf4j;

import java.util.regex.Pattern;

/**
 * Utility class for detecting video type from title and description.
 * Uses keyword-based pattern matching to categorize videos.
 * 
 * Production-ready with comprehensive patterns and fallback logic.
 */
@Slf4j
public class VideoTypeDetector {

    // Interview patterns
    private static final Pattern INTERVIEW_PATTERN = Pattern.compile(
        ".*(interview|press conference|q&a|q & a|media day|post[- ]game|pre[- ]game|" +
        "talks about|speaks on|discusses|exclusive chat|sit down|one on one).*",
        Pattern.CASE_INSENSITIVE
    );

    // Training patterns
    private static final Pattern TRAINING_PATTERN = Pattern.compile(
        ".*(training|practice|workout|drill|warm[- ]up|conditioning|" +
        "skill work|shooting practice|footwork|agility|strength).*",
        Pattern.CASE_INSENSITIVE
    );

    // Behind the scenes patterns
    private static final Pattern BEHIND_SCENES_PATTERN = Pattern.compile(
        ".*(behind the scenes|locker room|off[- ]court|off[- ]field|" +
        "day in life|day in the life|tunnel walk|arrival|pregame|" +
        "backstage|exclusive access|inside look).*",
        Pattern.CASE_INSENSITIVE
    );

    // Full game patterns
    private static final Pattern FULL_GAME_PATTERN = Pattern.compile(
        ".*(full game|complete game|entire game|full match|complete match|" +
        "entire match|game replay|match replay|full replay).*",
        Pattern.CASE_INSENSITIVE
    );

    // Documentary patterns
    private static final Pattern DOCUMENTARY_PATTERN = Pattern.compile(
        ".*(documentary|story|journey|career|legacy|feature|" +
        "biography|profile|rise of|the making of|untold story).*",
        Pattern.CASE_INSENSITIVE
    );

    /**
     * Detect video type from title and description.
     * Checks patterns in priority order and returns the first match.
     * 
     * @param title Video title
     * @param description Video description (can be null)
     * @return Detected VideoType, defaults to HIGHLIGHT if no match
     */
    public static Highlight.VideoType detectVideoType(String title, String description) {
        if (title == null || title.isBlank()) {
            log.warn("Empty title provided for video type detection, defaulting to HIGHLIGHT");
            return Highlight.VideoType.HIGHLIGHT;
        }

        // Combine title and description for better detection
        String combined = title.toLowerCase();
        if (description != null && !description.isBlank()) {
            combined += " " + description.toLowerCase();
        }

        // Check patterns in priority order
        // Order matters: more specific patterns first

        if (FULL_GAME_PATTERN.matcher(combined).matches()) {
            log.debug("Detected FULL_GAME from: {}", title);
            return Highlight.VideoType.FULL_GAME;
        }

        if (DOCUMENTARY_PATTERN.matcher(combined).matches()) {
            log.debug("Detected DOCUMENTARY from: {}", title);
            return Highlight.VideoType.DOCUMENTARY;
        }

        if (INTERVIEW_PATTERN.matcher(combined).matches()) {
            log.debug("Detected INTERVIEW from: {}", title);
            return Highlight.VideoType.INTERVIEW;
        }

        if (TRAINING_PATTERN.matcher(combined).matches()) {
            log.debug("Detected TRAINING from: {}", title);
            return Highlight.VideoType.TRAINING;
        }

        if (BEHIND_SCENES_PATTERN.matcher(combined).matches()) {
            log.debug("Detected BEHIND_SCENES from: {}", title);
            return Highlight.VideoType.BEHIND_SCENES;
        }

        // Default to HIGHLIGHT (game highlights, best plays, key moments)
        log.debug("Defaulting to HIGHLIGHT for: {}", title);
        return Highlight.VideoType.HIGHLIGHT;
    }

    /**
     * Detect if a video should be featured based on title/description keywords.
     * Featured videos are typically major events, championships, or milestone moments.
     * 
     * @param title Video title
     * @param description Video description (can be null)
     * @param viewCount View count (higher views increase likelihood)
     * @return true if video should be featured
     */
    public static boolean shouldBeFeatured(String title, String description, Long viewCount) {
        if (title == null || title.isBlank()) {
            return false;
        }

        String combined = title.toLowerCase();
        if (description != null && !description.isBlank()) {
            combined += " " + description.toLowerCase();
        }

        // Featured keywords (championships, milestones, historic moments)
        Pattern featuredPattern = Pattern.compile(
            ".*(championship|finals|playoff|super bowl|world series|world cup|" +
            "olympics|record|historic|milestone|legendary|epic|" +
            "game[- ]winning|walk[- ]off|buzzer[- ]beater|overtime|" +
            "debut|retirement|farewell|last game|first game|" +
            "mvp|all[- ]star|hall of fame).*",
            Pattern.CASE_INSENSITIVE
        );

        boolean hasKeywords = featuredPattern.matcher(combined).matches();
        
        // High view count also indicates featured-worthy content
        boolean hasHighViews = viewCount != null && viewCount > 1_000_000;

        return hasKeywords || hasHighViews;
    }

    /**
     * Private constructor to prevent instantiation.
     */
    private VideoTypeDetector() {
        throw new UnsupportedOperationException("Utility class");
    }
}
