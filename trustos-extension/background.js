// TrustOS Background Service Worker (Manifest V3)
// Coordinates tab badge state, threat telemetry, and storage synchronization.

chrome.runtime.onInstalled.addListener(() => {
    console.log("TrustOS: Service worker initialized.");
    
    // Initialize default preferences
    chrome.storage.local.get(['shieldEnabled', 'allowedDomains', 'sensitivityThreshold'], (res) => {
        if (res.shieldEnabled === undefined) {
            chrome.storage.local.set({
                shieldEnabled: true,
                allowedDomains: [],
                sensitivityThreshold: 0.60
            });
        }
    });
});

// Listen for tab risk updates and update extension badge in real time
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "UPDATE_TAB_RISK" && sender.tab && sender.tab.id) {
        const tabId = sender.tab.id;
        const riskData = request.riskData;

        if (!riskData) {
            chrome.action.setBadgeText({ tabId: tabId, text: "" });
            return;
        }

        if (riskData.isHighRisk) {
            chrome.action.setBadgeText({ tabId: tabId, text: "RISK" });
            chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: "#ef4444" });
        } else if (riskData.isMediumRisk) {
            chrome.action.setBadgeText({ tabId: tabId, text: "WARN" });
            chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: "#f59e0b" });
        } else if (riskData.isWhitelisted) {
            chrome.action.setBadgeText({ tabId: tabId, text: "TRUST" });
            chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: "#3b82f6" });
        } else {
            chrome.action.setBadgeText({ tabId: tabId, text: "SAFE" });
            chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: "#10b981" });
        }

        sendResponse({ received: true });
    }
});

// Reset badge when tab is updated / navigated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading') {
        chrome.action.setBadgeText({ tabId: tabId, text: "SCAN" });
        chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: "#64748b" });
    }
});
