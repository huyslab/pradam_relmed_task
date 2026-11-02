const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { ENTRIES, browsers, RESULT_FILENAME } = require('../loading-test-params');

const BASE_URL = "https://huyslab.github.io/pradam_relmed_task/experiment.html?pradam_id=test";

// Write this test's result into its own output dir (unique per test and retry),
// so parallel workers never touch the same file. Playwright clears test-results/
// at the start of each run; validation/collect-loading-results.js merges them.
function saveResult(testInfo, session, task, browser, passed) {
    fs.mkdirSync(testInfo.outputDir, { recursive: true });
    fs.writeFileSync(
        testInfo.outputPath(RESULT_FILENAME),
        JSON.stringify({ session, task, browser, passed, retry: testInfo.retry })
    );
}

for (const browserType of browsers) {
    // Create a test fixture for this browser type at the top level
    const browserTest = test.extend({ browserName: browserType });

    browserTest.describe(`Website Load Test in ${browserType}`, () => {
        for (const { param, session, task } of ENTRIES) {
            browserTest(`Loading ${session}/${task} in ${browserType}`, async ({ page }, testInfo) => {
                // Navigate to the page with the URL parameter
                let passed = false;
                try {
                    // Attach the console listener before navigating to the page
                    const messagePromise = new Promise(resolve => {
                        page.on('console', msg => {
                            console.log(`Console message in ${session}/${task} (${browserType}):`, msg.text());
                            if (msg.text().includes("load_successful")) {
                                resolve(true);
                            }
                        });
                    });

                    const response = await page.goto(`${BASE_URL}${param}`, { waitUntil: 'load', timeout: 20000 });

                    console.log(`Response status for ${session}/${task} (${browserType}):`, response.status());
                    passed = response.ok();
                    if (passed) {
                        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(false), 3000));
                        passed = await Promise.race([messagePromise, timeoutPromise]);
                    }
                } catch (e) {
                    passed = false;
                    console.error(`Error loading ${session}/${task} in ${browserType}:`, e);
                }

                saveResult(testInfo, session, task, browserType, passed);

                expect(passed).toBeTruthy();
            });
        }
    });
}
