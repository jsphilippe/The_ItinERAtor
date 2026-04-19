// flights.js
//
// Synthetic flight dataset used for the ItinERAtor experiment.
//
// This dataset is intentionally *constrained* and *structured* rather than
// exhaustive. Its purpose is not realism, but experimental control.
//
// By limiting route availability and date coverage while maintaining
// overlapping hubs and ambiguity, the dataset amplifies the impact of
// constraint visibility. This makes differences between flexible and
// constraint-aware interfaces observable without altering the underlying
// task structure.
//
// In real-world systems, large datasets can mask hidden constraints through
// incidental success. This dataset removes that redundancy so that users must
// reason about constraints rather than stumble into valid outcomes.

function generateDateRange(minDate, maxDate) {
  // Generate an inclusive range of ISO date strings.
  // Dates are expanded explicitly so that temporal constraints can be
  // reasoned about programmatically rather than inferred from range
  const dates = [];
  let current = new Date(minDate);
  const end = new Date(maxDate);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// -----------------------------
// Structured but dense route graph
// -----------------------------
// The route graph is designed to:
// - Contain multiple hubs with overlapping connectivity
// - Include asymmetries between outbound and return routes
// - Create terminal airports that act as dead-ends
// - Support multi-city paths with ordering constraints
// - Introduce distractors that appear plausible but are infeasible
//
// This structure ensures that invalid itineraries arise naturally from
// constraint interactions, not from arbitrary blocking.
const routes = [
  // Hub: JFK
  // Acts as a primary branching point with limited outbound dates.
  {
    origin: "JFK",
    destination: "LAX",
    minDate: "2026-05-09",
    maxDate: "2026-05-11",
  },
  {
    origin: "JFK",
    destination: "SFO",
    minDate: "2026-05-10",
    maxDate: "2026-05-10",
  },
  {
    origin: "JFK",
    destination: "SEA",
    minDate: "2026-05-10",
    maxDate: "2026-05-10",
  },
  {
    origin: "JFK",
    destination: "ORD",
    minDate: "2026-06-01",
    maxDate: "2026-06-02",
  },

  // Hub: ORD (high ambiguity zone)
  // Supports multiple outbound options with differing temporal overlap,
  // making round-trip feasibility difficult to infer without constraint awareness.
  {
    origin: "ORD",
    destination: "LAX",
    minDate: "2026-06-01",
    maxDate: "2026-06-05",
  },
  {
    origin: "ORD",
    destination: "SFO",
    minDate: "2026-06-03",
    maxDate: "2026-06-06",
  },
  {
    origin: "ORD",
    destination: "DEN",
    minDate: "2026-07-01",
    maxDate: "2026-07-03",
  },
  {
    origin: "ORD",
    destination: "ATL",
    minDate: "2026-06-02",
    maxDate: "2026-06-04",
  },

  // Hub: DEN
  // Introduces temporal separation between legs, especially relevant
  // for multi-city itinerary ordering.
  {
    origin: "DEN",
    destination: "SFO",
    minDate: "2026-07-05",
    maxDate: "2026-07-07",
  },
  {
    origin: "DEN",
    destination: "LAX",
    minDate: "2026-07-06",
    maxDate: "2026-07-06",
  },
  {
    origin: "DEN",
    destination: "SEA",
    minDate: "2026-07-02",
    maxDate: "2026-07-04",
  },

  // Hub: West coast overlap
  // Creates plausible but ordering-sensitive multi-city paths.
  {
    origin: "SFO",
    destination: "SEA",
    minDate: "2026-05-09",
    maxDate: "2026-05-12",
  },
  {
    origin: "SEA",
    destination: "DEN",
    minDate: "2026-05-10",
    maxDate: "2026-05-13",
  },

  // East/south loop ambiguity
  // Allows partial loops that appear valid but break under return or
  // temporal constraints.
  {
    origin: "ATL",
    destination: "DFW",
    minDate: "2026-06-01",
    maxDate: "2026-06-03",
  },
  {
    origin: "DFW",
    destination: "DEN",
    minDate: "2026-06-02",
    maxDate: "2026-06-05",
  },

  // Distractor-heavy zone
  // Routes that are locally valid but globally limiting, reinforcing
  // the need to reason about downstream consequences.
  {
    origin: "BOS",
    destination: "MIA",
    minDate: "2026-05-10",
    maxDate: "2026-05-12",
  },
  {
    origin: "MIA",
    destination: "ATL",
    minDate: "2026-05-11",
    maxDate: "2026-05-13",
  },
];

// -----------------------------
// Expand into atomic flights
// -----------------------------
// Each route definition is expanded into individual flight instances.
// This avoids implicit temporal ranges and ensures that all constraints
// emerge from concrete availability rather than hidden assumptions.
//
// The resulting dataset is static and deterministic across sessions,
// enabling consistent experimental conditions for all participants.
export const flights = routes.flatMap((route) => {
  const dates = generateDateRange(route.minDate, route.maxDate);

  return dates.map((date) => ({
    id: crypto.randomUUID(),
    origin: route.origin,
    destination: route.destination,
    departDate: date,
  }));
});