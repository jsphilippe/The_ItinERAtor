// sus.js
//
// System Usability Scale (SUS) component with additional open-ended questions.
//
// This component represents the *evaluative* phase of the experiment and is
// intentionally treated as an atomic form submission rather than an
// interactive surface.
//
// Key methodological decisions embodied here:
// - Intermediate survey interactions are not logged
// - Logging is explicitly suspended during SUS completion
// - SUS is submitted once, producing a single evaluative record
// - Raw item responses are preserved alongside computed scores
//
// These choices ensure that evaluative data is not contaminated by
// fine-grained interaction telemetry and that responses reflect participants'
// final judgments rather than transient edits.

import { useState, useEffect, useRef } from "react";

// Standard 10-item System Usability Scale statements.
// Items alternate between positive and negative framing as defined by SUS.
const SUS_QUESTIONS = [
  "I think that I would like to use this system frequently.",
  "I found the system unnecessarily complex.",
  "I thought the system was easy to use.",
  "I think that I would need the support of a technical person to be able to use this system.",
  "I found the various functions in this system were well integrated.",
  "I thought there was too much inconsistency in this system.",
  "I would imagine that most people would learn to use this system very quickly.",
  "I found the system very cumbersome to use.",
  "I felt very confident using the system.",
  "I needed to learn a lot of things before I could get going with this system.",
];

// Open-ended questions used to capture qualitative context.
// These allow participants to explain strategies, confusion, and perceptions
// that may not be fully reflected in Likert-scale responses.
const OPEN_ENDED_QUESTIONS = [
  {
    id: "frustration",
    question:
      "What (if anything) frustrated or slowed you down while using this system?",
  },
  {
    id: "ease",
    question: "What did you find easy or intuitive?",
  },
  {
    id: "confusion",
    question:
      "Was there anything you found confusing or unclear? Please explain.",
  },
  {
    id: "strategy",
    question:
      "How did you go about completing the tasks? (Briefly describe your approach)",
  },
  {
    id: "improvement",
    question: "If you could change one thing, what would it be?",
  },
];

// Compute SUS score using the standard scoring formula.
// Raw responses are transformed post-hoc; the formula is fixed and widely used.
function computeSUS(responses) {
  const adjusted = responses.map((r, i) => (i % 2 === 0 ? r - 1 : 5 - r));
  return adjusted.reduce((a, b) => a + b, 0) * 2.5;
}

export default function SUS({
  system,
  logEvent,
  updateSession,
  setLoggingEnabled,
  onComplete,
}) {
  // Stores Likert-scale responses for the standard SUS items.
  // Values are collected but not logged incrementally.
  const [responses, setResponses] = useState(
    Array(SUS_QUESTIONS.length).fill(null)
  );

  // Stores free-text responses for open-ended questions.
  // Keystrokes and intermediate edits are intentionally not logged.
  const [openResponses, setOpenResponses] = useState({});

  // Prevent duplicate phase-start logging (e.g., under React StrictMode).
  const hasLoggedStart = useRef(false);

  useEffect(() => {
    if (hasLoggedStart.current) return;
    hasLoggedStart.current = true;

    // Suspend interaction logging while SUS is active.
    // This prevents free-text survey input from contaminating behavioral logs.
    setLoggingEnabled(false);

    // Record the entry into the SUS phase at the experiment level.
    logEvent("experiment", "sus_started", { system });
  }, [system, logEvent, setLoggingEnabled]);

  // Update a Likert-scale response locally without emitting events.
  const updateResponse = (index, value) => {
    setResponses((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // Update an open-ended response locally without emitting events.
  const updateOpenResponse = (id, value) => {
    setOpenResponses((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Require all SUS items to be answered and at least one open-ended response.
  // This ensures that quantitative ratings are contextualized with
  // qualitative feedback.
  const allAnswered =
    responses.every((r) => r !== null) &&
    Object.values(openResponses).some((v) => v && v.trim() !== "");

  const submitSUS = () => {
    // Compute the SUS score at submission time using the standard formula.
    // The score is stored alongside raw responses for convenience and
    // reproducibility.
    const score = computeSUS(responses);

    // Store finalized SUS data atomically within the session object.
    // This avoids partial or incremental survey artifacts.
    updateSession((prev) => ({
      ...prev,
      [system]: {
        ...prev[system],
        sus: {
          responses,
          score,
          openEnded: openResponses,
          completedAt: new Date().toISOString(),
        },
      },
    }));

    // Re-enable interaction logging for subsequent phases.
    setLoggingEnabled(true);

    // Record survey completion as a single experiment-level event.
    logEvent("experiment", "sus_submitted", {
      system,
      score,
      responses,
      openEnded: openResponses,
    });

    onComplete();
  };

  return (
    <div>
      <h1>System Usability Scale</h1>

      <p>
        Please indicate how much you agree or disagree with each statement based
        on your overall experience with{" "}
        <strong>{system === "systemA" ? "System A" : "System B"}</strong>.
      </p>

      <p>
        There are no right or wrong answers. Please respond based on your
        immediate impression of the system.
      </p>

      {SUS_QUESTIONS.map((question, index) => (
        <div key={index} style={{ marginBottom: "1.75rem" }}>
          <p>
            <strong>{index + 1}.</strong> {question}
          </p>

          <table>
            <tbody>
              <tr>
                <td
                  style={{
                    paddingRight: "0.75rem",
                    fontSize: "0.8rem",
                    color: "#555",
                    whiteSpace: "nowrap",
                  }}
                >
                  Strongly Disagree
                </td>

                {[1, 2, 3, 4, 5].map((n) => (
                  <td
                    key={n}
                    style={{
                      textAlign: "center",
                      padding: "0 0.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    {n}
                  </td>
                ))}

                <td
                  style={{
                    paddingLeft: "0.75rem",
                    fontSize: "0.8rem",
                    color: "#555",
                    whiteSpace: "nowrap",
                  }}
                >
                  Strongly Agree
                </td>
              </tr>

              <tr>
                <td />
                {[1, 2, 3, 4, 5].map((value) => (
                  <td
                    key={value}
                    style={{ textAlign: "center", padding: "0 0.5rem" }}
                  >
                    <input
                      type="radio"
                      name={`sus-${index}`}
                      value={value}
                      checked={responses[index] === value}
                      onChange={() => updateResponse(index, value)}
                    />
                  </td>
                ))}
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      <h2 style={{ marginTop: "2rem" }}>Additional Feedback</h2>

      <p style={{ fontSize: "0.9rem", color: "#666" }}>
        Please answer at least one of the following questions.
      </p>

      {OPEN_ENDED_QUESTIONS.map((q) => (
        <div key={q.id} style={{ marginBottom: "1.5rem" }}>
          <p>
            <strong>{q.question}</strong>
          </p>
          <textarea
            rows={3}
            style={{ width: "100%", padding: "0.5rem" }}
            value={openResponses[q.id] || ""}
            onChange={(e) => updateOpenResponse(q.id, e.target.value)}
          />
        </div>
      ))}

      <button
        disabled={!allAnswered}
        onClick={submitSUS}
        style={{
          opacity: allAnswered ? 1 : 0.5,
          cursor: allAnswered ? "pointer" : "not-allowed",
        }}
      >
        Submit Survey
      </button>
    </div>
  );
}