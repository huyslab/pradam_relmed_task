const fs = require("fs");
const path = require("path");
const { ENTRIES, browsers, RESULT_FILENAME } = require("./loading-test-params");

// Merge the per-test result files written by load_test.spec.js into loading-test-results.json.
// Entries with no result file (test never ran) stay null.
const outputDir = path.join(__dirname, "../test-results");
const resultsFile = path.join(__dirname, "../loading-test-results.json");

const results = ENTRIES.map(({ session, task }) => ({
    session,
    task,
    ...Object.fromEntries(browsers.map(b => [b, null]))
}));

// Keep the result of the latest retry for each session/task/browser
const latestRetry = {};

const files = fs.existsSync(outputDir) ? fs.readdirSync(outputDir, { recursive: true }) : [];
for (const file of files) {
    if (path.basename(file) !== RESULT_FILENAME) continue;

    const { session, task, browser, passed, retry } = JSON.parse(fs.readFileSync(path.join(outputDir, file), "utf8"));
    const entry = results.find(item => item.session === session && item.task === task);
    if (!entry || !browsers.includes(browser)) continue;

    const key = `${session}|${task}|${browser}`;
    if (latestRetry[key] !== undefined && latestRetry[key] > retry) continue;
    latestRetry[key] = retry;
    entry[browser] = passed;
}

fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
console.log(`✅ Collected ${Object.keys(latestRetry).length} results into loading-test-results.json`);
