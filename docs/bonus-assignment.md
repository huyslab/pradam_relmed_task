# Bonus Assignment

This document describes how the bonus payment is computed for each task in the experiment.

---

## Overview

Each task computes a **raw bonus** as a proportion of the participant's performance relative to the theoretical minimum and maximum possible earnings. This proportion is then linearly mapped onto a monetary bonus range defined per task. Participants always receive at least **60%** of the maximum bonus.

---

## Per-Task Raw Bonus Computation

### Common Interface

Every task provides a function that returns an object with three fields:
- `earned` — actual cumulative earnings (sum of chosen/obtained reward values)
- `min` — theoretical minimum possible earnings (worst-case scenario)
- `max` — theoretical maximum possible earnings (best-case scenario)

These are dispatched by `getTaskBonusData(task)` in `utils.js:951`.

### 1. PILT (Probabilistic Instrumental Learning Task)

**File:** `PILT.js:594-625`

For each PILT trial with numeric feedback values:
- `max` = sum of the **highest** available feedback option on each trial
- `min` = sum of the **lowest** available feedback option on each trial
- `earned` = sum of `chosen_feedback` (the option the participant actually selected)

For 2-stimuli trials, the options are `feedback_left` and `feedback_right`. For 3-stimuli trials, `feedback_middle` is also included.

### 2. Vigour + PIT (Physical Effort / Pavlovian-Instrumental Transfer)

**File:** `PIT.js:274-308`

Computed for both `vigour_trial` and `pit_trial` phases and summed together:

- `earned` = last trial's `total_reward × 0.01` (pence → pounds)
- `min` = sum over all trials of `1 × magnitude × 0.01 / ratio` (assuming minimum effort: 1 press/trial)
- `max` = sum over all trials of `10 × (trial_duration_s) × (magnitude × 0.01 / ratio)` (assuming maximum effort: 10 presses/second)

The ratio and magnitude come from each trial's `timeline_variables`.

### 3. Reversal Learning

**File:** `reversal.js:174-189`

- `max` = number of reversal trials (best case: £1 on every trial)
- `min` = number of reversal trials × £0.01 (worst case: £0.01 on every trial)
- `earned` = sum of `chosen_feedback` across all reversal trials

### 4. Control (Ship Navigation)

**File:** `build_control_timeline.js:303-316`

- `earned` = sum of all `reward` values from `control_reward` trials
- `min` = 0
- `max` = sum of all `reward_number` values from the timeline variables (total possible reward)

---

## Task-to-Bonus Mapping

Defined in `getTaskBonusData()` at `utils.js:951-974`:

| `window.task`     | Raw bonus source                                            |
|-------------------|-------------------------------------------------------------|
| `pilt-to-test`    | `computeRelativePILTBonus()` + `computeRelativeVigourPITBonus()` |
| `reversal`        | `computeRelativeReversalBonus()`                            |
| `wm`              | `computeRelativePILTBonus()`                                |
| `control`         | `computeRelativeControlBonus()`                             |
| `vigour` (debug)  | `computeRelativeVigourPITBonus()`                           |
| `pit` (debug)     | `computeRelativeVigourPITBonus()`                           |
| default           | `{ earned: 0, min: 0, max: 0 }`                             |

---

## Monetary Bonus Calculation

### Standard Formula (PILT, WM, Reversal, PIT+Vigour)

Defined in `computeTotalBonus()` at `utils.js:1036-1077`:

```javascript
max_bonus = { "pilt-to-test": 2.45, "reversal": 0.5, "wm": 0.8, "control": 1.25 }[task]
min_bonus = max_bonus × 0.6
earned    = prevBonus.earned + taskBonus.earned
min       = prevBonus.min    + taskBonus.min
max       = prevBonus.max    + taskBonus.max
prop      = clamp((earned − min) / (max − min), 0, 1)
bonus     = prop × (max_bonus − min_bonus) + min_bonus
```

**Resulting bonus ranges:**

| Task           | Minimum | Maximum |
|----------------|---------|---------|
| `pilt-to-test` | £1.47   | £2.45   |
| `reversal`     | £0.30   | £0.50   |
| `wm`           | £0.48   | £0.80   |
| `control`      | £0.75   | £1.25   |

### Control Task — Alternative Formula

The control task uses its own inline calculation at `build_control_timeline.js:318-366`:

```javascript
bonus = (earned − min) / (max − min) × 0.4 × 1.8 + 0.6 × 1.8
//       ↑ range scale  ↑   ↑ base   ↑
//        0.72             1.08
```

This yields a range of **£1.08 to £1.80** (not the £0.75–£1.25 from the standard formula). The standard formula exists in `computeTotalBonus()` but the trial at `build_control_timeline.js:318` uses the inline formula instead, and sends the adjusted bonus via `postToParent({ bonus })`.

---

## Cross-Reload Persistence

Bonus state is accumulated across module reloads using `window.session_state`, which is persisted as a JSON-encoded URL parameter (`session_state`). The per-task state object is:

```json
{
  "pilt-to-test": { "earned": 0, "min": 0, "max": 0 },
  "reversal":     { "earned": 0, "min": 0, "max": 0 },
  "wm":           { "earned": 0, "min": 0, "max": 0 },
  "control":      { "earned": 0, "min": 0, "max": 0 }
}
```

`updateBonusState()` at `utils.js:990-1034` accumulates the current run's raw bonus into the persisted session state. For the reversal task, only `earned` is accumulated (min and max are fixed based on trial count, so they are not updated between reloads).

Note: `updateBonusState()` is currently **not** called automatically from `updateState()` (commented out at `utils.js:252`). Bonus state updates must happen separately when needed.

---

## Bonus Display

The `bonus_trial` at `utils.js:1079-1109`:
1. Calls `computeTotalBonus()` to compute the final bonus amount
2. Displays the amount formatted as GBP currency to the participant
3. On finish, posts `{ bonus: <amount> }` to the parent window and sets the checkpoint to `bonus_trial_end`

The bonus trial is conditionally added to the procedure for tasks `pilt-to-test`, `wm`, `reversal`, and `control` (via `bonus_trial` or the control-specific inline bonus screen).

---

## Summary of Key Files

| File | Role |
|------|------|
| `utils.js:951-974` | `getTaskBonusData()` — dispatches to per-task bonus functions |
| `utils.js:990-1034` | `updateBonusState()` — accumulates bonus across reloads |
| `utils.js:1036-1077` | `computeTotalBonus()` — standard monetary bonus formula |
| `utils.js:1079-1109` | `bonus_trial` — bonus display and reporting trial |
| `PILT.js:594-625` | `computeRelativePILTBonus()` |
| `PIT.js:274-308` | `computeRelativeVigourPITBonus()` |
| `reversal.js:174-189` | `computeRelativeReversalBonus()` |
| `build_control_timeline.js:303-366` | `computeRelativeControlBonus()` + control bonus trial |
