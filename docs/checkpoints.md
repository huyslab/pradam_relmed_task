# Checkpoints

Checkpoints are short string labels (e.g. `"pilt_task_start"`, `"video_end"`) that mark where a participant is in the experiment. They serve two purposes:

1. **Resumption** — if a session is interrupted, the last saved checkpoint tells the experiment exactly where to pick up, so the participant never has to repeat completed tasks.
2. **Triggering a data save** — by default, calling `updateState()` with a checkpoint also pushes all accumulated trial data to REDCap.

---

## How checkpoints are written

`updateState(state)` in [utils.js:244](../utils.js#L244) is called inside jsPsych `on_start` or `on_finish` hooks throughout the task modules (e.g. [instruction_video_playback.js:58](../instruction_video_playback.js#L58), [discounting.js:87](../discounting.js#L87), [vigour.js:410](../vigour.js#L410)). It does three things:

1. Calls `saveDataREDCap()` (unless the state name contains `"no_resume"`).
2. Logs the state string to the console.
3. Calls `postToParent({ state })` to send the checkpoint to the parent window (Prolific/PRADAM portal), which stores it and passes it back on next load as `?state=<checkpoint>`.

---

## How checkpoints are read on resumption

When the experiment loads, [experiment.html:62](../experiment.html#L62) reads the URL parameter:

```js
window.last_state = jsPsych.data.getURLVariable('state') || "none";
```

`"none"` means a first-time visit — all tasks run.

---

## The order arrays

Every session has an ordered array of checkpoint strings in [resumption.js](../resumption.js). These define the canonical sequence of the session:

| Array | Session / module |
|---|---|
| `pilt_to_test_order` | Main PILT → Vigour → PIT → Test pipeline |
| `screening_order` | Screening session (video → PILT → reversal → questionnaires) |
| `wm_order` | Working-memory session |
| `quests_order` | Standalone questionnaire battery |

---

## The resumption rule

`resumptionRule(order, last_state, task)` ([resumption.js:9](../resumption.js#L9)) returns `true` when `last_state` appears **before** `task` in the order array — meaning `task` has not yet been completed and should be added to the procedure. If `last_state === "none"` it always returns `true`.

```js
// Returns true if last_state appears before task → task should still run
function resumptionRule(order, last_state, task) {
    if (last_state === "none") return true;
    return order.indexOf(last_state) < order.indexOf(task);
}
```

In [experiment.html](../experiment.html) each task block is wrapped in this check, so only the remaining tasks are appended to the jsPsych procedure on resume.

---

## Special checkpoints

| Name pattern | Meaning |
|---|---|
| `no_resume` / `no_resume_*` | Sent to parent but **no data save** is triggered; used to signal that a task is not resumable (e.g. mid-vigour, mid-PIT) |
| `bonus_trial_end` | Last checkpoint in a pipeline; marks the session as fully complete |

`no_resume` checkpoints are filtered out of the data-save path in `updateState` ([utils.js:247](../utils.js#L247)) and are also excluded from the order arrays used by `resumptionRule`, so they do not affect where a participant resumes from.

---

## Adding a checkpoint

1. Call `updateState("my_task_start")` in the appropriate `on_start` / `on_finish` hook of the new task trial.
2. Insert `"my_task_start"` at the correct position in the relevant order array in [resumption.js](../resumption.js).
3. Wrap the task block in `experiment.html` (or the relevant module) with `resumptionRule(order, window.last_state, "my_task_start")`.
