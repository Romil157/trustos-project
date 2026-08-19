/**
 * Headless Node.js Test Runner for TrustOS
 */

// Create browser mock environment
global.window = global;
global.document = {
    body: { innerText: "" },
    querySelectorAll: () => [],
    documentElement: { appendChild: () => {} }
};
global.location = { hostname: "example.com", href: "https://example.com" };

// Load TrustOS modules in order
require('../trustos-extension/scripts/config.js');
require('../trustos-extension/scripts/bloom_filter.js');
require('../trustos-extension/scripts/threat_data.js');
require('../trustos-extension/scripts/domain_check.js');
require('../trustos-extension/scripts/wasm_loader.js');
require('../trustos-extension/scripts/keyword_check.js');
require('../trustos-extension/scripts/form_check.js');
require('../trustos-extension/scripts/risk_engine.js');
require('./unit_tests.js');

async function run() {
    const summary = await global.TrustOSTests.runAll();
    console.log(`\n========================================`);
    console.log(`TrustOS Test Results: ${summary.passed}/${summary.total} Passed`);
    console.log(`========================================\n`);
    if (summary.failed > 0) {
        process.exit(1);
    }
}

run();
