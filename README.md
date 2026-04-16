# The ItinERAtor

The ItinERAtor is a research prototype that compares flexible and constraint-aware interfaces for airline itinerary construction.

The project is designed for human-computer interaction and decision-support studies, focusing on how constraint visibility, feedback, and enforcement influence user behavior, error patterns, and learning during complex, multi-step tasks.

---

## Overview

ItinERAtor presents participants with two contrasting itinerary construction systems that expose constraints in fundamentally different ways.

- **System A: Flexible Search**  
  Users are allowed to explore freely, including attempting invalid itineraries. Some constraints are reflected indirectly through interface affordances such as adaptive date ranges, but these guardrails are advisory rather than outcome enforcing. Constraints are primarily discovered through interaction, submission feedback, and abstract hints after repeated failure.

- **System B: Guided Search**  
  Users are guided step by step and can only select options that participate in at least one valid itinerary given the underlying data. Constraints are enforced compositionally by the interface, ensuring that every reachable state corresponds to a feasible itinerary rather than validating user input after the fact.

Participants must successfully construct:

- one-way itineraries  
- round-trip itineraries  
- multi-city itineraries  

in each system before completing the experiment.

The goal of the project is to study how users reason about constraints and adapt their strategies when constraints are implicit or softly suggested versus explicitly enforced.

---

## Experimental Design

The application implements a within-subjects comparison between two interaction paradigms operating over the same task domain and dataset.

### System A: Flexible Search

- Invalid actions are permitted
- Some constraints are reflected as soft guardrails in the interface
- Errors are surfaced after submission
- Constraints are inferred through interaction and failure
- Progressive hints reveal abstract constraints after repeated unsuccessful attempts
- Hints explain constraints, not specific solutions
- Encourages exploration, hypothesis testing, and adaptation

Soft guardrails in System A shape available input ranges without guaranteeing success or preventing failure. For example, date pickers may adapt based on historical availability, but users can still select dates that result in zero outcomes or infeasible itineraries.

### System B: Guided Search

- Only valid options are selectable at every step
- Choices are constrained dynamically based on prior selections
- Uses filtered dropdowns and constrained date pickers to prevent invalid input
- Enforces constraints through forward-looking pruning of the state space
- Eliminates trial-and-error exploration
- Emphasizes constraint awareness through enforced correctness

System B ensures that every reachable state corresponds to a feasible itinerary supported by the dataset.

Both systems operate on the same underlying flight data so that observed differences in behavior can be attributed to interface design rather than task content.

---

## Constraint Representation

All constraints are derived programmatically from a static flight dataset and are not hard-coded as abstract rules.

The systems differ in how those constraints are exposed:

- In **System A**, constraints are primarily learned through interaction. Some constraints are reflected indirectly as advisory guardrails that shape input affordances without enforcing correctness. Users can still construct invalid or incomplete itineraries.
- In **System B**, constraints are enforced directly by the interface. Invalid combinations are never presented as selectable options. This enforcement is achieved through dynamic constraint propagation that guarantees itinerary validity before submission rather than validating after user input.

This distinction allows the study of how users build mental models of system constraints when those constraints are discovered versus enforced.

---

## Data and Constraints

Flight availability is defined in a static dataset (`flights.js`).

Constraints derived from this dataset include:

- route availability  
- valid departure date ranges  
- terminal airports with no outbound flights  
- return feasibility for round-trip itineraries  
- multi-city leg continuity  
- temporal ordering across itinerary legs  

No real airline data or live booking systems are used.

---

## Hints

Hints are used exclusively in System A and follow these principles:

- Hints appear only after repeated failed attempts
- Hints describe violated constraints rather than providing direct answers
- Hints are derived dynamically from the dataset
- Hint specificity increases based on failure patterns and constraint type

Examples of revealed constraints include:

- limited date availability for specific routes  
- absence of return routes  
- terminal airports in multi-city itineraries  
- temporal ordering violations across legs  

System B does not provide hints. Instead, it prevents invalid actions from being taken.

---

## Data Collection and SUS Reporting

All data collection occurs entirely on the client side.

During interaction, the system logs:

- field changes  
- option presentation counts  
- failed and successful attempts  
- timing information  
- hint exposure events  

At the end of the experiment, participants download a JSON file containing the complete session log. This file serves as the authoritative, lossless record of interaction data. No information is automatically transmitted or stored by the application.

Derived artifacts, including System Usability Scale scores and PDF summaries, are generated offline from the downloaded JSON files during analysis. The application itself does not compute SUS scores or generate reports.

This separation preserves transparency, reproducibility, and compatibility with static hosting environments such as GitHub Pages.

---

## Technology Stack

- React  
- JavaScript (ES6)  
- Client-side state only  
- No backend server  
- Static hosting compatible  

---

## Running the Project Locally

To run the project locally:

```bash
npm install
npm start
