// sus.js - Component for administering the System Usability Scale (SUS) questionnaire after each system interaction. Collects participant responses, computes the SUS score, and logs relevant events for analysis.

import { useState, useEffect, useRef } from "react";

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

function computeSUS(responses) {
  const adjusted = responses.map((r, i) => (i % 2 === 0 ? r - 1 : 5 - r));
  return adjusted.reduce((a, b) => a + b, 0) * 2.5;
}

export default function SUS({ system, logEvent, updateSession, onComplete }) {
  const [responses, setResponses] = useState(
    Array(SUS_QUESTIONS.length).fill(null)
  );

  const hasLoggedStart = useRef(false);

  useEffect(() => {
    if (hasLoggedStart.current) return;
    hasLoggedStart.current = true;
    logEvent("experiment", "sus_started", { system });
  }, [system, logEvent]);

  const updateResponse = (index, value) => {
    setResponses((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const allAnswered = responses.every((r) => r !== null);

  const submitSUS = () => {
    const score = computeSUS(responses);

    updateSession((prev) => ({
      ...prev,
      [system]: {
        ...prev[system],
        sus: {
          responses,
          score,
          completedAt: new Date().toISOString(),
        },
      },
    }));

    logEvent("experiment", "sus_submitted", {
      system,
      score,
      responses,
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
                    style={{
                      textAlign: "center",
                      padding: "0 0.5rem",
                    }}
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