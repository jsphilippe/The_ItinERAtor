// useSessionLogger.js
//
// Custom React hook for managing session state and logging interaction events
// across multiple logical systems (experiment, systemA, systemB).
//
// This hook serves as the single authoritative mechanism for recording
// interaction telemetry, timing data, and system lifecycle transitions.
//
// A critical design feature of this logger is the ability to temporarily
// suspend logging during evaluative phases (e.g., SUS) so that free-text
// survey input is not conflated with interaction behavior. This enables
// clean separation between behavioral data and evaluative data while
// preserving a single, coherent session record.

import { useState, useCallback } from "react";

export default function useSessionLogger(initialSession) {
  // Holds the full session object that will ultimately be exported.
  // This includes per-system event streams, timing metadata, and SUS results.
  const [session, setSession] = useState(() => initialSession);

  // -----------------------------
  // Logging gate
  // -----------------------------
  // Controls whether interaction events are recorded.
  //
  // Logging is normally enabled during all interactive phases, but can be
  // explicitly disabled by the application when entering survey or evaluation
  // stages. This prevents intermediate text edits and survey interaction
  // artifacts from contaminating behavioral logs.
  const [loggingEnabled, setLoggingEnabled] = useState(true);

  // -----------------------------
  // Core event logger
  // -----------------------------
  // Records a single event into the appropriate system stream.
  //
  // Events are timestamped using performance.now() so that relative timing
  // comparisons across phases and systems are meaningful independent of
  // wall-clock time.
  //
  // If logging is disabled, events are silently ignored by design.
  const logEvent = useCallback(
    (system, type, payload = {}) => {
      if (!loggingEnabled) return;

      const event = {
        system,
        type,
        payload,
        timestamp: performance.now(),
      };

      setSession((prev) => ({
        ...prev,
        [system]: {
          ...prev[system],
          events: [...prev[system].events, event],
        },
      }));
    },
    [loggingEnabled]
  );

  // -----------------------------
  // Field change logger
  // -----------------------------
  // Specialized helper for logging form field changes.
  //
  // This captures granular interaction behavior such as incremental input
  // revisions, which is particularly useful for analyzing exploration and
  // correction strategies in System A and guided progression in System B.
  const logFieldChange = useCallback(
    (system, field, value, prevValue) => {
      logEvent(system, "field_change", {
        field,
        value,
        prevValue,
      });
    },
    [logEvent]
  );

  // -----------------------------
  // System lifecycle helpers
  // -----------------------------
  // Record the entry and completion of each system.
  //
  // Start and end times are stored directly on the system object to support
  // duration analysis and visualization. Lifecycle events are also logged
  // explicitly so that timing data is visible both structurally and
  // in the event stream.
  const startSystem = useCallback(
    (system) => {
      setSession((prev) => ({
        ...prev,
        [system]: {
          ...prev[system],
          startTime: performance.now(),
        },
      }));

      logEvent(system, "system_start");
    },
    [logEvent]
  );

  const completeSystem = useCallback(
    (system) => {
      setSession((prev) => ({
        ...prev,
        [system]: {
          ...prev[system],
          endTime: performance.now(),
          completed: true,
        },
      }));

      logEvent(system, "system_complete");
    },
    [logEvent]
  );

  // -----------------------------
  // Direct session updater
  // -----------------------------
  // Provides controlled write access to the session object.
  //
  // This is used sparingly for cases where structured updates are required
  // outside the event stream, such as recording finalized SUS responses.
  const updateSession = useCallback((updaterFn) => {
    setSession((prev) => updaterFn(prev));
  }, []);

  // -----------------------------
  // Export API
  // -----------------------------
  // Exposes a minimal but explicit interface so that all session mutations
  // and logging behavior flow through this hook.
  return {
    session,
    setSession,
    logEvent,
    logFieldChange,
    startSystem,
    completeSystem,
    updateSession,
    setLoggingEnabled,
  };
}