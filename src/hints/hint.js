// hint.js
//
// Logic for generating context-sensitive hints in System A based on
// user interaction history and constraints derived from the flight dataset.
//
// Critically, this file encodes a *compensatory* mechanism rather than
// a general help system. Hints exist to acknowledge the presence of
// constraints that are intentionally hidden in the flexible interface,
// without revealing specific solutions or optimal choices.
//
// Design principles:
// - Hints are failure-gated (never shown early)
// - Hints are non-directive and explanatory rather than instructional
// - Hints describe violated constraints, not how to satisfy them
// - Hints prevent infinite frustration loops while preserving difficulty
//
// System B deliberately does not use this hint system. In that interface,
// the same constraints are enforced proactively through available options,
// making reactive guidance unnecessary.

export function getHint({ tripType, failureCount, lastAttempt, flightFacts }) {
  // -----------------------------
  // Guard: do not hint too early
  // -----------------------------
  // Hints are intentionally suppressed during early attempts so that
  // users are free to explore and form hypotheses about system behavior.
  // The failure threshold ensures that guidance appears only after
  // sustained difficulty, not after normal experiment
  if (failureCount < 5) return null;

  // Extract derived constraint facts from the shared flight analysis.
  // These functions reflect the same constraints enforced directly
  // by System B, ensuring parity at the data level.
  const {
    terminalAirports = [],
    hasRoute = () => false,
    getAvailableDates = () => [],
  } = flightFacts || {};

  // -----------------------------
  // 1. Procedural completeness (highest priority)
  // -----------------------------
  // Before surfacing higher-level constraint violations, the system
  // first checks for incomplete submissions. This prevents misleading
  // hints about availability or structure when required information
  // is missing.
  if (tripType !== "multiCity") {
    if (
      !lastAttempt?.origin ||
      !lastAttempt?.destination ||
      !lastAttempt?.departDate ||
      (tripType === "roundTrip" && !lastAttempt?.returnDate)
    ) {
      return {
        type: "form_incomplete",
        message:
          "Some itinerary details are still missing. Try completing all fields before evaluating route availability.",
      };
    }
  } else {
    const legs = lastAttempt?.legs || [];
    const incompleteLeg = legs.some(
      (leg) => !leg.origin || !leg.destination || !leg.departDate
    );

    if (incompleteLeg) {
      return {
        type: "form_incomplete",
        message:
          "Each leg of a multi-city trip requires an origin, destination, and departure date.",
      };
    }
  }

  // -----------------------------
  // 2. Explicit non-viable route (soft disclosure)
  // -----------------------------
  // If a route does not exist in the dataset at all, this hint signals
  // structural infeasibility without naming alternative routes.
  // The phrasing remains probabilistic to avoid collapsing exploration.
  if (tripType !== "multiCity") {
    const { origin, destination } = lastAttempt || {};

    if (origin && destination && !hasRoute(origin, destination)) {
      return {
        type: "route_may_not_exist",
        message:
          "This origin and destination pairing may not be viable in this system.",
      };
    }
  }

  // -----------------------------
  // 3. Temporal availability mismatch (route exists)
  // -----------------------------
  // This hint distinguishes between structural impossibility and
  // temporal constraint violations. The route may exist, but only
  // on specific dates that must be discovered.
  if (tripType === "oneWay") {
    const { origin, destination, departDate } = lastAttempt || {};

    if (origin && destination && departDate && hasRoute(origin, destination)) {
      const availableDates = getAvailableDates(origin, destination);

      if (availableDates.length > 0 && !availableDates.includes(departDate)) {
        return {
          type: "date_unavailable",
          message:
            "This route exists, but flights are only available on certain dates.",
        };
      }
    }
  }

  // -----------------------------
  // 4. Round-trip structural limitation
  // -----------------------------
  // Some routes permit outbound travel but do not support a return.
  // This hint exposes asymmetric route structure without revealing
  // specific alternatives or allowable return paths.
  if (tripType === "roundTrip") {
    const { origin, destination } = lastAttempt || {};

    if (
      origin &&
      destination &&
      hasRoute(origin, destination) &&
      !hasRoute(destination, origin)
    ) {
      return {
        type: "no_return",
        message:
          "This destination may not support a return flight to the origin. Not all routes allow round-trip travel.",
      };
    }
  }

  // -----------------------------
  // 5. Multi-city terminal airport constraint
  // -----------------------------
  // Terminal airports represent structural dead-ends in the route graph.
  // In System A, users can discover these limits only through failure,
  // whereas System B prevents selecting such airports except as final legs.
  if (tripType === "multiCity") {
    const legs = lastAttempt?.legs || [];
    const lastLeg = legs[legs.length - 1];

    if (
      lastLeg?.destination &&
      terminalAirports.includes(lastLeg.destination)
    ) {
      return {
        type: "terminal_airport",
        message:
          "This airport has no onward flights. Multi-city trips typically must end here.",
      };
    }
  }

  // -----------------------------
  // 6. Fallback: abstract system constraint
  // -----------------------------
  // If no specific constraint can be identified, the system acknowledges
  // the presence of hidden limitations without disclosing their nature.
  // This preserves uncertainty while preventing the perception that
  // failure is arbitrary or user error.
  return {
    type: "general_constraint",
    message:
      "Not all routes in this system are available under all conditions.",
  };
}