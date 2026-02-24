window.TrustOS = window.TrustOS || {};

TrustOS.FormCheck = {
    evaluate: function () {
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        const hasLoginForm = passwordInputs.length > 0;

        return {
            hasLoginForm: hasLoginForm,
            score: hasLoginForm ? TrustOS.Config.WEIGHTS.LOGIN_FORM_PRESENT : 0
        };
    }
};
