// FiverrGrowth Safe Copilot Content Script (Runs directly in Fiverr)
console.log('[FiverrGrowth] Safe Copilot loaded on Fiverr.');

// Check if page contains briefs and parse them
function extractFiverrBriefs() {
  const briefs = [];

  // Try parsing from Perseus hydration if available
  const scriptTag = document.getElementById('perseus-initial-props');
  if (scriptTag) {
    try {
      const data = JSON.parse(scriptTag.textContent || '{}');
      const rawBriefs = data.briefs || data.buyerRequests || data.opportunities || [];
      if (Array.isArray(rawBriefs)) {
        rawBriefs.forEach((b, idx) => {
          briefs.push({
            fiverrBriefId: b.id || `fvr_parsed_${idx}`,
            clientTitle: b.title || b.headline || 'Custom Client Brief',
            description: b.description || b.text || '',
            budget: b.budget ? `$${b.budget}` : 'Flexible',
            urgencyText: b.deliveryTime ? `${b.deliveryTime} Days` : '48 Hours',
            skills: b.skills || b.tags || [],
            clientCountry: b.buyerCountry || 'International',
            source: 'fiverr_extension',
            status: 'new'
          });
        });
      }
    } catch (e) {
      // Ignored
    }
  }

  // Also query visible DOM cards if Perseus was not present
  const briefElements = document.querySelectorAll(
    '[data-testid="brief-card"], .brief-item, .buyer-request-row, .opportunity-card'
  );

  briefElements.forEach((el, index) => {
    const titleEl = el.querySelector('h3, h4, .title, [data-testid="brief-title"]');
    const descEl = el.querySelector('p, .description, [data-testid="brief-description"]');
    const budgetEl = el.querySelector('.budget, [data-testid="budget-text"]');
    const urgencyEl = el.querySelector('.urgency, [data-testid="delivery-time"]');

    const title = titleEl ? titleEl.textContent?.trim() : `Client Brief #${index + 1}`;
    const description = descEl ? descEl.textContent?.trim() : '';
    const budget = budgetEl ? budgetEl.textContent?.trim() : 'Flexible';
    const urgencyText = urgencyEl ? urgencyEl.textContent?.trim() : '48 Hours';

    if (title || description) {
      briefs.push({
        fiverrBriefId: el.getAttribute('data-brief-id') || `fvr_dom_${Date.now()}_${index}`,
        clientTitle: title || 'Client Project Brief',
        description: description || 'Inbound client project requirements.',
        budget,
        urgencyText,
        skills: ['Custom Solution'],
        clientCountry: 'International',
        source: 'fiverr_extension',
        status: 'new'
      });
    }
  });

  return briefs;
}

// Injects floating Safe Copilot badge
function injectFloatingCopilot() {
  if (document.getElementById('fg-copilot-root')) return;

  const root = document.createElement('div');
  root.id = 'fg-copilot-root';
  root.style.position = 'fixed';
  root.style.bottom = '20px';
  root.style.right = '20px';
  root.style.zIndex = '999999';
  root.style.fontFamily = 'Helvetica Neue, sans-serif';

  root.innerHTML = `
    <div id="fg-copilot-card" style="
      background: #ffffff;
      border: 1px solid #dadbdd;
      border-radius: 12px;
      padding: 14px 18px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.14);
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 320px;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: #1dbf73;
        border-radius: 50%;
        box-shadow: 0 0 0 3px rgba(29, 191, 115, 0.2);
      "></div>
      <div style="flex: 1;">
        <div style="font-size: 12px; font-weight: bold; color: #222325;">FiverrGrowth Copilot</div>
        <div style="font-size: 11px; color: #74767e;">Safe Mode Active (Home IP)</div>
      </div>
      <button id="fg-sync-btn" style="
        background: #1dbf73;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: bold;
        cursor: pointer;
      ">Sync Briefs</button>
    </div>
  `;

  document.body.appendChild(root);

  document.getElementById('fg-sync-btn')?.addEventListener('click', () => {
    const briefs = extractFiverrBriefs();
    chrome.runtime.sendMessage({ type: 'SYNC_BRIEFS', payload: { briefs } }, (response) => {
      const btn = document.getElementById('fg-sync-btn');
      if (btn) {
        if (response?.success) {
          btn.textContent = `Synced (${response.count || 0}) ✓`;
          btn.style.background = '#107a48';
          setTimeout(() => {
            btn.textContent = 'Sync Briefs';
            btn.style.background = '#1dbf73';
          }, 3000);
        } else {
          btn.textContent = 'Ready (App)';
        }
      }
    });
  });
}

// Safe Human Pacing Delay Utility
function humanPaceDelay(minSeconds = 15, maxSeconds = 30) {
  const ms = Math.floor((Math.random() * (maxSeconds - minSeconds) + minSeconds) * 1000);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Initialize on idle
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  injectFloatingCopilot();
} else {
  window.addEventListener('DOMContentLoaded', injectFloatingCopilot);
}
