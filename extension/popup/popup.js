// ============================================
// CLAUSEWALL EXTENSION POPUP
// ============================================

let currentTabId = null;
let currentUrl = null;
let currentIssues = [];
let currentDocumentId = null;
let currentResultsUrl = null;
let highlightsActive = false;

function getCacheKey(url) {
  try {
    const u = new URL(url);
    return "cw_" + u.hostname + u.pathname.replace(/\/$/, "");
  } catch {
    return "cw_" + url;
  }
}

// ── Init ──────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab) {
    showNotSupported();
    return;
  }

  currentTabId = tab.id;
  currentUrl = tab.url;

  // Show URL
  const urlBar = document.getElementById("urlBar");
  try {
    const u = new URL(currentUrl);
    urlBar.textContent = u.hostname + u.pathname;
  } catch {
    urlBar.textContent = currentUrl;
  }

  // Skip chrome:// and extension pages
  if (
    currentUrl.startsWith("chrome://") ||
    currentUrl.startsWith("chrome-extension://") ||
    currentUrl.startsWith("brave://") ||
    currentUrl.startsWith("edge://") ||
    currentUrl.startsWith("about:")
  ) {
    showNotSupported();
    return;
  }

  // Get current highlight state from content script
  try {
    chrome.tabs.sendMessage(
      currentTabId,
      { type: "GET_HIGHLIGHT_STATE" },
      (response) => {
        if (response) {
          highlightsActive = response.active || false;
        }
      }
    );
  } catch (e) {
    // Content script not loaded yet
  }

  // Request results from background
  chrome.runtime.sendMessage(
    { type: "GET_RESULTS", url: currentUrl, tabId: currentTabId },
    (response) => {
      if (!response) {
        showNotScanned();
        return;
      }

      switch (response.status) {
        case "complete":
          showResults(response.data);
          break;
        case "analyzing":
          showAnalyzing();
          pollForResults();
          break;
        case "error":
          showError(response.message);
          break;
        default:
          showNotScanned();
      }
    }
  );
});

// ── Polling (for analyzing state) ─────────

function pollForResults() {
  const interval = setInterval(() => {
    chrome.runtime.sendMessage(
      { type: "GET_RESULTS", url: currentUrl, tabId: currentTabId },
      (response) => {
        if (response?.status === "complete") {
          clearInterval(interval);
          showResults(response.data);
        } else if (response?.status === "error") {
          clearInterval(interval);
          showError(response.message);
        }
      }
    );
  }, 1500);
}

// ── States ────────────────────────────────

function showNotSupported() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <div class="state-container">
      <div class="state-icon">🚫</div>
      <div class="state-title">Not Supported</div>
      <div class="state-description">
        ClauseWall can't scan this type of page.
        Visit a website's Terms of Service to get started.
      </div>
    </div>
  `;
}

function showNotScanned() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <div class="state-container">
      <div class="state-icon">🔍</div>
      <div class="state-title">No Legal Page Detected</div>
      <div class="state-description">
        This page doesn't appear to contain Terms of Service or legal text.
        If it does, click below to scan manually.
      </div>
      <button class="btn btn-primary" id="scanBtn">
        🛡️ Scan This Page Anyway
      </button>
    </div>
  `;

  document.getElementById("scanBtn").addEventListener("click", forceScan);
}

