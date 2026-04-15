// hintUtils.js
// Utility functions for analyzing flight data and generating insights that can be used for hint generation in the itinerary search experiment.
// Provides functions to identify terminal airports, check route existence, and retrieve available dates for routes.

export function analyzeFlights(flights) {
  // -----------------------------
  // Data structures
  // -----------------------------

  // origin -> count of outbound flights
  const outboundCounts = {};

  // destination -> count of inbound flights
  const inboundCounts = {};

  // Set of "ORIGIN->DESTINATION"
  const routes = new Set();

  // Map "ORIGIN->DESTINATION" -> array of available departure dates
  const dateMap = {};

  // -----------------------------
  // Build indexes from flights.js
  // -----------------------------
  flights.forEach(flight => {
    const { origin, destination, departDate } = flight;

    if (!origin || !destination || !departDate) return;

    outboundCounts[origin] = (outboundCounts[origin] || 0) + 1;
    inboundCounts[destination] =
      (inboundCounts[destination] || 0) + 1;

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

  // Airports that have inbound flights but no outbound flights
  const terminalAirports = Object.keys(inboundCounts).filter(
    airport => !outboundCounts[airport]
  );

  // -----------------------------
  // Query helpers
  // -----------------------------

  const hasRoute = (from, to) => {
    return routes.has(`${from}->${to}`);
  };

  const getAvailableDates = (from, to) => {
    return dateMap[`${from}->${to}`] || [];
  };

  // -----------------------------
  // Public API
  // -----------------------------
  return {
    terminalAirports,
    hasRoute,
    getAvailableDates
  };
}
