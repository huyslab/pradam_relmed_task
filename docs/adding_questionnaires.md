# Adding Questionnaires to the PRADAM Task

This document provides a guide on how to add a new questionnaire to the PRADAM experimental framework. Questionnaires are primarily managed in `questionnaires.js` and utilize the custom `jsPsychSurveyTemplate` plugin.

## 1. Define the Questionnaire Content

Open `questionnaires.js` and add your questionnaire's scale and prompts at the beginning of the file.

### a. Define the Response Scale (Likert Scale)
Define an array of strings representing the response options.

```javascript
var likert_new_quest = [
    "Not at all",
    "Several days",
    "More than half the days",
    "Nearly every day"
];
```

### b. Define the Question Prompts
Define an array of strings for the questions.

```javascript
var prompt_new_quest = [
    "Question 1 text...",
    "Question 2 text...",
    "Question 3 text...",
    // Add a catch question if needed
    "This is a catch question (please select 'Not at all')", 
];
```

## 2. Create the Questionnaire Function

Define a function that returns a jsPsych trial object. By convention, these functions take `i` (current index) and `total` (total number of questionnaires) as arguments to display progress.

```javascript
var questionnaire_new_quest = (i, total) => {
    return {
        type: jsPsychSurveyTemplate,
        instructions: [`<h2>Questionnaire ${i} out of ${total}</h2>` +
            "<p>Please indicate how often you have been bothered by the following problems over the <u>last 2 weeks</u>.</p>"
        ],
        items: prompt_new_quest,
        scale: likert_new_quest,
        survey_width: 700,
        data: {
            trialphase: "NEW_QUEST" // Unique identifier for data analysis
        },
        on_start: () => {
            // Update state for resumption/persistence logic
            updateState("NEW_QUEST_start");
        }
    };
};
```

### Using Different Plugins
While most questionnaires use `jsPsychSurveyTemplate`, you can also use `jsPsychSurveyMultiChoice` for categorical responses (e.g., ICECAP).

## 3. Integrate into the Timeline

Scroll to the bottom of `questionnaires.js` where the `questionnaires_timeline` is constructed. You need to add your questionnaire to the `included_questionnaires` array within the appropriate session/task block.

### a. Identify the Target Session/Task
Questionnaires are usually added to one of three blocks:
1.  **`screening`**: For the initial screening session.
2.  **`quests` (Battery B)**: For weeks 0, 2, 4, 28.
3.  **`quests` (Battery C)**: For all other sessions where `task === "quests"`.

### b. Add the Questionnaire with Resumption Logic
Wrap the addition in a `resumptionRule` check to ensure participants don't repeat the questionnaire if they already completed it.

```javascript
if (resumptionRule(quests_order, window.last_state, "NEW_QUEST_start")){
    included_questionnaires.push(questionnaire_new_quest);
}
```

> [!IMPORTANT]
> The anchor name (e.g., `"NEW_QUEST_start"`) must match the string used in `updateState()` within the questionnaire function and must be added to the corresponding order list (e.g., `quests_order`) in `resumption.js`.

## 4. Update Resumption Logic (Optional but Recommended)

To ensure the experiment persists correctly across refreshes, you should add your new state anchor to `resumption.js`.

1.  Open `resumption.js`.
2.  Find the relevant order array (e.g., `quests_order` or `screening_order`).
3.  Add your anchor name in the correct sequence.

```javascript
const quests_order = [
    "dd_task_start",
    "open_text_task_start",
    "PHQ9_start",
    "GAD7_start",
    "NEW_QUEST_start", // Add your anchor here
    "PVSS_start",
    // ...
];
```

## 5. Technical Details

### `instantiate_questionnaires(questionnaires)`
This helper function in `questionnaires.js` iterates through the `included_questionnaires` array, calls each function with the correct numbering, and automatically adds `updateState("no_resume")` to the **last** questionnaire in the list. This prevents the participant from being redirected back to the beginning of the questionnaires once they have finished the battery.

### Catch Questions
It is good practice to include "catch" questions (infrequency items) to ensure data quality. You can see examples in `prompt_gad` (line 114) or `prompt_BADS` (line 154) in `questionnaires.js`.

### Data Export
If you need to generate a requirement document or validate the questionnaire structure in a Node.js environment, add your new function to the `module.exports` block at the bottom of `questionnaires.js`.
