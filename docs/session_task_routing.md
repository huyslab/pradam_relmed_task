# Session & Task Routing

This document explains how `experiment.html` determines which tasks a participant sees, and in what order, for each session.

---

## 1. URL Parameters

Everything is driven by two URL parameters passed to `experiment.html`:

| Parameter | Example values | Purpose |
|---|---|---|
| `session` | `Pre-training 1`, `Visit 1`, `Visit 2`, `Monitor Week 5`, `Monitor Week 25`, `baseline`, legacy values such as `screening` / `wk0` | Which study visit this is |
| `task` | `pilt-to-test`, `wm`, `quests`, `reversal`, `control`, `vigour`, `pit`, `dd`, `screening`, … | Which task module to run within that session |

The `participant_id` parameter sets `window.context` to `"pradam"` (our participants) or `"prolific"` (online participants).

---

## 2. Top-Level Routing: Sequence File vs. Direct Run

`experiment.html` first derives a canonical sequence key:

```js
window.sequenceKey = window.SESSION_SEQUENCE_KEYS[window.session] || window.session;
```

At the bottom of `experiment.html`, sequence files are loaded by `window.sequenceKey`:

```js
if (["screening", "visit1", "visit2", "monitorWk5", "monitorWk25"].includes(window.sequenceKey)) {
    loadSequence(`sequences/trial1_${window.sequenceKey}_sequences.js`);
} else {
    run_full_experiment();
}
```

- **Sessions with sequence files** (`screening`, `visit1`, `visit2`, `monitorWk5`, `monitorWk25`): a per-session JS file is loaded first (e.g. `sequences/trial1_screening_sequences.js`). That file sets up any session-specific stimulus sequences, then calls `run_full_experiment()` itself.
- **All other sessions** (`baseline` or ad-hoc task runs without a recognized sequence key): `run_full_experiment()` is called directly without a sequence file.

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
| `screening` | Welcome/resume → Max press rate → PILT → Control → Reversal → Questionnaires |

Each task block also appends an **acceptability rating** after the main task, and all modules end with the shared `end_experiment_msgs` (upload & redirect).

The instruction video code still exists, but the video block in the screening branch is currently commented out.

---

## 4. Questionnaire Battery by Session

`questionnaires.js` branches on `window.session` (and `window.task`) to select which scales to include ([questionnaires.js:829](../questionnaires.js#L829)):

| Session / Task condition | Battery label | Scales included |
|---|---|---|
| `session === window.SESSION_NAMES.preTraining` (`"Pre-training 1"`) | A | PHQ-9, GAD-7, WSAS, ICECAP-A, BFI |
| `session === "baseline"` | D | PHQ-9, GAD-7, WSAS, ICECAP-A, BFI |
| `task === "quests"` & `session ∈ {"Visit 1", "Visit 2"}` | E | PHQ-9, GAD-7, IDS-SR, PVSS, BADS, Hopelessness, RRS-Brooding, PERS-NegAct |
| `task === "quests"` & `session ∈ {"Monitor Week 25"}` | B | PHQ-9, GAD-7, PVSS, BADS, Hopelessness, RRS-Brooding, PERS-NegAct |
| `task === "quests"` & monitoring sessions `Monitor Week 1/2/3/5/9/13/17/21` | Monitor | PHQ-9, DESS |
| `task === "quests"` (all other sessions) | C | PHQ-9, GAD-7, WSAS, ICECAP-A, PVSS, BADS, Hopelessness, RRS-Brooding, PERS-NegAct |

Additionally, the `quests` module prepends **Delay Discounting** and **Open Text** for `Visit 1` and `Visit 2`, and appends a **Placebo Drug Guess** for `Visit 1` and `Visit 2`.

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

→ sequenceKey is wk0
  → no matching sequence file key in [screening, visit1, visit2, monitorWk5, monitorWk25]
  → run_full_experiment() directly

→ run_full_experiment():
  → task === "quests"
    → dd + open_text + questionnaire battery B
    → resumptionRule skips anything before "PHQ9_start"
      → only PHQ-9 onwards is added to procedure
```
