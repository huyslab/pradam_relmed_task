const placebo_drug_guess = {
    type: jsPsychHtmlButtonResponse,
    css_classes: ['instructions'],
    stimulus: `<p>In the first part of the RELMED study, participants receive either an antidepressant medication or a placebo (a pill with no active medicine).</p>
<p><span class="highlight-txt">If you had to guess, which type of pill do you think you are taking right now?</span></p>`,
    choices: ["Active drug", "Placebo (dummy pill)"],
    post_trial_gap: 400,
    data: {
        trialphase: "placebo_drug_guess"
    }
}

const placebo_drug_confidence = {
    type: jsPsychHtmlButtonResponse,
    css_classes: ['instructions'],
    stimulus: `<p><span class="highlight-txt">How <strong>confident</strong> are you in your guess?</span></p>`,
    choices: ["1<br>Not at all", "2", "3", "4", "5<br>Very confident"],
    trial_duration: 10000,
    post_trial_gap: 400,
    data: {
        trialphase: "placebo_drug_confidence"
    }
}

const placebo_drug_timeline = [
    placebo_drug_guess,
    placebo_drug_confidence
];