# State Management & Checkpoint Resumption

How the task receives state on load, persists it during execution, and resumes from a checkpoint.

---

## 1. State Initialization via URL Parameters

All state is injected through URL query parameters when `experiment.html` loads (`experiment.html:59-69`):

| URL Parameter | Window Variable | Type | Purpose |
|---|---|---|---|
| `participant_id` | `window.participantID` | string | Unique participant identifier; also determines `context` |
| `session` | `window.session` | string | Session type: `screening`, `wk0`, `wk2`, `wk4`, `wk24`, `wk28` |
| *(derived)* | `window.sessionKey` | string | Normalized session key used for stimulus folder paths (`pre-training` → `screening`) |
| `task` | `window.task` | string | Task module: `pilt-to-test`, `wm`, `quests`, `reversal`, `control`, `vigour`, `pit`, `dd`, `screening` |
| `state` | `window.last_state` | string | **Resumption checkpoint** — the last checkpoint reached; `"none"` on first visit |
| `session_state` | `window.session_state` | object | JSON-encoded cross-module data: cumulative bonus per task, safe-coin frequencies |
| `azure_PID` | `window.azurePID` | string | Azure participant ID |

Additionally:
- `window.debug` — derived; `true` if `participantID` contains `"debug"` or `"TST"`
- `window.demo` — derived; `true` if `participantID` contains `"DEMO"` or `"STAF"`
- `window.pause_resume_events` — initialized as `[]`; populated by parent `postMessage` events

**Example URL:**
```
experiment.html?participant_id=PRADAM_001&session=wk0&task=quests&state=PHQ9_start&session_state=%7B%22quests%22%3A%7B%22earned%22%3A2.5%7D%7D
```

After parsing, `jsPsych.data.addProperties()` (`experiment.html:75-83`) attaches `participant_id`, `session`, `task`, `version`, and warning counters to every subsequent trial record.

---

## 2. Checkpoint Emission During the Task

### `updateState(state, save_data = true)` — `utils.js:244-258`

Every task module emits checkpoints by calling `updateState()` at critical moments (typically in `on_finish` or `on_start` hooks):

```javascript
function updateState(state, save_data = true) {
    if (!state.includes("no_resume") && save_data) {
        saveDataREDCap();          // upload all trial data to REDCap
    }
    postToParent({ state: state }); // notify parent window
}
```

**Two effects per checkpoint:**

1. **Data upload** — calls `saveDataREDCap()` which packages all jsPsych trial data and interaction events, then sends them via `postToParent()` to the parent PRADAM portal, which relays the upload to REDCap.

2. **State notification** — sends `{ state: "<checkpoint>" }` to the parent window. The parent stores this value and passes it back as `?state=<checkpoint>` the next time this module is loaded.

### Checkpoint naming conventions

| Pattern | Data saved? | Resume point? | Usage |
|---|---|---|---|
| Normal (e.g., `pilt_task_start`) | Yes | Yes | Standard resumption checkpoints |
| `no_resume_*` (e.g., `no_resume_10_minutes`) | **No** | **No** | Signals to parent without saving (e.g., vigour 10-minute duration flag) |

### Where checkpoints are emitted (key examples)

| Checkpoint | File | Approx. line |
|---|---|---|
| `video_start`, `video_end` | `instruction_video_playback.js` | 57–69 |
| `max_press_rate_start` | various | — |
| `dd_instructions_start`, `dd_task_start` | `discounting.js` | 87, 94 |
| `pilt_task_start`, `pilt_block_N_start`, `pilt_last_block_start` | `PILT.js` | 527–568 |
| `no_resume_10_minutes`, `vigour_task_start` | `vigour.js` | 409–410 |
| `pit_task_start` | `PIT.js` | 177–178 |
| `wm_task_start`, `wm_block_N_start`, `wm_test_task_start` | PILT/WM | — |
| `bonus_trial_end` | `utils.js` | ~1109 |
| All questionnaire starts (`PHQ9_start`, `GAD7_start`, etc.) | questionnaire files | — |

---

## 3. Cross-Module Session State

`window.session_state` is a plain object that survives across separate task-module loads within the same session. It is passed as a JSON-encoded URL parameter and updated by calling `postToParent({ session_state: JSON.stringify(...) })`.

### Tracked fields

| Key | Type | Updated by | Purpose |
|---|---|---|---|
| `"safe"` | frequency-map object | `updateSafeFun()` in `utils.js:547-575` | Cumulative safe-coin outcome frequencies across modules (used for bonus calculation) |
| `"<task>"` (e.g., `"pit"`, `"vigour"`) | `{ earned, min, max }` | `updateBonusState()` in `utils.js:990-1034` | Cumulative bonus earned per task module across reloads |

These are updated mid-task and on task completion, ensuring the parent window always has the latest cumulative values to carry into the next module URL.

---

## 4. Checkpoint Resumption Logic

### 4.1 Canonical Order Arrays — `resumption.js:29-97`

Each task has a predefined ordered list of checkpoint strings representing its full execution sequence. These are the ground truth for "what should have been completed before what."

