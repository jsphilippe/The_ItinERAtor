// consent.js
import { useState } from "react";

export default function Consent({ onAccept, onDecline, logEvent }) {
  const [checked, setChecked] = useState(false);

  return (
    <div>
      <h1>Research Consent</h1>

      <p>
        You are participating in a research study on flight search behavior.
        Your interactions will be recorded anonymously, including clicks,
        selections, and timing data. No personally identifiable information
        will be collected.
      </p>

      <p>
        You may withdraw at any time by closing the browser. By proceeding,
        you consent to the use of your data for research purposes.
      </p>

      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            const value = e.target.checked;
            setChecked(value);

            logEvent("systemA", "consent_checkbox", { value });
            logEvent("systemB", "consent_checkbox", { value });
          }}
        />
        I have read and agree to participate
      </label>

      <br /><br />

      <button
        disabled={!checked}
        onClick={() => {
          const timestamp = performance.now();

          logEvent("systemA", "consent_given", { timestamp });
          logEvent("systemB", "consent_given", { timestamp });

          onAccept();
        }}
      >
        Continue
      </button>

      <br /><br />

      <button
        onClick={() => {
          logEvent("systemA", "consent_declined");
          logEvent("systemB", "consent_declined");

          onDecline();
        }}
      >
        Decline
      </button>
    </div>
  );
}