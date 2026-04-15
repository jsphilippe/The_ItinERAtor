// tripTypeSelector.js
// Component for selecting trip type (one‑way, round‑trip, multi‑city) with event logging.

import { useEffect, useRef } from "react";

export default function TripTypeSelector({ tripType, setTripType, logEvent }) {
  // Guard to prevent duplicate init logging (e.g., React StrictMode)
  const hasLoggedInit = useRef(false);

  // Log initial trip type exactly once
  useEffect(() => {
    if (hasLoggedInit.current) return;
    hasLoggedInit.current = true;

    logEvent("experiment", "trip_type_init", { tripType });
  }, [logEvent, tripType]);

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