```javascript
// abridged examples
let pilt_to_test_order = [
    "prepilt_conditioning_start",
    "pavlovian_lottery_last",
    "pilt_instructions_start",
    "pilt_task_start",
    "pilt_block_1_start",
    // ... pilt_block_2 through pilt_block_20 ...
    "pilt_last_block_start",
    "vigour_instructions_start",
    "vigour_task_start",
    "pit_instructions_start",
    "pit_task_start",
    "vigour_test_task_start",
    "pilt_test_instructions_start",
    "pilt_test_task_start",
    "bonus_trial_end"
];

let quests_order = [
    "dd_task_start",
    "open_text_task_start",
    "quests_start",
    "PHQ9_start",
    "GAD7_start",
    // ... other questionnaires ...
    "BFI_start",
    "placebo_drug_guess",
    "placebo_drug_confidence"
];
```

`no_resume_*` checkpoints are **excluded** from these arrays — they are never resumption points.

### 4.2 The Resumption Rule — `resumption.js:9-27`

```javascript
function resumptionRule(order, last_state, task) {
    if (last_state === "none") return true;   // first visit: run everything

    const taskIndex      = order.indexOf(task);
    const lastStateIndex = order.indexOf(last_state);

    // Run this task only if the last checkpoint is BEFORE it in the order
    return lastStateIndex < taskIndex;
}
```

- Returns `true` → add this task segment to the jsPsych procedure (run it)
- Returns `false` → skip it (already completed)

### 4.3 Applied During Task Routing — `experiment.html:298-808`

Inside `run_full_experiment()`, each task block conditionally includes sub-timelines:

```javascript
if (window.task === "pilt-to-test") {
    // Show resumption message if returning mid-task
    if (window.last_state !== "none" && window.context === "pradam") {
        procedure.push(resumption_msg);
    }

    // Each segment guarded by resumptionRule
    if (resumptionRule(pilt_to_test_order, window.last_state, "pavlovian_lottery_last")) {
        procedure = procedure.concat(initPavlovianLottery());
    }
    if (resumptionRule(pilt_to_test_order, window.last_state, "pilt_task_start")) {
        procedure = procedure.concat(pilt_timeline);
    }
    // ... and so on for vigour, pit, test phases, bonus
}
```

---

## 5. End-to-End Resumption Flow

**Scenario:** Participant completes PILT blocks (last checkpoint `pilt_last_block_start`), closes the browser, and returns later.

```
1. Parent window stores:  state = "pilt_last_block_start"

2. Participant reopens URL:
   experiment.html?...&state=pilt_last_block_start&task=pilt-to-test&session=wk0

3. experiment.html parses:
   window.last_state = "pilt_last_block_start"

4. run_full_experiment() builds the procedure:
   resumptionRule(order, "pilt_last_block_start", "pilt_task_start")
     → lastStateIndex(30) >= taskIndex(3)  → false  → SKIP (already done)

   resumptionRule(order, "pilt_last_block_start", "vigour_task_start")
     → lastStateIndex(30) < taskIndex(34)  → true   → ADD vigour

   resumptionRule(order, "pilt_last_block_start", "pit_task_start")
     → lastStateIndex(30) < taskIndex(36)  → true   → ADD pit

   (and so on for test phases and bonus)

5. jsPsych.run(procedure) → starts from Vigour

6. Each completed segment emits updateState("vigour_task_start") etc.
   → data saved to REDCap
   → parent window updates stored state
```

---

## 6. Communication with Parent Window — `utils.js:207-242`

All state updates go through `postToParent()`, which sends a `postMessage` to the embedding iframe/window:

```javascript
function postToParent(message) {
    window.parent.postMessage(message, "*");
}
```

The parent window (PRADAM portal) listens for these messages and:
- Stores the latest `state` checkpoint
- Stores the latest `session_state` JSON
- Relays data uploads to REDCap

On next module load, the parent constructs the new URL with the stored `state` and `session_state` values embedded as query parameters.

Pause/resume events from the parent arrive via the reverse channel (`experiment.html:736-758`) and are buffered in `window.pause_resume_events`.

---

## 7. Data Upload — `saveDataREDCap()` — `utils.js:261-363`

Called automatically by every non-`no_resume` checkpoint. Packages:

| Field | Content |
|---|---|
| `record_id` | `participantID + "_" + module_start_time` |
| `participant_id` | `window.participantID` |
| `session` | `window.session` |
| `module` | `window.task` |
| `data` | JSON array of `{ interaction_data, jspsych_data }` (stimulus text excluded) |

In PRADAM context, the upload is relayed through `postToParent()` to the portal. Prolific direct-upload is not yet implemented.

---

## 8. Quick Reference: Key Files

| Concern | File | Lines |
|---|---|---|
| URL param parsing & init | `experiment.html` | 59–83 |
| Task routing & resumption guards | `experiment.html` | 298–808 |
| Resumption rule function | `resumption.js` | 9–27 |
| Checkpoint order arrays | `resumption.js` | 29–97 |
| `updateState()` (checkpoint emission) | `utils.js` | 244–258 |
| `postToParent()` | `utils.js` | 207–242 |
| `saveDataREDCap()` | `utils.js` | 261–363 |
| `updateSafeFun()` / safe-coin state | `utils.js` | 547–575 |
| `updateBonusState()` | `utils.js` | 990–1034 |
| Pause/resume event listener | `experiment.html` | 736–758 |
