// Session/task combinations covered by the loading test.
// Shared by the Playwright spec and the results collector.

const SESSION_NAMES = {
    preTraining: "Pre-training 1",
    visit1: "Visit 1",
    visit2: "Visit 2",
    monitorWk5: "Monitor Week 5",
    monitorWk25: "Monitor Week 25"
};

const task_sessions = [
    SESSION_NAMES.preTraining,
    SESSION_NAMES.visit1,
    SESSION_NAMES.visit2,
    SESSION_NAMES.monitorWk5,
    SESSION_NAMES.monitorWk25
];
const quest_sessions = []; // wk6/wk8/wk52 removed - no longer valid sessions
const task_tasks = ["pilt-to-test", "reversal", 'control', "wm"];

const PARAMS = [
    "&session=screening&task=screening",
].concat(
    task_sessions.flatMap(s => task_tasks.map(t => `&session=${encodeURIComponent(s)}&task=${t}`))
).concat(
    task_sessions.map(s => `&session=${encodeURIComponent(s)}&task=quests`)
);

// One entry per URL, with session/task decoded for labelling results
const ENTRIES = PARAMS.map(param => {
    const params = new URLSearchParams(param);
    return {
        param,
        session: params.get("session") || "N/A",
        task: params.get("task") || "N/A"
    };
});

// Define browsers to test with
const browsers = ['chromium', 'firefox', 'webkit'];

// Each test writes its result to this file inside its own Playwright output dir
const RESULT_FILENAME = 'loading-result.json';

module.exports = { ENTRIES, browsers, RESULT_FILENAME };
