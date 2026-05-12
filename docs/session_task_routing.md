# Session & Task Routing

This document explains how `experiment.html` determines which tasks a participant sees, and in what order, for each session.

---

## 1. URL Parameters

Everything is driven by two URL parameters passed to `experiment.html`:

| Parameter | Example values | Purpose |
|---|---|---|
| `session` | `screening`, `wk0`, `wk2`, `wk4`, `wk24`, `wk28`, `baseline`, `visit1`, `visit2` | Which study visit this is |
| `task` | `pilt-to-test`, `wm`, `quests`, `reversal`, `control`, `vigour`, `pit`, `dd`, `screening`, … | Which task module to run within that session |

The `participant_id` parameter sets `window.context` to `"pradam"` (our participants) or `"prolific"` (online participants).

---

## 2. Top-Level Routing: Sequence File vs. Direct Run

At the bottom of `experiment.html` ([experiment.html:807](../experiment.html#L807)):

```js
if (["wk0", "wk2", "wk4", "wk24", "wk28", "screening"].includes(window.session)) {
    loadSequence(`sequences/trial1_${window.session}_sequences.js`);
} else {
    run_full_experiment();
}
```

- **Sessions with sequence files** (`screening`, `wk0`, `wk2`, `wk4`, `wk24`, `wk28`): a per-session JS file is loaded first (e.g. `sequences/trial1_wk0_sequences.js`). That file sets up any session-specific stimulus sequences, then calls `run_full_experiment()` itself.
- **All other sessions** (`baseline`, `visit1`, `visit2`, or any ad-hoc task run): `run_full_experiment()` is called directly without a sequence file.

---

## 3. Task Routing Inside `run_full_experiment()`

`run_full_experiment()` builds a `procedure` array by checking `window.task` ([experiment.html:292](../experiment.html#L292)). Each `if` block appends the relevant trials for that task module:

| `window.task` | What runs |
|---|---|
| `pilt-to-test` | Pavlovian conditioning → PILT → Vigour → PIT → Post-vigour test → PILT test → Bonus trial |
| `pilt` | PILT only |
| `pilt_test` | PILT test only |
| `vigour` | Max press rate test → Vigour task |
| `pit` | PIT task |
| `wm` | WM task → WM test → *(wk24/wk28 only: Delay discounting + Open text)* → Bonus trial |
| `wm_only` | WM task + WM test (no bonus, no dd) |
| `reversal` | Reversal learning task → Bonus trial |
| `control` | Control task (with interactive instructions) → Bonus trial |
| `dd` | Delay discounting only |
| `open_text` | Free-text open questions only |
| `quests` | Questionnaire battery (content depends on session — see §4) |
| `screening` | Video → Max press rate → PILT → Control → Reversal → Questionnaires |

Each task block also appends an **acceptability rating** after the main task, and all modules end with the shared `end_experiment_msgs` (upload & redirect).

---

## 4. Questionnaire Battery by Session

`questionnaires.js` branches on `window.session` (and `window.task`) to select which scales to include ([questionnaires.js:829](../questionnaires.js#L829)):

| Session / Task condition | Battery label | Scales included |
|---|---|---|
| `session === "screening"` | A | PHQ-9, GAD-7, WSAS, ICECAP-A, BFI |
| `session === "baseline"` | D | PHQ-9, GAD-7, WSAS, ICECAP-A, BFI |
| `task === "quests"` & `session ∈ {visit1, visit2}` | E | PHQ-9, GAD-7, PVSS, BADS, Hopelessness, RRS-Brooding, PERS-NegAct |
| `task === "quests"` & `session ∈ {wk0, wk2, wk4, wk28}` | B | PHQ-9, GAD-7, PVSS, BADS, Hopelessness, RRS-Brooding, PERS-NegAct |
| `task === "quests"` (all other sessions) | C | PHQ-9, GAD-7, WSAS, ICECAP-A, PVSS, BADS, Hopelessness, RRS-Brooding, PERS-NegAct |

Additionally, the `quests` module prepends **Delay Discounting** and **Open Text** tasks when `session ∈ {wk0, wk2, wk4}`, and appends a **Placebo Drug Guess** when `session ∈ {wk2, wk4}`.

---

## 5. Resumption Logic

If a participant's session is interrupted, `window.last_state` (from the URL) records where they stopped. `resumptionRule(order, last_state, task)` ([resumption.js:9](../resumption.js#L9)) skips any task whose checkpoint already appears *before* `last_state` in the ordered list — so only the remaining tasks are appended to the procedure.

Each task module has its own order array defined in `resumption.js`:

| Array | Used by |
|---|---|
| `screening_order` | `task === "screening"` |
| `pilt_to_test_order` | `task === "pilt-to-test"` |
| `wm_order` | `task === "wm"` |
| `quests_order` | `task === "quests"` and questionnaire battery selection |

---

## Summary Flow

```
URL: ?participant_id=XXX&session=wk0&task=quests&state=PHQ9_start

window.context  = "pradam"
window.session  = "wk0"
window.task     = "quests"
window.last_state = "PHQ9_start"

→ session is in [wk0, wk2, wk4, wk24, wk28, screening]
  → loadSequence("sequences/trial1_wk0_sequences.js")
    → (sequence file sets up stimuli, then calls run_full_experiment())

→ run_full_experiment():
  → task === "quests"
    → dd + open_text + questionnaire battery B
    → resumptionRule skips anything before "PHQ9_start"
      → only PHQ-9 onwards is added to procedure
```
