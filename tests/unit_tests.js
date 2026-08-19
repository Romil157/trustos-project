/**
 * TrustOS Automated Test Suite
 * Validates edge algorithms, Bloom filter bounds, entropy calculation, typosquatting logic, and RiskEngine.
 */

(function (root) {
    const TrustOSTests = {
        results: [],

        assert: function (condition, testName, details = '') {
            const passed = Boolean(condition);
            this.results.push({
                name: testName,
                passed: passed,
                details: details
            });
            if (!passed) {
                console.error(`FAILED: ${testName} - ${details}`);
            } else {
                console.log(`PASSED: ${testName}`);
            }
        },

        runAll: async function () {
            this.results = [];
            console.log("TrustOS: Running Automated Test Suite...");

            this.testBloomFilter();
            this.testEntropyCalculation();
            this.testLevenshteinTyposquatting();
            this.testHomographDetection();
            this.testKeywordScanner();
            this.testFormCheck();
            this.testRiskEngine();

            const total = this.results.length;
            const passed = this.results.filter(r => r.passed).length;
            const failed = total - passed;

            console.log(`TrustOS Test Run Complete: ${passed}/${total} Passed, ${failed} Failed.`);
            return {
                total: total,
                passed: passed,
                failed: failed,
                results: this.results
            };
        },

        testBloomFilter: function () {
            const BF = TrustOS.BloomFilter;
            BF.init(10000);
            BF.clear();

            BF.add("malicious-phish-site.com");
            BF.add("canvas-fake-login.net");

            this.assert(BF.test("malicious-phish-site.com"), "BloomFilter: Recognizes added threat item");
            this.assert(BF.test("canvas-fake-login.net"), "BloomFilter: Recognizes second added threat item");
            this.assert(!BF.test("google.com"), "BloomFilter: Clean domain returns false");
            this.assert(!BF.test("instructure.com"), "BloomFilter: Institutional domain returns false");
        },

        testEntropyCalculation: function () {
            const DC = TrustOS.DomainCheck;

            const lowEntropy = DC.calculateEntropy("google");
            const highEntropy = DC.calculateEntropy("xjk92a8zbcq71");

            this.assert(lowEntropy < 3.0, "Entropy: Normal domain SLD has low Shannon entropy", `Got ${lowEntropy.toFixed(2)}`);
            this.assert(highEntropy >= 3.0, "Entropy: Randomized DGA string has high Shannon entropy", `Got ${highEntropy.toFixed(2)}`);
            this.assert(DC.calculateEntropy("") === 0, "Entropy: Empty string returns 0");
        },

        testLevenshteinTyposquatting: function () {
            const DC = TrustOS.DomainCheck;

            this.assert(DC.levenshteinDistance("google", "google") === 0, "Levenshtein: Identical strings distance is 0");
            this.assert(DC.levenshteinDistance("g00gle", "google") === 2, "Levenshtein: 'g00gle' vs 'google' distance is 2");
            this.assert(DC.levenshteinDistance("canvas", "canvass") === 1, "Levenshtein: 'canvas' vs 'canvass' distance is 1");

            const typosquatCheck = DC.checkTyposquatting("accounts-g00gle.com");
            this.assert(typosquatCheck.isTyposquat, "Typosquatting: Detects brand mimicry on 'accounts-g00gle.com'");
        },

        testHomographDetection: function () {
            const DC = TrustOS.DomainCheck;

            const punycodeRes = DC.checkHomograph("xn--gogle-pqa.com");
            this.assert(punycodeRes.hasHomograph && punycodeRes.isPunycode, "Homograph: Detects punycode prefix (xn--)");

            // Cyrillic 'а' (\u0430) spoofing Latin 'a'
            const cyrillicSpoof = "c\u0430nvas.com";
            const cyrillicRes = DC.checkHomograph(cyrillicSpoof);
            this.assert(cyrillicRes.hasHomograph, "Homograph: Detects Cyrillic character spoofing in domain name");
        },

        testKeywordScanner: function () {
            const KC = TrustOS.KeywordCheck;

            const cleanText = "Welcome to the online university course catalog. Search for electives.";
            const cleanRes = KC.evaluate(cleanText);
            this.assert(cleanRes.score === 0, "KeywordScanner: Clean educational text produces 0 risk score");

            const threatText = "URGENT ACTION REQUIRED: Account suspended! Confirm identity immediately to restore access.";
            const threatRes = KC.evaluate(threatText);
            this.assert(threatRes.score > 0.20, "KeywordScanner: High-pressure urgency text triggers penalty", `Score: ${threatRes.score}`);
            this.assert(threatRes.categoryCount >= 1, "KeywordScanner: Categorizes urgency triggers correctly");
        },

        testFormCheck: function () {
            const FC = TrustOS.FormCheck;
            const res = FC.evaluate();

            this.assert(typeof res.score === 'number', "FormCheck: Returns valid numeric score");
            this.assert(Array.isArray(res.reasons), "FormCheck: Returns reasons array");
        },

        testRiskEngine: function () {
            const RE = TrustOS.RiskEngine;

            // Test Whitelist override
            const allowedRes = RE.analyzePage({
                allowedDomains: [window.location.hostname.toLowerCase()]
            });
            this.assert(allowedRes.isWhitelisted, "RiskEngine: Honors user-defined allowlist");
            this.assert(allowedRes.score === 0, "RiskEngine: Allowlisted domain score is 0");

            // Test Normal Analysis
            const evalRes = RE.analyzePage();
            this.assert(evalRes.score >= 0 && evalRes.score <= 1.0, "RiskEngine: Score normalized within [0.0, 1.0]");
            this.assert(typeof evalRes.riskLevel === 'string', "RiskEngine: Risk level is defined");
        }
    };

    root.TrustOSTests = TrustOSTests;
})(typeof window !== 'undefined' ? window : this);
