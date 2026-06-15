## Questionnaires by session (quests task)

| Session | PHQ-9 | GAD-7 | WSAS | ICECAP | BFI | IDS-SR | PVSS | BADS | Hopelessness | RRS Brooding | PERS NegAct | DESS |
|---------|:-----:|:-----:|:----:|:------:|:---:|:------:|:----:|:----:|:------------:|:------------:|:-----------:|:----:|
| Pre-training 1 | ✓ | ✓ | ✓ | ✓ | ✓ | | | | | | | |
| Visit 1 | ✓ | ✓ | | | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Visit 2 | ✓ | ✓ | | | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Monitor Week 1 | ✓ | | | | | | | | | | | ✓ |
| Monitor Week 2 | ✓ | | | | | | | | | | | ✓ |
| Monitor Week 3 | ✓ | | | | | | | | | | | ✓ |
| Monitor Week 5 | ✓ | | | | | | | | | | | ✓ |
| Monitor Week 9 | ✓ | | | | | | | | | | | |
| Monitor Week 13 | ✓ | | | | | | | | | | | |
| Monitor Week 17 | ✓ | | | | | | | | | | | |
| Monitor Week 21 | ✓ | | | | | | | | | | | |
| Monitor Week 25 | ✓ | ✓ | | | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |

## `phase` sub-battery (M3VAS)

The M3VAS (Maudsley 3-item Visual Analogue Scale) is an **independent measure**, not part of the standard session batteries above. It is administered during **Visit 1 / Visit 2** only when a `phase` URL parameter is present.

- **No `phase` parameter** → the standard Visit 1 / Visit 2 battery runs (PHQ-9, GAD-7, IDS-SR, PVSS, BADS, Hopelessness, RRS Brooding, PERS NegAct).
- **`phase` parameter present** → the battery is replaced by **PHQ-9 + M3VAS only**, and the placebo-drug-guess block is skipped.

The value of `phase` (when present) is saved to every data row via `jsPsych.data.addProperties`.

M3VAS uses a continuous axis (0–100), rendered by the custom `jsPsychSurveyVAS` plugin ([plugin-survey-vas.js](../plugin-survey-vas.js)) — the only continuous-response questionnaire in the battery. Each item is a horizontal line with a hidden mark that the participant must place; all items are required. State anchor: `m3vas_start` (see `quests_order` in [resumption.js](../resumption.js)).
