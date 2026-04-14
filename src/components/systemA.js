// systemA.js

import { useEffect, useState } from "react";
import { getHint } from "../hints/hint";

export default function SystemA({
  flights,
  allOrigins,
  allDestinations,
  tripType,
  flightFacts,
  logEvent,
  logFieldChange,
  onComplete
}) {
  // -----------------------------
  // Helpers
  // -----------------------------
  const emptyForm = () => ({
    origin: "",
    destination: "",
    departDate: "",
    returnDate: "",
    legs: [{ origin: "", destination: "", departDate: "" }]
  });

  const sameAirport = (a, b) => a && b && a === b;

  // -----------------------------
  // State
  // -----------------------------
  const [form, setForm] = useState(emptyForm());
  const [attempted, setAttempted] = useState(false);
  const [attemptResult, setAttemptResult] = useState(null);

  const [successfulItineraries, setSuccessfulItineraries] = useState({
    oneWay: null,
    roundTrip: null,
    multiCity: null
  });

  const [failureCounts, setFailureCounts] = useState({
    oneWay: 0,
    roundTrip: 0,
    multiCity: 0
  });

  const [currentHint, setCurrentHint] = useState(null);

  // -----------------------------
  // Reset transient state on trip type change
  // -----------------------------
  useEffect(() => {
    setForm(emptyForm());
    setAttempted(false);
    setAttemptResult(null);
    setCurrentHint(null);
  }, [tripType]);

  // -----------------------------
  // Multi city helpers
  // -----------------------------
  const updateLeg = (index, field, value) => {
    setForm(prev => {
      const legs = prev.legs.map((leg, i) => {
        if (i !== index) return { ...leg };

        if (field === "destination" && value === leg.origin) {
          return leg;
        }

        return {
          ...leg,
          [field]: value
        };
      });

      if (field === "destination" && legs[index + 1]) {
        legs[index + 1] = {
          ...legs[index + 1],
          origin: value
        };
      }

      return { ...prev, legs };
    });
  };

  const addLeg = () => {
    setForm(prev => {
      const last = prev.legs[prev.legs.length - 1];
      return {
        ...prev,
        legs: [
          ...prev.legs,
          {
            origin: last.destination || "",
            destination: "",
            departDate: ""
          }
        ]
      };
    });
  };

  const deleteLeg = index => {
    setForm(prev => {
      if (prev.legs.length === 1) return prev;
      const legs = prev.legs.filter((_, i) => i !== index);
      return { ...prev, legs };
    });
  };

  // -----------------------------
  // Submit logic
  // -----------------------------
  const submitSystemA = () => {
    logEvent("systemA", "submit_search", { ...form, tripType });
    setAttempted(true);

    let found = [];

    if (tripType === "oneWay") {
      if (
        !form.origin ||
        !form.destination ||
        !form.departDate ||
        sameAirport(form.origin, form.destination)
      ) {
        found = [];
      } else {
        found = flights.filter(
          f =>
            f.origin === form.origin &&
            f.destination === form.destination &&
            f.departDate === form.departDate
        );
      }
    }

    if (tripType === "roundTrip") {
      if (
        !form.origin ||
        !form.destination ||
        !form.departDate ||
        !form.returnDate ||
        sameAirport(form.origin, form.destination) ||
        new Date(form.returnDate) < new Date(form.departDate)
      ) {
        found = [];
      } else {
        const outbound = flights.filter(
          f =>
            f.origin === form.origin &&
            f.destination === form.destination &&
            f.departDate === form.departDate
        );

        const inbound = flights.filter(
          f =>
            f.origin === form.destination &&
            f.destination === form.origin &&
            f.departDate === form.returnDate
        );

        found =
          outbound.length && inbound.length
            ? [...outbound, ...inbound]
            : [];
      }
    }

    if (tripType === "multiCity") {
      const legs = form.legs;

      const valid = legs.every((leg, i) => {
        if (!leg.origin || !leg.destination || !leg.departDate) return false;
        if (leg.origin === leg.destination) return false;

        if (i > 0) {
          const prev = legs[i - 1];
          if (leg.origin !== prev.destination) return false;
          if (new Date(leg.departDate) < new Date(prev.departDate)) return false;
        }

        return flights.some(
          f =>
            f.origin === leg.origin &&
            f.destination === leg.destination &&
            f.departDate === leg.departDate
        );
      });

      found = valid ? legs : [];
    }

    setAttemptResult(found);

    if (found.length > 0) {
      setSuccessfulItineraries(prev => ({
        ...prev,
        [tripType]: found
      }));
      setCurrentHint(null);
    } else {
      const nextFailureCount = failureCounts[tripType] + 1;

      setFailureCounts(prev => ({
        ...prev,
        [tripType]: nextFailureCount
      }));

      const hint = getHint({
        tripType,
        failureCount: nextFailureCount,
        lastAttempt: form,
        flightFacts
      });

      if (hint) {
        setCurrentHint(hint);
        logEvent("systemA", "hint_shown", {
          tripType,
          hintType: hint.type,
          failureCount: nextFailureCount
        });
      }
    }

    logEvent(
      "systemA",
      found.length === 0 ? "zero_results" : "results_returned",
      { count: found.length }
    );
  };

  // -----------------------------
  // Reset search
  // -----------------------------
  const resetSearch = () => {
    logEvent("systemA", "reset_search", {
      tripType,
      hadSuccess: !!successfulItineraries[tripType]
    });

    setForm(emptyForm());
    setAttempted(false);
    setAttemptResult(null);
    setCurrentHint(null);
    setSuccessfulItineraries(prev => ({
      ...prev,
      [tripType]: null
    }));
  };

  // -----------------------------
  // Completion gate
  // -----------------------------
  const canContinue =
    successfulItineraries.oneWay &&
    successfulItineraries.roundTrip &&
    successfulItineraries.multiCity;

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <>
      <h1>System A: Flexible Search</h1>

      {tripType !== "multiCity" && (
        <>
          <label>
            Origin:
            <select
              value={form.origin}
              onChange={e =>
                setForm(prev => ({ ...prev, origin: e.target.value }))
              }
            >
              <option value="">Select origin</option>
              {allOrigins.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <br />

          <label>
            Destination:
            <select
              value={form.destination}
              onChange={e =>
                setForm(prev => ({ ...prev, destination: e.target.value }))
              }
            >
              <option value="">Select destination</option>
              {allDestinations
                .filter(d => d !== form.origin)
                .map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
            </select>
          </label>

          <br />

          <label>
            Departure Date:
            <input
              type="date"
              value={form.departDate}
              onChange={e =>
                setForm(prev => ({ ...prev, departDate: e.target.value }))
              }
            />
          </label>
        </>
      )}

      {tripType === "roundTrip" && (
        <>
          <br />
          <label>
            Return Date:
            <input
              type="date"
              min={form.departDate}
              value={form.returnDate}
              onChange={e =>
                setForm(prev => ({ ...prev, returnDate: e.target.value }))
              }
            />
          </label>
        </>
      )}

      {tripType === "multiCity" && (
        <>
          <h3>Flight Legs</h3>

          {form.legs.map((leg, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <select
                value={leg.origin}
                disabled={i > 0}
                onChange={e =>
                  updateLeg(i, "origin", e.target.value)
                }
              >
                {i === 0 ? (
                  <>
                    <option value="">Origin</option>
                    {allOrigins.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </>
                ) : (
                  <option value={leg.origin}>{leg.origin}</option>
                )}
              </select>

              <select
                value={leg.destination}
                onChange={e =>
                  updateLeg(i, "destination", e.target.value)
                }
              >
                <option value="">Destination</option>
                {allDestinations
                  .filter(d => d !== leg.origin)
                  .map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
              </select>

              <input
                type="date"
                min={i > 0 ? form.legs[i - 1].departDate : undefined}
                value={leg.departDate}
                onChange={e =>
                  updateLeg(i, "departDate", e.target.value)
                }
              />

              {i > 0 && (
                <button onClick={() => deleteLeg(i)}>
                  Remove
                </button>
              )}
            </div>
          ))}

          <button onClick={addLeg}>+ Add Leg</button>
        </>
      )}

      <br />

      <button onClick={submitSystemA}>Search</button>
      <button onClick={resetSearch} style={{ marginLeft: 8 }}>
        Reset Search
      </button>

      {attempted &&
        Array.isArray(attemptResult) &&
        attemptResult.length === 0 && (
          <p>No results found.</p>
        )}

      {currentHint && (
        <div style={{ marginTop: 12, color: "#555" }}>
          <strong>Hint:</strong> {currentHint.message}
        </div>
      )}

      {successfulItineraries[tripType] && (
        <ul>
          {successfulItineraries[tripType].map((leg, i) => (
            <li key={i}>
              {leg.origin} → {leg.destination} on {leg.departDate}
            </li>
          ))}
        </ul>
      )}

      {!canContinue && (
        <p style={{ color: "#666", marginTop: 8 }}>
          Complete One Way, Round Trip, and Multi City searches to proceed.
        </p>
      )}

      <button
        onClick={onComplete}
        disabled={!canContinue}
        style={{
          opacity: canContinue ? 1 : 0.5,
          cursor: canContinue ? "pointer" : "not-allowed"
        }}
      >
        Continue to System B
      </button>
    </>
  );
}