window.TrustOS = window.TrustOS || {};

TrustOS.Config = {
    // Modular Risk Vector Weights (Sum to 1.0)
    WEIGHTS: {
        BLOOM_FILTER_MATCH: 0.90,
        HOMOGRAPH_PUNYCODE: 0.65,
        TYPOSQUATTING: 0.45,
        DOMAIN_MISMATCH: 0.35,
        ENTROPY_ANOMALY: 0.25,
        CROSS_ORIGIN_FORM: 0.40,
        LOGIN_FORM_PRESENT: 0.20,
        OBSCURED_ELEMENTS: 0.20,
        URGENCY_KEYWORDS: 0.15,
        WASM_ML_INFERENCE: 0.25
    },

    // Sensitivity Thresholds
    SENSITIVITY_PROFILES: {
        STRICT: 0.40,
        BALANCED: 0.60,
        PERMISSIVE: 0.80
    },

    DEFAULT_SENSITIVITY: 'BALANCED',
    RISK_THRESHOLD: 0.60,

    // High-Value Target Domains for Typosquatting & Impersonation Detection
    PROTECTED_BRANDS: [
        { name: 'Canvas LMS', domain: 'canvas.instructure.com' },
        { name: 'Google Accounts', domain: 'accounts.google.com' },
        { name: 'Microsoft 365', domain: 'login.microsoftonline.com' },
        { name: 'GitHub', domain: 'github.com' },
        { name: 'Blackboard', domain: 'blackboard.com' },
        { name: 'Zoom', domain: 'zoom.us' },
        { name: 'PayPal', domain: 'paypal.com' },
        { name: 'Chase Bank', domain: 'chase.com' },
        { name: 'Bank of America', domain: 'bankofamerica.com' },
        { name: 'MahaDBT Portal', domain: 'mahadbt.maharashtra.gov.in' }
    ],

    // Trusted Institutional and Global Domains
    TRUSTED_DOMAINS: [
        'instructure.com',
        'google.com',
        'microsoft.com',
        'github.com',
        'blackboard.com',
        'zoom.us',
        'edu',
        'ac.uk',
        'gov.in',
        'gov'
    ],

    // High-Risk Linguistic Phishing & Coercion Patterns
    SUSPICIOUS_TERMS: [
        'verify your account',
        'urgent action required',
        'account suspended',
        'immediate verification',
        'password expires',
        'security breach detected',
        'unauthorized access attempt',
        'update billing information',
        'confirm identity immediately',
        'session terminated',
        'financial aid hold',
        'scholarship disbursement notice',
        'tuition overdue urgent',
        'login to validate',
        'click here to restore access'
    ],

    // Shannon Entropy Thresholds for Domain Obfuscation (DGA detection)
    ENTROPY_THRESHOLD: 3.85,

    // Maximum allowed Levenshtein distance for typosquatting alert
    TYPOSQUATTING_DISTANCE_THRESHOLD: 2
};