function showAnalyzing() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <div class="state-container">
      <div class="state-icon">🛡️</div>
      <div class="state-title">Analyzing...</div>
      <div class="state-description">
        Scanning for predatory clauses using Indian legal database.
        This usually takes 10-20 seconds.
      </div>
      <div class="loading-dots">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>
    </div>
  `;
}

function showError(message) {
  const content = document.getElementById("content");
  content.innerHTML = `
    <div class="state-container">
      <div class="state-icon">❌</div>
      <div class="state-title">Analysis Failed</div>
      <div class="state-description">
        ${message || "Something went wrong. Please try again."}
      </div>
      <button class="btn btn-primary" id="retryBtn">
        🔄 Try Again
      </button>
    </div>
  `;

  document.getElementById("retryBtn").addEventListener("click", forceScan);
}

function showResults(data) {
  if (!data || data.error) {
    showError(data?.message);
    return;
  }

  const score = data.risk_score || 0;
  const level = data.risk_level || "safe";
  const summary = data.summary || "";
  const counts = data.clause_counts || { safe: 0, warning: 0, dangerous: 0, illegal: 0 };
  const issues = data.top_issues || [];
  
  currentIssues = issues;
  currentDocumentId = data.document_id || null;
  currentResultsUrl = data.results_url || null;

  const colors = {
    safe: "#22c55e",
    warning: "#eab308",
    dangerous: "#ef4444",
    illegal: "#a855f7",
  };

  const labels = {
    safe: "Low Risk",
    warning: "Moderate Risk",
    dangerous: "High Risk",
    illegal: "Critical Risk",
  };

  const icons = {
    safe: "✅",
    warning: "⚠️",
    dangerous: "🔴",
    illegal: "⛔",
  };

  const color = colors[level] || colors.safe;

  // Build issues HTML with click-to-scroll
  let issuesHTML = "";
  issues.forEach((issue, i) => {
    const issueLevel = issue.risk_level || "warning";
    const issueIcon = icons[issueLevel] || "⚠️";

    issuesHTML += `
      <div class="issue-card issue-card-${issueLevel}" data-index="${i}">
        <div class="issue-header">
          <span class="issue-icon">${issueIcon}</span>
          <span class="issue-title">${issue.title || `Issue ${i + 1}`}</span>
          <span class="issue-goto" title="Scroll to clause">📍</span>
        </div>
        <div class="issue-explanation">${issue.explanation || ""}</div>
        ${issue.legal_issue ? `<div class="issue-legal">⚖️ ${issue.legal_issue}</div>` : ""}
      </div>
    `;
  });

    // Determine full analysis URL
  let fullAnalysisUrl = "https://clause-wall.vercel.app/upload";
  let fullAnalysisText = "📄 Full Analysis on ClauseWall";
  let showRescanHint = false;
  
  if (currentDocumentId) {
    fullAnalysisUrl = `https://clause-wall.vercel.app/results/${currentDocumentId}`;
    fullAnalysisText = "📄 View Full Analysis";
  } else if (currentResultsUrl) {
    fullAnalysisUrl = currentResultsUrl;
    fullAnalysisText = "📄 View Full Analysis";
  } else {
    // Old cached result without document_id
    showRescanHint = true;
  }

  const content = document.getElementById("content");
  content.innerHTML = `
    <!-- Score -->
    <div class="score-section">
      <div class="score-ring" style="background: conic-gradient(${color} ${score}%, rgba(255,255,255,0.05) 0)">
        <div class="score-ring-inner">
          <span class="score-number" style="color: ${color}">${score}</span>
          <span class="score-max">/100</span>
        </div>
      </div>
      <div class="score-label" style="color: ${color}">
        ${icons[level]} ${labels[level]}
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-item stat-safe">
        <div class="stat-count">${counts.safe || 0}</div>
        <div class="stat-label">Safe</div>
      </div>
      <div class="stat-item stat-warning">
        <div class="stat-count">${counts.warning || 0}</div>
        <div class="stat-label">Warning</div>
      </div>
      <div class="stat-item stat-dangerous">
        <div class="stat-count">${counts.dangerous || 0}</div>
        <div class="stat-label">Danger</div>
      </div>
      <div class="stat-item stat-illegal">
        <div class="stat-count">${counts.illegal || 0}</div>
        <div class="stat-label">Illegal</div>
      </div>
    </div>

    <!-- Summary -->
    ${summary ? `<div class="summary">${summary}</div>` : ""}

        <!-- Actions -->
    <div class="actions">
      ${issues.length > 0 ? `
        <button class="btn btn-highlight ${highlightsActive ? 'active' : ''}" id="highlightBtn">
          ${highlightsActive ? '🚫 Remove Highlights' : '👁️ Highlight on Page'}
        </button>
      ` : ""}
      ${showRescanHint ? `
        <button class="btn btn-primary" id="rescanBtn">
          🔄 Re-scan for Full Analysis
        </button>
      ` : `
        <a href="${fullAnalysisUrl}" target="_blank" class="btn btn-outline" id="fullAnalysisBtn">
          ${fullAnalysisText}
        </a>
      `}
    </div>

    <!-- Issues -->
    ${issues.length > 0 ? `
      <div class="issues-section">
        <div class="issues-title">
          Click any issue to scroll to it on page
        </div>
        <div class="issues-list">
          ${issuesHTML}
        </div>
      </div>
    ` : ""}
  `;

  // Highlight toggle button
  const highlightBtn = document.getElementById("highlightBtn");
  if (highlightBtn) {
    highlightBtn.addEventListener("click", () => {
      chrome.tabs.sendMessage(
        currentTabId,
        {
          type: "TOGGLE_HIGHLIGHTS",
          clauses: currentIssues,
        },
        (response) => {
          if (response) {
            highlightsActive = response.active;
            highlightBtn.classList.toggle("active", highlightsActive);
            highlightBtn.textContent = highlightsActive
              ? "🚫 Remove Highlights"
              : "👁️ Highlight on Page";
          }
        }
      );
    });
  }

  // Click-to-scroll on issue cards
  document.querySelectorAll(".issue-card").forEach((card) => {
    card.addEventListener("click", () => {
      const index = parseInt(card.dataset.index);
      
      // First ensure highlights are on
      if (!highlightsActive) {
        chrome.tabs.sendMessage(
          currentTabId,
          { type: "TOGGLE_HIGHLIGHTS", clauses: currentIssues },
          (response) => {
            if (response?.active) {
              highlightsActive = true;
              if (highlightBtn) {
                highlightBtn.classList.add("active");
                highlightBtn.textContent = "🚫 Remove Highlights";
              }
              scrollToClause(index);
            }
          }
        );
      } else {
        scrollToClause(index);
      }
    });
  });

    // Re-scan button for old cached results
  const rescanBtn = document.getElementById("rescanBtn");
  if (rescanBtn) {
    rescanBtn.addEventListener("click", () => {
      // Clear cache for this URL and re-scan
      const cacheKey = getCacheKey(currentUrl);
      chrome.storage.local.remove(cacheKey, () => {
        forceScan();
      });
    });
  }
}

function scrollToClause(index) {
  chrome.tabs.sendMessage(
    currentTabId,
    { type: "SCROLL_TO_CLAUSE", index: index },
    (response) => {
      if (response?.success) {
        window.close();
      }
    }
  );
}

// ── Force Scan ────────────────────────────

function forceScan() {
  showAnalyzing();

  chrome.tabs.sendMessage(
    currentTabId,
    { type: "EXTRACT_TEXT" },
    (response) => {
      if (!response || !response.text) {
        showError("Could not extract text from this page.");
        return;
      }

      chrome.runtime.sendMessage(
        {
          type: "FORCE_SCAN",
          url: response.url || currentUrl,
          text: response.text,
          title: response.title || "",
          tabId: currentTabId,
        },
        (result) => {
          if (result?.status === "complete") {
            showResults(result.data);
          } else if (result?.status === "analyzing") {
            pollForResults();
          } else {
            showError(result?.message || "Analysis failed");
          }
        }
      );
    }
  );
}