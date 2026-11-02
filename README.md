# RELMED task in PRADAM study

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/huyslab/pradam_relmed_task/validate_loading.yaml?branch=main&label=Task%20loading)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/huyslab/pradam_relmed_task/validate_simulation.yml?branch=main&label=Task%20simulation)
![GitHub Release](https://img.shields.io/github/v/release/huyslab/pradam_relmed_task)

This reposistory hosts the experiment website for the RELMED trial 1, which includes PILT, Vigour, PIT, reversal, WM, control, and questionnaires. The task is coded with jsPsych.

## Files in this repository (update needed)

```
.
├── consent.html - landing page, consent form.
├── experiment.html - main experiment script, participants are redirected here from conset.html
├── PILT.js - main script for PILT
├── PILT_instructions.js - instructions for PILT
├── plugin-PLT.js - plugin for PILT trial
├── pilot6_pilt.json - trial sequence for PILT
├── pilot6_pilt_test.json - trial sequence for PILT test phase
├── vigour.js - main vigour task script
├── vigour_instructions.js - vigour task 
├── visgour_styles.css - stylesheet for vigour task
├── post-vigour-test.js - script for post vigour task test
├── vigour.json - trial sequence for vigour task
├── reversal.js - main script for reversal task
├── PIT.js - main script for PIT transfer phase
├── questionnaires.js - main script for all the questionnaires
├── plugin-reversal.js - plugin for reversal trial
├── pilot4_reversal_sequence.js - trial sequence for reversal task
├── utils.js - functions and trial objects shared across tasks
├── jspsych - jsPsych library/
│   └── .
└── lambda - AWS lambda function scripts/
    └── .
```

<!-- LOADING-TEST-RESULTS -->

### 🧪 Can all tasks load?

| Session | Task | Chromium | Firefox | WebKit |
|---------|------|----------|---------|--------|
| screening | screening | ✅ Success | ✅ Success | ✅ Success |
| Pre-training 1 | pilt-to-test | ✅ Success | ✅ Success | ✅ Success |
| Pre-training 1 | reversal | ✅ Success | ✅ Success | ✅ Success |
| Pre-training 1 | control | ✅ Success | ✅ Success | ✅ Success |
| Pre-training 1 | wm | ✅ Success | ✅ Success | ✅ Success |
| Visit 1 | pilt-to-test | ✅ Success | ✅ Success | ✅ Success |
| Visit 1 | reversal | ✅ Success | ✅ Success | ✅ Success |
| Visit 1 | control | ✅ Success | ✅ Success | ✅ Success |
| Visit 1 | wm | ✅ Success | ✅ Success | ✅ Success |
| Visit 2 | pilt-to-test | ✅ Success | ✅ Success | ✅ Success |
| Visit 2 | reversal | ✅ Success | ✅ Success | ✅ Success |
| Visit 2 | control | ✅ Success | ✅ Success | ✅ Success |
| Visit 2 | wm | ✅ Success | ✅ Success | ✅ Success |
| Monitor Week 5 | pilt-to-test | ✅ Success | ✅ Success | ✅ Success |
| Monitor Week 5 | reversal | ✅ Success | ✅ Success | ✅ Success |
| Monitor Week 5 | control | ✅ Success | ✅ Success | ✅ Success |
| Monitor Week 5 | wm | ✅ Success | ✅ Success | ✅ Success |
| Monitor Week 25 | pilt-to-test | ✅ Success | ✅ Success | ✅ Success |
| Monitor Week 25 | reversal | ✅ Success | ✅ Success | ✅ Success |
| Monitor Week 25 | control | ✅ Success | ✅ Success | ✅ Success |
| Monitor Week 25 | wm | ✅ Success | ✅ Success | ✅ Success |
| Pre-training 1 | quests | ✅ Success | ✅ Success | ✅ Success |
| Visit 1 | quests | ✅ Success | ✅ Success | ✅ Success |
| Visit 2 | quests | ✅ Success | ✅ Success | ✅ Success |
| Monitor Week 5 | quests | ✅ Success | ✅ Success | ✅ Success |
| Monitor Week 25 | quests | ✅ Success | ✅ Success | ✅ Success |

<!-- LOADING-TEST-RESULTS -->
