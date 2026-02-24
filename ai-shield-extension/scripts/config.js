window.TrustOS = window.TrustOS || {};

TrustOS.Config = {
    WEIGHTS: {
        URGENCY_KEYWORDS: 0.15,
        LOGIN_FORM_PRESENT: 0.2,
        DOMAIN_MISMATCH: 0.5,
        OBSCURED_ELEMENTS: 0.15
    },
    SUSPICIOUS_TERMS: [
        'verify', 'urgent', 'suspend', 'bank', 'login', 'password', 'update account', 'validate', 'security alert'
    ],
    TRUSTED_DOMAINS: [
        'university.edu',
        'google.com',
        'canvas.instructure.com',
        'github.com'
    ],
    RISK_THRESHOLD: 0.6
};
