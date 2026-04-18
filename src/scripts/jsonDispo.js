// jsonDispo.js
//
// Component responsible for final data disposition after experiment completion.
//
// This component explicitly transfers control of the collected session data
// to the participant by requiring manual download and submission. No data is
// transmitted automatically, stored remotely, or processed server-side.
//
// This design serves three purposes:
// 1. Preserves participant agency and transparency
// 2. Ensures compatibility with static hosting environments
// 3. Produces a single, lossless artifact suitable for offline analysis

export default function JsonDispo({ session }) {
  // Generates a downloadable JSON file containing the complete session log.
  // The file includes interaction events, timing data, and finalized SUS
  // responses, but contains no personally identifiable information.
  const downloadSessionFile = () => {
    const blob = new Blob([JSON.stringify(session, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    // The filename encodes a participant identifier only.
    // No real-world identity information is included.
    link.href = url;
    link.download = `participant_${session.participantId}.json`;

    // Trigger the download programmatically and clean up immediately.
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1>Study Complete</h1>

      <p>
        Thank you for participating in this usability study. You have now
        completed all required tasks and surveys.
      </p>

      <p>
        Please download your anonymous session data file using the button below.
        This file contains your interaction logs and usability survey responses
        and does not include any personally identifiable information.
      </p>

      <p>
        After downloading the file, please submit it to the research team using
        one of the following methods:
      </p>

      <p>Email the file as an attachment to:</p>

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
        Once the file has been successfully submitted, no further action is
        required. You may close this browser window.
      </p>

      <button onClick={downloadSessionFile}>Download Session Data</button>
    </div>
  );
}
