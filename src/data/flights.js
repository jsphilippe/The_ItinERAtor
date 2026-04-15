// flights.js
// Dataset of flights with structured but dense route graph, designed for testing
// itinerary search systems under conditions of ambiguity and distractors.

function generateDateRange(minDate, maxDate) {
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
// (intentional ambiguity + overlap)
// -----------------------------
const routes = [
  // Hub: JFK
  { origin: "JFK", destination: "LAX", minDate: "2026-05-09", maxDate: "2026-05-11" },
  { origin: "JFK", destination: "SFO", minDate: "2026-05-10", maxDate: "2026-05-10" },
  { origin: "JFK", destination: "SEA", minDate: "2026-05-10", maxDate: "2026-05-10" },
  { origin: "JFK", destination: "ORD", minDate: "2026-06-01", maxDate: "2026-06-02" },

  // Hub: ORD (high ambiguity zone)
  { origin: "ORD", destination: "LAX", minDate: "2026-06-01", maxDate: "2026-06-05" },
  { origin: "ORD", destination: "SFO", minDate: "2026-06-03", maxDate: "2026-06-06" },
  { origin: "ORD", destination: "DEN", minDate: "2026-07-01", maxDate: "2026-07-03" },
  { origin: "ORD", destination: "ATL", minDate: "2026-06-02", maxDate: "2026-06-04" },

  // Hub: DEN
  { origin: "DEN", destination: "SFO", minDate: "2026-07-05", maxDate: "2026-07-07" },
  { origin: "DEN", destination: "LAX", minDate: "2026-07-06", maxDate: "2026-07-06" },
  { origin: "DEN", destination: "SEA", minDate: "2026-07-02", maxDate: "2026-07-04" },

  // Hub: West coast overlap
  { origin: "SFO", destination: "SEA", minDate: "2026-05-09", maxDate: "2026-05-12" },
  { origin: "SEA", destination: "DEN", minDate: "2026-05-10", maxDate: "2026-05-13" },

  // East/south loop ambiguity
  { origin: "ATL", destination: "DFW", minDate: "2026-06-01", maxDate: "2026-06-03" },
  { origin: "DFW", destination: "DEN", minDate: "2026-06-02", maxDate: "2026-06-05" },

  // distractor-heavy zone (critical for experiment validity)
  { origin: "BOS", destination: "MIA", minDate: "2026-05-10", maxDate: "2026-05-12" },
  { origin: "MIA", destination: "ATL", minDate: "2026-05-11", maxDate: "2026-05-13" }
];

// -----------------------------
// Expand into atomic flights
// -----------------------------
export const flights = routes.flatMap(route => {
  const dates = generateDateRange(route.minDate, route.maxDate);

  return dates.map(date => ({
    id: crypto.randomUUID(),
    origin: route.origin,
    destination: route.destination,
    departDate: date
  }));
});
