// ============================================
// CLAUSEWALL EXTENSION — BACKGROUND SERVICE WORKER
// Handles API calls, caching, badge updates
// ============================================

// ── Config ──────────────────────────────────
// Change to localhost for local testing:
// const API_BASE = "http://localhost:3000";
const API_BASE = "https://clause-wall.vercel.app";
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// ── Badge Colors ────────────────────────────
const BADGE_COLORS = {
  safe: "#22c55e",
  warning: "#eab308",
  dangerous: "#ef4444",
  illegal: "#a855f7",
  analyzing: "#3b82f6",
  default: "#6b7280",
};

// Track in-progress analyses
const pendingAnalyses = new Set();

// ── Message Handler ─────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOS_DETECTED") {
    handleTosDetected(message, sender.tab);
    return false;
  }

  if (message.type === "GET_RESULTS") {
    handleGetResults(message.url, message.tabId).then(sendResponse);
    return true;
  }

  if (message.type === "FORCE_SCAN") {
    handleForceScan(message.url, message.text, message.title, message.tabId).then(sendResponse);
    return true;
  }

  return false;
});

// ── ToS Detected (from content.js) ──────────

async function handleTosDetected(message, tab) {
  if (!tab?.id) return;

  const cacheKey = getCacheKey(message.url);

  // Check cache first
  const cached = await getCachedResult(cacheKey);
  if (cached && !cached.error) {
    updateBadge(tab.id, cached);
    chrome.tabs.sendMessage(tab.id, {
      type: "ANALYSIS_COMPLETE",
      data: cached,
    }).catch(() => {});
    return;
  }

  // Skip if already analyzing this URL
  if (pendingAnalyses.has(cacheKey)) return;

  // Start analysis
  pendingAnalyses.add(cacheKey);
  updateBadgeAnalyzing(tab.id);

  try {
    const results = await analyzeText(message.url, message.text, message.title);

    // Cache results
    await cacheResult(cacheKey, results);

    // Update badge
    updateBadge(tab.id, results);

    // Notify content script
    chrome.tabs.sendMessage(tab.id, {
      type: "ANALYSIS_COMPLETE",
      data: results,
    }).catch(() => {});
  } catch (error) {
    console.error("[ClauseWall] Analysis failed:", error);
    updateBadgeError(tab.id);
    await cacheResult(cacheKey, { error: true, message: error.message });
  } finally {
    pendingAnalyses.delete(cacheKey);
  }
}

// ── Get Results (from popup) ────────────────

async function handleGetResults(url, tabId) {
  const cacheKey = getCacheKey(url);
  const cached = await getCachedResult(cacheKey);

  if (cached && !cached.error) {
    return { status: "complete", data: cached };
  }

  if (cached && cached.error) {
    return { status: "error", message: cached.message };
  }

  if (pendingAnalyses.has(cacheKey)) {
    return { status: "analyzing" };
  }

  return { status: "not_scanned" };
}

// ── Force Scan (from popup) ─────────────────

async function handleForceScan(url, text, title, tabId) {
  const cacheKey = getCacheKey(url);

  if (pendingAnalyses.has(cacheKey)) {
    return { status: "analyzing" };
  }

  pendingAnalyses.add(cacheKey);
  if (tabId) updateBadgeAnalyzing(tabId);

  try {
    const results = await analyzeText(url, text, title);
    await cacheResult(cacheKey, results);
    if (tabId) updateBadge(tabId, results);

    // Notify content script
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: "ANALYSIS_COMPLETE",
        data: results,
      }).catch(() => {});
    }

    return { status: "complete", data: results };
  } catch (error) {
    console.error("[ClauseWall] Force scan failed:", error);
    if (tabId) updateBadgeError(tabId);
    return { status: "error", message: error.message };
  } finally {
    pendingAnalyses.delete(cacheKey);
  }
}

// ── API Call ─────────────────────────────────

async function analyzeText(url, text, title) {
  const response = await fetch(`${API_BASE}/api/extension/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: url,
      text: text.substring(0, 30000),
      title: title || "",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  
  // Store document_id for results link
  if (data.document_id) {
    data.results_url = `${API_BASE}/results/${data.document_id}`;
  }

  return data;
}

// ── Cache Functions ─────────────────────────

function getCacheKey(url) {
  try {
    const u = new URL(url);
    return "cw_" + u.hostname + u.pathname.replace(/\/$/, "");
  } catch {
    return "cw_" + url;
  }
}

function getCachedResult(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      const entry = result[key];
      if (!entry) return resolve(null);

      // Check expiry
      if (Date.now() - entry.timestamp > CACHE_DURATION_MS) {
        chrome.storage.local.remove(key);
        return resolve(null);
      }

      resolve(entry.data);
    });
  });
}

function cacheResult(key, data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      {
        [key]: {
          data: data,
          timestamp: Date.now(),
        },
      },
      resolve
    );
  });
}

// ── Badge Updates ───────────────────────────

function updateBadge(tabId, results) {
  if (results.error) {
    updateBadgeError(tabId);
    return;
  }

  const score = results.risk_score || 0;
  const level = results.risk_level || "safe";
  const color = BADGE_COLORS[level] || BADGE_COLORS.default;

  chrome.action.setBadgeText({ text: String(score), tabId });
  chrome.action.setBadgeBackgroundColor({ color: color, tabId });
  chrome.action.setTitle({
    title: `ClauseWall: ${score}/100 risk score`,
    tabId,
  });
}

function updateBadgeAnalyzing(tabId) {
  chrome.action.setBadgeText({ text: "...", tabId });
  chrome.action.setBadgeBackgroundColor({
    color: BADGE_COLORS.analyzing,
    tabId,
  });
  chrome.action.setTitle({ title: "ClauseWall: Analyzing...", tabId });
}

function updateBadgeError(tabId) {
  chrome.action.setBadgeText({ text: "!", tabId });
  chrome.action.setBadgeBackgroundColor({
    color: BADGE_COLORS.dangerous,
    tabId,
  });
  chrome.action.setTitle({ title: "ClauseWall: Analysis failed", tabId });
}

// ── Clear badge when navigating ──────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    chrome.action.setBadgeText({ text: "", tabId });
    chrome.action.setTitle({ title: "ClauseWall — Contract Scanner", tabId });
  }
});

console.log("[ClauseWall] Background service worker loaded");