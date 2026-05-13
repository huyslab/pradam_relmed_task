# Procedure End Flow

This document explains what happens when a jsPsych procedure finishes: how the task sends a completion signal to the parent page and how trial data is persisted.

---

## The final two trials

At the end of every procedure, `run_full_experiment()` ([experiment.html:711](../experiment.html#L711)) appends `end_experiment_msgs`:

```
[Instructions page] → "Thank you…" message, participant clicks Next
        ↓
[HtmlKeyboardResponse] trialphase: "data_upload"
        on_start: end_experiment()   ← this is where everything fires
```

The second trial never awaits a keypress — it just displays "Uploading data…" and immediately runs `end_experiment` in `on_start`.

---

## `end_experiment()` — [utils.js:367](../utils.js#L367)

```js
function end_experiment() {
    window.removeEventListener('beforeunload', preventRefresh); // allow tab close
    saveDataREDCap(10, { message: "endTask" });                 // pradam & prolific
    // prolific only: callback → redirect to Prolific completion URL
}
```

Two things happen:

1. The page-leave guard is removed so the browser won't show "Are you sure?" when redirected.
2. `saveDataREDCap` is called with `retry = 10` and an extra field `message: "endTask"`. That field is how the parent portal knows the task is fully complete (as opposed to an intermediate save).

---

## `saveDataREDCap()` — [utils.js:261](../utils.js#L261)

Assembles and ships the payload:

```js
const combined_data = JSON.stringify([{
    interaction_data: jsPsych.data.getInteractionData().json(),
    jspsych_data:     jsPsych.data.get().ignore('stimulus').json()
}]);

const data_message = {
    data: {
        record_id:          participantID + "_" + module_start_time,
        participant_id:     participantID,
        sitting_start_time: module_start_time,
        session:            session,
        module:             task,
        data:               combined_data
    },
    ...extra_fields   // e.g. { message: "endTask" }
};
```

Then it calls `postToParent(data_message, fallback)`. On failure the fallback retries with exponential backoff (1 s, 2 s, 4 s … up to `retry` attempts).

- In **localhost** dev mode the save is skipped entirely and only `console.log` fires.
- `window.context === "prolific"` raises an error (Prolific path is currently disabled).

---

## `postToParent()` — [utils.js:207](../utils.js#L207)

```js
window.parent.postMessage(message, parentUrl);
```

The `<iframe>` is hosted inside the PRADAM portal. `postMessage` sends a structured JS object to the portal's listener. Allowed origins are validated before sending:

- `http://localhost:3000`
- `https://pradam.org`
- `https://www.pradam.org`
- `https://beta.pradam.org`

If the origin check fails or `window.parent` is unavailable the `fallback` callback is invoked instead.

---

## Message types the parent receives

| Field in message | When | Meaning |
|---|---|---|
| `{ data: {...} }` | Every `saveDataREDCap()` call | Trial data snapshot; portal writes to REDCap |
| `{ data: {...}, message: "endTask" }` | Final `end_experiment()` call | Task fully complete; portal can mark session done |
| `{ state: "checkpoint_name" }` | Every `updateState()` call | Resumption checkpoint; portal stores for next load |
| `{ session_state: "..." }` | `updateSafeFun()` | Safe (coin lottery) state update |
| `{ bonus: value }` | Bonus trial `on_finish` | Bonus amount to display in portal |

---

## Intermediate saves during the task

Data is also saved at every `updateState()` call (unless the state name contains `"no_resume"`). This means the portal holds an up-to-date snapshot throughout the session, not just at the end. See [checkpoints.md](checkpoints.md) for the full checkpoint system.

---

## Emergency save on tab close

```js
on_close: () => { saveDataREDCap() }   // experiment.html:51
```

If the participant closes the tab mid-task, jsPsych fires `on_close` and attempts one last data save. This is the last-resort path with `retry = 1` and no `"endTask"` message, so the portal will not mark the session as complete.
