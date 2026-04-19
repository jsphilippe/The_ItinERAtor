// hintUtils.js
//
// Utility functions for analyzing flight data and deriving constraint facts
// used by both the hint system (System A) and guided constraint enforcement
// (System B).
//
// This module serves as the single source of truth for inferred constraints.
// No constraints are hard-coded as abstract rules. Instead, all knowledge
// about route existence, temporal availability, and terminal airports is
// derived directly from the static flight dataset.
//
// Centralizing this logic ensures that behavioral differences between systems
// arise from how constraints are exposed or enforced, not from differences
// in the underlying constraint definitions themselves.

export function analyzeFlights(flights) {
  // -----------------------------
  // Data structures
  // -----------------------------
  // These structures are built once per session and treated as read-only.
  // They provide efficient lookup for constraint-related queries during
  // interaction and hint generation.

  // origin -> count of outbound flights
  // Used to infer whether an airport can serve as a continuation point
  // in round-trip or multi-city itineraries.
  const outboundCounts = {};

  // destination -> count of inbound flights
  // Used in combination with outboundCounts to identify terminal airports.
  const inboundCounts = {};

  // Set of "ORIGIN->DESTINATION" route keys
  // Represents the existence of at least one flight between two airports,
  // independent of date.
  const routes = new Set();

  // Map "ORIGIN->DESTINATION" -> array of available departure dates
  // Preserves the full temporal constraint surface for each route.
  // This supports hints related to date availability without hard-coding
  // acceptable ranges.
  const dateMap = {};

  // -----------------------------
  // Build indexes from flights.js
  // -----------------------------
  // Iterate once over the dataset to build all derived views.
  // This preprocessing step trades upfront computation for cheap,
  // repeated constraint queries during interaction.
  flights.forEach((flight) => {
    const { origin, destination, departDate } = flight;

    // Defensive guard to ensure incomplete records do not poison indexes.
    if (!origin || !destination || !departDate) return;

    outboundCounts[origin] = (outboundCounts[origin] || 0) + 1;
    inboundCounts[destination] = (inboundCounts[destination] || 0) + 1;

    const routeKey = `${origin}->${destination}`;
    routes.add(routeKey);

    if (!dateMap[routeKey]) {
      dateMap[routeKey] = [];
    }

    dateMap[routeKey].push(departDate);
  });

  // -----------------------------
  // Derived facts
  // -----------------------------
  // Terminal airports are defined as airports that receive flights
  // but do not originate any outbound flights.
  //
  // These airports create structural dead-ends in multi-city itineraries
  // and are surfaced through hints in System A or prevented entirely
  // in System B.
  const terminalAirports = Object.keys(inboundCounts).filter(
    (airport) => !outboundCounts[airport]
  );

  // -----------------------------
  // Query helpers
  // -----------------------------
  // Lightweight accessors used throughout the application to reason
  // about constraint satisfaction without exposing internal structures.

  // Returns true if at least one flight exists between two airports,
  // regardless of date.
  const hasRoute = (from, to) => {
    return routes.has(`${from}->${to}`);
  };

  // Returns all valid departure dates for a route.
  // An empty array indicates that the route does not exist or that no
  // temporal availability remains.
  const getAvailableDates = (from, to) => {
    return dateMap[`${from}->${to}`] || [];
  };

  // -----------------------------
  // Public API
  // -----------------------------
  // Exposes only high-level constraint facts and queries.
  // Callers are intentionally prevented from mutating internal state.
  return {
    terminalAirports,
    hasRoute,
    getAvailableDates,
  };
}