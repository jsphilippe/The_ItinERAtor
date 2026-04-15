// jsonDispo.js
// Component for final session data download and submission instructions after experiment completion.
// Provides a button to download the session data as a JSON file, which participants can then submit to the research team.

export default function JsonDispo({ session }) {
  const downloadSessionFile = () => {
    const blob = new Blob([JSON.stringify(session, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `participant_${session.participantId}.json`;

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

      <p>
        Email the file as an attachment to:
      </p>

      <p>
        Jacques Philippe: jphilippe@wpi.edu
        <br />
        Kenneth Doan: kmdoan@wpi.edu
        <br />
        Jonathan Golden: jegolden@wpi.edu
      </p>

      <p>
        Once the file has been successfully submitted, no further action is
        required. You may close this browser window.
      </p>

      <button onClick={downloadSessionFile}>Download Session Data</button>
    </div>
  );
}
