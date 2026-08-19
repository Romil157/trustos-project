// TrustOS Edge Phishing Detection & UI Injector
// Integrates with TrustOS.RiskEngine and encapsulates UI inside Shadow DOM.

(function () {
    let currentRiskData = null;
    let shadowRoot = null;
    let overlayHost = null;
    let mutationTimer = null;
    let isShieldActive = false;

    // Load styles into Shadow DOM
    function getOverlayStyles() {
        return `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            
            :host, #trustos-overlay-host {
                all: initial;
                display: block;
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 2147483647;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }

            .trustos-overlay-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(10, 15, 29, 0.92);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #f8fafc;
                opacity: 0;
                animation: trustosFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                padding: 20px;
                box-sizing: border-box;
            }

            @keyframes trustosFadeIn {
                to { opacity: 1; }
            }

            .trustos-shield-container {
                background: rgba(26, 34, 53, 0.78);
                border: 1px solid rgba(148, 163, 184, 0.22);
                box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(239, 68, 68, 0.3);
                border-radius: 20px;
                padding: 2.5rem;
                max-width: 660px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                text-align: center;
                animation: trustosSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                transform: translateY(24px);
                box-sizing: border-box;
            }

            @keyframes trustosSlideUp {
                to { transform: translateY(0); }
            }

            .trustos-badge-header {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(239, 68, 68, 0.15);
                border: 1px solid rgba(239, 68, 68, 0.4);
                color: #fca5a5;
                padding: 6px 14px;
                border-radius: 9999px;
                font-size: 0.8rem;
                font-weight: 700;
                letter-spacing: 1px;
                text-transform: uppercase;
                margin-bottom: 1rem;
            }

            .trustos-title {
                font-size: 1.85rem;
                font-weight: 800;
                margin: 0 0 0.5rem 0;
                color: #ffffff;
                letter-spacing: -0.5px;
            }

            .trustos-subtitle {
                font-size: 0.95rem;
                color: #94a3b8;
                margin: 0 0 1.5rem 0;
                line-height: 1.5;
            }

            .trustos-explanation {
                text-align: left;
                background: rgba(15, 23, 42, 0.65);
                padding: 1.25rem 1.5rem;
                border-radius: 14px;
                margin-bottom: 1.75rem;
                border: 1px solid rgba(148, 163, 184, 0.12);
                border-left: 4px solid #ef4444;
            }

            .trustos-assessment-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.75rem;
            }

            .trustos-assessment-title {
                margin: 0;
                font-size: 0.95rem;
                font-weight: 700;
                color: #f8fafc;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .trustos-score-pill {
                background: #ef4444;
                color: #ffffff;
                font-weight: 800;
                font-size: 0.8rem;
                padding: 3px 10px;
                border-radius: 9999px;
                letter-spacing: 0.5px;
            }

            .trustos-reasons-list {
                color: #e2e8f0;
                padding-left: 1.25rem;
                margin: 0.75rem 0;
                font-size: 0.88rem;
                line-height: 1.6;
            }

            .trustos-reasons-list li {
                margin-bottom: 0.4rem;
            }

            .trustos-advice {
                font-size: 0.82rem;
                color: #fca5a5;
                margin: 0.5rem 0 0 0;
            }

            .trustos-actions {
                display: flex;
                flex-direction: column;
                gap: 0.65rem;
                align-items: center;
            }

            .trustos-btn {
                all: unset;
                box-sizing: border-box;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 0.85rem 1.75rem;
                font-size: 0.92rem;
                font-weight: 600;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                width: 100%;
                max-width: 420px;
                letter-spacing: 0.3px;
                text-align: center;
            }

            .trustos-btn-primary {
                background-color: #3b82f6;
                color: #ffffff;
                box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.39);
            }

            .trustos-btn-primary:hover {
                background-color: #2563eb;
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.45);
            }

            .trustos-btn-whitelist {
                background-color: rgba(16, 185, 129, 0.15);
                color: #34d399;
                border: 1px solid rgba(16, 185, 129, 0.35);
            }

            .trustos-btn-whitelist:hover {
                background-color: rgba(16, 185, 129, 0.25);
                color: #10b981;
            }

            .trustos-btn-secondary {
                background-color: transparent;
                color: #94a3b8;
                border: 1px solid rgba(148, 163, 184, 0.25);
            }

            .trustos-btn-secondary:not(.trustos-disabled):hover {
                background-color: rgba(239, 68, 68, 0.1);
                color: #ef4444;
                border-color: #ef4444;
            }

            .trustos-disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .trustos-footer-meta {
                margin-top: 1.25rem;
                font-size: 0.75rem;
                color: #64748b;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .trustos-copy-report {
                background: none;
                border: none;
                color: #38bdf8;
                cursor: pointer;
                font-size: 0.75rem;
                text-decoration: underline;
                padding: 0;
            }

            .trustos-copy-report:hover {
                color: #7dd3fc;
            }
        `;
    }

    function activateShield(riskData) {
        if (isShieldActive) return;
        isShieldActive = true;

        // Remove any existing overlay element
        removeShield();

        overlayHost = document.createElement('div');
        overlayHost.id = 'trustos-overlay-host';
        shadowRoot = overlayHost.attachShadow({ mode: 'open' });

        const reasonsHtml = (riskData.reasons || [])
            .map(r => `<li>${r}</li>`)
            .join('');

        const scorePercent = (riskData.score * 100).toFixed(0);

        shadowRoot.innerHTML = `
            <style>${getOverlayStyles()}</style>
            <div class="trustos-overlay-backdrop">
                <div class="trustos-shield-container">
                    <div class="trustos-badge-header">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        Security Alert
                    </div>
                    <h1 class="trustos-title">TrustOS Shield Activated</h1>
                    <h2 class="trustos-subtitle">High-probability credential harvesting or deceptive phishing threat detected.</h2>
                    
                    <div class="trustos-explanation">
                        <div class="trustos-assessment-header">
                            <h3 class="trustos-assessment-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                Risk Assessment
                            </h3>
                            <span class="trustos-score-pill">${scorePercent}% Risk</span>
                        </div>
                        <p style="margin: 0 0 8px 0; font-size: 0.88rem; color: #cbd5e1;">Interaction with this webpage has been paused because:</p>
                        <ul class="trustos-reasons-list">
                            ${reasonsHtml}
                        </ul>
                        <p class="trustos-advice">Security Advice: Do not enter passwords, emails, or personal identifiers on this page.</p>
                    </div>

                    <div class="trustos-actions">
                        <button id="trustos-go-back" class="trustos-btn trustos-btn-primary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                            Go Back to Safety
                        </button>
                        <button id="trustos-whitelist" class="trustos-btn trustos-btn-whitelist">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                            Trust This Domain (Session Allowlist)
                        </button>
                        <button id="trustos-override" class="trustos-btn trustos-btn-secondary trustos-disabled">
                            Proceed Anyway (Wait 3s)
                        </button>
                    </div>

                    <div class="trustos-footer-meta">
                        <span>TrustOS Zero-Transmission Edge Defense</span>
                        <button id="trustos-copy-report" class="trustos-copy-report">Copy Threat Diagnostic Report</button>
                    </div>
                </div>
            </div>
        `;

        document.documentElement.appendChild(overlayHost);

        // Bind Go Back
        const backBtn = shadowRoot.getElementById('trustos-go-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.close();
                }
            });
        }

        // Bind Session Whitelist
        const whitelistBtn = shadowRoot.getElementById('trustos-whitelist');
        if (whitelistBtn) {
            whitelistBtn.addEventListener('click', () => {
                const hostname = (window.location.hostname || '').toLowerCase();
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.get(['allowedDomains'], (res) => {
                        const list = res.allowedDomains || [];
                        if (!list.includes(hostname)) {
                            list.push(hostname);
                            chrome.storage.local.set({ allowedDomains: list }, () => {
                                removeShield();
                            });
                        } else {
                            removeShield();
                        }
                    });
                } else {
                    removeShield();
                }
            });
        }

        // Bind Friction Override Countdown
        const overrideBtn = shadowRoot.getElementById('trustos-override');
        let countdown = 3;
        const interval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                overrideBtn.textContent = `Proceed Anyway (Wait ${countdown}s)`;
            } else {
                clearInterval(interval);
                overrideBtn.textContent = "Proceed Anyway (Unsafe)";
                overrideBtn.classList.remove('trustos-disabled');
                overrideBtn.addEventListener('click', removeShield);
            }
        }, 1000);

        // Bind Copy Diagnostic Report
        const copyBtn = shadowRoot.getElementById('trustos-copy-report');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const report = JSON.stringify(riskData, null, 2);
                navigator.clipboard.writeText(report).then(() => {
                    copyBtn.textContent = "Report Copied to Clipboard!";
                    setTimeout(() => {
                        copyBtn.textContent = "Copy Threat Diagnostic Report";
                    }, 2500);
                });
            });
        }
    }

    function removeShield() {
        if (overlayHost) {
            overlayHost.remove();
            overlayHost = null;
            shadowRoot = null;
        }
        isShieldActive = false;
    }

    function runDetection() {
        if (!window.TrustOS || !window.TrustOS.RiskEngine) {
            return;
        }

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['shieldEnabled', 'allowedDomains', 'sensitivityThreshold'], function (settings) {
                if (settings.shieldEnabled === false) {
                    removeShield();
                    currentRiskData = null;
                    return;
                }

                const options = {
                    allowedDomains: settings.allowedDomains || [],
                    threshold: settings.sensitivityThreshold || window.TrustOS.Config.RISK_THRESHOLD
                };

                currentRiskData = window.TrustOS.RiskEngine.analyzePage(options);

                // Notify background worker of risk state
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({
                        type: "UPDATE_TAB_RISK",
                        riskData: currentRiskData
                    }).catch(() => {});
                }

                if (currentRiskData.isHighRisk) {
                    activateShield(currentRiskData);
                } else {
                    removeShield();
                }
            });
        } else {
            // Standalone mode without chrome runtime
            currentRiskData = window.TrustOS.RiskEngine.analyzePage();
            if (currentRiskData.isHighRisk) {
                activateShield(currentRiskData);
            }
        }
    }

    // Set up MutationObserver to detect dynamically injected credential forms
    function setupMutationObserver() {
        const observer = new MutationObserver(() => {
            if (mutationTimer) clearTimeout(mutationTimer);
            mutationTimer = setTimeout(runDetection, 300);
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    // Message Listener for popup communication
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === "GET_RISK_DATA") {
                if (!currentRiskData && window.TrustOS && window.TrustOS.RiskEngine) {
                    currentRiskData = window.TrustOS.RiskEngine.analyzePage();
                }
                sendResponse({ riskData: currentRiskData });
            } else if (request.type === "RESCAN_PAGE") {
                runDetection();
                sendResponse({ success: true, riskData: currentRiskData });
            }
        });
    }

    // Initial Execution
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            runDetection();
            setupMutationObserver();
        });
    } else {
        runDetection();
        setupMutationObserver();
    }

    // Expose TrustOS test trigger for playground simulation
    window.TrustOS.runDetection = runDetection;
    window.TrustOS.activateShield = activateShield;
    window.TrustOS.removeShield = removeShield;
})();
