package com.topplayersofallsports.playerservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Resolves real player photo URLs using the Wikipedia API.
 *
 * Why Wikipedia instead of API-Sports:
 *  - No API key required
 *  - No daily request limit (200 req/second allowed for read-only queries)
 *  - Covers every athlete — current, retired, and historical legends (Pelé, Maradona, etc.)
 *  - Photos are freely licensed Wikimedia Commons images, publicly accessible in <img> tags
 *
 * Called automatically during seeding (Top100SeedingService) so every player
 * is stored with their real photo from the moment they enter the database.
 *
 * The admin endpoint POST /api/admin/players/enrich-images/{sport} is available
 * to backfill photos for players already in the DB without a real image.
 */
@Service
@Slf4j
public class PlayerImageEnrichmentService {

    private static final String WIKIPEDIA_API = "https://en.wikipedia.org";
    private static final int THUMBNAIL_SIZE = 500;

    private final PlayerRepository playerRepository;
    private final WebClient wikiClient;
    private final ObjectMapper objectMapper;

    public PlayerImageEnrichmentService(
            PlayerRepository playerRepository,
            ObjectMapper objectMapper) {
        this.playerRepository = playerRepository;
        this.objectMapper = objectMapper;
        this.wikiClient = WebClient.builder()
                .baseUrl(WIKIPEDIA_API)
                .defaultHeader("User-Agent", "TopPlayersOfAllSports/1.0 (sports-data-platform)")
                .codecs(cfg -> cfg.defaultCodecs().maxInMemorySize(1024 * 1024))
                .build();
    }

    // ── Public API ────────────────────────────────────────────────────────────────

    /**
     * Resolves a real Wikipedia photo URL for the given athlete.
     *
     * Called during seeding so the photo is set at player-creation time.
     *
     * Search strategy:
     *  1. Try the athlete's display/common name (e.g. "Pelé", "Messi")
     *  2. If no thumbnail found, try full name + sport qualifier (e.g. "Edson Arantes do Nascimento football")
     *  3. Return null if not found — caller falls back to ui-avatars placeholder
     *
     * @param displayName  Short/common name the athlete is known by (e.g. "Pelé")
     * @param fullName     Full official name (e.g. "Edson Arantes do Nascimento")
     * @param sportHint    Sport category used as qualifier on retry (e.g. "football", "basketball")
     */
    public String findPhotoUrl(String displayName, String fullName, String sportHint) {
        // 1. Try common/display name first — unambiguous for legends
        String photo = queryWikipedia(displayName);
        if (photo != null) {
            log.debug("[WikiPhoto] ✅ {} → {}", displayName, photo);
            return photo;
        }

        // 2. Try full name alone
        if (fullName != null && !fullName.equalsIgnoreCase(displayName)) {
            photo = queryWikipedia(fullName);
            if (photo != null) {
                log.debug("[WikiPhoto] ✅ {} (full name) → {}", fullName, photo);
                return photo;
            }
        }

        // 3. Try name + sport qualifier to resolve disambiguation pages
        String qualified = displayName + " " + sportHint.toLowerCase();
        photo = queryWikipedia(qualified);
        if (photo != null) {
            log.debug("[WikiPhoto] ✅ {} (qualified) → {}", qualified, photo);
            return photo;
        }

        log.debug("[WikiPhoto] ⚠️ No photo found for '{}' / '{}'", displayName, fullName);
        return null;
    }

    /**
     * Convenience overload used when display name equals full name.
     */
    public String findPhotoUrl(String name, String sportHint) {
        return findPhotoUrl(name, name, sportHint);
    }

    /**
     * Backfills photo URLs for all ranked players of a sport that lack a real photo.
     * Used by the admin endpoint for players already in the DB.
     *
     * @return stats map: { success, sport, total, updated, skipped, notFound }
     */
    public Map<String, Object> enrichImagesForSport(Sport sport) {
        List<Player> players = playerRepository.findTop100BySport(sport);
        log.info("[WikiPhoto] Starting backfill for {} {} players", players.size(), sport);

        AtomicInteger updated = new AtomicInteger(0);
        AtomicInteger skipped = new AtomicInteger(0);
        AtomicInteger notFound = new AtomicInteger(0);

        for (Player player : players) {
            if (hasRealPhoto(player.getPhotoUrl())) {
                skipped.incrementAndGet();
                continue;
            }

            try {
                String name  = player.getDisplayName() != null ? player.getDisplayName() : player.getName();
                String photo = findPhotoUrl(name, player.getName(), sport.name().toLowerCase());

                if (photo != null) {
                    player.setPhotoUrl(photo);
                    playerRepository.save(player);
                    updated.incrementAndGet();
                    log.info("[WikiPhoto] ✅ {} → {}", player.getName(), photo);
                } else {
                    notFound.incrementAndGet();
                    log.info("[WikiPhoto] ⚠️ No photo found for {}", player.getName());
                }

                // Brief pause — Wikipedia is generous but we're polite
                Thread.sleep(150);

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("[WikiPhoto] Interrupted — stopping enrichment for {}", sport);
                break;
            } catch (Exception e) {
                notFound.incrementAndGet();
                log.warn("[WikiPhoto] Error enriching {}: {}", player.getName(), e.getMessage());
            }
        }

        log.info("[WikiPhoto] Done for {}. updated={}, skipped={}, notFound={}",
                sport, updated.get(), skipped.get(), notFound.get());

        return Map.of(
                "success", true,
                "sport", sport.name(),
                "total", players.size(),
                "updated", updated.get(),
                "skipped", skipped.get(),
                "notFound", notFound.get()
        );
    }

    // ── Private helpers ───────────────────────────────────────────────────────────

    /**
     * Calls the Wikipedia pageimages API for the given title.
     *
     * API: GET /w/api.php?action=query&titles={title}&prop=pageimages&pithumbsize=500&format=json&redirects=1
     *
     * Returns the thumbnail URL, or null if the page doesn't exist or has no image.
     */
    private String queryWikipedia(String title) {
        if (title == null || title.isBlank()) return null;
        try {
            String response = wikiClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/w/api.php")
                            .queryParam("action", "query")
                            .queryParam("titles", title)
                            .queryParam("prop", "pageimages")
                            .queryParam("pithumbsize", THUMBNAIL_SIZE)
                            .queryParam("format", "json")
                            .queryParam("redirects", "1")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            return extractThumbnail(response);
        } catch (Exception e) {
            log.debug("[WikiPhoto] Request failed for '{}': {}", title, e.getMessage());
            return null;
        }
    }

    /**
     * Extracts the thumbnail URL from a Wikipedia API JSON response.
     *
     * Response structure:
     * { "query": { "pages": { "<id>": { "thumbnail": { "source": "https://..." } } } } }
     *
     * Returns null if missing, disambiguation, or no photo set on the Wikipedia page.
     */
    private String extractThumbnail(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            JsonNode pages = objectMapper.readTree(json).path("query").path("pages");
            if (!pages.isObject() || pages.isEmpty()) return null;

            JsonNode page = pages.fields().next().getValue();

            // Page ID -1 means "not found"
            if (page.has("missing")) return null;

            String url = page.path("thumbnail").path("source").asText(null);
            return (url != null && !url.isBlank()) ? url : null;

        } catch (Exception e) {
            log.debug("[WikiPhoto] JSON parse failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * True if the player already has a real (non-placeholder) photo URL.
     */
    private boolean hasRealPhoto(String photoUrl) {
        if (photoUrl == null || photoUrl.isBlank()) return false;
        return !photoUrl.contains("ui-avatars.com") && !photoUrl.contains("placeholder");
    }
}
