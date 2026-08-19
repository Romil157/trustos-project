window.TrustOS = window.TrustOS || {};

/**
 * TrustOS Linguistic Urgency & Threat Scanner
 * Evaluates high-pressure linguistic markers, psychological coercion phrases, and ML anomaly vectors.
 */
TrustOS.KeywordCheck = {
    // Categorized High-Risk Threat Markers
    CATEGORIES: {
        ACCOUNT_COERCION: [
            'account suspended', 'account locked', 'unauthorized access',
            'security breach', 'immediate verification', 'verify your account',
            'session expired', 'confirm identity immediately', 'password expires'
        ],
        FINANCIAL_LURES: [
            'financial aid hold', 'scholarship disbursement', 'tuition overdue',
            'update billing information', 'refund pending', 'direct deposit problem',
            'wire transfer confirmation', 'payment failed action required'
        ],
        URGENCY_TRIGGERS: [
            'urgent action required', 'within 24 hours', 'immediate response needed',
            'final warning', 'prevent deactivation', 'restore access now'
        ]
    },

    evaluate: function (textContext) {
        let score = 0;
        let matchedReasons = [];
        let detectedCategories = new Set();
        const text = (textContext || '').toLowerCase();

        if (!text || text.length === 0) {
            return { score: 0, matches: [] };
        }

        // 1. Scan Categorized Threat Markers
        for (const [categoryName, terms] of Object.entries(this.CATEGORIES)) {
            terms.forEach(term => {
                // Word boundary matching for accuracy
                const regex = new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
                if (regex.test(text)) {
                    detectedCategories.add(categoryName);
                    score += 0.10;
                    matchedReasons.push(`High-Risk Phrase: '${term}' (${categoryName.replace('_', ' ')})`);
                }
            });
        }

        // 2. Scan General Suspicious Terms from Config
        if (TrustOS.Config && TrustOS.Config.SUSPICIOUS_TERMS) {
            TrustOS.Config.SUSPICIOUS_TERMS.forEach(term => {
                if (text.includes(term.toLowerCase()) && !matchedReasons.some(r => r.includes(`'${term}'`))) {
                    score += 0.05;
                    matchedReasons.push(`Suspicious Term: '${term}' found in visible page content.`);
                }
            });
        }

        // Multi-category coercion multiplier
        if (detectedCategories.size >= 2) {
            score += 0.15;
            matchedReasons.push("Compound Pressure Tactics: Multiple coercion categories combined on a single page.");
        }

        // 3. Edge WebAssembly / ML Model Context Analysis
        if (TrustOS.WasmLoader && TrustOS.WasmLoader.isReady) {
            const mlResult = TrustOS.WasmLoader.analyzeLinguistics(text);
            if (mlResult.score > 0) {
                score += mlResult.score;
                matchedReasons.push(...mlResult.labels);
            }
        }

        return {
            score: Math.min(score, 0.60), // Cap at 60%
            matches: matchedReasons,
            categoryCount: detectedCategories.size
        };
    }
};
