// TrustOS Popup Controller
// Manages telemetry synchronization, active tab communication, allowlists, and sensitivity settings.

document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const toggleSwitch = document.getElementById('toggle-switch');
    const statusText = document.getElementById('status-text');
    const statusCircle = document.getElementById('status-circle');
    const riskMeter = document.getElementById('risk-meter');
    const scoreText = document.getElementById('score-text');
    const thresholdText = document.getElementById('threshold-text');
    const breakdownBox = document.getElementById('breakdown-box');
    const reasonsList = document.getElementById('reasons-list');
    const rescanBtn = document.getElementById('rescan-btn');

    // Telemetry Elements
    const telEntropy = document.getElementById('tel-entropy');
    const telBloom = document.getElementById('tel-bloom');
    const telForm = document.getElementById('tel-form');
    const telMl = document.getElementById('tel-ml');
    const telHostname = document.getElementById('tel-hostname');

    // Allowlist Elements
    const newDomainInput = document.getElementById('new-domain-input');
    const addDomainBtn = document.getElementById('add-domain-btn');
    const allowedDomainsList = document.getElementById('allowed-domains-list');

    // Settings Elements
    const sensitivitySelect = document.getElementById('sensitivity-select');

    // Tab Navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const target = btn.getAttribute('data-tab');
            const targetEl = document.getElementById(target);
            if (targetEl) targetEl.classList.add('active');
        });
    });

    // 1. Initialize State & Settings
    chrome.storage.local.get(['shieldEnabled', 'allowedDomains', 'sensitivityThreshold'], function (data) {
        const isEnabled = data.shieldEnabled !== false;
        toggleSwitch.checked = isEnabled;

        if (data.sensitivityThreshold) {
            sensitivitySelect.value = data.sensitivityThreshold.toFixed(2);
            thresholdText.innerText = `Threshold: ${(data.sensitivityThreshold * 100).toFixed(0)}%`;
        }

        renderAllowlist(data.allowedDomains || []);

        if (isEnabled) {
            fetchTabRiskData();
        } else {
            setDisabledUI();
        }
    });

    // 2. Protection Toggle Listener
    toggleSwitch.addEventListener('change', () => {
        const isEnabled = toggleSwitch.checked;
        chrome.storage.local.set({ shieldEnabled: isEnabled }, function () {
            if (isEnabled) {
                fetchTabRiskData();
            } else {
                setDisabledUI();
            }
        });
    });

    // 3. Sensitivity Threshold Change
    sensitivitySelect.addEventListener('change', () => {
        const val = parseFloat(sensitivitySelect.value);
        chrome.storage.local.set({ sensitivityThreshold: val }, () => {
            thresholdText.innerText = `Threshold: ${(val * 100).toFixed(0)}%`;
            fetchTabRiskData();
        });
    });

    // 4. Allowlist Management
    addDomainBtn.addEventListener('click', () => {
        const domain = (newDomainInput.value || '').trim().toLowerCase();
        if (!domain) return;

        chrome.storage.local.get(['allowedDomains'], (res) => {
            const list = res.allowedDomains || [];
            if (!list.includes(domain)) {
                list.push(domain);
                chrome.storage.local.set({ allowedDomains: list }, () => {
                    newDomainInput.value = '';
                    renderAllowlist(list);
                    fetchTabRiskData();
                });
            }
        });
    });

    function renderAllowlist(domains) {
        allowedDomainsList.innerHTML = '';
        if (domains.length === 0) {
            allowedDomainsList.innerHTML = '<li style="font-size: 0.75rem; color: var(--text-muted); padding: 6px 0;">No custom allowed domains.</li>';
            return;
        }

        domains.forEach(d => {
            const li = document.createElement('li');
            li.className = 'domain-item';
            li.innerHTML = `
                <span>${d}</span>
                <button class="remove-btn" data-domain="${d}">Remove</button>
            `;
            li.querySelector('.remove-btn').addEventListener('click', () => {
                removeAllowedDomain(d);
            });
            allowedDomainsList.appendChild(li);
        });
    }

    function removeAllowedDomain(domain) {
        chrome.storage.local.get(['allowedDomains'], (res) => {
            const list = (res.allowedDomains || []).filter(d => d !== domain);
            chrome.storage.local.set({ allowedDomains: list }, () => {
                renderAllowlist(list);
                fetchTabRiskData();
            });
        });
    }

    // 5. Fetch Risk Data from Active Tab
    function fetchTabRiskData() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (!tabs[0] || !tabs[0].url || tabs[0].url.startsWith('chrome://')) {
                setSafeUI(0, ["System / Internal Browser Page"]);
                statusText.innerText = "System Page";
                statusCircle.className = "status-dot risk-med";
                scoreText.innerText = "Risk Score: N/A";
                telHostname.innerText = tabs[0] ? tabs[0].url : "internal";
                return;
            }

            try {
                const urlObj = new URL(tabs[0].url);
                telHostname.innerText = urlObj.hostname;
            } catch (e) {
                telHostname.innerText = tabs[0].url;
            }

            chrome.tabs.sendMessage(tabs[0].id, { type: "GET_RISK_DATA" }, function (response) {
                if (chrome.runtime.lastError || !response || !response.riskData) {
                    setSafeUI(0, ["Page is clear or refresh tab to initialize TrustOS script."]);
                    return;
                }
                updateRiskUI(response.riskData);
            });
        });
    }

    // 6. Rescan Trigger
    if (rescanBtn) {
        rescanBtn.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0] && tabs[0].id) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: "RESCAN_PAGE" }, function (response) {
                        if (response && response.riskData) {
                            updateRiskUI(response.riskData);
                        } else {
                            fetchTabRiskData();
                        }
                    });
                }
            });
        });
    }

    // 7. UI Status Updaters
    function setDisabledUI() {
        statusText.innerText = "Shield Disabled";
        statusCircle.className = "status-dot disabled";
        riskMeter.style.width = "0%";
        riskMeter.style.background = "#64748b";
        scoreText.innerText = "Risk Score: N/A";
        breakdownBox.classList.remove('visible');
    }

    function setSafeUI(score, msgArr = []) {
        statusText.innerText = "Safe Verified";
        statusCircle.className = "status-dot";
        riskMeter.style.width = "5%";
        riskMeter.style.background = "var(--success)";
        scoreText.innerText = "Risk Score: 0%";

        if (msgArr.length > 0) {
            breakdownBox.classList.add('visible');
            reasonsList.innerHTML = msgArr.map(r => `<li>${r}</li>`).join('');
        } else {
            breakdownBox.classList.remove('visible');
        }

        telEntropy.innerText = "Normal";
        telBloom.innerText = "Clean";
        telForm.innerText = "None";
        telMl.innerText = "Clear";
    }

    function updateRiskUI(riskData) {
        const scorePercent = (riskData.score * 100).toFixed(0);
        scoreText.innerText = `Risk Score: ${scorePercent}%`;
        riskMeter.style.width = `${Math.max(5, scorePercent)}%`;

        if (riskData.isWhitelisted) {
            statusText.innerText = "Allowlisted";
            statusCircle.className = "status-dot";
            statusCircle.style.backgroundColor = "var(--accent)";
            riskMeter.style.background = "var(--accent)";
        } else if (riskData.isHighRisk) {
            statusText.innerText = "High Risk";
            statusCircle.className = "status-dot risk-high";
            statusCircle.style.backgroundColor = "";
            riskMeter.style.background = "var(--danger)";
        } else if (riskData.isMediumRisk || riskData.score > 0) {
            statusText.innerText = "Elevated Risk";
            statusCircle.className = "status-dot risk-med";
            statusCircle.style.backgroundColor = "";
            riskMeter.style.background = "var(--warning)";
        } else {
            statusText.innerText = "Safe Verified";
            statusCircle.className = "status-dot";
            statusCircle.style.backgroundColor = "";
            riskMeter.style.background = "var(--success)";
        }

        // Breakdown List
        if (riskData.reasons && riskData.reasons.length > 0) {
            breakdownBox.classList.add('visible');
            reasonsList.innerHTML = riskData.reasons.map(r => `<li>${r}</li>`).join('');
        } else {
            breakdownBox.classList.remove('visible');
        }

        // Telemetry Tab Update
        if (riskData.telemetry) {
            const tel = riskData.telemetry;
            if (tel.domain) {
                telEntropy.innerText = tel.domain.entropy ? tel.domain.entropy.toFixed(2) : "Low";
                telBloom.innerText = tel.domain.isKnownThreat ? "THREAT MATCH" : "Clean";
            }
            if (tel.forms) {
                telForm.innerText = tel.forms.hasLoginForm ? (tel.forms.crossOriginSubmit ? "Cross-Origin" : "Password Form") : "None";
            }
            if (tel.linguistics) {
                telMl.innerText = tel.linguistics.score > 0 ? "Threat Markers" : "Clean";
            }
        }
    }
});
