// tripTypeSelector.js

import { useEffect } from "react";

export default function TripTypeSelector({
  tripType,
  setTripType,
  logEvent
}) {
  // -----------------------------
  // Trip type change handler
  // -----------------------------
  const handleChange = (nextType) => {
    if (nextType === tripType) return;

    setTripType(nextType);

    logEvent("experiment", "trip_type_change", {
      tripType: nextType
    });
  };

  // -----------------------------
  // Log initial trip type on mount
  // -----------------------------
  useEffect(() => {
    logEvent("experiment", "trip_type_init", {
      tripType
    });
  }, [logEvent, tripType]);

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div style={{ marginBottom: "1rem" }}>
      <h2>Trip Type</h2>

      <button
        onClick={() => handleChange("oneWay")}
        style={{
          fontWeight: tripType === "oneWay" ? "bold" : "normal"
        }}
      >
        One-Way
      </button>

      <button
        onClick={() => handleChange("roundTrip")}
        style={{
          fontWeight: tripType === "roundTrip" ? "bold" : "normal"
        }}
      >
        Round-Trip
      </button>

      <button
        onClick={() => handleChange("multiCity")}
        style={{
          fontWeight: tripType === "multiCity" ? "bold" : "normal"
        }}
      >
        Multi-City
      </button>
    </div>
  );
}