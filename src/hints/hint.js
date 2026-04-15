// hint.js
// Logic for generating context-sensitive hints based on user interactions and derived flight data insights.
//
// Design principles:
// - Hints are failure-gated (never shown too early)
// - Hints are probabilistic and non-directive
// - Hints acknowledge constraints without revealing solutions
// - Hints prevent infinite frustration loops without guiding success

export function getHint({
  tripType,
  failureCount,
  lastAttempt,
  flightFacts
}) {
  // --------------------------------------------------
  // Guard: do not hint too early
  // --------------------------------------------------
  if (failureCount < 5) return null;

  const {
    terminalAirports = [],
    hasRoute = () => false,
    getAvailableDates = () => []
  } = flightFacts || {};

  // --------------------------------------------------
  // 1. Procedural completeness (highest priority)
  // --------------------------------------------------
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
          "Some itinerary details are still missing. Try completing all fields before evaluating route availability."
      };
    }
  } else {
    const legs = lastAttempt?.legs || [];
    const incompleteLeg = legs.some(
      leg => !leg.origin || !leg.destination || !leg.departDate
    );

    if (incompleteLeg) {
      return {
        type: "form_incomplete",
        message:
          "Each leg of a multi-city trip requires an origin, destination, and departure date."
      };
    }
  }

  // --------------------------------------------------
  // 2. Explicit non-viable route (soft disclosure)
  // --------------------------------------------------
  if (tripType !== "multiCity") {
    const { origin, destination } = lastAttempt || {};

    if (
      origin &&
      destination &&
      !hasRoute(origin, destination)
    ) {
      return {
        type: "route_may_not_exist",
        message:
          "This origin and destination pairing may not be viable in this system."
      };
    }
  }

  // --------------------------------------------------
  // 3. Temporal availability mismatch (route exists)
  // --------------------------------------------------
  if (tripType === "oneWay") {
    const { origin, destination, departDate } = lastAttempt || {};

    if (
      origin &&
      destination &&
      departDate &&
      hasRoute(origin, destination)
    ) {
      const availableDates = getAvailableDates(origin, destination);

      if (
        availableDates.length > 0 &&
        !availableDates.includes(departDate)
      ) {
        return {
          type: "date_unavailable",
          message:
            "This route exists, but flights are only available on certain dates."
        };
      }
    }
  }

  // --------------------------------------------------
  // 4. Round-trip structural limitation
  // --------------------------------------------------
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
          "This destination may not support a return flight to the origin. Not all routes allow round-trip travel."
      };
    }
  }

  // --------------------------------------------------
  // 5. Multi-city terminal airport constraint
  // --------------------------------------------------
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
          "This airport has no onward flights. Multi-city trips typically must end here."
      };
    }
  }

  // --------------------------------------------------
  // 6. Fallback: abstract system constraint
  // --------------------------------------------------
  return {
    type: "general_constraint",
    message:
      "Not all routes in this system are available under all conditions."
  };
}
