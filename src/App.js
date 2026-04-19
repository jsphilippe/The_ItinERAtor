// App.js
// Main application component for the ItinERAtor experiment.
//
// This component orchestrates the entire experimental flow across phases
// (consent → instructions → System A → System B → SUS → completion).
// It also establishes the session-level logging structure used to support
// post-hoc behavioral and usability analysis.
//
// Importantly, App.js enforces clean phase boundaries so that interaction
// telemetry, evaluative data (SUS), and experimental metadata remain
// analytically separable.

import { useEffect, useState } from "react";

import Consent from "./scripts/consent";
import Instructions from "./scripts/instructions";
import SUS from "./scripts/sus";

import SystemA from "./components/systemA";
import SystemB from "./components/systemB";
import TripTypeSelector from "./components/tripTypeSelector";

import { flights } from "./data/flights";

import useSessionLogger from "./hooks/useSessionLogger";
import useTripValidation from "./hooks/useTripValidation";

import { analyzeFlights } from "./utils/hintUtils";

import JsonDispo from "./scripts/jsonDispo";

export default function App() {
  // -----------------------------
  // Phase control
  // -----------------------------
  // Controls which part of the experiment is currently active.
  // Phases are strictly sequential and mutually exclusive to prevent
  // overlap between interaction logging, system usage, and survey collection
  const [phase, setPhase] = useState("consent");

  // -----------------------------
  // Trip type
  // -----------------------------
  // Tracks the currently active itinerary type (one-way, round-trip, multi-city).
  // This state is shared across systems so that both System A and System B
  // are exercised over identical task categories.
  const [tripType, setTripType] = useState("oneWay");

  // -----------------------------
  // Initial session
  // -----------------------------
  // Defines the complete shape of the session log.
  // All interaction data, timing data, and SUS responses are stored locally
  // in this object and ultimately exported as a single JSON artifact.
  //
  // System A and System B intentionally share the same schema so that
  // differences in behavior can be attributed to interface design rather
  // than differences in data representation
  const initialSession = {
    participantId: crypto.randomUUID(),
    meta: {
      createdAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      condition: "oneWay",
    },
    experiment: {
      events: [],
    },
    systemA: {
      startTime: null,
      endTime: null,
      completed: false,
      events: [],
      sus: null,
    },
    systemB: {
      startTime: null,
      endTime: null,
      completed: false,
      events: [],
      sus: null,
    },
  };

  // -----------------------------
  // Session logger
  // -----------------------------
  // Centralized logging hook that records all interaction telemetry.
  //
  // The logging gate (setLoggingEnabled) allows logging to be temporarily
  // suspended during evaluative phases (e.g., SUS) so that free-text
  // survey input does not contaminate behavioral interaction logs.
  const {
    session,
    logEvent,
    logFieldChange,
    startSystem,
    completeSystem,
    updateSession,
    setLoggingEnabled
  } = useSessionLogger(initialSession);

  // -----------------------------
  // Validation hook
  // -----------------------------
  // Shared validation logic derived from the same flight dataset.
  // Using the same validator for both systems ensures that differences
  // in user experience arise from interface design rather than logic changes.
  const { validateTrip } = useTripValidation(flights);

  // -----------------------------
  // Navigation lock
  // -----------------------------
  // Prevents browser back navigation during the experiment.
  // This preserves experimental integrity by avoiding partial sessions,
  // skipped phases, or corrupted timing data.
  useEffect(() => {
    window.history.pushState({ locked: true }, "", window.location.pathname);

    const handlePopState = () => {
      window.history.pushState({ locked: true }, "", window.location.pathname);
      logEvent("experiment", "browser_navigation_attempt");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [logEvent]);

  // -----------------------------
  // Derived data
  // -----------------------------
  // Pre-compute shared aggregates and constraint facts from the dataset.
  // These are passed into systems as read-only inputs to avoid
  // duplication and to keep constraint logic centralized.
  const allOrigins = [...new Set(flights.map((f) => f.origin))];
  const allDestinations = [...new Set(flights.map((f) => f.destination))];
  const flightFacts = analyzeFlights(flights);

  // -----------------------------
  // Start timing when systems mount
  // -----------------------------
  // Records per-system start times when the corresponding phase is entered.
  // Timing is measured using performance.now() so that relative durations
  // can be compared across participants independently of wall-clock time.
  useEffect(() => {
    if (phase === "systemA" && session.systemA.startTime === null) {
      startSystem("systemA");
    }

    if (phase === "systemB" && session.systemB.startTime === null) {
      startSystem("systemB");
    }
  }, [phase, session, startSystem]);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      {/* CONSENT */}
      {/* Establishes informed consent before any logging begins */}
      {phase === "consent" && (
        <Consent
          logEvent={logEvent}
          onAccept={() => setPhase("instructions")}
          onDecline={() => alert("You must consent to participate.")}
        />
      )}

      {/* INSTRUCTIONS */}
      {/* Provides task framing and ensures a consistent mental baseline */}
      {phase === "instructions" && (
        <Instructions logEvent={logEvent} onBegin={() => setPhase("systemA")} />
      )}

      {/* SYSTEM A */}
      {/* Flexible interface where constraints are inferred through interaction */}
      {phase === "systemA" && (
        <>
          <TripTypeSelector
            tripType={tripType}
            setTripType={setTripType}
            logEvent={logEvent}
          />

          <hr />

          <SystemA
            flights={flights}
            allOrigins={allOrigins}
            allDestinations={allDestinations}
            tripType={tripType}
            flightFacts={flightFacts}
            logEvent={logEvent}
            logFieldChange={logFieldChange}
            validateTrip={validateTrip}
            onComplete={() => {
              completeSystem("systemA");
              setTripType("oneWay");
              setPhase("systemB");
            }}
          />
        </>
      )}

      {/* SYSTEM B */}
      {/* Guided interface where constraints are enforced proactively */}
      {phase === "systemB" && (
        <>
          <TripTypeSelector
            tripType={tripType}
            setTripType={setTripType}
            logEvent={logEvent}
          />

          <hr />

          <SystemB
            flights={flights}
            tripType={tripType}
            logEvent={logEvent}
            logFieldChange={logFieldChange}
            validateTrip={validateTrip}
            onComplete={() => {
              completeSystem("systemB");
              setPhase("susA");
            }}
          />
        </>
      )}

      {/* SUS FOR SYSTEM A */}
      {/* Evaluative phase: logging is suspended to preserve survey integrity */}
      {phase === "susA" && (
        <SUS
          system="systemA"
          logEvent={logEvent}
          updateSession={updateSession}
          setLoggingEnabled={setLoggingEnabled}
          onComplete={() => setPhase("susB")}
        />
      )}

      {/* SUS FOR SYSTEM B */}
      {/* Identical evaluative treatment ensures comparability */}
      {phase === "susB" && (
        <SUS
          system="systemB"
          logEvent={logEvent}
          updateSession={updateSession}
          setLoggingEnabled={setLoggingEnabled}
          onComplete={() => setPhase("complete")}
        />
      )}

      {/* POST-STUDY DATA DISPOSITION */}
      {/* Participants manually download their session data for submission */}
      {phase === "complete" && <JsonDispo session={session} />}
    </div>
  );
}