# Delay Discounting (DD) Task

**Implementation file:** [discounting.js](../discounting.js)

---

## Overview

The DD task presents 27 binary monetary choice questions drawn from the **Monetary Choice Questionnaire (MCQ)** format. On each trial, the participant chooses between a smaller reward available immediately and a larger reward available after a delay. All stimuli are hypothetical and denominated in GBP (£).

---

## Experimental Flow

```
dd_instructions (2 pages)
        ↓
Trial 1 of 27   ──→  [no-response warning, if applicable]
        ↓
Trial 2 of 27   ──→  [no-response warning, if applicable]
        ↓
        …
        ↓
Trial 27 of 27
```

### 1. Instructions

| Property | Value |
|---|---|
| Plugin | `jsPsychInstructions` |
| Pages | 2 |
| Navigation | Clickable prev / next buttons |
| `trialphase` marker | `"dd_instructions"` |

**Page 1 text:**
> On each turn of the first task, you'll see two hypothetical options for winning money. Each time, just pick the one you prefer.

**Page 2 text:**
> For each of the next 27 choices, please indicate which reward you would prefer: the smaller reward today, or the larger reward in the specified number of days.

On finish, `dd_n_warnings` is initialised to `0` in the global jsPsych data properties, and the session state is updated to `"dd_task_start"`.

### 2. Main Task Trials

| Property | Value |
|---|---|
| Plugin | `jsPsychHtmlButtonResponse` |
| Stimulus text | `"Would you prefer:"` |
| Button count | 2 |
| Button enable delay | 300 ms |
| Response deadline (standard) | `window.default_response_deadline` (4 000 ms in PRADAM; 3 000 ms in Prolific) |
| Response deadline (extended) | `window.default_long_response_deadline` (6 000 ms) |
| Post-trial gap | 200 ms |
| `trialphase` marker | `"dd_task"` |

The extended deadline is used when the participant has already received the maximum number of no-response warnings for this task (see Warning System below).

**Button labels** are formatted as:
- Left button (index 0): `£{today}\ntoday`
- Right button (index 1): `£{later}\nin {delay} days`

---

## Trial Parameters

All 27 choice pairs are fixed and presented in the order below. There is no adaptive procedure.

| # | Immediate (£, today) | Delayed (£) | Delay (days) |
|---|---|---|---|
| 1 | 54 | 55 | 117 |
| 2 | 55 | 75 | 61 |
| 3 | 19 | 25 | 53 |
| 4 | 31 | 85 | 7 |
| 5 | 14 | 25 | 19 |
| 6 | 47 | 50 | 160 |
| 7 | 15 | 35 | 13 |
| 8 | 25 | 60 | 14 |
| 9 | 78 | 80 | 162 |
| 10 | 40 | 55 | 62 |
| 11 | 11 | 30 | 7 |
| 12 | 67 | 75 | 119 |
| 13 | 34 | 35 | 186 |
| 14 | 27 | 50 | 21 |
| 15 | 69 | 85 | 91 |
| 16 | 49 | 60 | 89 |
| 17 | 80 | 85 | 157 |
| 18 | 24 | 35 | 29 |
| 19 | 33 | 80 | 14 |
| 20 | 28 | 30 | 179 |
| 21 | 34 | 50 | 30 |
| 22 | 25 | 30 | 80 |
| 23 | 41 | 75 | 20 |
| 24 | 54 | 60 | 111 |
| 25 | 54 | 80 | 30 |
| 26 | 22 | 25 | 136 |
| 27 | 20 | 55 | 7 |

**Stimulus range summary:**

| Parameter | Min | Max |
|---|---|---|
| Immediate amount | £11 | £80 |
| Delayed amount | £25 | £85 |
| Delay | 7 days | 186 days |

---

## No-Response Warning System

If the participant does not respond within the trial deadline, `data.response` is `null`. The trial is followed by a `noChoiceWarning` screen:

- Message: *"Didn't catch a response – moving on"*
- Duration: 800 ms

The warning is only shown when `can_be_warned("dd")` returns `true`, which requires:
- `dd_n_warnings` < `window.max_warnings_per_task` (default 3)
- No warning was already shown on the immediately preceding trial

Each missed response also increments the global `n_warnings` counter. If `n_warnings` reaches `window.maxWarnings` (15), the participant is removed from the session.

---

## Data Output

One row is written per trial (plus one row per warning screen, if triggered).

| Field | Type | Description |
|---|---|---|
| `sum_today` | number | Immediate reward amount (£) |
| `sum_later` | number | Delayed reward amount (£) |
| `delay` | number | Delay in days |
| `trialphase` | string | Always `"dd_task"` |
| `response` | 0 \| 1 \| null | Button index chosen; `null` = no response |
| `chosen_later` | boolean \| null | `true` if delayed option chosen; `null` if no response |
| `rt` | number | Response time in ms (jsPsych default) |
| `dd_n_warnings` | number | Cumulative no-response count for this task |
| `n_warnings` | number | Global no-response count across all tasks |

---

## Session Routing

The DD task appears in three different task bundles:

| `task` parameter | Sessions included |
|---|---|
| `"dd"` | Standalone DD-only run |
| `"wm"` (Working Memory module) | `wk24`, `wk28` |
| `"quests"` (Questionnaire battery) | `wk0`, `wk2`, `wk4` |

Within `quests_order`, DD is the first task after the initial state. Within `wm_order`, DD is positioned between working memory test trials and the open-text instructions. Resumption logic (`resumption.js`) skips the DD block if the participant already completed it before a session interruption.
