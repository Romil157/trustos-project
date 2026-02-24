// popup.js

document.addEventListener('DOMContentLoaded', function () {
    const toggleSwitch = document.getElementById('toggle-switch');
    const statusText = document.getElementById('status-text');
    const statusCircle = document.getElementById('status-circle');
    const riskMeter = document.getElementById('risk-meter');
    const scoreText = document.getElementById('score-text');
    const breakdownBox = document.getElementById('breakdown-box');
    const reasonsList = document.getElementById('reasons-list');

    // 1. Initialize State
    chrome.storage.local.get(['shieldEnabled'], function (result) {
        const isEnabled = result.shieldEnabled !== false; // Default true
        toggleSwitch.checked = isEnabled;

        if (isEnabled) {
            fetchTabRiskData();
        } else {
            setDisabledUI();
        }
    });

    // 2. Toggle Listener
    toggleSwitch.addEventListener('change', () => {
        const isEnabled = toggleSwitch.checked;
        chrome.storage.local.set({ shieldEnabled: isEnabled }, function () {
            if (isEnabled) {
                // Changing to enabled, need to fetch data
                fetchTabRiskData();
            } else {
                setDisabledUI();
            }
        });
    });

    // 3. Fetch Data from Content Script
    function fetchTabRiskData() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (!tabs[0] || !tabs[0].url || tabs[0].url.startsWith('chrome://')) {
                setSafeUI(0, []);
                statusText.innerText = "System Page";
                statusCircle.className = "status-circle risk-med";
                scoreText.innerText = "Risk Score: N/A";
                return;
            }

            chrome.tabs.sendMessage(tabs[0].id, { type: "GET_RISK_DATA" }, function (response) {
                if (chrome.runtime.lastError) {
                    setSafeUI(0, ["Please refresh this page to activate AI Shield."]);
                    statusText.innerText = "Needs Refresh";
                    statusCircle.className = "status-circle risk-med";
                    return;
                }
                if (!response || !response.riskData) {
                    setSafeUI(0, ["Scanning in progress or no risk factors detected."]);
                    return;
                }

                updateRiskUI(response.riskData);
            });
        });
    }

    // 4. UI Updaters
    function setDisabledUI() {
        statusText.innerText = "Protection Disabled";
        statusCircle.className = "status-circle disabled";
        riskMeter.style.width = "0%";
        riskMeter.style.background = "var(--text-muted)";
        scoreText.innerText = "Risk Score: N/A";
        breakdownBox.classList.remove('visible');
    }

    function setSafeUI(score, msgArr = []) {
        statusText.innerText = "Safe";
        statusCircle.className = "status-circle"; // default green
        riskMeter.style.width = "5%";
        riskMeter.style.background = "var(--success)";
        scoreText.innerText = "Risk Score: ~0%";

        if (msgArr && msgArr.length > 0) {
            breakdownBox.classList.add('visible');
            reasonsList.innerHTML = msgArr.map(r => `<li>${r}</li>`).join('');
        } else {
            breakdownBox.classList.remove('visible');
        }
    }

    function updateRiskUI(riskData) {
        const scorePercent = (riskData.score * 100).toFixed(0);
        scoreText.innerText = `Risk Score: ${scorePercent}%`;
        riskMeter.style.width = `${Math.max(5, scorePercent)}%`;

        if (riskData.isHighRisk) {
            statusText.innerText = "High Risk";
            statusCircle.className = "status-circle risk-high";
            riskMeter.style.background = "var(--danger)";
        } else if (riskData.score > 0) {
            statusText.innerText = "Elevated Risk";
            statusCircle.className = "status-circle risk-med";
            riskMeter.style.background = "var(--warning)";
        } else {
            statusText.innerText = "Safe";
            statusCircle.className = "status-circle";
            riskMeter.style.background = "var(--success)";
        }

        // Breakdown
        if (riskData.reasons && riskData.reasons.length > 0) {
            breakdownBox.classList.add('visible');
            reasonsList.innerHTML = riskData.reasons.map(r => `<li>${r}</li>`).join('');
        } else {
            breakdownBox.classList.remove('visible');
        }
    }
});
