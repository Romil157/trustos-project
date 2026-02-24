window.TrustOS = window.TrustOS || {};

TrustOS.RiskEngine = {
    analyzePage: function () {
        let totalScore = 0;
        let reasons = [];

        // 1. Text Analysis
        const bodyText = document.body.innerText || "";
        const keywordResult = TrustOS.KeywordCheck.evaluate(bodyText);
        totalScore += keywordResult.score;
        if (keywordResult.matches.length > 0) {
            reasons.push(`Suspicious urgency keywords found: ${keywordResult.matches.join(', ')}`);
        }

        // 2. Form Analysis
        const formResult = TrustOS.FormCheck.evaluate();
        totalScore += formResult.score;
        if (formResult.hasLoginForm) {
            reasons.push("Page is soliciting credentials (password input detected).");
        }

        // 3. Domain Analysis (incorporating Bloom Filter)
        const domainResult = TrustOS.DomainCheck.evaluate(window.location.hostname);

        if (domainResult.isKnownThreat) {
            // Instant flag from edge threat intelligence
            totalScore += domainResult.riskScore;
            reasons.push(...domainResult.matchedReasons);
        } else if (!domainResult.isTrusted && formResult.hasLoginForm) {
            // Critical Rule: Password request on an unknown domain
            totalScore += domainResult.riskScore;
            reasons.push(`Domain '${domainResult.hostname}' is not a recognized safe domain for logging in.`);
        } else if (!domainResult.isTrusted && keywordResult.matches.length > 0) {
            // Linguistic threat on unknown domain
            totalScore += (domainResult.riskScore / 2); // Partial penalty
        }

        totalScore = Math.min(totalScore, 1.0); // Cap at 1.0 (100%)

        return {
            score: totalScore,
            isHighRisk: totalScore >= TrustOS.Config.RISK_THRESHOLD,
            reasons: reasons
        };
    }
};
