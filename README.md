# The ItinERAtor

The ItinERAtor is a research prototype that compares flexible and constraint-aware interfaces for airline itinerary construction.

The project is designed for human-computer interaction and decision-support studies, focusing on how constraint visibility, feedback, and enforcement influence user behavior, error patterns, and learning.

---

## Overview

ItinERAtor presents participants with two contrasting itinerary construction systems:

- **System A: Flexible Search**  
  Users are allowed to explore freely, including attempting invalid itineraries. Constraints are discovered through feedback and, after repeated failure, abstract hints.

- **System B: Guided Search**  
  Users are guided step by step and can only select options that are valid given the underlying data. Constraints are enforced directly rather than explained.

Participants must successfully construct:

- one-way itineraries  
- round-trip itineraries  
- multi-city itineraries  

in each system before completing the experiment.

The goal of the project is to study how users reason about constraints and adapt their strategies when constraints are implicit versus explicit.

---

## Experimental Design

The application implements a within-subjects comparison between two interaction paradigms.

### System A: Flexible Search

- Invalid actions are permitted
- Errors are surfaced after submission
- Constraints are inferred through interaction
- Progressive hints reveal abstract constraints after repeated failure
- Encourages exploration and hypothesis testing

### System B: Guided Search

- Only valid options are selectable
- Choices are constrained by the dataset at every step
- Uses date pickers and filtered selections to prevent invalid input
- Eliminates trial-and-error exploration
- Emphasizes constraint awareness over discovery

Both systems operate on the same underlying dataset so that differences in behavior can be attributed to interface design rather than task content.

---

## Data and Constraints

Flight availability is defined in a static dataset (`flights.js`).  
All constraints are derived programmatically from this dataset, including:

- route availability
- valid departure dates
- terminal airports with no outbound flights
- return feasibility for round-trip itineraries
- multi-city leg continuity and temporal ordering

No real airline data or live booking systems are used.

---

## Hints

Hints are used only in System A and follow these principles:

- Hints appear only after repeated failed attempts
- Hints reveal constraints, not solutions
- Hints are derived from the dataset, not hard-coded rules
- Hint specificity increases based on the type of violated constraint

Examples of constraints revealed include:

- date availability limits
- lack of return routes
- terminal airports in multi-city trips

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

At the end of the experiment, participants download a JSON file containing the full session log. This JSON file serves as the authoritative, lossless record of participant interaction. No data is automatically transmitted or stored by the application.

Derived artifacts, including System Usability Scale (SUS) reports and PDF summaries, are generated offline from the downloaded JSON files during analysis. The application itself does not generate PDFs or perform SUS scoring.

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
