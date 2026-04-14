// hint.js

export function getHint({
  tripType,
  failureCount,
  lastAttempt,
  flightFacts
}) {
  // -----------------------------
  // Guard: do not hint too early
  // -----------------------------
  if (failureCount < 5) return null;

  const {
    terminalAirports = [],
    hasRoute = () => false,
    getAvailableDates = () => []
  } = flightFacts || {};

  // -----------------------------
  // 1. Form incomplete
  // -----------------------------
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
          "Try completing all itinerary details before exploring route constraints."
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
          "Each leg needs an origin, destination, and departure date."
      };
    }
  }

  // -----------------------------
  // 2. Date availability mismatch
  // -----------------------------
  if (tripType === "oneWay") {
    const { origin, destination, departDate } = lastAttempt;

    if (origin && destination && departDate && hasRoute(origin, destination)) {
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

  // -----------------------------
  // 3. Round-trip structural constraint
  // -----------------------------
  if (tripType === "roundTrip") {
    const { origin, destination } = lastAttempt;

    if (origin && destination && !hasRoute(destination, origin)) {
      return {
        type: "no_return",
        message:
          "This destination does not have flights back to the origin. Not all routes support round-trip travel."
      };
    }
  }

  // -----------------------------
  // 4. Multi-city terminal airport
  // -----------------------------
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
          "This airport has no onward flights. Multi-city trips must end here."
      };
    }
  }

  // -----------------------------
  // 5. Fallback
  // -----------------------------
  return {
    type: "general_constraint",
    message:
      "Not all routes in this system are available under all conditions."
  };
}