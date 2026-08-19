window.TrustOS = window.TrustOS || {};

/**
 * TrustOS Domain & Hostname Verification Engine
 * Analyzes Shannon entropy, typosquatting distance, IDN homographs, and Bloom filter threat feeds.
 */
TrustOS.DomainCheck = {
    /**
     * Calculate Shannon Entropy of a string to detect randomized / DGA domains
     */
    calculateEntropy: function (str) {
        if (!str || str.length === 0) return 0;
        const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (clean.length === 0) return 0;

        const frequencies = {};
        for (let i = 0; i < clean.length; i++) {
            const ch = clean[i];
            frequencies[ch] = (frequencies[ch] || 0) + 1;
        }

        let entropy = 0;
        for (const ch in frequencies) {
            const p = frequencies[ch] / clean.length;
            entropy -= p * Math.log2(p);
        }
        return entropy;
    },

    /**
     * Calculate Levenshtein Distance between two strings
     */
    levenshteinDistance: function (a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    },

    /**
     * Check for Cyrillic / Greek IDN Homograph lookalikes in Latin-appearing domains
     */
    checkHomograph: function (hostname) {
        // Cyrillic & Greek homoglyphs commonly used in phishing
        const homoglyphPattern = /[\u0400-\u04FF\u0370-\u03FF]/;
        const isPunycode = hostname.toLowerCase().startsWith('xn--') || hostname.toLowerCase().includes('.xn--');
        const hasHomoglyphs = homoglyphPattern.test(hostname);

        return {
            hasHomograph: isPunycode || hasHomoglyphs,
            isPunycode: isPunycode,
            details: isPunycode ? 'Punycode encoded domain (xn--) detected' : (hasHomoglyphs ? 'Cyrillic/Greek homoglyph characters detected in hostname' : null)
        };
    },

    /**
     * Check if hostname is a raw IPv4/IPv6 address
     */
    isIpAddress: function (hostname) {
        const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Pattern = /^\[?[0-9a-fA-F:]+\]?$/;
        return ipv4Pattern.test(hostname) || (ipv6Pattern.test(hostname) && hostname.includes(':'));
    },

    /**
     * Evaluate Typosquatting against registered high-value brands
     */
    checkTyposquatting: function (hostname) {
        const cleanHost = (hostname || '').toLowerCase();
        const parts = cleanHost.split('.');
        const domainSLD = parts.length >= 2 ? parts[parts.length - 2] : cleanHost;

        // Split domain into sub-tokens (e.g. 'accounts-g00gle' -> ['accounts-g00gle', 'accounts', 'g00gle'])
        const tokens = [domainSLD, ...domainSLD.split('-'), ...parts];

        let detectedBrand = null;
        let minDistance = Infinity;

        TrustOS.Config.PROTECTED_BRANDS.forEach(brand => {
            const brandParts = brand.domain.split('.');
            const brandSLD = brandParts.length >= 2 ? brandParts[brandParts.length - 2] : brand.domain;

            // Test SLD and all tokens
            tokens.forEach(token => {
                if (token && token.length >= 3) {
                    const dist = this.levenshteinDistance(token, brandSLD);
                    if (dist > 0 && dist <= TrustOS.Config.TYPOSQUATTING_DISTANCE_THRESHOLD && dist < minDistance) {
                        // Check that this is not actually the legitimate brand domain
                        if (!cleanHost.endsWith(brand.domain)) {
                            minDistance = dist;
                            detectedBrand = brand;
                        }
                    }
                }
            });
        });

        return {
            isTyposquat: detectedBrand !== null,
            brand: detectedBrand,
            distance: minDistance
        };
    },

    /**
     * Master Domain Evaluation
     */
    evaluate: function (hostname) {
        const cleanHost = (hostname || '').toLowerCase().trim();
        let isTrusted = false;
        let isKnownThreat = false;
        let riskScore = 0;
        let reasons = [];

        // 1. Check Bloom Filter (O(1) Instant Threat Lookup)
        if (TrustOS.BloomFilter && TrustOS.BloomFilter.test(cleanHost)) {
            isKnownThreat = true;
            riskScore += TrustOS.Config.WEIGHTS.BLOOM_FILTER_MATCH;
            reasons.push(`Domain '${cleanHost}' matches known phishing signature in local Bloom filter.`);
        }

        // 2. Check Trusted Registry
        TrustOS.Config.TRUSTED_DOMAINS.forEach(d => {
            if (cleanHost === d || cleanHost.endsWith('.' + d)) {
                isTrusted = true;
            }
        });

        if (isTrusted) {
            return {
                isTrusted: true,
                isKnownThreat: false,
                hostname: cleanHost,
                riskScore: 0,
                matchedReasons: []
            };
        }

        // 3. Check IDN Homograph & Punycode Spoofing
        const homographResult = this.checkHomograph(cleanHost);
        if (homographResult.hasHomograph) {
            riskScore += TrustOS.Config.WEIGHTS.HOMOGRAPH_PUNYCODE;
            reasons.push(`Potential Homograph Attack: ${homographResult.details}.`);
        }

        // 4. Check Typosquatting
        const typosquatResult = this.checkTyposquatting(cleanHost);
        if (typosquatResult.isTyposquat) {
            riskScore += TrustOS.Config.WEIGHTS.TYPOSQUATTING;
            reasons.push(`Typosquatting Detected: '${cleanHost}' closely mimics protected brand '${typosquatResult.brand.name}' (${typosquatResult.brand.domain}).`);
        }

        // 5. Check Shannon Entropy (Randomized / DGA Domains)
        const parts = cleanHost.split('.');
        const sld = parts.length >= 2 ? parts[parts.length - 2] : cleanHost;
        const entropy = this.calculateEntropy(sld);
        if (entropy >= TrustOS.Config.ENTROPY_THRESHOLD && sld.length > 8) {
            riskScore += TrustOS.Config.WEIGHTS.ENTROPY_ANOMALY;
            reasons.push(`High Shannon Entropy (${entropy.toFixed(2)}): Hostname demonstrates algorithmic randomness characteristic of disposable phishing domains.`);
        }

        // 6. Check Raw IP Address hostnames
        if (this.isIpAddress(cleanHost)) {
            riskScore += TrustOS.Config.WEIGHTS.DOMAIN_MISMATCH;
            reasons.push(`Direct IP Access: Browsing via raw IP address ('${cleanHost}') rather than an authenticated domain.`);
        }

        // 7. Check Excessive Subdomain Depth
        if (parts.length >= 5) {
            riskScore += 0.20;
            reasons.push(`Excessive Subdomain Stacking (${parts.length} levels) often used to obscure true destination domain.`);
        }

        // Base domain mismatch penalty if untrusted
        if (!isTrusted && !isKnownThreat && riskScore === 0) {
            riskScore += TrustOS.Config.WEIGHTS.DOMAIN_MISMATCH;
        }

        return {
            isTrusted: isTrusted,
            isKnownThreat: isKnownThreat,
            hostname: cleanHost,
            riskScore: Math.min(riskScore, 1.0),
            matchedReasons: reasons,
            entropy: entropy
        };
    }
};
