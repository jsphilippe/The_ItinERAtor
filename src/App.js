// App.js

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
  const [phase, setPhase] = useState("consent");

  // -----------------------------
  // Trip type
  // -----------------------------
  const [tripType, setTripType] = useState("oneWay");

  // -----------------------------
  // Initial session
  // -----------------------------
  const initialSession = {
    participantId: crypto.randomUUID(),
    meta: {
      createdAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      condition: "oneWay"
    },
    experiment: {
      events: []
    },
    systemA: {
      startTime: null,
      endTime: null,
      completed: false,
      events: [],
      sus: null
    },
    systemB: {
      startTime: null,
      endTime: null,
      completed: false,
      events: [],
      sus: null
    }
  };

  // -----------------------------
  // Session logger
  // -----------------------------
  const {
    session,
    logEvent,
    logFieldChange,
    startSystem,
    completeSystem,
    updateSession
  } = useSessionLogger(initialSession);

  // -----------------------------
  // Validation hook
  // -----------------------------
  const { validateTrip } = useTripValidation(flights);

  // -----------------------------
  // Navigation lock
  // -----------------------------
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
  const allOrigins = [...new Set(flights.map(f => f.origin))];
  const allDestinations = [...new Set(flights.map(f => f.destination))];
  const flightFacts = analyzeFlights(flights);

  // -----------------------------
  // Start timing when systems mount
  // -----------------------------
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
      {phase === "consent" && (
        <Consent
          logEvent={logEvent}
          onAccept={() => setPhase("instructions")}
          onDecline={() => alert("You must consent to participate.")}
        />
      )}

      {/* INSTRUCTIONS */}
      {phase === "instructions" && (
        <Instructions
          logEvent={logEvent}
          onBegin={() => setPhase("systemA")}
        />
      )}

      {/* SYSTEM A */}
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
      {phase === "susA" && (
        <SUS
          system="systemA"
          logEvent={logEvent}
          updateSession={updateSession}
          onComplete={() => setPhase("susB")}
        />
      )}

      {/* SUS FOR SYSTEM B */}
      {phase === "susB" && (
        <SUS
          system="systemB"
          logEvent={logEvent}
          updateSession={updateSession}
          onComplete={() => setPhase("complete")}
        />
      )}

      {/* POST-STUDY DATA DISPOSITION */}
      {phase === "complete" && (
        <JsonDispo session={session} />
      )}
    </div>
  );
}