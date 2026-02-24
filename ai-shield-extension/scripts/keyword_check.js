window.TrustOS = window.TrustOS || {};

TrustOS.KeywordCheck = {
    evaluate: function (textContext) {
        let score = 0;
        let matchedReasons = [];

        // 1. Static Heuristics (Legacy Module)
        const text = textContext.toLowerCase();
        const basePenalty = TrustOS.Config.WEIGHTS.URGENCY_KEYWORDS / 2;

        TrustOS.Config.SUSPICIOUS_TERMS.forEach(term => {
            if (text.includes(term)) {
                matchedReasons.push(`Static Match: '${term}' found.`);
                score += basePenalty;
            }
        });

        // 2. ML Inference (Wasm Module)
        if (TrustOS.WasmLoader && TrustOS.WasmLoader.isReady) {
            const mlResult = TrustOS.WasmLoader.analyzeLinguistics(textContext);
            if (mlResult.score > 0) {
                score += mlResult.score;
                matchedReasons.push(...mlResult.labels);
            }
        }

        return {
            score: Math.min(score, 0.6), // Cap maximum linguistic penalty to 0.6 (60%)
            matches: matchedReasons
        };
    }
};
