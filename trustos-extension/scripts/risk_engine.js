window.TrustOS = window.TrustOS || {};

/**
 * TrustOS Multi-Vector Risk Engine
 * Aggregates signals across Bloom filters, domain heuristics, form audits, and linguistic ML models.
 */
TrustOS.RiskEngine = {
    // Current active sensitivity threshold
    currentThreshold: TrustOS.Config.RISK_THRESHOLD,

    setThreshold: function (threshold) {
        if (typeof threshold === 'number' && threshold >= 0 && threshold <= 1) {
            this.currentThreshold = threshold;
        }
    },

    analyzePage: function (options = {}) {
        const hostname = (window.location.hostname || '').toLowerCase();
        const url = window.location.href || '';
        let totalScore = 0;
        let reasons = [];
        let telemetry = {};

        // Check if domain is allowlisted locally by user
        if (options.allowedDomains && options.allowedDomains.includes(hostname)) {
            return {
                score: 0,
                isHighRisk: false,
                isMediumRisk: false,
                isWhitelisted: true,
                reasons: ["Domain is currently in user's trusted allowlist."],
                telemetry: { status: "WHITELISTED", hostname: hostname }
            };
        }

        // 1. Text & Linguistic Anomaly Analysis
        const bodyText = (document.body ? (document.body.innerText || "") : "");
        const keywordResult = TrustOS.KeywordCheck.evaluate(bodyText);
        totalScore += keywordResult.score;
        if (keywordResult.matches.length > 0) {
            reasons.push(...keywordResult.matches);
        }
        telemetry.linguistics = {
            score: keywordResult.score,
            categoryCount: keywordResult.categoryCount || 0
        };

        // 2. Form & Credential Harvest Analysis
        const formResult = TrustOS.FormCheck.evaluate();
        totalScore += formResult.score;
        if (formResult.reasons.length > 0) {
            reasons.push(...formResult.reasons);
        }
        telemetry.forms = {
            hasLoginForm: formResult.hasLoginForm,
            crossOriginSubmit: formResult.crossOriginSubmit,
            obscuredInputs: formResult.obscuredInputs,
            insecureSubmission: formResult.insecureSubmission,
            score: formResult.score
        };

        // 3. Domain, Bloom Filter, Entropy, & Typosquatting Analysis
        const domainResult = TrustOS.DomainCheck.evaluate(hostname);
        telemetry.domain = {
            hostname: domainResult.hostname,
            isTrusted: domainResult.isTrusted,
            isKnownThreat: domainResult.isKnownThreat,
            entropy: domainResult.entropy,
            score: domainResult.riskScore
        };

        if (domainResult.isKnownThreat) {
            // Immediate high-priority flag from Bloom filter
            totalScore += domainResult.riskScore;
            reasons.push(...domainResult.matchedReasons);
        } else if (domainResult.isTrusted) {
            // If domain is explicitly trusted, significantly reduce false positive risks
            totalScore = Math.max(0, totalScore - 0.50);
        } else {
            // Untrusted origin: apply domain-specific penalties
            totalScore += domainResult.riskScore;
            if (domainResult.matchedReasons.length > 0) {
                reasons.push(...domainResult.matchedReasons);
            }

            // Critical Rule: Password Solicitation on an Untrusted Origin
            if (formResult.hasLoginForm) {
                totalScore += 0.35;
                reasons.push(`Unverified Credential Gate: Password solicitation requested on unrecognized domain '${hostname}'.`);
            }
        }

        // Final score normalization (0.00 to 1.00)
        const finalScore = Math.min(Math.max(totalScore, 0.0), 1.0);
        const threshold = options.threshold || this.currentThreshold;
        const isHighRisk = finalScore >= threshold;
        const isMediumRisk = !isHighRisk && finalScore >= (threshold * 0.5);

        let riskLevel = "SAFE";
        if (isHighRisk) riskLevel = "HIGH";
        else if (isMediumRisk) riskLevel = "ELEVATED";

        return {
            score: Number(finalScore.toFixed(2)),
            threshold: threshold,
            isHighRisk: isHighRisk,
            isMediumRisk: isMediumRisk,
            isWhitelisted: false,
            riskLevel: riskLevel,
            reasons: Array.from(new Set(reasons)), // Deduplicate reasons
            telemetry: telemetry,
            url: url,
            timestamp: new Date().toISOString()
        };
    }
};
