// tripTypeSelector.js
//
// Component responsible for selecting the active itinerary type
// (one-way, round-trip, multi-city).
//
// Although visually simple, this component plays an important role in
// coordinating task context across the experiment. Changes to trip type
// affect which constraints are active, which validation rules apply,
// and which interaction patterns are logged.
//
// Trip type events are logged at the experiment level rather than the
// system level so that shifts in task context can be aligned and compared
// across System A and System B.

import { useEffect, useRef } from "react";

export default function TripTypeSelector({ tripType, setTripType, logEvent }) {
  // Guard to prevent duplicate initialization logging.
  //
  // This is necessary because React StrictMode may invoke effects multiple
  // times in development. The ref ensures that the initial trip type is
  // logged exactly once per session.
  const hasLoggedInit = useRef(false);

  // -----------------------------
  // Initial trip type logging
  // -----------------------------
  // Records the initial task context when the selector first mounts.
  // This establishes a baseline for later trip type changes and ensures
  // that all subsequent behavior can be interpreted in light of the
  // starting itinerary type.
  useEffect(() => {
    if (hasLoggedInit.current) return;
    hasLoggedInit.current = true;

    logEvent("experiment", "trip_type_init", { tripType });
  }, [logEvent, tripType]);

  // -----------------------------
  // Trip type change handler
  // -----------------------------
  // Updates shared trip type state and records the change.
  //
  // Logging at the experiment level makes it possible to analyze when and
  // how participants switch task strategies, independent of which system
  // they are currently using.
  const handleChange = (nextType) => {
    if (nextType === tripType) return;

    setTripType(nextType);
    logEvent("experiment", "trip_type_change", { tripType: nextType });
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <h2>Trip Type</h2>

      <button
        onClick={() => handleChange("oneWay")}
        style={{ fontWeight: tripType === "oneWay" ? "bold" : "normal" }}
      >
        One‑Way
      </button>

      <button
        onClick={() => handleChange("roundTrip")}
        style={{ fontWeight: tripType === "roundTrip" ? "bold" : "normal" }}
      >
        Round‑Trip
      </button>

      <button
        onClick={() => handleChange("multiCity")}
        style={{ fontWeight: tripType === "multiCity" ? "bold" : "normal" }}
      >
        Multi‑City
      </button>
    </div>
  );
}
