// TRUSTOS AI HEURISTIC ENGINE - UI Injector & Execution logic
// Relies on TrustOS.RiskEngine loaded prior in manifest.json

let currentRiskData = null;

function activateShield(riskData) {
    console.log(`TRUSTOS: High Risk Detected (Score: ${(riskData.score * 100).toFixed(0)}%)`);

    // Create Shadow DOM Overlay
    const overlay = document.createElement('div');
    overlay.id = 'trustos-overlay-root';

    // Build the explanation list
    const reasonsHtml = riskData.reasons.map(r => `<li>${r}</li>`).join('');

    overlay.innerHTML = `
        <div class="trustos-shield-container">
            <h1 class="trustos-title">TRUSTOS SHIELD ACTIVATED</h1>
            <h2 class="trustos-subtitle">Potential Phishing Detected</h2>
            
            <div class="trustos-explanation">
                <h3 style="margin-top: 0; display: flex; align-items: center; gap: 10px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff4b4b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    AI Risk Assessment
                </h3>
                <p><strong>Score: ${(riskData.score * 100).toFixed(0)}%</strong>. Access to this page has been paused because:</p>
                <ul>
                    ${reasonsHtml}
                </ul>
                <p style="margin-bottom: 0px; color: #ffbaba;">Recommendation: Close this tab immediately if you do not strictly trust this source.</p>
            </div>

            <div class="trustos-actions">
                <button id="trustos-go-back" class="trustos-btn trustos-btn-primary">GO BACK TO SAFETY</button>
                <button id="trustos-override" class="trustos-btn trustos-btn-secondary">PROCEED ANYWAY (UNSAFE)</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Event Listeners for buttons
    document.getElementById('trustos-go-back').addEventListener('click', () => {
        window.history.back(); // Or close tab if history is empty
    });

    const overrideBtn = document.getElementById('trustos-override');
    // Implement Friction for proceeding
    overrideBtn.innerHTML = "PROCEED ANYWAY (WAIT 3s)";
    overrideBtn.classList.add('trustos-disabled');
    let countdown = 3;
    const interval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            overrideBtn.innerHTML = `PROCEED ANYWAY (WAIT ${countdown}s)`;
        } else {
            clearInterval(interval);
            overrideBtn.innerHTML = "PROCEED ANYWAY (UNSAFE)";
            overrideBtn.classList.remove('trustos-disabled');
            overrideBtn.addEventListener('click', removeShield);
        }
    }, 1000);
}

function runDetection() {
    if (!TrustOS || !TrustOS.RiskEngine) {
        console.error("TRUSTOS Risk Engine not loaded.");
        return;
    }

    currentRiskData = TrustOS.RiskEngine.analyzePage();

    if (currentRiskData.isHighRisk) {
        activateShield(currentRiskData);
    }
}

function removeShield() {
    const overlay = document.getElementById('trustos-overlay-root');
    if (overlay) {
        overlay.remove();
    }
}

// Listen for messages from popup to supply current risk score
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_RISK_DATA") {
        if (!currentRiskData && window.TrustOS && window.TrustOS.RiskEngine) {
            currentRiskData = window.TrustOS.RiskEngine.analyzePage();
        }
        sendResponse({ riskData: currentRiskData });
    }
});

// Initial Check Configuration
chrome.storage.local.get(['shieldEnabled'], function (result) {
    if (result.shieldEnabled !== false) { // Default to true
        // Short delay to ensure DOM is ready
        setTimeout(runDetection, 500);
    }
});

// Listen for Toggle Changes from Popup
chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (changes.shieldEnabled) {
        if (changes.shieldEnabled.newValue === true) {
            runDetection();
        } else {
            removeShield();
            currentRiskData = null;
        }
    }
});
