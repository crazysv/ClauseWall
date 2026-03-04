// ============================================
// CLAUSEWALL EXTENSION — CONTENT SCRIPT
// Detects ToS pages, extracts text, highlights clauses
// ============================================

(function () {
  "use strict";

  // Don't run on ClauseWall's own pages
  if (
    location.hostname === "clause-wall.vercel.app" ||
    location.hostname === "localhost"
  ) {
    return;
  }

  // ── State ───────────────────────────────────
  let highlightsActive = false;
  let highlightedElements = [];
  let tooltipEl = null;
  let analysisResults = null;

  // ── ToS Detection Patterns ──────────────────

  const URL_PATTERNS = [
    /\/terms/i,
    /\/tos\b/i,
    /\/legal/i,
    /\/privacy/i,
    /\/conditions/i,
    /\/eula/i,
    /\/user-agreement/i,
    /\/subscriber-agreement/i,
    /\/acceptable-use/i,
    /\/cookie-policy/i,
    /\/data-policy/i,
    /\/community-guidelines/i,
  ];

  const TITLE_PATTERNS = [
    /terms of (service|use)/i,
    /privacy policy/i,
    /terms and conditions/i,
    /end user license/i,
    /acceptable use/i,
    /user agreement/i,
    /cookie policy/i,
    /data policy/i,
    /legal notice/i,
  ];

  const CONTENT_MARKERS = [
    /by (using|accessing|continuing|registering|creating)/i,
    /you agree to (be bound|these terms|the following|our)/i,
    /terms of (service|use)/i,
    /privacy policy/i,
    /we (may|reserve the right to|collect|use|share|disclose)/i,
    /limitation of liability/i,
    /governing law/i,
    /arbitration/i,
    /indemnif/i,
    /intellectual property/i,
    /termination/i,
    /disclaimer/i,
    /warranty/i,
  ];

  // ── Detection ───────────────────────────────

  function isTosPage() {
    const url = location.href;
    const title = document.title;

    const urlMatch = URL_PATTERNS.some((p) => p.test(url));
    if (urlMatch) return true;

    const titleMatch = TITLE_PATTERNS.some((p) => p.test(title));
    if (titleMatch) return true;

    return false;
  }

  function confirmTosContent(text) {
    let matches = 0;
    for (const pattern of CONTENT_MARKERS) {
      if (pattern.test(text)) matches++;
      if (matches >= 3) return true;
    }
    return false;
  }

  // ── Text Extraction ─────────────────────────

  function extractPageText() {
    const selectors = [
      "main",
      "article",
      '[role="main"]',
      ".content",
      ".main-content",
      ".terms",
      ".legal",
      ".privacy",
      "#content",
      "#main",
      "#terms",
      ".entry-content",
      ".post-content",
      ".page-content",
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim().length > 500) {
        return cleanText(el.textContent);
      }
    }

    const body = document.body.cloneNode(true);
    const removeSelectors = [
      "nav",
      "footer",
      "header",
      "script",
      "style",
      "noscript",
      "iframe",
      "svg",
      ".nav",
      ".navbar",
      ".header",
      ".footer",
      ".sidebar",
      ".menu",
      ".cookie-banner",
      ".popup",
    ];
    removeSelectors.forEach((sel) => {
      body.querySelectorAll(sel).forEach((el) => el.remove());
    });

    return cleanText(body.textContent);
  }

  function cleanText(text) {
    return text
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim();
  }

  // ── Improved Highlighting ───────────────────

  function highlightClauses(clauses) {
    if (!clauses || clauses.length === 0) return false;
    
    removeHighlights();
    highlightedElements = [];

    const bodyText = document.body.innerText.toLowerCase();

    clauses.forEach((clause, index) => {
      if (!clause.text) return;

      // Clean and prepare search phrases
      const searchPhrases = getSearchPhrases(clause.text);
      
      for (const phrase of searchPhrases) {
        if (phrase.length < 10) continue;
        
        // Find in body text first to confirm it exists
        if (!bodyText.includes(phrase.toLowerCase())) continue;

        // Use TreeWalker to find text nodes
        const found = findAndHighlightText(phrase, clause, index);
        if (found) break; // Stop after first successful match
      }
    });

    highlightsActive = highlightedElements.length > 0;
    
    // Persist state
    chrome.storage.local.set({ 
      [`highlights_${location.href}`]: highlightsActive 
    });

    return highlightsActive;
  }

  function getSearchPhrases(text) {
    // Clean the text
    const cleaned = text.replace(/\s+/g, " ").trim();
    
    const phrases = [];
    
    // Try first 100 chars
    if (cleaned.length >= 20) {
      phrases.push(cleaned.substring(0, 100));
    }
    
    // Try first 60 chars
    if (cleaned.length >= 20) {
      phrases.push(cleaned.substring(0, 60));
    }
    
    // Try first 40 chars
    if (cleaned.length >= 20) {
      phrases.push(cleaned.substring(0, 40));
    }

    // Try to find unique phrases (words 3-6)
    const words = cleaned.split(" ");
    if (words.length >= 5) {
      phrases.push(words.slice(0, 5).join(" "));
    }
    if (words.length >= 8) {
      phrases.push(words.slice(2, 7).join(" "));
    }

    return phrases;
  }

  function findAndHighlightText(searchText, clause, index) {
    const searchLower = searchText.toLowerCase().trim();
    
    // Get all text-containing elements
    const elements = document.querySelectorAll("p, li, div, span, td, section, article");
    
    for (const el of elements) {
      // Skip if element contains other block elements (too broad)
      if (el.querySelector("p, div, section, article")) continue;
      
      const elText = el.textContent.toLowerCase();
      
      if (elText.includes(searchLower)) {
        // Found a match - highlight this element
        const highlightId = `clausewall-highlight-${index}`;
        
        // Check if already highlighted
        if (el.classList.contains("clausewall-highlighted")) continue;

        const riskClass =
          clause.risk_level === "illegal"
            ? "clausewall-highlight-illegal"
            : clause.risk_level === "dangerous"
            ? "clausewall-highlight-dangerous"
            : "clausewall-highlight-warning";

        el.classList.add("clausewall-highlighted", riskClass);
        el.id = highlightId;
        el.dataset.cwIndex = index;
        el.dataset.cwTitle = clause.title || "Concerning Clause";
        el.dataset.cwExplanation = clause.explanation || "";
        el.dataset.cwLegal = clause.legal_issue || "";
        el.dataset.cwLevel = clause.risk_level || "warning";

        el.addEventListener("mouseenter", showTooltip);
        el.addEventListener("mouseleave", hideTooltip);

        highlightedElements.push(el);
        return true;
      }
    }

    return false;
  }

  function removeHighlights() {
    // Remove from tracked elements
    highlightedElements.forEach((el) => {
      el.classList.remove(
        "clausewall-highlighted",
        "clausewall-highlight-dangerous",
        "clausewall-highlight-illegal",
        "clausewall-highlight-warning"
      );
      el.removeAttribute("data-cw-index");
      el.removeAttribute("data-cw-title");
      el.removeAttribute("data-cw-explanation");
      el.removeAttribute("data-cw-legal");
      el.removeAttribute("data-cw-level");
      el.removeEventListener("mouseenter", showTooltip);
      el.removeEventListener("mouseleave", hideTooltip);
    });

    // Also query and remove any we might have missed
    document
      .querySelectorAll(".clausewall-highlighted")
      .forEach((el) => {
        el.classList.remove(
          "clausewall-highlighted",
          "clausewall-highlight-dangerous",
          "clausewall-highlight-illegal",
          "clausewall-highlight-warning"
        );
      });

    hideTooltip();
    highlightedElements = [];
    highlightsActive = false;

    // Persist state
    chrome.storage.local.set({ 
      [`highlights_${location.href}`]: false 
    });
  }

  function scrollToClause(index) {
    const el = document.getElementById(`clausewall-highlight-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Flash effect
      el.style.transition = "box-shadow 0.3s ease";
      el.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.5)";
      setTimeout(() => {
        el.style.boxShadow = "";
      }, 1500);
      
      return true;
    }
    return false;
  }

  // ── Tooltip ─────────────────────────────────

  function showTooltip(e) {
    hideTooltip();

    const el = e.currentTarget;
    const title = el.dataset.cwTitle;
    const explanation = el.dataset.cwExplanation;
    const legal = el.dataset.cwLegal;
    const level = el.dataset.cwLevel;

    const levelIcons = {
      illegal: "⛔",
      dangerous: "🔴",
      warning: "⚠️",
    };

    tooltipEl = document.createElement("div");
    tooltipEl.className = "clausewall-tooltip";
    tooltipEl.innerHTML = `
      <div class="clausewall-tooltip-title">
        <span class="clausewall-tooltip-badge clausewall-badge-${level}">
          ${levelIcons[level] || "⚠️"} ${level}
        </span>
        ${title}
      </div>
      <div class="clausewall-tooltip-explanation">${explanation}</div>
      ${legal ? `<div class="clausewall-tooltip-legal">⚖️ ${legal}</div>` : ""}
    `;

    document.body.appendChild(tooltipEl);

    const rect = el.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    
    let left = rect.left + window.scrollX;
    let top = rect.top + window.scrollY - tooltipRect.height - 8;

    // Keep within viewport
    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    if (left < 10) left = 10;
    
    if (top < window.scrollY + 10) {
      top = rect.bottom + window.scrollY + 8;
    }

    tooltipEl.style.left = left + "px";
    tooltipEl.style.top = top + "px";
  }

  function hideTooltip() {
    if (tooltipEl) {
      tooltipEl.remove();
      tooltipEl = null;
    }
  }

  // ── Floating Badge ──────────────────────────

  let floatingBadge = null;

  function showFloatingBadge(results) {
    removeFloatingBadge();
    analysisResults = results;

    const score = results.risk_score || 0;
    const level = results.risk_level || "safe";

    const colors = {
      safe: "#22c55e",
      warning: "#eab308",
      dangerous: "#ef4444",
      illegal: "#a855f7",
    };

    const icons = {
      safe: "✅",
      warning: "⚠️",
      dangerous: "🔴",
      illegal: "⛔",
    };

    const labels = {
      safe: "Low Risk",
      warning: "Caution",
      dangerous: "High Risk",
      illegal: "Critical",
    };

    floatingBadge = document.createElement("div");
    floatingBadge.className = "clausewall-floating-badge";
    if (level === "dangerous" || level === "illegal") {
      floatingBadge.classList.add("clausewall-pulse");
    }

    floatingBadge.innerHTML = `
      <span class="clausewall-floating-badge-icon">🛡️</span>
      <span class="clausewall-floating-badge-score" style="color: ${colors[level]}">${score}</span>
      <span class="clausewall-floating-badge-label">${labels[level]}</span>
      <span class="clausewall-floating-badge-close" title="Close">✕</span>
    `;

    floatingBadge.addEventListener("click", (e) => {
      if (e.target.classList.contains("clausewall-floating-badge-close")) {
        removeFloatingBadge();
        return;
      }

      if (highlightsActive) {
        removeHighlights();
        floatingBadge.querySelector(".clausewall-floating-badge-label").textContent = labels[level];
      } else if (results.top_issues) {
        highlightClauses(results.top_issues);
        if (highlightsActive) {
          floatingBadge.querySelector(".clausewall-floating-badge-label").textContent = "Highlighted";
        }
      }
    });

    document.body.appendChild(floatingBadge);
  }

  function removeFloatingBadge() {
    if (floatingBadge) {
      floatingBadge.remove();
      floatingBadge = null;
    }
  }

  // ── Message Listener ────────────────────────

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "ANALYSIS_COMPLETE") {
      if (message.data && !message.data.error) {
        analysisResults = message.data;
        showFloatingBadge(message.data);
        
        // Auto-highlight if dangerous
        if (
          message.data.risk_level === "dangerous" ||
          message.data.risk_level === "illegal"
        ) {
          highlightClauses(message.data.top_issues);
        }
      }
    }

    if (message.type === "TOGGLE_HIGHLIGHTS") {
      if (highlightsActive) {
        removeHighlights();
        sendResponse({ active: false, count: 0 });
      } else if (message.clauses) {
        highlightClauses(message.clauses);
        sendResponse({ active: highlightsActive, count: highlightedElements.length });
      } else {
        sendResponse({ active: false, count: 0 });
      }
      return true;
    }

    if (message.type === "GET_HIGHLIGHT_STATE") {
      sendResponse({ 
        active: highlightsActive, 
        count: highlightedElements.length 
      });
      return true;
    }

    if (message.type === "SCROLL_TO_CLAUSE") {
      const success = scrollToClause(message.index);
      sendResponse({ success });
      return true;
    }

    if (message.type === "EXTRACT_TEXT") {
      const text = extractPageText();
      sendResponse({ text, title: document.title, url: location.href });
      return true;
    }

    return false;
  });

  // ── Init ────────────────────────────────────

  function init() {
    if (!isTosPage()) return;

    const text = extractPageText();
    if (text.length < 200) return;

    if (!confirmTosContent(text)) return;

    chrome.runtime.sendMessage({
      type: "TOS_DETECTED",
      url: location.href,
      text: text,
      title: document.title,
    });
  }

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }
})();