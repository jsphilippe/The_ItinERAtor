// systemB.js

import { useEffect, useMemo, useState } from "react";

export default function SystemB({
  flights,
  tripType,
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

  // -----------------------------
  // State
  // -----------------------------
  const [form, setForm] = useState(emptyForm());

  const [successfulItineraries, setSuccessfulItineraries] = useState({
    oneWay: null,
    roundTrip: null,
    multiCity: null
  });

  const [firstSuccessTime, setFirstSuccessTime] = useState(null);

  // -----------------------------
  // Reset on trip type change
  // -----------------------------
  useEffect(() => {
    setForm(emptyForm());
  }, [tripType]);

  // -----------------------------
  // Preloaded viable origins
  // -----------------------------
  const viableOrigins = useMemo(() => {
    if (tripType === "roundTrip") {
      return [
        ...new Set(
          flights
            .filter(f =>
              flights.some(
                r =>
                  r.origin === f.destination &&
                  r.destination === f.origin
              )
            )
            .map(f => f.origin)
        )
      ];
    }

    return [...new Set(flights.map(f => f.origin))];
  }, [flights, tripType]);

  // -----------------------------
  // Preloaded viable destinations
  // -----------------------------
  const viableDestinations = useMemo(() => {
    if (!form.origin) return [];

    if (tripType === "oneWay") {
      return [
        ...new Set(
          flights
            .filter(f => f.origin === form.origin)
            .map(f => f.destination)
        )
      ];
    }

    if (tripType === "roundTrip") {
      return [
        ...new Set(
          flights
            .filter(f => f.origin === form.origin)
            .map(f => f.destination)
            .filter(dest => {
              const outboundDates = flights
                .filter(
                  f =>
                    f.origin === form.origin &&
                    f.destination === dest
                )
                .map(f => f.departDate);

              const inboundDates = flights
                .filter(
                  f =>
                    f.origin === dest &&
                    f.destination === form.origin
                )
                .map(f => f.departDate);

              return outboundDates.some(d =>
                inboundDates.some(r => new Date(r) >= new Date(d))
              );
            })
        )
      ];
    }

    if (tripType === "multiCity") {
      return [
        ...new Set(
          flights
            .filter(f => f.origin === form.origin)
            .map(f => f.destination)
            .filter(dest =>
              flights.some(next => next.origin === dest)
            )
        )
      ];
    }

    return [];
  }, [flights, form.origin, tripType]);

  // -----------------------------
  // Viable departure dates (one way and round trip)
  // -----------------------------
  const viableDepartDates = useMemo(() => {
    if (!form.origin || !form.destination) return [];
    return [
      ...new Set(
        flights
          .filter(
            f =>
              f.origin === form.origin &&
              f.destination === form.destination
          )
          .map(f => f.departDate)
      )
    ];
  }, [flights, form.origin, form.destination]);

  const departBounds = useMemo(() => {
    if (viableDepartDates.length === 0) return { min: "", max: "" };
    const sorted = [...viableDepartDates].sort();
    return { min: sorted[0], max: sorted[sorted.length - 1] };
  }, [viableDepartDates]);

  // -----------------------------
  // Viable return dates
  // -----------------------------
  const viableReturnDates = useMemo(() => {
    if (
      tripType !== "roundTrip" ||
      !form.origin ||
      !form.destination ||
      !form.departDate
    ) {
      return [];
    }

    return [
      ...new Set(
        flights
          .filter(
            f =>
              f.origin === form.destination &&
              f.destination === form.origin &&
              new Date(f.departDate) >= new Date(form.departDate)
          )
          .map(f => f.departDate)
      )
    ];
  }, [flights, form, tripType]);

  const returnBounds = useMemo(() => {
    if (viableReturnDates.length === 0) return { min: "", max: "" };
    const sorted = [...viableReturnDates].sort();
    return { min: sorted[0], max: sorted[sorted.length - 1] };
  }, [viableReturnDates]);

  // -----------------------------
  // Multi city helpers
  // -----------------------------
  const updateLeg = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      legs: prev.legs.map((leg, i) =>
        i === index ? { ...leg, [field]: value } : leg
      )
    }));
  };

  const addLeg = () => {
    setForm(prev => {
      const last = prev.legs[prev.legs.length - 1];
      return {
        ...prev,
        legs: [
          ...prev.legs,
          { origin: last.destination || "", destination: "", departDate: "" }
        ]
      };
    });
  };

  const deleteLeg = index => {
    setForm(prev => ({
      ...prev,
      legs:
        prev.legs.length > 1
          ? prev.legs.filter((_, i) => i !== index)
          : prev.legs
    }));
  };

  // -----------------------------
  // Submit logic
  // -----------------------------
  const submitSystemB = () => {
    logEvent("systemB", "submit_search", { ...form, tripType });

    let found = [];

    if (tripType === "oneWay") {
      found = flights.filter(
        f =>
          f.origin === form.origin &&
          f.destination === form.destination &&
          f.departDate === form.departDate
      );
    }

    if (tripType === "roundTrip") {
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

    if (tripType === "multiCity") {
      const valid = form.legs.every((leg, i) => {
        if (!leg.origin || !leg.destination || !leg.departDate) return false;

        if (i > 0) {
          const prev = form.legs[i - 1];
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

      found = valid ? form.legs : [];
    }

    if (found.length > 0) {
      if (!firstSuccessTime) {
        const time = performance.now();
        setFirstSuccessTime(time);
        logEvent("systemB", "first_success", { tripType, time });
      }

      setSuccessfulItineraries(prev => ({
        ...prev,
        [tripType]: found
      }));
    }
  };

  // -----------------------------
  // Reset search
  // -----------------------------
  const resetSearch = () => {
    logEvent("systemB", "reset_search", {
      tripType,
      hadSuccess: !!successfulItineraries[tripType]
    });

    setForm(emptyForm());
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
      <h1>System B: Guided Search</h1>

      {tripType === "multiCity" && (
        <>
          <h3>Flight Legs</h3>

          {form.legs.map((leg, i) => {
            const legDates =
              leg.origin && leg.destination
                ? [
                    ...new Set(
                      flights
                        .filter(
                          f =>
                            f.origin === leg.origin &&
                            f.destination === leg.destination
                        )
                        .map(f => f.departDate)
                    )
                  ]
                : [];

            const bounds =
              legDates.length === 0
                ? { min: "", max: "" }
                : {
                    min: legDates.sort()[0],
                    max: legDates.sort()[legDates.length - 1]
                  };

            const previousDate =
              i > 0 ? form.legs[i - 1].departDate : null;

            const effectiveMin =
              previousDate && bounds.min
                ? previousDate > bounds.min
                  ? previousDate
                  : bounds.min
                : bounds.min;

            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <select
                  value={leg.origin}
                  disabled={i > 0}
                  onChange={e =>
                    updateLeg(i, "origin", e.target.value)
                  }
                >
                  <option value="">Origin</option>
                  {viableOrigins.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>

                <select
                  value={leg.destination}
                  onChange={e =>
                    updateLeg(i, "destination", e.target.value)
                  }
                >
                  <option value="">Destination</option>
                  {[
                    ...new Set(
                      flights
                        .filter(f => f.origin === leg.origin)
                        .map(f => f.destination)
                    )
                  ]
                    .filter(dest =>
                      flights.some(next => next.origin === dest)
                    )
                    .map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                </select>

                <input
                  type="date"
                  min={effectiveMin}
                  max={bounds.max}
                  value={leg.departDate}
                  onChange={e => {
                    const value = e.target.value;
                    if (!legDates.includes(value)) return;
                    if (previousDate && value < previousDate) return;
                    updateLeg(i, "departDate", value);
                  }}
                />

                {i > 0 && (
                  <button onClick={() => deleteLeg(i)}>
                    Remove
                  </button>
                )}
              </div>
            );
          })}

          <button onClick={addLeg}>+ Add Leg</button>
        </>
      )}

      {tripType !== "multiCity" && (
        <>
          <label>
            Origin:
            <select
              value={form.origin}
              onChange={e => {
                logFieldChange("systemB", "origin", e.target.value, form.origin);
                setForm({
                  ...form,
                  origin: e.target.value,
                  destination: "",
                  departDate: "",
                  returnDate: ""
                });
              }}
            >
              <option value="">Select origin</option>
              {viableOrigins.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <br />

          <label>
            Destination:
            <select
              value={form.destination}
              disabled={!form.origin}
              onChange={e => {
                logFieldChange("systemB", "destination", e.target.value, form.destination);
                setForm({
                  ...form,
                  destination: e.target.value,
                  departDate: "",
                  returnDate: ""
                });
              }}
            >
              <option value="">Select destination</option>
              {viableDestinations.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>

          <br />

          <label>
            Departure Date:
            <input
              type="date"
              min={departBounds.min}
              max={departBounds.max}
              value={form.departDate}
              onChange={e => {
                const value = e.target.value;
                if (!viableDepartDates.includes(value)) return;
                logFieldChange("systemB", "departDate", value, form.departDate);
                setForm(prev => ({
                  ...prev,
                  departDate: value,
                  returnDate: ""
                }));
              }}
            />
          </label>

          {tripType === "roundTrip" && (
            <>
              <br />
              <label>
                Return Date:
                <input
                  type="date"
                  min={returnBounds.min}
                  max={returnBounds.max}
                  value={form.returnDate}
                  onChange={e => {
                    const value = e.target.value;
                    if (!viableReturnDates.includes(value)) return;
                    logFieldChange("systemB", "returnDate", value, form.returnDate);
                    setForm(prev => ({ ...prev, returnDate: value }));
                  }}
                />
              </label>
            </>
          )}
        </>
      )}

      <br />

      <button onClick={submitSystemB}>Search</button>
      <button onClick={resetSearch} style={{ marginLeft: 8 }}>
        Reset Search
      </button>

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
        <p style={{ color: "#666" }}>
          Complete One Way, Round Trip, and Multi City searches to proceed.
        </p>
      )}

      <button onClick={onComplete} disabled={!canContinue}>
        Finish Experiment
      </button>
    </>
  );
}