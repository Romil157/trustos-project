window.TrustOS = window.TrustOS || {};

// Mock database of malicious domains (in production this would be thousands)
TrustOS.ThreatData = [
    "mahadbt-verify.com",
    "mahadbt.maharashtra.gov.in-verify.com",
    "secure-login.instructure-canvas.com",
    "paypal-update-account-now.com",
    "university-portal-login.net",
    "chase-security-alert.com"
];

// Initialize the Bloom Filter on edge
if (TrustOS.BloomFilter) {
    TrustOS.ThreatData.forEach(domain => {
        TrustOS.BloomFilter.add(domain);
    });
    console.log("TRUSTOS: Edge Bloom Filter initialized with threat data.");
}
