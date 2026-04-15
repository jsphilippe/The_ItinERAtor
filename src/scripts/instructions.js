// instructions.js - Component for displaying the study instructions and handling the start of the study

export default function Instructions({ onBegin, logEvent }) {
  return (
    <div>
      <h1>Study Instructions</h1>

      <p>
        Thank you for agreeing to participate in this usability study. In this
        session, you will interact with two different flight search interfaces
        designed for academic research.
      </p>

      <p>
        Your goal is to explore each interface and attempt to find valid flight
        itineraries based on the tasks presented. There are no right or wrong
        answers. We are interested in how the system supports your decision
        making, not in how quickly or successfully you complete each task.
      </p>

      <p>
        As you work through the tasks, please interact with the interface as you
        naturally would if you were booking a real flight. If something is
        confusing, frustrating, or unexpectedly difficult, respond the way you
        normally would. You may retry searches, revise earlier choices, or
        explore alternatives as needed in order to complete each task.
      </p>

      <p>
        You will use two different systems, referred to as System A and System
        B. These systems present similar tasks in different ways. You do not
        need to remember anything from the first system to use the second.
        Please approach each system independently.
      </p>

      <p>
        After completing the tasks in both systems, you will be asked to
        complete a short 10‑question usability survey about your experience.
        Please answer these questions based on your overall impressions.
      </p>

      <p>
        There is no time limit. Based on the number and complexity of the tasks,
        the session is expected to take approximately 10 to 20 minutes. If you
        feel stuck at any point, continue experimenting until you are able to
        complete the task and proceed.
      </p>

      <p>When you are ready, click the button below to begin the study.</p>

      <button
        onClick={() => {
          logEvent("systemA", "instructions_begin");
          logEvent("systemB", "instructions_begin");
          onBegin();
        }}
      >
        Begin Study
      </button>
    </div>
  );
}