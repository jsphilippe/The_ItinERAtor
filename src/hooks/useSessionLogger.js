// useSessionLogger.js
// Custom React hook for managing session state and logging events across different systems (e.g., experiment, systemA, systemB).
// Provides a structured API for logging field changes, system lifecycle events, and direct session updates.

import { useState, useCallback } from "react";

export default function useSessionLogger(initialSession) {
  const [session, setSession] = useState(() => initialSession);

  // -----------------------------
  // Core event logger
  // -----------------------------
  const logEvent = useCallback((system, type, payload = {}) => {
    const event = {
      system,
      type,
      payload,
      timestamp: performance.now()
    };

    setSession(prev => ({
      ...prev,
      [system]: {
        ...prev[system],
        events: [...prev[system].events, event]
      }
    }));
  }, []);

  // -----------------------------
  // Field change logger
  // -----------------------------
  const logFieldChange = useCallback((system, field, value, prevValue) => {
    logEvent(system, "field_change", {
      field,
      value,
      prevValue
    });
  }, [logEvent]);

  // -----------------------------
  // System lifecycle helpers
  // -----------------------------
  const startSystem = useCallback((system) => {
    setSession(prev => ({
      ...prev,
      [system]: {
        ...prev[system],
        startTime: performance.now()
      }
    }));

    logEvent(system, "system_start");
  }, [logEvent]);

  const completeSystem = useCallback((system) => {
    setSession(prev => ({
      ...prev,
      [system]: {
        ...prev[system],
        endTime: performance.now(),
        completed: true
      }
    }));

    logEvent(system, "system_complete");
  }, [logEvent]);

  // -----------------------------
  // Direct session updater (rare use)
  // -----------------------------
  const updateSession = useCallback((updaterFn) => {
    setSession(prev => updaterFn(prev));
  }, []);

  // -----------------------------
  // Export API
  // -----------------------------
  return {
    session,
    setSession,
    logEvent,
    logFieldChange,
    startSystem,
    completeSystem,
    updateSession
  };
}
