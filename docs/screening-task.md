# Screening Task

The screening task is a **~20-minute introductory training session** that exposes participants to the main learning tasks before the longitudinal sessions begin. In the current PRADAM routing it is identified by:

- `window.task === "screening"`
- `window.session === window.SESSION_NAMES.preTraining` (`"Pre-training 1"`)
- `window.sequenceKey === "screening"`

`sequenceKey` is the canonical key used to load `sequences/trial1_screening_sequences.js` and screening-specific stimulus/config folders.

---

## Procedure

Tasks run in this fixed order. Each block is skipped automatically if the participant has already completed it (resumption logic — see §Resumption below).

### 1. Welcome message
**File:** [experiment.html:200–212](../experiment.html#L200)

Two-page instructions:
- Page 1: "Welcome to the first PRADAM training session!" — introduces the coin-winning games.
- Page 2: Explains the response-deadline warning message and gives contact details.

Prolific participants get a shorter single-page welcome with no mention of PRADAM.

---

### 2. Instruction video *(currently disabled)*
**File:** [instruction_video_playback.js](../instruction_video_playback.js), previously assembled in the screening branch of [experiment.html](../experiment.html#L646)

The video assets and playback timeline still exist, but the screening branch in `experiment.html` currently has the video block commented out. As a result, the task proceeds from the welcome/resumption message directly to the maximum press rate test.

The `screening_order` array still contains `video_start` and `video_end` for backward compatibility with existing state URLs.

---

### 3. Maximum press rate test
**File:** [press_test.js](../press_test.js), assembled in [experiment.html](../experiment.html#L668)

- Participant presses **J** as fast as possible for **7 seconds**.
- If average speed < **3.0 presses/sec**, a retake loop is shown.
- Feedback displays the achieved speed ("X.XX times per second").
- Collected data: response times, press count, average speed.

---

### 4. PILT — Pavlovian Instrumental Transfer Learning
**File:** [PILT.js](../PILT.js), assembled in [experiment.html](../experiment.html#L674)

- Two cards appear left/right; participant chooses with **← →** arrow keys.
- Feedback shown as coin imagery (whole vs. broken coins).
- Screening uses `PILT_json` from `sequences/trial1_screening_sequences.js`; currently this is **50 trials** using `puppy_1.jpg` and `staple_1.jpg`.
- Followed by an **acceptability rating**.

---

### 5. Control task — Ship exploration game
**File:** [build_control_timeline.js](../build_control_timeline.js), assembled in [experiment.html](../experiment.html#L683)

Two phases run in screening (the Reward phase is omitted):

| Phase | Description |
|---|---|
| **Explore** | Navigate a ship left/right with arrow keys; discover which island each ship color belongs to. |
| **Predict** | Given a ship, predict which of 3 islands it will travel to. |

#### Trial sequence

The sequences are **hardcoded static arrays** in [control_configs.js](../control_configs.js):

- **`explore_sequence_screening`** — 24 pre-defined explore trials, each specifying `left`/`right` ship options, `near` (nearby island), and `current` (effort level 1–3).
- **`predict_sequence_screening`** — 4 pre-defined predict trials, each specifying which `ship` to predict.

These are assembled in [build_control_timeline.js:425–435](../build_control_timeline.js#L425) into alternating miniblocks:

```
Explore ×6 → Predict ×1  (miniblock 1)
Explore ×6 → Predict ×1  (miniblock 2)
Explore ×6 → Predict ×1  (miniblock 3)
Explore ×6 → Predict ×1  (miniblock 4)
```

#### Screening vs. full-session differences

| Feature | Screening | Full session |
|---|---|---|
| Ships with homebase | 3 (red→i2, green→i3, blue→i1) | 4 (+ yellow→i3) |
| Predict island choices | 3 (i1, i2, i3) | 4 |
| Reward phase | **Omitted** | Included |
| Explore trials | 24 | 72 |
| Predict trials | 4 | 24 |

The yellow ship appears in explore trials as a distractor but has no defined homebase (`undefined` in `CONTROL_CONFIG.controlRule`) and is never asked about in predict trials.

After all phases, a **homebase reveal** shows the confirmed ship→island mappings.
Followed by an **acceptability rating**.

---

### 6. Reversal learning task
**File:** [reversal.js](../reversal.js), assembled in [experiment.html](../experiment.html#L696)

- Two squirrels appear left/right; participant chooses with **← →** arrow keys.
- Reward contingencies **reverse** periodically — participant must adapt.
- **50 trials** in screening (vs. 150 in all other sessions — see [reversal.js:4](../reversal.js#L4)).
- Trial schedules come from `reversal_json` in `sequences/trial1_screening_sequences.js`.
- Followed by an **acceptability rating**.

---

### 7. Questionnaire battery — Battery A
**File:** [questionnaires.js:829–856](../questionnaires.js#L829)

Five scales administered in sequence:

| Scale | Measures |
|---|---|
| PHQ-9 | Depression |
| GAD-7 | Anxiety |
| WSAS | Work and social adjustment / functional impairment |
| ICECAP-A | Wellbeing / quality of life |
| BFI | Big Five personality traits |

---

### 8. End / data upload
**File:** [experiment.html](../experiment.html#L302)

- Thank-you message; participant is told data is uploading (up to 2 minutes).
- Data upload trial blocks until complete, then redirects to My RELMED.

---

## Resumption

If a session is interrupted, `window.last_state` (from the URL `?state=` parameter) records the last completed checkpoint. `resumptionRule(screening_order, last_state, checkpoint)` in [resumption.js:85–97](../resumption.js#L85) skips any task whose checkpoint already passed, so only the remaining tasks are added to the procedure.

Checkpoint order for screening:

```
video_start → video_end  (legacy/inactive while the video block is commented out)
→ max_press_rate_start → max_press_rate_end
→ pilt_instructions_start → pilt_task_start → pilt_block_1_start → pilt_last_block_start
→ control_task_start
→ reversal_instructions_start → reversal_task_start
→ PHQ9_start → GAD7_start → WSAS_start → ICECAP_start → BFI_start
```

---

## How to change the screening task

### Change the welcome message text
Edit the string in [experiment.html](../experiment.html#L229) inside the `window.session === window.SESSION_NAMES.preTraining` branch.

### Add or remove a task
1. Add/remove the task block inside the `if (window.task === "screening")` section of [experiment.html](../experiment.html#L646).
2. Add/remove its checkpoint(s) in the `screening_order` array in [resumption.js](../resumption.js), in the correct position.

### Change which questionnaires are shown
Edit the `if (window.session === window.SESSION_NAMES.preTraining)` block in [questionnaires.js](../questionnaires.js#L829). Add or remove `included_questionnaires.push(...)` calls, and add/remove the matching `resumptionRule` checkpoint in `screening_order` or the `quests_order` array that `screening_order` concatenates in [resumption.js](../resumption.js).

### Change the number of reversal trials
Edit the constant at [reversal.js:4](../reversal.js#L4):

```js
const rev_n_trials = (window.demo || (window.task === "screening")) ? 50 : 150;
```

Replace `50` with the desired trial count for the screening session.

### Change the control task sequences (islands, ships)
The sequences for Explore and Predict phases are defined in [control_configs.js](../control_configs.js) as `explore_sequence_screening` and `predict_sequence_screening`. Edit or regenerate those arrays to change the trials shown during screening. The ship→island homebase mappings are in `CONTROL_CONFIG.controlRule` in the same file.

### Change the PILT stimuli / blocks
PILT block structure and stimuli for screening come from `sequences/trial1_screening_sequences.js` as well. The number of blocks and card pairs are set there.

### Add or remove the instruction video
The video block is currently commented out in the `window.task === "screening"` branch of [experiment.html](../experiment.html#L659). To re-enable it, restore the block that pushes `video_welcome_txt`, `preload_video`, and `instruction_video`, and decide whether it should remain gated on `window.context === "pradam"`. If the video is removed permanently, also remove `video_start` / `video_end` from `screening_order` in [resumption.js](../resumption.js).

### Change the response deadline
The deadline (in ms) is a global parameter set earlier in `experiment.html` — search for `response_deadline` or `trial_duration`. Adjust the value to change how long participants have to respond before the warning appears (default: 4000 ms; extended to 6000 ms when warnings are frequent).
