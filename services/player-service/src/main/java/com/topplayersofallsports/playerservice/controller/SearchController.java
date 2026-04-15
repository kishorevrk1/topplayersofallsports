package com.topplayersofallsports.playerservice.controller;

import com.topplayersofallsports.playerservice.dto.SearchResultsResponse;
import com.topplayersofallsports.playerservice.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<SearchResultsResponse> search(
            @RequestParam String q,
            @RequestParam(required = false) String sport,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        if (q == null || q.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (size > 50) size = 50; // max page size guard

        return ResponseEntity.ok(searchService.search(q, sport, page, size));
    }
}
