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
The current code defines named PRADAM sessions in `window.SESSION_NAMES` and maps some of them to canonical `sequenceKey` values:

| Display/session value | `sequenceKey` | Notes |
|---|---|---|
| `Pre-training 1` | `screening` | Initial screening/pre-training task sequence |
| `Visit 1` | `visit1` | Visit 1 sequence |
| `Visit 2` | `visit2` | Visit 2 sequence |
| `Monitor Week 5` | `monitorWk5` | Monitoring sequence |
| `Monitor Week 25` | `monitorWk25` | Monitoring sequence |
| `baseline` | `baseline` | Questionnaire/session logic, no sequence file loaded by default |

Legacy URL values such as `screening`, `wk0`, `wk2`, `wk4`, `wk24`, and `wk28` may still appear in older docs or links, but the PRADAM pre-training path currently uses `session=Pre-training 1` and `task=screening`.

## Usage of the Session Variable
The `session` variable influences several aspects of the experiment:

### 1. Welcome Messages
Different welcome text is displayed depending on participant context and session:
- **Prolific context**: Displays a shorter single-page welcome for the study part.
- **`session === window.SESSION_NAMES.preTraining`**: Displays "Welcome to the first PRADAM training session!" and specific training-oriented instructions.
- **All other PRADAM sessions**: Display the standard PRADAM session welcome.

### 2. Task Inclusion Logic
The session determines which specific sub-tasks or extra modules are included within a primary task. The `run_full_experiment()` function contains the branching logic:

#### **Working Memory Task (`window.task === "wm"`)**
- Runs the core Working Memory procedure and WM test.
- The old session-gated Delay Discounting and Open Text additions are still visible in comments, but are not currently active.

#### **Questionnaires Task (`window.task === "quests"`)**
- Adds the questionnaire timeline selected in `questionnaires.js`.
- **Sessions `Visit 1` and `Visit 2`**:
    - Adds **Placebo Drug Guess** (`placebo_drug_timeline`) at the end of the questionnaires.
- Delay Discounting and Open Text are available through standalone `task=dd` and `task=open_text`, but are not currently prepended to `task=quests`.

#### **Screening Task (`window.task === "screening"`)**
- **All screening sessions**:
    - Includes **Max Press Rate** test.
    - Includes **PILT**, **Control**, and **Reversal** procedures.
    - Includes **Questionnaire** timeline.
    - The **Instruction Video** timeline exists but is currently commented out in `experiment.html`, so it does not run.

### 3. Sequence Loading
At the end of the script, the session value is used to dynamically load the corresponding sequence file:

```javascript
window.sequenceKey = window.SESSION_SEQUENCE_KEYS[window.session] || window.session;

if (["screening", "visit1", "visit2", "monitorWk5", "monitorWk25"].includes(window.sequenceKey)) {
    loadSequence(`sequences/trial1_${window.sequenceKey}_sequences.js`);
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
   if ([window.SESSION_NAMES.visit1, window.SESSION_NAMES.visit2].includes(window.session)) { ... }
   ```
2. Add your session constant or string to the array.
3. Ensure the task is wrapped in a `resumptionRule` check if you want it to support resuming from an interrupted state:
   ```javascript
   if (resumptionRule(order_list, window.last_state, "anchor_name")) {
       procedure = procedure.concat(your_task_timeline);
   }
   ```

### 3. Removing a Task from a Session
To remove a task, delete the session value from the relevant `.includes()` array, or remove the task block if it should no longer run for any session.

### 4. Updating Sequence Files
If you create a new session name (e.g., `Monitor Week 9`), you must:
1. Add it to `window.SESSION_NAMES`.
2. Add a mapping in `window.SESSION_SEQUENCE_KEYS` if its sequence/stimulus key differs from the display value.
3. Ensure a corresponding sequence file exists, such as `sequences/trial1_monitorWk9_sequences.js`.
4. Add the new sequence key to the loader at the bottom of `experiment.html`:
   ```javascript
   if (["screening", ..., "monitorWk9"].includes(window.sequenceKey)) {
       loadSequence(`sequences/trial1_${window.sequenceKey}_sequences.js`);
   }
   ```

## Sequence Files (`sequences/trial1_[sequenceKey]_sequences.js`)

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
