// consent.js - Component for displaying the research consent form and handling user consent

import { useState } from "react";

export default function Consent({ onAccept, onDecline, logEvent }) {
  const [checked, setChecked] = useState(false);

  return (
    <div>
      <h1>Research Consent</h1>

      <p>
        You are invited to participate in a usability research study conducted
        as part of the CSC 4xx: Human‑Computer Interaction course at Worcester
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
        What to expect: You will complete three flight search tasks and then
        answer a brief 10‑question usability survey known as the System
        Usability Scale (SUS). Some tasks may feel confusing, inefficient, or
        difficult. This is intentional and expected. Please interact with the
        system as naturally as you would if you were using a real flight booking
        website.
      </p>

      <p>
        Data and privacy: Your interactions with the interface, including
        clicks, selections, timing data, and survey responses, will be recorded
        anonymously in JSON log files. No names, contact information, or other
        personally identifiable data are collected. All data will be used solely
        for academic research and course evaluation purposes.
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
        Jacques Philippe: jphilippe@wpi.edu
        <br />
        Kenneth Doan: kmdoan@wpi.edu
        <br />
        Jonathan Golden: jegolden@wpi.edu
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