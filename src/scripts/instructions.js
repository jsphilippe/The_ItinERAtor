// instructions.js

export default function Instructions({
  onBegin,
  logEvent,
  conditionOrder
}) {
  return (
    <div>
      <h1>Instructions</h1>

      <p>
        In this study, you will complete a series of flight search tasks
        using two different systems.
      </p>

      <p>
        Your goal is to find valid flights that satisfy the task requirements.
        Work as quickly and accurately as possible.
      </p>

      <p>
        All interactions (clicks, selections, timing) will be recorded.
      </p>

      <p>
        You will begin with <strong>System A</strong>, then switch to System B.
      </p>

      <button
        onClick={() => {
          logEvent("systemA", "instructions_begin");
          logEvent("systemB", "instructions_begin");

          onBegin();
        }}
      >
        Begin Experiment
      </button>
    </div>
  );
}