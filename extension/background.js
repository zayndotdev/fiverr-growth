// FiverrGrowth Background Service Worker (Manifest V3)

const API_BASE = 'http://localhost:5000/api/v1';

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[FiverrGrowth] Extension installed successfully.');
  await chrome.storage.local.set({
    connected: true,
    lastSyncTime: null,
    detectedBriefsCount: 0,
    safetySettings: {
      safetyGapSeconds: 25,
      humanJitter: true,
      autoReview: true
    }
  });
});

// Handle incoming messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SYNC_BRIEFS') {
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/briefs/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ briefs: request.payload?.briefs || [] })
        });
        const data = await response.json();
        
        await chrome.storage.local.set({
          lastSyncTime: new Date().toISOString(),
          detectedBriefsCount: request.payload?.briefs?.length || 0
        });

        sendResponse({ success: true, count: data.count, data: data.data });
      } catch (err) {
        console.error('[FiverrGrowth] Sync failed:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep channel open for async response
  }

  if (request.type === 'GENERATE_PROPOSAL') {
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/briefs/generate-batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            briefIds: [request.payload?.briefId],
            strategy: request.payload?.strategy || { tone: 'closer', safetyGapSeconds: 25 }
          })
        });
        const data = await response.json();
        sendResponse({ success: true, proposal: data.data?.[0] });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (request.type === 'RECORD_APPLICATION') {
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/briefs/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request.payload)
        });
        const data = await response.json();
        sendResponse({ success: true, data });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (request.type === 'GET_STATUS') {
    (async () => {
      const storage = await chrome.storage.local.get(['connected', 'lastSyncTime', 'detectedBriefsCount', 'safetySettings']);
      sendResponse({ success: true, data: storage });
    })();
    return true;
  }
});
