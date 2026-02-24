window.TrustOS = window.TrustOS || {};

TrustOS.DomainCheck = {
    evaluate: function (hostname) {
        let isTrusted = false;

        // 1. Check Bloom Filter for instantaneous known-threat matching
        let isKnownThreat = false;
        if (TrustOS.BloomFilter && TrustOS.BloomFilter.test(hostname)) {
            // For a high-security extension, flag immediately if matched
            isKnownThreat = true;
        }

        // 2. Check Trusted list
        TrustOS.Config.TRUSTED_DOMAINS.forEach(d => {
            if (hostname.endsWith(d)) {
                isTrusted = true;
            }
        });

        // 3. Calculate Domain Risk
        let riskScore = 0;
        let reasons = [];

        if (isKnownThreat) {
            riskScore = 0.9; // Very high base risk if marked malicious
            reasons.push(`Domain '${hostname}' matches a known threat pattern in the local Bloom filter.`);
        } else if (!isTrusted) {
            riskScore = TrustOS.Config.WEIGHTS.DOMAIN_MISMATCH;
        }

        return {
            isTrusted: isTrusted,
            isKnownThreat: isKnownThreat,
            hostname: hostname,
            riskScore: isTrusted ? 0 : riskScore,
            matchedReasons: reasons
        };
    }
};
