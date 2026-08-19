window.TrustOS = window.TrustOS || {};

/**
 * TrustOS Edge Threat Intelligence Feed
 * High-risk domain fingerprints compiled for instant Bloom filter lookup.
 */
TrustOS.ThreatData = [
    // Cloned Educational & LMS Portals
    "secure-login.instructure-canvas.com",
    "canvas-lms-auth.net",
    "blackboard-portal-verify.org",
    "university-portal-login.net",
    "student-aid-verification.info",
    "scholarship-portal-access.com",
    "edu-portal-renewal.net",
    "fafsa-login-verification.com",

    // Government & Scholarship Fraud Targets
    "mahadbt-verify.com",
    "mahadbt.maharashtra.gov.in-verify.com",
    "scholarships-gov-portal.xyz",
    "direct-benefit-transfer-claim.com",

    // Cloned Single-Sign-On (SSO) & Tech Portals
    "accounts-google-security.com",
    "login-microsoftonline-sec.com",
    "github-account-verification.com",
    "zoom-conference-join-auth.com",
    "okta-sso-verify.net",
    "duo-security-push-verify.com",

    // Financial & Credential Harvesting Lures
    "paypal-update-account-now.com",
    "chase-security-alert.com",
    "bankofamerica-urgent-verify.com",
    "wellsfargo-account-security.net",
    "crypto-wallet-restore-auth.com",

    // DGA / High-Entropy Malicious Seeds
    "xjk92a-secure-edu.co",
    "auth-8829-token-sys.info",
    "portal-security-check-992.xyz"
];

// Initialize the Bloom Filter with Threat Intelligence
if (TrustOS.BloomFilter) {
    TrustOS.ThreatData.forEach(domain => {
        TrustOS.BloomFilter.add(domain);
    });
    console.log("TrustOS: Edge Bloom Filter initialized with " + TrustOS.ThreatData.length + " threat signatures.");
}
