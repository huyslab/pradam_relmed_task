# Session Configuration in RELMED Task

This document summarizes how the `session` variable is handled in `experiment.html`.

## How the Session is Set
The `session` variable is retrieved from the URL query parameters using the `jsPsych.data.getURLVariable` function:

```javascript
window.session = jsPsych.data.getURLVariable('session');
```

It is also stored in the jsPsych data properties for tracking:

```javascript
jsPsych.data.addProperties({
    // ...
    session: window.session,
    // ...
});
```

## Available Sessions
Based on the logic in `experiment.html`, there are **6** specifically handled session values:

1.  **`screening`**: The initial training session.
2.  **`wk0`**: Week 0 session.
3.  **`wk2`**: Week 2 session.
4.  **`wk4`**: Week 4 session.
5.  **`wk24`**: Week 24 session.
6.  **`wk28`**: Week 28 session.

## Usage of the Session Variable
The `session` variable influences several aspects of the experiment:

### 1. Welcome Messages
Different welcome text is displayed depending on whether the session is `screening`, `wk0`, or others:
- **`screening`**: Displays "Welcome to the first RELMED training session!" and specific training-oriented instructions.
- **`wk0`**: Appends a specific warning: "Please read the instructions carefully. They may differ from the training session." to the standard RELMED session message.
- **All other sessions**: Display the standard "Thank you for taking part in this RELMED session!" message.

### 2. Task Inclusion Logic
The session determines which specific sub-tasks or extra modules are included within a primary task. The `run_full_experiment()` function contains the branching logic:

#### **Working Memory Task (`window.task === "wm"`)**
- **Sessions `wk24`, `wk28`**: 
    - Adds **Delay Discounting** (`dd_timeline`).
    - Adds **Open Text** (`openTextTimeline`).
- **All other sessions**: Only the core Working Memory and test procedures are included.

#### **Questionnaires Task (`window.task === "quests"`)**
- **Sessions `wk0`, `wk2`, `wk4`**: 
    - Adds **Delay Discounting** (`dd_timeline`).
    - Adds **Open Text** (`openTextTimeline`).
- **Sessions `wk2`, `wk4`**: 
    - Adds **Placebo Drug Guess** (`placebo_drug_timeline`) at the end of the questionnaires.

#### **Screening Task (`window.task === "screening"`)**
- **All screening sessions**:
    - Includes **Instruction Video** (if context is `pradam`).
    - Includes **Max Press Rate** test.
    - Includes **PILT**, **Control**, and **Reversal** procedures.
    - Includes **Questionnaire** timeline.

### 3. Sequence Loading
At the end of the script, the session value is used to dynamically load the corresponding sequence file:

```javascript
if (["wk0", "wk2", "wk4", "wk24", "wk28", "screening"].includes(window.session)) {
    loadSequence(`sequences/trial1_${window.session}_sequences.js`);
}
```
## How to Modify Session Configurations

To add or remove a sub-task from a specific session, you must modify the `run_full_experiment()` function within `experiment.html`.

### 1. Locating the Task Block
The experiment is organized by primary task (`window.task`). First, identify the code block for the task you want to modify (e.g., `if (window.task === "wm")` for Working Memory).

### 2. Adding a Task to a Session
To add an existing module (like `dd_timeline`) to a new session:
1. Find the conditional check for sessions, such as:
   ```javascript
   if (["wk24", "wk28"].includes(window.session)) { ... }
   ```
2. Add your session string to the array (e.g., `["wk24", "wk28", "wk2"]`).
3. Ensure the task is wrapped in a `resumptionRule` check if you want it to support resuming from an interrupted state:
   ```javascript
   if (resumptionRule(order_list, window.last_state, "anchor_name")) {
       procedure = procedure.concat(your_task_timeline);
   }
   ```

### 3. Removing a Task from a Session
To remove a task, simply delete the session string from the relevant `.includes()` array. For example, changing `["wk0", "wk2", "wk4"]` to `["wk0", "wk4"]` will remove the associated sub-tasks from session `wk2`.

### 4. Updating Sequence Files
If you create a new session name (e.g., `wk8`), you must:
1. Ensure a corresponding sequence file exists: `sequences/trial1_wk8_sequences.js`.
2. Add the new session name to the sequence loader at the bottom of `experiment.html`:
   ```javascript
   if (["wk0", ..., "wk8"].includes(window.session)) {
       loadSequence(`sequences/trial1_${window.session}_sequences.js`);
   }
   ```

## Sequence Files (`sequences/trial1_[session]_sequences.js`)

The sequence files are session-specific JavaScript files that contain pre-generated trial data. They ensure that all participants in a given session experience the same stimuli and reward schedules.

### Structure of a Sequence File
A sequence file typically defines several global constants containing stringified JSON data:

- **`PILT_json`**: Main sequences for the Probabilistic Instrumental Learning Task.
- **`PILT_test_json`**: Cross-block test pairs for the PILT.
- **`WM_json` / `WM_test_json`**: Sequences for the Working Memory modules.
- **`reversal_json`**: Trial sequences for the Reversal learning task.

#### **JSON Schema**
Each constant is an **array of arrays**, where each inner array represents a **block** of trials. Each trial object contains specific parameters:

```json
{
  "trial": 1,
  "block": 1,
  "stimulus_left": "iceskate_1.jpg",
  "stimulus_right": "paint_1.jpg",
  "feedback_left": 1.0,
  "feedback_right": 0.01,
  "optimal_right": false,
  "valence": 1.0,
  "EV_left": 1.0,
  "EV_right": 0.01
}
```

### How Sequences are Utilized
1. **Dynamic Loading**: `experiment.html` identifies the session from the URL and uses `loadSequence()` to inject the corresponding script into the page before starting the experiment.
2. **Global Availability**: Once the script is loaded, constants like `PILT_json` become globally accessible.
3. **Task Initialization**:
   - Tasks (e.g., in `PILT.js`) check for the existence of these constants:
     ```javascript
     let PILT_structure = typeof PILT_json !== "undefined" ? JSON.parse(PILT_json) : null;
     ```
   - If present, the task uses `jsPsych.timelineVariable` to map the JSON fields to the trial properties.
4. **Timeline Construction**: The `build_PILT_task()` and `build_post_PILT_test()` functions iterate through the JSON blocks to programmatically construct the jsPsych timeline for that session.
