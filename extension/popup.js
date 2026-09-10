// FiverrGrowth Extension Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const briefsCountEl = document.getElementById('briefs-count');
  const openDashboardBtn = document.getElementById('open-dashboard-btn');
  const syncBtn = document.getElementById('sync-active-tab-btn');

  // Load current status from storage
  chrome.storage.local.get(['detectedBriefsCount', 'lastSyncTime'], (data) => {
    if (data.detectedBriefsCount) {
      briefsCountEl.textContent = `${data.detectedBriefsCount} Detected`;
    }
  });

  // Open web dashboard
  openDashboardBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173/briefs' });
  });

  // Sync active tab
  syncBtn?.addEventListener('click', async () => {
    syncBtn.textContent = 'Scanning Fiverr Tab...';
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_DOM_SYNC' }, (response) => {
          if (chrome.runtime.lastError) {
            syncBtn.textContent = 'Open Fiverr Tab First';
            setTimeout(() => { syncBtn.textContent = 'Sync Active Fiverr Tab'; }, 2500);
          } else {
            syncBtn.textContent = 'Synced Successfully ✓';
            setTimeout(() => { syncBtn.textContent = 'Sync Active Fiverr Tab'; }, 2500);
          }
        });
      }
    } catch (e) {
      syncBtn.textContent = 'Error scanning';
    }
  });
});
