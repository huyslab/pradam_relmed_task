# `pilt-to-test` Task

This document explains the `pilt-to-test` task: what it is, how it works, and how its sub-tasks differ from their standalone counterparts.

---

## 1. Overview

`pilt-to-test` is the **main experimental session task** — a complete, integrated pipeline that chains several cognitive tasks into one session. It is the only task that runs the full sequence from Pavlovian conditioning through instrumental learning, effort, Pavlovian-to-Instrumental transfer, and retention testing.

It is triggered by passing `task=pilt-to-test` as a URL parameter:

```
experiment.html?participant_id=XXX&session=wk0&task=pilt-to-test&state=none
```

It is used across sessions `wk0`, `wk2`, `wk4`, `wk24`, and `wk28`.

---

## 2. Sub-Task Sequence

The sequence is assembled dynamically in [experiment.html:310–394](../experiment.html#L310-L394), governed by the `pilt_to_test_order` checkpoint array in [resumption.js:63–83](../resumption.js#L63-L83). Each block is gated by `resumptionRule()` so that interrupted sessions can resume mid-pipeline without repeating completed tasks (see §4).

| # | Sub-task | Checkpoints | What it does |
|---|----------|-------------|-------------|
| 1 | **Preload** | — | Pre-loads all PILT stimulus images |
| 2 | **Welcome / Resumption message** | — | Welcome-back screen, or a resumption notice for re-entering participants |
| 3 | **Max Press Rate test** | `pit_task_start` | Measures baseline button-pressing speed; calibrates vigour and PIT tasks |
| 4 | **Pavlovian Lottery** (conditioning) | `pavlovian_lottery_last` | 30 trials pairing visual stimuli with coin rewards to establish passive stimulus→value associations |
| 5 | **PILT** | `pilt_last_block_start` | Probabilistic Instrumental Learning Task: 20 blocks in which participants choose between stimuli to earn rewards under probabilistic feedback |
| 6 | **PILT acceptability** | — | Brief subjective rating of the PILT experience |
| 7 | **Vigour task** | `vigour_task_start` | Effort-based decision making: participants press rapidly to earn rewards; effort required and reward magnitude vary across trials |
| 8 | **Vigour acceptability** | — | Brief subjective rating |
| 9 | **PIT** (Pavlovian-to-Instrumental Transfer) | `pit_task_start` | Tests whether Pavlovian stimulus values (step 4) bias instrumental choices (step 5) — the scientific core of the study |
| 10 | **PIT acceptability** | — | Brief subjective rating |
| 11 | **Post-Vigour test** | `vigour_test_task_start` | 9 pairwise preference comparisons (18 trials) measuring retention of vigour-task reward values |
| 12 | **PILT test** | `pilt_test_task_start` | Tests retention and transfer of PILT learning to novel stimulus pairings |
| 13 | **Bonus trial** | `bonus_trial_end` | Reveals the real-money bonus earned during the session |

### Why this order matters

The tasks are deliberately ordered so that each stage builds on the previous one:

- Pavlovian conditioning (step 4) must precede PILT (step 5) so that stimuli carry learned value before instrumental choice begins.
- PILT learning (step 5) must precede PIT (step 9) so participants know the stimuli whose values are being transferred.
- Max press rate (step 3) must precede vigour and PIT so that effort levels can be individualised based on each participant's physical capacity.
- The PILT test (step 12) is intentionally delayed until after vigour and PIT, measuring retention across a longer and more demanding interval.

---

## 3. How Sub-Tasks Differ from Their Standalone Counterparts

The same underlying code (e.g. `PILT.js`, `PIT.js`, `vigour.js`) is reused across task modules, but the standalone `task=` variants are stripped of experimental context.

### PILT

| | `pilt-to-test` (line [336](../experiment.html#L336)) | `task=pilt` (line [396](../experiment.html#L396)) |
|---|---|---|
| Prior conditioning | Yes — Pavlovian lottery run first | No |
| Acceptability rating | Yes | Yes |
| Transfer/test phase | Yes — PILT test follows later in the same session | No |
| Resumption support | Yes | No |

### PILT test

| | `pilt-to-test` (line [383](../experiment.html#L383)) | `task=pilt_test` (line [407](../experiment.html#L407)) |
|---|---|---|
| Prior PILT session | Assumed — runs in the same pipeline | Not assumed — run as a standalone or separate session |
| Delay since learning | Long — vigour and PIT intervene between PILT and the test | None (immediate) unless scheduled separately |
| Resumption support | Yes | No |

### Vigour

| | `pilt-to-test` (line [346](../experiment.html#L346)) | `task=vigour` (line [414](../experiment.html#L414)) |
|---|---|---|
| Max press rate test | Yes — gated; skipped if already completed | Yes — always included |
| Preload | Inside the vigour block | Prepended separately |
| Participant state | Arrives Pavlovian-conditioned and post-PILT | Cold start |
| Resumption support | Yes | No |

### PIT

| | `pilt-to-test` (line [361](../experiment.html#L361)) | `task=pit` (line [433](../experiment.html#L433)) |
|---|---|---|
| Prior conditioning | Yes — Pavlovian lottery and PILT have run | No |
| Prior press calibration | Yes — max press rate test has run | No |
| Preload | Inherited from vigour block | `preload_vigour` prepended explicitly |
| Resumption support | Yes | No |

**Summary:** In `pilt-to-test`, the sub-tasks are interdependent and scientifically valid as a combined pipeline. The standalone task names (`pilt`, `pit`, `vigour`, `pilt_test`) are modular fragments intended for isolated debugging, partial re-runs, or development testing — not for use as a substitute for the full pipeline.

---

## 4. Resumption Logic

If a session is interrupted, the `state=` URL parameter records the last completed checkpoint. `resumptionRule(order, last_state, task)` ([resumption.js:8](../resumption.js#L8)) returns `true` only when `last_state` appears *before* `task` in `pilt_to_test_order`, meaning that task has not yet been completed.

```js
// Returns true if last_state appears before task in the order array
// (i.e., task has not yet been completed)
function resumptionRule(order, last_state, task) {
    if (last_state === "none") return true;  // first run: do everything
    return order.indexOf(last_state) < order.indexOf(task);
}
```

The full checkpoint order for `pilt-to-test` is ([resumption.js:63](../resumption.js#L63)):

```
prepilt_conditioning_start
pavlovian_lottery_last
pilt_instructions_start
pilt_task_start
pilt_block_1_start … pilt_block_20_start
pilt_last_block_start
vigour_instructions_start
vigour_task_start
pit_instructions_start
pit_task_start
vigour_test_task_start
pilt_test_instructions_start
pilt_test_task_start
bonus_trial_end
```

**Example:** A participant interrupted at `vigour_task_start` would resume with PIT onwards; PILT and conditioning would be skipped.

---

## 5. Key Source Files

| File | Role |
|------|------|
| [experiment.html:310–394](../experiment.html#L310-L394) | Builds the `pilt-to-test` procedure array |
| [resumption.js:8–83](../resumption.js#L8-L83) | `resumptionRule()` function and `pilt_to_test_order` array |
| [PILT.js](../PILT.js) | PILT block setup, block messages, `return_PILT_full_sequence()` |
| [plugin-PILT.js](../plugin-PILT.js) | jsPsych plugin executing each PILT trial |
| [PILT_instructions.js](../PILT_instructions.js) | PILT instruction screens |
| [pavlovian_lottery.js](../pavlovian_lottery.js) | Pavlovian conditioning task (30 trials) |
| [vigour.js](../vigour.js) | Vigour task configuration and trial timeline |
| [vigour_instructions.js](../vigour_instructions.js) | Vigour instruction screens |
| [PIT.js](../PIT.js) | PIT task configuration (68 trials), stimulus-coin mappings |
| [post-vigour-test.js](../post-vigour-test.js) | Post-vigour preference test (9 pairs, 18 trials) |
| [press_test.js](../press_test.js) | Max press rate measurement |
| [acceptability.js](../acceptability.js) | Acceptability rating scales (used after PILT, vigour, PIT) |
