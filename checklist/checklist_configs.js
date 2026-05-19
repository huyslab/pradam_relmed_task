// Configurations for the checklist task.
// Each entry keyed by the `task` URL parameter.
// To add a new checklist, add an entry below.
window.CHECKLIST_CONFIGS = {
    default: {
        title: "Default checklist",
        instruction: "<p>Please complete the default checklist items.</p><p>When you are done, press <b>Submit</b>.</p>",
        items: [
            "Default checklist item 1",
            "Default checklist item 2",
            "Default checklist item 3"
        ]
    },
    free_recall: {
        title: "Free recall",
        instruction: "<p>Please complete the free recall task on the laptop.</p><p>When you are done, press <b>Submit</b>.</p>",
        items: [
            "Free recall completed"
        ]
    },
    rating_choice: {
        title: "Word rating and choice",
        instruction: "<p>Please complete the word rating and choice task on the laptop.</p><p>When you are done, press <b>Submit</b>.</p>",
        items: [
            "Task completed"
        ]
    },
    short_choice: {
        title: "Short choice",
        instruction: "<p>Please complete the short choice task on the laptop.</p><p>When you are done, press <b>Submit</b>.</p>",
        items: [
            "Instructions and session 1",
            "Session 2 (45 min after ATD administration)",
            "Session 3 (90 min after ATD administration)",
            "Session 4 (135 min after ATD administration)",
            "Session 5 (180 min after ATD administration)",
        ]
    }
};
