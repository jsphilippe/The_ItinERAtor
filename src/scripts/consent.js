// consent.js
//
// Component responsible for presenting the research consent form and
// recording participant consent decisions.
//
// This component serves two critical purposes:
// 1. Ensuring informed consent before any experimental interaction begins
// 2. Establishing an auditable record of consent-related actions without
//    collecting personally identifiable information
//
// Consent interactions are logged symmetrically for both System A and System B
// so that all participant actions prior to system interaction are captured
// consistently, regardless of later system order.

import { useState } from "react";

export default function Consent({ onAccept, onDecline, logEvent }) {
  // Tracks whether the participant has acknowledged the consent statement.
  // Progression to the experiment is disabled until consent is explicitly given.
  const [checked, setChecked] = useState(false);

  return (
    <div>
      <h1>Research Consent</h1>

      <p>
        You are invited to participate in a usability research study conducted
        as part of the CS 546: Human‑Computer Interaction course at Worcester
        Polytechnic Institute. This study evaluates experimental flight search
        interface designs developed for an academic project called The
        ItinERAter.
      </p>

      <p>
        The purpose of this study is to evaluate the design of the system, not
        to evaluate you as a participant. During the session, you will complete
        several flight search tasks using two different interface designs,
        followed by a short usability questionnaire.
      </p>

      <p>
        <strong>What to expect:</strong> You will complete three flight search
        tasks and then answer a brief 10‑question usability survey known as the
        System Usability Scale (SUS). Some tasks may feel confusing,
        inefficient, or difficult. This is intentional and expected. Please
        interact with the system as naturally as you would if you were using a
        real flight booking website.
      </p>

      <p>
        <strong>Data and privacy:</strong> Your interactions with the interface,
        including clicks, selections, timing data, and survey responses, will be
        recorded anonymously in JSON log files. No names, contact information,
        or other personally identifiable data are collected. All data will be
        used solely for academic research and course evaluation purposes.
      </p>

      <p>
        Participation in this study is completely voluntary. You may stop
        participating at any time by closing your browser window, without
        penalty or negative consequence. The entire session is expected to take
        approximately 10 to 20 minutes.
      </p>

      <p>
        If you have questions about this study or how your data will be used,
        you may contact the student research team at:
      </p>

      <p>
        <strong>
          Jacques Philippe: jphilippe@wpi.edu
          <br />
          Kenneth Doan: kmdoan@wpi.edu
          <br />
          Jonathan Golden: jegolden@wpi.edu
        </strong>
      </p>

      <p>
        By proceeding, you confirm that you understand the nature of the study
        and consent to the anonymous use of your interaction data for research
        purposes.
      </p>

      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            const value = e.target.checked;
            setChecked(value);

            // Log consent checkbox interaction for both systems.
            // This ensures that pre-task interaction history is
            // symmetric and complete regardless of later system order.
            logEvent("systemA", "consent_checkbox", { value });
            logEvent("systemB", "consent_checkbox", { value });
          }}
        />
        I have read and agree to participate in this study
      </label>

      <br />
      <br />

      <button
        disabled={!checked}
        onClick={() => {
          const timestamp = performance.now();

          // Record explicit consent with a timestamp.
          // Consent is logged before any system interaction begins,
          // providing an auditable boundary for experimental data.
          logEvent("systemA", "consent_given", { timestamp });
          logEvent("systemB", "consent_given", { timestamp });
          onAccept();
        }}
      >
        Continue
      </button>

      <br />
      <br />

      <button
        onClick={() => {
          // Record consent refusal symmetrically for completeness.
          // No further interaction data is recorded after decline.
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
