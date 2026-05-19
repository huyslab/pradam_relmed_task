// Configurations for the checklist task.
// Each entry keyed by the `task` URL parameter.
// To add a new checklist, add an entry below.
window.CHECKLIST_CONFIGS = {
    default: {
        title: "Checklist",
        instruction: "<p>Please review the items below and tick each one you have completed.</p><p>When you are done, press <b>Submit</b>.</p>",
        items: [
            "Item 1",
            "Item 2",
            "Item 3"
        ]
    },
    pre_session: {
        title: "Pre-session checklist",
        instruction: "<p>Before starting today's session, please confirm the following:</p>",
        items: [
            "I am in a quiet environment with minimal distractions.",
            "My device is plugged in or has sufficient battery.",
            "I have read and understood the instructions.",
            "I have approximately 30 minutes available without interruption.",
            "I am ready to focus on the task."
        ]
    },
    post_session: {
        title: "Post-session checklist",
        instruction: "<p>Thank you for completing today's session. Please confirm the following before finishing:</p>",
        items: [
            "I completed the task to the best of my ability.",
            "I did not use any external aids during the task.",
            "I will remember to attend the next scheduled session.",
            "I have no immediate concerns to report."
        ]
    }
};
