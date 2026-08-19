window.TrustOS = window.TrustOS || {};

/**
 * TrustOS Form & Credential Security Scanner
 * Inspects authentication forms, cross-origin submit actions, obscured inputs, and insecure transmissions.
 */
TrustOS.FormCheck = {
    evaluate: function () {
        const currentHost = (window.location.hostname || '').toLowerCase();
        const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'));
        const forms = Array.from(document.querySelectorAll('form'));
        
        let score = 0;
        let reasons = [];
        let hasLoginForm = passwordInputs.length > 0;
        let crossOriginSubmit = false;
        let obscuredInputs = false;
        let insecureSubmission = false;

        // 1. Password Input Presence
        if (hasLoginForm) {
            score += TrustOS.Config.WEIGHTS.LOGIN_FORM_PRESENT;
            reasons.push("Page contains sensitive credential input fields (password solicit).");
        }

        // 2. Cross-Origin Form Action Audit
        forms.forEach(form => {
            const action = form.getAttribute('action');
            if (action && !action.startsWith('#') && !action.startsWith('javascript:')) {
                try {
                    const actionUrl = new URL(action, window.location.href);
                    const targetHost = actionUrl.hostname.toLowerCase();

                    // Check if form posts data to a different external domain
                    if (targetHost && targetHost !== currentHost && !currentHost.endsWith(targetHost) && !targetHost.endsWith(currentHost)) {
                        crossOriginSubmit = true;
                        score += TrustOS.Config.WEIGHTS.CROSS_ORIGIN_FORM;
                        reasons.push(`Cross-Origin Form Action: Form submits credentials externally to '${targetHost}' instead of current origin '${currentHost}'.`);
                    }

                    // Check for insecure plaintext HTTP transmission
                    if (actionUrl.protocol === 'http:' && window.location.protocol === 'https:') {
                        insecureSubmission = true;
                        score += 0.20;
                        reasons.push("Insecure Form Action: Form transmits data over unencrypted HTTP protocol.");
                    }
                } catch (e) {
                    // Invalid URL in action attribute
                }
            }
        });

        // 3. Obscured / Hidden Credential Elements (Anti-Analysis & Stealth Stealers)
        passwordInputs.forEach(input => {
            const style = window.getComputedStyle(input);
            const isHidden = style.display === 'none' ||
                             style.visibility === 'hidden' ||
                             parseFloat(style.opacity) < 0.1 ||
                             input.offsetWidth === 0 ||
                             input.offsetHeight === 0 ||
                             parseInt(style.left, 10) < -1000;

            if (isHidden) {
                obscuredInputs = true;
                score += TrustOS.Config.WEIGHTS.OBSCURED_ELEMENTS;
                reasons.push("Stealth Field Detected: Password input is hidden or obscured from visible rendering.");
            }
        });

        // Check for generic credential collection without a enclosing <form>
        if (hasLoginForm && forms.length === 0) {
            score += 0.10;
            reasons.push("Unstructured Credential Collection: Password field exists outside standard HTML <form> element.");
        }

        return {
            hasLoginForm: hasLoginForm,
            crossOriginSubmit: crossOriginSubmit,
            obscuredInputs: obscuredInputs,
            insecureSubmission: insecureSubmission,
            score: Math.min(score, 0.8),
            reasons: reasons
        };
    }
};
