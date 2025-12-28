        // ============================================
        // SCR Tab Logic (Main Protocol Tabs and Nested Condition Tabs)

        // Make initConditionTabs globally available
        window.initConditionTabs = function() {
          // Find all active protocol tab contents that have condition tabs
          document.querySelectorAll('.protocol-tab-content.active').forEach(function(protocolContent) {
            const conditionContainer = protocolContent.querySelector('.scr-tabbed-conditions');
            if (!conditionContainer) return;

            const condTabs = conditionContainer.querySelector('.scr-tabs');
            if (!condTabs) return;

            const tabs = condTabs.querySelectorAll('.scr-tab');
            const contents = conditionContainer.querySelectorAll('.scr-tab-content');

            tabs.forEach(tab => {
              // Remove any existing onclick to prevent duplicate handlers
              tab.onclick = null;
              tab.onclick = function() {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.getAttribute('data-condition');
                const content = conditionContainer.querySelector('.scr-tab-content[data-condition-content="' + target + '"]');
                if (content) {
                  content.classList.add('active');
                }
              };
            });
          });
        };

        document.addEventListener('DOMContentLoaded', function() {
          // Initialize condition tabs on initial page load
          window.initConditionTabs();
        });
// ============================================
// SCR Tabbed Conditions (responsive tabs for Outcomes & Actions)
// ============================================
// (SCR tabbed-conditions logic is now handled by initConditionTabs above)
// ============================================
// State Management
// ============================================
const AppState = {
  currentPage: "dashboard",
  currentChecklist: null,
  theme: localStorage.getItem("theme") || "dark",
  font: localStorage.getItem("font") || "Manrope",
  checklists: {
    starting: { total: 21, checks: {} },
    stepup: { total: 20, checks: {} },
    repeat: { total: 31, checks: {} },
    "transfer-above": { total: 18, checks: {} },
    "transfer-below": { total: 21, checks: {} },
  },
};

// ============================================
// Utility Functions
// ============================================
const Utils = {
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  formatDateTime() {
    const now = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return now.toLocaleDateString("en-GB", options);
  },

  saveState() {
    localStorage.setItem("appState", JSON.stringify(AppState.checklists));
  },

  loadState() {
    const saved = localStorage.getItem("appState");
    if (saved) {
      try {
        AppState.checklists = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load saved state:", e);
      // ============================================
      // SCR Main Tab Switching Logic
      // ============================================
      document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.scr-protocol .protocol-tabs').forEach(function(tabBar) {
          const tabs = tabBar.querySelectorAll('.protocol-tab');
          const container = tabBar.parentElement;
          const contents = container.querySelectorAll('.protocol-tab-content');
          tabs.forEach(tab => {
            tab.addEventListener('click', function() {
              tabs.forEach(t => t.classList.remove('active'));
              contents.forEach(c => c.classList.remove('active'));
              tab.classList.add('active');
              const target = tab.getAttribute('data-tab');
              const content = container.querySelector('.protocol-tab-content[data-tab-content="' + target + '"]');
              if (content) content.classList.add('active');
            });
          });
        });
      });
      }
    }
  },
};

// ============================================
// Global Macro Copy Function
// ============================================
async function copyMacro(btn) {
  // Find the macro-text element within the same macro-template
  const templateContainer = btn.closest('.macro-template');
  const templateEl = templateContainer ? templateContainer.querySelector('.macro-text') : null;
  
  if (!templateEl) {
    console.error('Macro template text not found');
    return;
  }
  
  const text = templateEl.textContent;
  
  // Try modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20 6L9 17l-5-5"/></svg> Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy';
        btn.classList.remove('copied');
      }, 2000);
      return;
    } catch (e) {
      // Fall through to legacy method
    }
  }
  
  // Legacy fallback
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (ok) {
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20 6L9 17l-5-5"/></svg> Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy';
        btn.classList.remove('copied');
      }, 2000);
    }
  } catch (e) {
    console.error("Failed to copy macro:", e);
  }
}

// Function to navigate to a specific macro
function navigateToMacro(macroNumber) {
  // Navigate to macros page using NavigationManager (updates navbar and page title)
  NavigationManager.goToPage('macros');
  
  // Wait for page to load, then activate correct tab/subtab and expand the macro card
  setTimeout(() => {
    // Determine which sub-panel the macro is in
    let subtabId = 'scr-macros'; // default
    if (macroNumber >= 14 && macroNumber <= 17) {
      subtabId = 'pue-macros';
    } else if (macroNumber >= 18 && macroNumber <= 20) {
      subtabId = 'titration-macros';
    } else if (macroNumber >= 21 && macroNumber <= 22) {
      subtabId = 'verification-macros';
    } else if (macroNumber >= 23 && macroNumber <= 24) {
      subtabId = 'weight-macros';
    } else if (macroNumber >= 25 && macroNumber <= 26) {
      subtabId = 'nevolat-macros';
    } else if (macroNumber >= 27 && macroNumber <= 30) {
      subtabId = 'rejection-macros';
    }
    
    // Make sure email-macros main tab is active
    const mainTabs = document.querySelectorAll('.protocol-tab[data-tab]');
    const mainPanels = document.querySelectorAll('.tab-panel[data-panel]');
    mainTabs.forEach(t => t.classList.remove('active'));
    mainPanels.forEach(p => p.classList.remove('active'));
    const emailTab = document.querySelector('.protocol-tab[data-tab="email-macros"]');
    const emailPanel = document.querySelector('.tab-panel[data-panel="email-macros"]');
    if (emailTab) emailTab.classList.add('active');
    if (emailPanel) emailPanel.classList.add('active');
    
    // Activate the correct sub-tab
    const subTabs = document.querySelectorAll('.protocol-tab[data-subtab]');
    const subPanels = document.querySelectorAll('.sub-panel[data-subpanel]');
    subTabs.forEach(t => t.classList.remove('active'));
    subPanels.forEach(p => p.classList.remove('active'));
    const targetSubTab = document.querySelector(`.protocol-tab[data-subtab="${subtabId}"]`);
    const targetSubPanel = document.querySelector(`.sub-panel[data-subpanel="${subtabId}"]`);
    if (targetSubTab) targetSubTab.classList.add('active');
    if (targetSubPanel) targetSubPanel.classList.add('active');
    
    // Now expand and scroll to the macro
    const macroCard = document.getElementById(`macro-${macroNumber}`);
    if (macroCard) {
      macroCard.classList.add('expanded');
      macroCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 200);
}

// ============================================
// Theme Management
// ============================================
const ThemeManager = {
  init() {
    this.applyTheme(AppState.theme);
    this.applyFont(AppState.font);

    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const newTheme = AppState.theme === "dark" ? "light" : "dark";
        this.applyTheme(newTheme);
      });
    }

    const fontSelector = document.getElementById("fontSelector");
    if (fontSelector) {
      fontSelector.value = AppState.font;
      fontSelector.addEventListener("change", (e) => {
        this.applyFont(e.target.value);
      });
    }
  },

  applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    AppState.theme = theme;
    localStorage.setItem("theme", theme);

    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.setAttribute("data-theme", theme);
    }
  },

  applyFont(font) {
    document.body.style.fontFamily = `"${font}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    AppState.font = font;
    localStorage.setItem("font", font);
  },
};

// ============================================
// Search Management
// ============================================
const SearchManager = {
  searchData: [],
  resultsContainer: null,
  allTabsTextIndex: null,
  latestFindSummary: null,
  pendingNavigation: null,

  globalFindState: {
    terms: [],
    marks: [],
    index: -1,
  },

  localFindState: {
    terms: [],
    marks: [],
    index: -1,
  },

  init() {
    this.buildSearchIndex();
    const searchInput = document.getElementById("globalSearch");
    const searchClear = document.getElementById("searchClear");

    const prevOccurrence = document.getElementById("prevOccurrence");
    const nextOccurrence = document.getElementById("nextOccurrence");

    if (searchInput) {
      searchInput.addEventListener(
        "input",
        Utils.debounce((e) => this.handleGlobalQuery(e.target.value), 220)
      );

      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.clearSearch();
          return;
        }

        // Ctrl+F style navigation in current tab
        if (e.key === "Enter") {
          e.preventDefault();
          if (e.shiftKey) {
            this.gotoOccurrence(-1, "global");
          } else {
            this.gotoOccurrence(1, "global");
          }
        }
      });
    }

    if (searchClear) {
      searchClear.addEventListener("click", () => this.clearSearch());
    }

    if (prevOccurrence) {
      prevOccurrence.addEventListener("click", () => this.gotoOccurrence(-1, "global"));
    }
    if (nextOccurrence) {
      nextOccurrence.addEventListener("click", () => this.gotoOccurrence(1, "global"));
    }

    // Close search results when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-container")) {
        this.hideResults();
      }
    });
  },

  // Runs both: (1) structured navigation search (dropdown), and (2) Ctrl+F-style highlight within current tab.
  handleGlobalQuery(rawQuery) {
    this.handleSearch(rawQuery);
    this.runFind(rawQuery, {
      mode: "global",
      scopeEl: document.getElementById("contentArea"),
      controls: {
        controlsId: "occurrenceControls",
        countId: "occurrenceCount",
      },
      highlightClass: "find-highlight--global",
    });
  },

  getQueryTerms(rawQuery) {
    if (!rawQuery) return [];

    // Split on common separators (including new lines) but keep multi-word phrases intact.
    return rawQuery
      .toLowerCase()
      .split(/[,;\.\-\/\|\n\r]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 1);
  },

  buildAllTabsTextIndex() {
    // Cache the plain text for each page so we can count matches "across the whole website".
    const titles = {
      dashboard: "Prescribing Dashboard",
      checklists: "Safety Checklists",
      transfer: "Transfer Assessment",
      "proto-core": "Core Checks Protocol",
      "proto-scr": "SCR Screening",
      "proto-pue": "Previous Use Evidence",
      "proto-titration": "Titration & Gap Treatment",
      "proto-weight": "Weight Monitoring",
      "proto-switching": "Switching & Side Effects",
      "proto-reviews": "6 Month Reviews",
      consultation: "Consultation Questions",
      definitions: "Definitions",
      contraindications: "Contraindications",
      "titration-guide": "Titration Guide",
      rejections: "Rejection Reasons",
      tags: "Tags Reference",
      macros: "Email Macros",
    };

    const pageIds = Object.keys(titles);
    const index = [];

    const htmlToText = (html) => {
      const div = document.createElement("div");
      div.innerHTML = html || "";
      return (div.innerText || "").replace(/\s+/g, " ").trim();
    };

    const getHtml = (pageId) => {
      // Mirrors ContentManager.loadPage switch, without touching the DOM.
      switch (pageId) {
        case "dashboard":
          return ContentManager.getDashboardContent();
        case "checklists":
          return ContentManager.getChecklistsContent();
        case "transfer":
          return ContentManager.getTransferContent();
        case "proto-core":
          return ContentManager.getProtocolContent("core");
        case "proto-scr":
          return ContentManager.getProtocolContent("scr");
        case "proto-pue":
          return ContentManager.getProtocolContent("pue");
        case "proto-titration":
          return ContentManager.getProtocolContent("titration");
        case "proto-weight":
          return ContentManager.getProtocolContent("weight");
        case "proto-switching":
          return ContentManager.getProtocolContent("switching");
        case "proto-reviews":
          return ContentManager.getProtocolContent("reviews");
        case "consultation":
          return ContentManager.getConsultationContent();
        case "definitions":
          return ContentManager.getDefinitionsContent();
        case "contraindications":
          return ContentManager.getContraindicationsContent();
        case "titration-guide":
          return ContentManager.getTitrationGuideContent();
        case "rejections":
          return ContentManager.getRejectionsContent();
        case "tags":
          return ContentManager.getTagsContent();
        case "macros":
          return ContentManager.getMacrosContent();
        default:
          return "";
      }
    };

    pageIds.forEach((pageId) => {
      try {
        const html = getHtml(pageId);
        index.push({
          pageId,
          title: titles[pageId] || pageId,
          text: htmlToText(html),
        });
      } catch (e) {
        // If any page generator throws, skip it rather than breaking the whole search.
      }
    });

    this.allTabsTextIndex = index;
  },

  computeAllTabsCounts(terms) {
    if (!terms || terms.length === 0) {
      return { total: 0, perPage: [] };
    }

    if (!this.allTabsTextIndex) {
      this.buildAllTabsTextIndex();
    }

    const countInText = (text, term) => {
      if (!text || !term) return 0;
      const re = new RegExp(this.escapeRegex(term), "gi");
      const m = text.match(re);
      return m ? m.length : 0;
    };

    const perPage = (this.allTabsTextIndex || [])
      .map((p) => {
        const count = terms.reduce((acc, t) => acc + countInText(p.text, t), 0);
        return { pageId: p.pageId, title: p.title, count };
      })
      .filter((p) => p.count > 0)
      .sort((a, b) => b.count - a.count);

    const total = perPage.reduce((acc, p) => acc + p.count, 0);
    return { total, perPage };
  },

  clearHighlightsInScope(scopeEl, highlightClass) {
    if (!scopeEl) return;
    scopeEl.querySelectorAll(`mark.find-highlight.${highlightClass}`).forEach((m) => {
      m.replaceWith(document.createTextNode(m.textContent || ""));
    });
  },

  highlightTermsInScope(scopeEl, terms, highlightClass) {
    if (!scopeEl || !terms || terms.length === 0) return [];

    const createdMarks = [];

    const shouldSkipNode = (node) => {
      if (!node || !node.parentElement) return true;
      const p = node.parentElement;
      if (p.closest(".search-container")) return true;
      if (p.closest(".search-results")) return true;
      if (p.closest(".local-search-container")) return true;
      if (p.closest("script, style, textarea, input, select")) return true;
      if (p.closest("mark.find-highlight")) return true;
      return false;
    };

    const wrapMatchesInTextNode = (textNode, term) => {
      const text = textNode.nodeValue;
      if (!text) return;

      const re = new RegExp(this.escapeRegex(term), "gi");
      const matches = [...text.matchAll(re)];
      if (matches.length === 0) return;

      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      matches.forEach((m) => {
        const start = m.index;
        const end = start + m[0].length;

        if (start > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, start)));
        }

        const mark = document.createElement("mark");
        mark.className = `find-highlight ${highlightClass}`;
        mark.textContent = text.slice(start, end);
        frag.appendChild(mark);
        createdMarks.push(mark);

        lastIndex = end;
      });

      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      textNode.replaceWith(frag);
    };

    // Apply each term separately to keep the logic simple.
    terms.forEach((term) => {
      const walker = document.createTreeWalker(scopeEl, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node.nodeValue || !node.nodeValue.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((n) => wrapMatchesInTextNode(n, term));
    });

    return createdMarks;
  },

  updateOccurrenceUI(mode) {
    const state = mode === "local" ? this.localFindState : this.globalFindState;
    const controlsId =
      mode === "local" ? "localOccurrenceControls" : "occurrenceControls";
    const countId = mode === "local" ? "localOccurrenceCount" : "occurrenceCount";

    const controlsEl = document.getElementById(controlsId);
    const countEl = document.getElementById(countId);

    const total = state.marks.length;
    if (!controlsEl || !countEl) return;

    if (total === 0) {
      controlsEl.style.display = "none";
      countEl.textContent = "0/0";
      return;
    }

    controlsEl.style.display = "flex";
    const current = state.index >= 0 ? state.index + 1 : 0;

    let suffix = "";
    if (
      mode === "global" &&
      this.latestFindSummary &&
      typeof this.latestFindSummary.allTabsTotal === "number"
    ) {
      suffix = ` • all ${this.latestFindSummary.allTabsTotal}`;
    }

    countEl.textContent = `${current}/${total}${suffix}`;
  },

  setActiveOccurrence(mode) {
    const state = mode === "local" ? this.localFindState : this.globalFindState;
    const activeClass =
      mode === "local" ? "find-highlight--active-local" : "find-highlight--active-global";
    const baseClass =
      mode === "local" ? "find-highlight--local" : "find-highlight--global";

    state.marks.forEach((m) => m.classList.remove(activeClass));

    if (!state.marks.length || state.index < 0) {
      this.updateOccurrenceUI(mode);
      return;
    }

    const mark = state.marks[state.index];
    if (mark) {
      mark.classList.add(activeClass);
      // Ensure base class is present (in case the DOM got re-rendered)
      if (!mark.classList.contains(baseClass)) mark.classList.add(baseClass);
      mark.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    this.updateOccurrenceUI(mode);
  },

  gotoOccurrence(direction, mode = "global") {
    const state = mode === "local" ? this.localFindState : this.globalFindState;
    if (!state.marks.length) {
      this.updateOccurrenceUI(mode);
      return;
    }

    const total = state.marks.length;
    if (state.index < 0) state.index = 0;
    state.index = (state.index + direction + total) % total;
    this.setActiveOccurrence(mode);
  },

  runFind(rawQuery, { mode, scopeEl, controls, highlightClass }) {
    const state = mode === "local" ? this.localFindState : this.globalFindState;
    const terms = this.getQueryTerms(rawQuery);

    // Clear existing highlights of the same mode
    this.clearHighlightsInScope(scopeEl, highlightClass);

    state.terms = terms;
    state.marks = [];
    state.index = -1;

    if (!terms.length) {
      this.updateOccurrenceUI(mode);
      return;
    }

    state.marks = this.highlightTermsInScope(scopeEl, terms, highlightClass);
    state.index = state.marks.length ? 0 : -1;
    this.setActiveOccurrence(mode);
  },

  buildSearchIndex() {
    this.searchData = [
      // Contraindications - Absolute
      {
        title: "Pancreatitis",
        context:
          "Including acute or chronic pancreatic insufficiency - REJECT immediately",
        page: "contraindications",
        sectionId: "gastrointestinal-contraindication",
        category: "Absolute Contraindication",
        keywords: ["pancreatitis", "pancreatic", "insufficiency", "acute", "chronic"],
      },
      {
        title: "Eating Disorders",
        context:
          "Anorexia nervosa, Bulimia nervosa, Binge Eating Disorder (BED), ARFID - REJECT",
        page: "contraindications",
        sectionId: "psychiatric-contraindication",
        category: "Absolute Contraindication",
        keywords: [
          "eating disorder",
          "anorexia",
          "bulimia",
          "binge eating",
          "bed",
          "arfid",
          "anorexia nervosa",
          "bulimia nervosa",
        ],
      },
      {
        title: "Type 1 Diabetes",
        context: "Insulin-dependent diabetes mellitus (IDDM) - REJECT",
        page: "contraindications",
        sectionId: "diabetes-contraindication",
        category: "Absolute Contraindication",
        keywords: [
          "type 1 diabetes",
          "t1d",
          "iddm",
          "insulin dependent",
          "diabetes mellitus",
        ],
      },
      {
        title: "Liver Cirrhosis",
        context: "Liver cirrhosis - REJECT immediately",
        page: "contraindications",
        sectionId: "renal-hepatic-contraindication",
        category: "Absolute Contraindication",
        keywords: ["liver cirrhosis", "cirrhosis", "hepatic", "liver"],
      },
      {
        title: "Liver Transplant",
        context: "Liver transplant - REJECT immediately",
        page: "contraindications",
        sectionId: "renal-hepatic-contraindication",
        category: "Absolute Contraindication",
        keywords: ["liver transplant", "transplant", "hepatic transplant"],
      },
      {
        title: "Endocrine Disorders",
        context:
          "Acromegaly, Cushing's syndrome, Addison's disease, Congenital Adrenal Hyperplasia - REJECT",
        page: "contraindications",
        sectionId: "thyroid-contraindication",
        category: "Absolute Contraindication",
        keywords: [
          "endocrine",
          "acromegaly",
          "cushing",
          "addison",
          "adrenal hyperplasia",
          "cushings",
          "addisons",
        ],
      },
      {
        title: "Ulcerative Colitis",
        context: "Ulcerative Colitis - REJECT",
        page: "contraindications",
        sectionId: "gastrointestinal-contraindication",
        category: "Absolute Contraindication",
        keywords: ["ulcerative colitis", "uc", "colitis", "ibd", "inflammatory bowel"],
      },
      {
        title: "Crohn's Disease",
        context: "Crohn's disease - REJECT",
        page: "contraindications",
        sectionId: "gastrointestinal-contraindication",
        category: "Absolute Contraindication",
        keywords: ["crohns", "crohn", "ibd", "inflammatory bowel disease"],
      },
      {
        title: "Gastroparesis",
        context: "Delayed gastric emptying - REJECT",
        page: "contraindications",
        sectionId: "gastrointestinal-contraindication",
        category: "Absolute Contraindication",
        keywords: ["gastroparesis", "delayed gastric emptying", "gastric emptying"],
      },
      {
        title: "MEN2",
        context: "Multiple Endocrine Neoplasia type 2 - REJECT",
        page: "contraindications",
        sectionId: "thyroid-contraindication",
        category: "Absolute Contraindication",
        keywords: [
          "men2",
          "men 2",
          "multiple endocrine neoplasia",
          "endocrine neoplasia",
        ],
      },
      {
        title: "Medullary Thyroid Cancer",
        context: "Medullary thyroid cancer - REJECT",
        page: "contraindications",
        sectionId: "thyroid-contraindication",
        category: "Absolute Contraindication",
        keywords: ["medullary thyroid", "thyroid cancer", "mtc", "medullary cancer"],
      },
      {
        title: "Pregnancy",
        context: "Currently pregnant, breastfeeding, or trying to conceive - REJECT",
        page: "contraindications",
        sectionId: "pregnancy-contraindication",
        category: "Absolute Contraindication",
        keywords: [
          "pregnancy",
          "pregnant",
          "breastfeeding",
          "lactating",
          "conceive",
          "ttc",
        ],
      },

      // Medications
      {
        title: "Insulin",
        context: "On repeat medication list or within last 3 months - REJECT",
        page: "contraindications",
        sectionId: "insulin-diabetic-meds",
        category: "Medication",
        keywords: ["insulin", "diabetes medication"],
      },
      {
        title: "Oral Diabetic Medications",
        context:
          "Sulfonylureas (Diamicron, Daonil, Rastin), SGLT2 inhibitors (Jardiance, Forxiga, Invokana), DPP-4 inhibitors (Januvia, Galvus, Trajenta), Thiazolidinediones (Actos)",
        page: "contraindications",
        sectionId: "insulin-diabetic-meds",
        category: "Medication",
        keywords: [
          "diabetic medication",
          "sulfonylureas",
          "diamicron",
          "gliclazide",
          "daonil",
          "glibenclamide",
          "rastin",
          "tolbutamide",
          "sglt2",
          "jardiance",
          "empagliflozin",
          "forxiga",
          "dapagliflozin",
          "invokana",
          "canagliflozin",
          "dpp-4",
          "dpp4",
          "januvia",
          "sitagliptin",
          "galvus",
          "vildagliptin",
          "trajenta",
          "linagliptin",
          "actos",
          "pioglitazone",
        ],
      },
      {
        title: "Narrow Therapeutic Index Medications",
        context:
          "Amiodarone, Carbamazepine, Ciclosporin, Clozapine, Digoxin, Fenfluramine, Lithium, Mycophenolate, Oral methotrexate, Phenobarbital, Phenytoin, Somatrogon, Tacrolimus, Theophylline, Warfarin",
        page: "contraindications",
        sectionId: "narrow-therapeutic-medications",
        category: "Medication",
        keywords: [
          "narrow therapeutic index",
          "nti",
          "amiodarone",
          "carbamazepine",
          "ciclosporin",
          "cyclosporine",
          "clozapine",
          "digoxin",
          "fenfluramine",
          "lithium",
          "mycophenolate",
          "methotrexate",
          "phenobarbital",
          "phenytoin",
          "somatrogon",
          "tacrolimus",
          "theophylline",
          "warfarin",
        ],
      },
      {
        title: "Orlistat",
        context:
          "Alli, Xenical - REJECT if GLP prescription issued <1 month after Orlistat",
        page: "contraindications",
        sectionId: "orlistat",
        category: "Medication",
        keywords: ["orlistat", "alli", "xenical", "weight loss medication"],
      },

      // Time-Sensitive Conditions
      {
        title: "Bariatric Surgery",
        context:
          "RYGB, Sleeve Gastrectomy, Lap-Band, BPD/DS, OAGB, gastric balloon - REJECT if <12 months",
        page: "contraindications",
        sectionId: "bariatric-surgery",
        category: "Time-Sensitive",
        keywords: [
          "bariatric",
          "bariatric surgery",
          "rygb",
          "gastric bypass",
          "sleeve gastrectomy",
          "lap band",
          "gastric band",
          "bpd/ds",
          "oagb",
          "gastric balloon",
          "weight loss surgery",
        ],
      },
      {
        title: "Cholecystectomy",
        context: "Gallbladder removal - REJECT if <12 months",
        page: "contraindications",
        sectionId: "cholecystectomy",
        category: "Time-Sensitive",
        keywords: ["cholecystectomy", "gallbladder removal", "gallbladder surgery"],
      },
      {
        title: "Cholelithiasis / Cholecystitis",
        context:
          "Gallstones or gallbladder inflammation - need cholecystectomy confirmation",
        page: "contraindications",
        sectionId: "gallstones-cholecystitis",
        category: "Clinical Details Required",
        keywords: [
          "cholelithiasis",
          "cholecystitis",
          "gallstones",
          "gallbladder",
          "gallbladder inflammation",
        ],
      },
      {
        title: "Heart Failure",
        context: "REJECT if Stage IV - email patient for cardiology letter (<a href='#macro-4' onclick='navigateToMacro(4); return false;' style='color: var(--accent);'>Macro 4</a>)",
        page: "contraindications",
        sectionId: "heart-failure",
        category: "Clinical Details Required",
        keywords: [
          "heart failure",
          "hf",
          "cardiac failure",
          "congestive heart failure",
          "chf",
        ],
      },
      {
        title: "Chronic Kidney Disease",
        context: "REJECT if eGFR <30 or Stage 4 - request eGFR (<a href='#macro-5' onclick='navigateToMacro(5); return false;' style='color: var(--accent);'>Macro 5</a>)",
        page: "contraindications",
        sectionId: "chronic-kidney-disease",
        category: "Clinical Details Required",
        keywords: [
          "chronic kidney disease",
          "ckd",
          "renal impairment",
          "egfr",
          "kidney disease",
          "renal disease",
        ],
      },
      {
        title: "Cancer",
        context: "Excluding MEN2/medullary thyroid - request oncology letter (<a href='#macro-3' onclick='navigateToMacro(3); return false;' style='color: var(--accent);'>Macro 3</a>)",
        page: "contraindications",
        sectionId: "cancer-assessment",
        category: "Patient Assessment",
        keywords: ["cancer", "malignancy", "oncology", "tumor", "carcinoma", "neoplasm"],
      },
      {
        title: "Breast Cancer",
        context: "Requires clarification NOT rejection - hormone therapy allowed (<a href='#macro-31' onclick='navigateToMacro(31); return false;' style='color: var(--accent);'>Macro 31</a>)",
        page: "contraindications",
        sectionId: "cancer-assessment",
        category: "Patient Assessment",
        keywords: ["breast cancer", "breast", "tamoxifen", "zoladex", "hormone therapy", "breast carcinoma", "mastectomy"],
      },
      {
        title: "Dementia / Cognitive Impairment",
        context: "Assess safety at home and ability to use medication (<a href='#macro-7' onclick='navigateToMacro(7); return false;' style='color: var(--accent);'>Macro 7</a>)",
        page: "contraindications",
        sectionId: "dementia-assessment",
        category: "Patient Assessment",
        keywords: [
          "dementia",
          "cognitive impairment",
          "alzheimers",
          "memory loss",
          "confusion",
        ],
      },
      {
        title: "Chronic Malabsorption",
        context: "REJECT if formal diagnosis confirmed (<a href='#macro-8' onclick='navigateToMacro(8); return false;' style='color: var(--accent);'>Macro 8</a>)",
        page: "contraindications",
        sectionId: "malabsorption-assessment",
        category: "Patient Assessment",
        keywords: ["malabsorption", "chronic malabsorption", "absorption disorder"],
      },
      {
        title: "Depression / Anxiety",
        context: "REJECT if acutely unwell <3 months or new antidepressant (<a href='#macro-9' onclick='navigateToMacro(9); return false;' style='color: var(--accent);'>Macro 9</a>)",
        page: "contraindications",
        sectionId: "depression-anxiety-assessment",
        category: "Patient Assessment",
        keywords: [
          "depression",
          "anxiety",
          "mental health",
          "psychiatric",
          "antidepressant",
          "ssri",
          "snri",
        ],
      },
      {
        title: "Suicidal Ideation",
        context: "REJECT if <12 months - active suicidal thoughts (<a href='#macro-9' onclick='navigateToMacro(9); return false;' style='color: var(--accent);'>Macro 9</a>)",
        page: "contraindications",
        sectionId: "suicidal-ideation-assessment",
        category: "Patient Assessment",
        keywords: ["suicidal", "suicide", "self harm", "suicidal ideation"],
      },
      {
        title: "Alcohol Abuse",
        context: "REJECT if current dependence or <12 months (<a href='#macro-10' onclick='navigateToMacro(10); return false;' style='color: var(--accent);'>Macro 10</a>)",
        page: "contraindications",
        sectionId: "alcohol-abuse-assessment",
        category: "Patient Assessment",
        keywords: [
          "alcohol",
          "alcohol abuse",
          "alcohol dependence",
          "alcoholism",
          "substance abuse",
        ],
      },

      // BMI & Weight
      {
        title: "BMI Requirements",
        context:
          "New patients: BMI ≥30 (or ≥27 with comorbidity). Transfer patients: different thresholds apply",
        page: "proto-weight",
        category: "Weight Protocol",
        keywords: ["bmi", "body mass index", "weight", "obesity", "overweight"],
      },
      {
        title: "Weight Verification",
        context:
          "Photo ID + scale photo required for new patients. Check date, visibility, matching details",
        page: "proto-weight",
        category: "Weight Protocol",
        keywords: [
          "weight verification",
          "weight photo",
          "scale photo",
          "id verification",
        ],
      },

      // SCR
      {
        title: "SCR Screening",
        context: "Summary Care Record - check for contraindications using scraping tool",
        page: "proto-scr",
        category: "SCR Protocol",
        keywords: [
          "scr",
          "summary care record",
          "nhs record",
          "scraping tool",
          "medical record",
        ],
      },
      {
        title: "SCR Permission",
        context: "Patient must grant permission to view SCR - use <a href='#macro-11' onclick='navigateToMacro(11); return false;' style='color: var(--accent);'>Macro 11</a> if missing",
        page: "proto-scr",
        category: "SCR Protocol",
        keywords: ["scr permission", "permission to view", "consent"],
      },

      // Titration
      {
        title: "Dose Titration",
        context: "Starting dose, step-up schedule, maintenance dose guidance",
        page: "titration-guide",
        category: "Titration",
        keywords: [
          "titration",
          "dose",
          "dosing",
          "starting dose",
          "step up",
          "maintenance dose",
          "dose escalation",
        ],
      },
      {
        title: "Gap in Treatment",
        context: "Rules for restarting after treatment breaks - depends on gap length",
        page: "proto-titration",
        category: "Titration",
        keywords: [
          "gap",
          "treatment gap",
          "missed dose",
          "restart",
          "break in treatment",
        ],
      },

      // PUE
      {
        title: "Previous Use Evidence",
        context: "Documentation required for transfer patients claiming prior GLP-1 use",
        page: "proto-pue",
        category: "Transfer Protocol",
        keywords: [
          "pue",
          "previous use",
          "prior use",
          "evidence",
          "transfer patient",
          "proof of use",
        ],
      },
    ];
  },

  handleSearch(query) {
    const searchClear = document.getElementById("searchClear");

    if (!query || query.trim().length < 2) {
      this.hideResults();
      if (searchClear) searchClear.style.display = "none";

      // Also clear Ctrl+F style highlights
      const scopeEl = document.getElementById("contentArea");
      this.clearHighlightsInScope(scopeEl, "find-highlight--global");
      this.globalFindState.terms = [];
      this.globalFindState.marks = [];
      this.globalFindState.index = -1;
      this.updateOccurrenceUI("global");
      this.latestFindSummary = null;
      return;
    }

    if (searchClear) searchClear.style.display = "flex";

    // Parse multiple terms - split by common separators (incl. new lines)
    const terms = this.getQueryTerms(query);

    const results = this.search(terms);

    const allTabs = this.computeAllTabsCounts(terms);
    const currentPageId = AppState.currentPage || "";
    const currentTabCount = (allTabs.perPage || []).find(
      (p) => p.pageId === currentPageId
    )
      ? (allTabs.perPage || []).find((p) => p.pageId === currentPageId).count
      : 0;
    this.latestFindSummary = {
      currentTabCount,
      allTabsTotal: allTabs.total,
      perPage: allTabs.perPage || [],
      rawQuery: query,
    };

    this.displayResults(results, query);
  },

  search(terms) {
    const allResults = [];

    terms.forEach((term) => {
      this.searchData.forEach((item) => {
        let score = 0;
        const termLower = term.toLowerCase();

        // Exact title match - highest priority
        if (item.title.toLowerCase() === termLower) {
          score += 100;
        }
        // Title contains term
        else if (item.title.toLowerCase().includes(termLower)) {
          score += 50;
        }

        // Check keywords
        item.keywords.forEach((keyword) => {
          if (keyword === termLower) {
            score += 80;
          } else if (keyword.includes(termLower) || termLower.includes(keyword)) {
            score += 30;
          }
        });

        // Context match
        if (item.context.toLowerCase().includes(termLower)) {
          score += 20;
        }

        // Fuzzy match for common medical term variations
        const fuzzyScore = this.fuzzyMatch(termLower, item.title.toLowerCase());
        score += fuzzyScore;

        if (score > 0) {
          allResults.push({
            ...item,
            score,
            matchedTerm: term,
          });
        }
      });
    });

    // Deduplicate and sort by score
    const uniqueResults = [];
    const seen = new Set();

    allResults
      .sort((a, b) => b.score - a.score)
      .forEach((result) => {
        const key = `${result.title}-${result.page}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueResults.push(result);
        }
      });

    return uniqueResults.slice(0, 10); // Top 10 results
  },

  fuzzyMatch(term, target) {
    // Simple fuzzy matching for typos and variations
    if (term.length < 3) return 0;

    const termChars = term.split("");
    let matchIndex = 0;
    let score = 0;

    for (let char of termChars) {
      const index = target.indexOf(char, matchIndex);
      if (index !== -1) {
        score += 1;
        matchIndex = index + 1;
      }
    }

    return score >= term.length * 0.7 ? score * 2 : 0;
  },

  displayResults(results, originalQuery) {
    if (!this.resultsContainer) {
      this.resultsContainer = document.createElement("div");
      this.resultsContainer.className = "search-results";
      document.querySelector(".search-container").appendChild(this.resultsContainer);
    }

    const summary = this.latestFindSummary;
    const summaryLine = summary
      ? `<div class="search-results-subheader">This tab: <strong>${summary.currentTabCount}</strong> • All tabs: <strong>${summary.allTabsTotal}</strong></div>`
      : "";

    const tabMatches =
      summary && summary.perPage && summary.perPage.length
        ? `
        <div class="search-results-tabs">
          <div class="search-results-tabs-title">Matches by tab</div>
          ${summary.perPage
            .slice(0, 8)
            .map(
              (p) => `
                <button class="search-tab-match" data-page="${p.pageId}" type="button">
                  <span class="search-tab-match-title">${p.title}</span>
                  <span class="search-tab-match-count">${p.count}</span>
                </button>
              `
            )
            .join("")}
        </div>
      `
        : "";

    if (results.length === 0) {
      this.resultsContainer.innerHTML = `
        ${summaryLine}
        ${tabMatches}
        <div class="search-no-results">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <div style="font-weight: 600; margin-bottom: 4px;">No results found</div>
          <div style="font-size: 13px;">Try different keywords or check spelling</div>
        </div>
      `;
      this.resultsContainer.classList.add("active");

      // Attach tab-match click handlers even when there are no structured results
      this.resultsContainer
        .querySelectorAll(".search-tab-match[data-page]")
        .forEach((btn) => {
          btn.addEventListener("click", () => {
            const pageId = btn.dataset.page;
            this.pendingNavigation = { pageId, sectionId: null, rawQuery: originalQuery };
            NavigationManager.goToPage(pageId);
            this.hideResults();
          });
        });
      return;
    }

    const resultsHTML = `
      <div class="search-results-header">${results.length} result${
      results.length !== 1 ? "s" : ""
    } found</div>
      ${summaryLine}
      ${tabMatches}
      ${results.map((result) => this.createResultHTML(result, originalQuery)).join("")}
    `;

    this.resultsContainer.innerHTML = resultsHTML;
    this.resultsContainer.classList.add("active");

    // Add click handlers
    this.resultsContainer
      .querySelectorAll(".search-result-item")
      .forEach((item, index) => {
        item.addEventListener("click", () => {
          const result = results[index];
          this.pendingNavigation = {
            pageId: result.page,
            sectionId: result.sectionId || null,
            rawQuery: originalQuery,
          };

          NavigationManager.goToPage(result.page);
          // Keep the query in the search box (Ctrl+F behavior), just close dropdown.
          this.hideResults();
        });
      });

    // Tab match click handlers
    this.resultsContainer
      .querySelectorAll(".search-tab-match[data-page]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const pageId = btn.dataset.page;
          this.pendingNavigation = { pageId, sectionId: null, rawQuery: originalQuery };
          NavigationManager.goToPage(pageId);
          this.hideResults();
        });
      });
  },

  createResultHTML(result, query) {
    const highlightedTitle = this.highlightText(result.title, query);
    const highlightedContext = this.highlightText(result.context, query);

    return `
      <div class="search-result-item">
        <div class="search-result-title">${highlightedTitle}</div>
        <div class="search-result-context">${highlightedContext}</div>
        <span class="search-result-badge">${result.category}</span>
      </div>
    `;
  },

  highlightText(text, query) {
    if (!query) return text;

    const terms = this.getQueryTerms(query);

    let highlightedText = text;

    terms.forEach((term) => {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, "gi");
      highlightedText = highlightedText.replace(regex, "<mark>$1</mark>");
    });

    return highlightedText;
  },

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  hideResults() {
    if (this.resultsContainer) {
      this.resultsContainer.classList.remove("active");
    }
  },

  clearSearch() {
    const searchInput = document.getElementById("globalSearch");
    const searchClear = document.getElementById("searchClear");
    const scopeEl = document.getElementById("contentArea");

    // Clear global highlights
    this.clearHighlightsInScope(scopeEl, "find-highlight--global");
    this.globalFindState.terms = [];
    this.globalFindState.marks = [];
    this.globalFindState.index = -1;
    this.updateOccurrenceUI("global");

    if (searchInput) searchInput.value = "";
    if (searchClear) searchClear.style.display = "none";
    this.hideResults();
  },

  // Called after ContentManager renders a page
  onPageRendered(pageId) {
    // If the global search box has a query, re-apply Ctrl+F highlights on the new content
    const searchInput = document.getElementById("globalSearch");
    const raw = searchInput ? searchInput.value : "";
    const scopeEl = document.getElementById("contentArea");
    if (raw && raw.trim().length >= 2) {
      this.runFind(raw, {
        mode: "global",
        scopeEl,
        controls: { controlsId: "occurrenceControls", countId: "occurrenceCount" },
        highlightClass: "find-highlight--global",
      });
    }

    // Set up contraindications local search when that page is shown
    if (pageId === "contraindications") {
      this.initContraindicationsLocalSearch();
    }

    // If navigation was triggered by search, scroll to the target section (if any)
    if (this.pendingNavigation && this.pendingNavigation.pageId === pageId) {
      const { sectionId } = this.pendingNavigation;
      if (sectionId) {
        // First, open the tabs to reveal the content
        setTimeout(() => {
          this.openTabsForSection(sectionId);

          // Then, wait for tabs to render before scrolling and highlighting
          setTimeout(() => {
            let section = document.getElementById(sectionId);

            // If section not found by ID, try to find the tab content itself
            if (!section) {
              section = document.querySelector(`[data-condition-content="${sectionId}"], [data-tab-content="${sectionId}"]`);
            }

            if (section) {
              section.scrollIntoView({ behavior: "smooth", block: "start" });
              section.style.animation = "highlight-pulse 2s ease-in-out";
              setTimeout(() => {
                section.style.animation = "";
              }, 2000);
            }
          }, 300); // Wait 300ms after opening tabs for them to fully render
        }, 150);
      }
      this.pendingNavigation = null;
    }
  },

  // Auto-open protocol tabs and nested condition tabs to reveal a section
  openTabsForSection(sectionId) {
    let section = document.getElementById(sectionId);

    // If section not found by ID, or if found but not inside any tabs,
    // try to find it by searching for elements with data-condition-content or text content
    if (!section || !section.closest('[data-tab-content], [data-condition-content]')) {
      // Try to find a tab content with matching data attribute
      const possibleTab = document.querySelector(`[data-condition-content="${sectionId}"], [data-tab-content="${sectionId}"]`);
      if (possibleTab) {
        section = possibleTab;
      }
    }

    if (!section) return;

    // Find if section is inside a protocol-tab-content (main tab)
    const mainTabContent = section.closest('.protocol-tab-content[data-tab-content]');
    if (mainTabContent) {
      const mainTabId = mainTabContent.dataset.tabContent;
      const mainTabContainer = mainTabContent.parentElement;
      const mainTab = mainTabContainer ? mainTabContainer.querySelector(`.protocol-tab[data-tab="${mainTabId}"]`) : null;

      if (mainTab && !mainTab.classList.contains('active')) {
        // Switch to the correct main tab
        const tabsContainer = mainTab.parentElement;
        if (tabsContainer) {
          tabsContainer.querySelectorAll('.protocol-tab').forEach(t => t.classList.remove('active'));
          mainTabContainer.querySelectorAll('.protocol-tab-content').forEach(c => c.classList.remove('active'));

          mainTab.classList.add('active');
          mainTabContent.classList.add('active');
        }
      }
    }

    // Find if section is inside a nested scr-tab-content (condition tab)
    const conditionTabContent = section.closest('.scr-tab-content[data-condition-content]');
    if (conditionTabContent) {
      const conditionId = conditionTabContent.dataset.conditionContent;
      const conditionTabsContainer = conditionTabContent.closest('.scr-tabbed-conditions');

      if (conditionTabsContainer) {
        const conditionTab = conditionTabsContainer.querySelector(`.scr-tab[data-condition="${conditionId}"]`);

        if (conditionTab && !conditionTab.classList.contains('active')) {
          // Switch to the correct condition tab
          conditionTabsContainer.querySelectorAll('.scr-tab').forEach(t => t.classList.remove('active'));
          conditionTabsContainer.querySelectorAll('.scr-tab-content').forEach(c => c.classList.remove('active'));

          conditionTab.classList.add('active');
          conditionTabContent.classList.add('active');
        }
      }
    }
  },

  initContraindicationsLocalSearch() {
    const input = document.getElementById("contraindicationsSearch");
    const clearBtn = document.getElementById("localSearchClear");
    const prevBtn = document.getElementById("localPrevOccurrence");
    const nextBtn = document.getElementById("localNextOccurrence");
    const scopeEl = document.getElementById("contentArea");

    if (!input || input.dataset.initialized === "true") {
      return;
    }
    input.dataset.initialized = "true";

    const run = (rawQuery) => {
      // Clear global highlights when local search is used, to prevent nested marks.
      this.clearHighlightsInScope(scopeEl, "find-highlight--global");
      this.globalFindState.terms = [];
      this.globalFindState.marks = [];
      this.globalFindState.index = -1;
      this.updateOccurrenceUI("global");

      this.runFind(rawQuery, {
        mode: "local",
        scopeEl,
        controls: {
          controlsId: "localOccurrenceControls",
          countId: "localOccurrenceCount",
        },
        highlightClass: "find-highlight--local",
      });

      if (clearBtn) {
        clearBtn.style.display = rawQuery && rawQuery.trim().length ? "flex" : "none";
      }
    };

    input.addEventListener(
      "input",
      Utils.debounce((e) => run(e.target.value), 180)
    );
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        input.value = "";
        run("");
        if (clearBtn) clearBtn.style.display = "none";
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) this.gotoOccurrence(-1, "local");
        else this.gotoOccurrence(1, "local");
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        input.value = "";
        run("");
        clearBtn.style.display = "none";
      });
    }

    if (prevBtn)
      prevBtn.addEventListener("click", () => this.gotoOccurrence(-1, "local"));
    if (nextBtn) nextBtn.addEventListener("click", () => this.gotoOccurrence(1, "local"));
  },
};

// ============================================
// Navigation Management
// ============================================
const NavigationManager = {
  init() {
    document.querySelectorAll(".nav-item[data-page]").forEach((item) => {
      item.addEventListener("click", () => this.goToPage(item.dataset.page));
    });

    const mobileToggle = document.getElementById("mobileToggle");
    const overlay = document.getElementById("overlay");

    if (mobileToggle) {
      mobileToggle.addEventListener("click", () => this.toggleMobileSidebar());
    }

    if (overlay) {
      overlay.addEventListener("click", () => this.closeMobileSidebar());
    }

    this.goToPage("dashboard");
  },

  goToPage(pageId) {
    AppState.currentPage = pageId;

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.page === pageId);
    });

    this.updateHeader(pageId);
    ContentManager.loadPage(pageId);
    this.closeMobileSidebar();
  },

  updateHeader(pageId) {
    const titles = {
      dashboard: [
        "Prescribing Dashboard",
        "Select a prescription type to begin safety checks",
      ],
      checklists: this.getChecklistHeaderText(),
      transfer: [
        "Transfer Patient Checks",
        "New to MedExpress but has previous GLP-1 use",
      ],
      "proto-core": ["Core Checks Protocol", "Essential verification requirements"],
      "proto-scr": [
        "SCR Screening",
        "Pre-prescription SCR checks, outcomes, decision-making, macros and documentation",
      ],
      "proto-pue": ["Previous Use Evidence", "Requirements for transfer patients"],
      "proto-titration": ["Titration & Gap Treatment", "Dose escalation rules"],
      "proto-weight": ["Weight Monitoring", "Weight change thresholds"],
      "proto-switching": ["Switching & Side Effects", "Medication changes"],
      "proto-reviews": ["6 Month Reviews", "Review requirements"],
      consultation: ["Consultation Questions", "Required questions and expected answers"],
      definitions: ["Definitions", "Patient classifications"],
      contraindications: ["Contraindications", "Absolute and relative contraindications"],
      "titration-guide": ["Titration Guide", "Dose equivalence and gap adjustments"],
      rejections: ["Rejection Reasons", "Manual rejection reasons and when to use them"],
      tags: ["Tags Reference", "Common tags and usage"],
      macros: ["Macros", "Email templates and documentation notes"],
    };

    const [title, subtitle] = titles[pageId] || ["Page", "Loading..."];
    const titleEl = document.getElementById("page-title");
    const subtitleEl = document.getElementById("page-subtitle");
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
  },

  toggleMobileSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    if (!sidebar || !overlay) return;
    sidebar.classList.toggle("open");
    overlay.classList.toggle("active");
  },

  closeMobileSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    if (!sidebar || !overlay) return;
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
  },

  getChecklistHeaderText() {
    const type = AppState.currentChecklist || "starting";
    const headers = {
      starting: [
        "Safety Checklist: New Order — Starter Dose",
        "Complete all required checks for patients beginning GLP-1 treatment"
      ],
      stepup: [
        "Safety Checklist: New Order — Continuation Dose",
        "Complete all required checks for patients titrating to a higher dose"
      ],
      repeat: [
        "Safety Checklist: Simple Repeats",
        "Complete all required checks for maintenance dose prescriptions"
      ]
    };
    return headers[type] || headers.starting;
  },
};

// ============================================
// Content Management
// ============================================
const ContentManager = {
  loadPage(pageId) {
    const contentArea = document.getElementById("contentArea");
    if (!contentArea) return;

    setTimeout(() => {
      let content = "";

      switch (pageId) {
        case "dashboard":
          content = this.getDashboardContent();
          break;
        case "checklists":
          content = this.getChecklistsContent();
          break;
        case "transfer":
          content = this.getTransferContent();
          break;
        case "proto-core":
          content = this.getProtocolContent("core");
          break;
        case "proto-scr":
          content = this.getProtocolContent("scr");
          break;
        case "proto-pue":
          content = this.getProtocolContent("pue");
          break;
        case "proto-titration":
          content = this.getProtocolContent("titration");
          break;
        case "proto-weight":
          content = this.getProtocolContent("weight");
          break;
        case "proto-switching":
          content = this.getProtocolContent("switching");
          break;
        case "proto-reviews":
          content = this.getProtocolContent("reviews");
          break;
        case "consultation":
          content = this.getConsultationContent();
          break;
        case "definitions":
          content = this.getDefinitionsContent();
          break;
        case "contraindications":
          content = this.getContraindicationsContent();
          break;
        case "titration-guide":
          content = this.getTitrationGuideContent();
          break;
        case "rejections":
          content = this.getRejectionsContent();
          break;
        case "tags":
          content = this.getTagsContent();
          break;
        case "macros":
          content = this.getMacrosContent();
          break;
        default:
          content = "<p>Page not found</p>";
      }

      contentArea.innerHTML = content;
      this.attachEventListeners(pageId);

      if (typeof SearchManager !== "undefined" && SearchManager.onPageRendered) {
        SearchManager.onPageRendered(pageId);
      }
    }, 50);
  },

  getDashboardContent() {
    return `
            <div class="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                Select Prescription Type
            </div>

            <div class="prescription-grid">
                <div class="prescription-card" data-type="starting">
                    <div class="prescription-icon starter">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    </div>
                    <h3>New Order — Starter Dose</h3>
                    <p>New patients beginning GLP-1 treatment for the first time</p>
                    <div class="checks-count">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg>
                      21 checks required
                    </div>
                </div>

                <div class="prescription-card" data-type="stepup">
                    <div class="prescription-icon stepup">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    </div>
                    <h3>New Order — Continuation Dose</h3>
                    <p>Existing patients titrating to a higher dose</p>
                    <div class="checks-count">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg>
                        20 checks required
                    </div>
                </div>

                <div class="prescription-card" data-type="repeat">
                    <div class="prescription-icon repeat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
                    </div>
                    <h3>Simple Repeats</h3>
                    <p>Existing patients ordering same dose (maintenance)</p>
                    <div class="checks-count">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg>
                        31 checks required
                    </div>
                </div>
            </div>
        `;
  },

  getChecklistsContent() {
    // Determine which checklist to show based on current state
    const type = AppState.currentChecklist || "starting";
    console.log("Loading checklist for type:", type);
    console.log("AppState.currentChecklist:", AppState.currentChecklist);

    const checklistConfig = {
      starting: {
        title: "New Order — Starter Dose",
        subtitle: "New Patient",
        badgeClass: "starter",
        total: 21,
        description: "Complete safety checks for patients beginning GLP-1 treatment for the first time"
      },
      stepup: {
        title: "New Order — Continuation Dose",
        subtitle: "Titration",
        badgeClass: "stepup",
        total: 20,
        description: "Safety checks for existing patients titrating to a higher dose"
      },
      repeat: {
        title: "Simple Repeats",
        subtitle: "Maintenance",
        badgeClass: "repeat",
        total: 31,
        description: "Streamlined checks for existing patients ordering the same dose"
      }
    };

    const config = checklistConfig[type] || checklistConfig.starting;

    return `
            <div class="back-to-dashboard" style="margin-bottom: 20px;">
                <button class="btn btn-secondary back-btn" data-page="dashboard">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Back to Dashboard
                </button>
            </div>

            <!-- Prescription Type Tabs -->
            <div class="protocol-tabs" style="margin-bottom: 24px;">
                <button class="protocol-tab checklist-type-tab ${type === 'starting' ? 'active' : ''}" data-checklist-type="starting">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    New Order — Starter Dose
                    <span style="display: block; font-size: 11px; opacity: 0.7; margin-top: 2px;">21 checks</span>
                </button>
                <button class="protocol-tab checklist-type-tab ${type === 'stepup' ? 'active' : ''}" data-checklist-type="stepup">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                    </svg>
                    New Order — Continuation Dose
                    <span style="display: block; font-size: 11px; opacity: 0.7; margin-top: 2px;">20 checks</span>
                </button>
                <button class="protocol-tab checklist-type-tab ${type === 'repeat' ? 'active' : ''}" data-checklist-type="repeat">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                        <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
                    </svg>
                    Simple Repeats
                    <span style="display: block; font-size: 11px; opacity: 0.7; margin-top: 2px;">31 checks</span>
                </button>
            </div>

            <div class="checklist-panel active" id="checklist-${type}">
                <div class="checklist-header">
                    <div class="checklist-title">
                        <h2>${config.title}</h2>
                        <span class="type-badge ${config.badgeClass}">${config.subtitle}</span>
                    </div>
                    <div class="progress-ring">
                        <div class="progress-circle" style="width: 64px !important; height: 64px !important; max-width: 64px !important; max-height: 64px !important;">
                            <svg width="64" height="64" viewBox="0 0 64 64" style="width: 64px !important; height: 64px !important; max-width: 64px !important; max-height: 64px !important;">
                                <defs>
                                    <linearGradient id="progressGradient-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#22c55e"/>
                                        <stop offset="100%" stop-color="#06b6d4"/>
                                    </linearGradient>
                                </defs>
                                <circle class="bg" cx="32" cy="32" r="27"/>
                                <circle class="progress" cx="32" cy="32" r="27" stroke-dasharray="169.6" stroke-dashoffset="169.6" id="progress-${type}" stroke="url(#progressGradient-${type})"/>
                            </svg>
                            <span class="progress-text" id="progress-text-${type}">0/${config.total}</span>
                        </div>
                        <div class="progress-label">Checks<br>Complete</div>
                    </div>
                </div>

                <div class="info-card ${config.badgeClass === 'starter' ? 'green' : config.badgeClass === 'stepup' ? 'orange' : 'cyan'}" style="margin-bottom: 24px;">
                    <div class="info-card-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px !important; height: 20px !important; max-width: 20px !important; max-height: 20px !important; flex-shrink: 0;">
                            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                        </svg>
                        📋 Checklist Type: ${config.title}
                    </div>
                    <div class="info-card-text">${config.description}</div>
                </div>

                ${this.getChecklistSections(type)}

                <div class="status-bar">
                    <div class="status-info">
                        <div class="status-badge pending" id="status-badge-${type}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                            <span>Pending</span>
                        </div>
                        <span style="color: var(--text-secondary); font-size: 14px;">Complete all checks to enable signing</span>
                    </div>
                    <div class="btn-actions">
                        <button class="btn btn-reset" data-checklist="${type}">Reset</button>
                        <button class="btn btn-sign" id="btn-sign-${type}" data-checklist="${type}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            Ready to Sign
                        </button>
                    </div>
                </div>
            </div>
        `;
  },

  getChecklistSections(type) {
    const sections = {
      starting: [
        {
          title: "Consultation & Eligibility",
          icon: "blue",
          checks: [
            {
              id: "s1",
              label: "Read full consultation and patient notes",
              hint: "Check for email updates, eligibility, any contraindications (Appendix 24), or GLP-1 hospitalisation history.",
              linkPage: "contraindications",
              linkLabel: "Open contraindications →",
            },
            {
              id: "s2",
              label: "Confirm age 18–74 years (up to 74y 11m)",
              hint: "Check DOB from ID. Outside range → Reject 'Clinically Unsuitable' with refund. No escalation needed.",
              warning: true,
              linkPage: "consultation",
              linkLabel: "Open consultation questions →",
            },
            {
              id: "s3",
              label: "BMI within eligible range (30–60, or 27–60 with comorbidity)",
              hint: "Comorbidities: prediabetes, diabetes, heart disease, high BP, high cholesterol, sleep apnoea. Max BMI = 60.",
              infoCard: {
                type: "orange",
                title: "BMI Licensing Thresholds",
                content: "• BMI ≥30: Eligible for GLP-1 (standard licensing)\n• BMI ≥27 with comorbidities: Eligible with comorbidity\n• BMI <30 (or <27 without comorbidity): Below-licence - requires PUE + starting BMI photo for NEW patients",
                linkPage: "pue",
                linkLabel: "View PUE & Below-Licence BMI Protocol →"
              }
            },
            {
              id: "s3b",
              label: "Check ethnicity-adjusted BMI if applicable",
              hint: "Eligible ethnicities → threshold lowered to 27.5. Do not challenge ethnicity even if doesn't match ID.",
            },
            {
              id: "s3c",
              label: "No contraindications or GLP-1-related hospitalisation",
              hint: "If hospitalisation due to GLP-1 confirmed → Reject. If unclear → hold + email patient.",
              danger: true,
            },
          ],
        },
        {
          title: "ID Verification",
          icon: "green",
          checks: [
            {
              id: "s4",
              label: "ID is government-issued, valid, and in date",
              hint: "Passport, driving licence, PASS card. Must show full name, DOB, photo. Can be non-UK if genuine.",
            },
            {
              id: "s5",
              label: "ID matches patient account details",
              hint: "Small mismatches (nickname, DOB day, married name) → correct via Users page before prescribing.",
              warning: true,
            },
            {
              id: "s5b",
              label: "If ID fails: Apply correct tag",
              hint: "1st fail → add 'Failed ID' tag (auto email, see <a href='#macro-21' onclick='navigateToMacro(21); return false;' style='color: var(--accent);'>Macro 21</a>). 2nd+ fail → send personalised email + 'Pending Customer Response'. Unsure → escalate (Appendix 7).",
            },
          ],
        },
        {
          title: "Photo & Weight Verification",
          icon: "orange",
          checks: [
            {
              id: "s6",
              label: "Compare ID to selfie — confirm same person",
              hint: "Photos also used to verify BMI range. Face must be visible and match ID.",
            },
            {
              id: "s6b",
              label: "Weight verification photo meets requirements",
              hint: "Ideal: patient alone, full-length, face visible, fitted clothing. Accept imperfect if ID match clear & BMI assessable.",
            },
            {
              id: "s6c",
              label: "Photo issues handled correctly",
              hint: "Blurry/covered → 'Weight verification failed' tag (once, see <a href='#macro-22' onclick='navigateToMacro(22); return false;' style='color: var(--accent);'>Macro 22</a>). Genitalia exposed → hold, request new photo, ask CS to delete. Photos don't match BMI → escalate.",
              warning: true,
            },
          ],
        },
        {
          title: "SCR Screening",
          icon: "blue",
          checks: [
            {
              id: "s9",
              label: "SCR checks done AFTER ID & weight verification",
              hint: "Do NOT access SCR until eligibility steps are completed (wrongful access = incident).",
              warning: true,
            },
            {
              id: "s10",
              label: "Review SCR scraping tool outcome",
              hint: "Pass → prescribe without opening SCR. Flagged → open SCR. No person found → follow SCR unavailable guidance.",
              linkPage: "proto-scr",
              linkLabel: "Open SCR Protocol →",
            },
            {
              id: "s11",
              label: "If flagged: review SCR for contraindications",
              hint: "Check Acute/Repeat Meds + Diagnoses + Problems/Issues. Reject for absolute contraindication; email/hold only if more info needed.",
            },
            {
              id: "s12",
              label: "Document SCR outcome in patient record",
              hint: "Notes: 'SCR pass' / 'SCR checked no contraindication' / 'SCR unavailable' / 'limited SCR' / 'contraindication found'.",
            },
          ],
        },
        {
          title: "GP Details",
          icon: "purple",
          checks: [
            {
              id: "s7",
              label: "GP is UK NHS surgery and verified",
              hint: "Green tick = validated. No tick → validate via Google/NHS ODS. Cannot validate → 'Incomplete GP details' tag (auto email).",
            },
            {
              id: "s7b",
              label: "GP address is UK-based",
              hint: "Non-UK GP → tag 'Incomplete GP details', remove Prescriber Review, email for UK GP. No UK GP = reject.",
              warning: true,
            },
            {
              id: "s7c",
              label: "Minor GP errors corrected (if applicable)",
              hint: "Small corrections (name/house number) can be fixed directly by prescriber. Record the change.",
            },
          ],
        },
        {
          title: "Final Verification",
          icon: "green",
          checks: [
            {
              id: "s8",
              label: "Confirm order is in correct queue",
              hint: "'GLP1s – New orders, starter dose, screened / ready to be prescribed' (CC will have done initial screening).",
            },
            {
              id: "s8b",
              label: "Check for Assisted Prescribing flag",
              hint: "If flagged, apply all above checks + follow Assisted Prescribe SOP for extra steps.",
            },
            {
              id: "s8c",
              label: "All checks passed — safe to prescribe starter dose",
              hint: "Document that all prescribing checks in section 4.3 have been met before signing.",
            },
          ],
        },
      ],
      "transfer-above": [
        {
          title: "Order Identification & Common Checks",
          icon: "blue",
          checks: [
            {
              id: "ta1",
              label: "Confirm order is in Transfer Continuation queue",
              hint: "Queue: 'GLP1s – New orders, continuation dose, screened / ready to be prescribed'. Patient is new to MedExpress but has had GLP-1 elsewhere.",
            },
            {
              id: "ta2",
              label: "Read full consultation and patient notes",
              hint: "Check for email updates, contraindications, GLP-1 hospitalisation history. If unclear, tag 'Pending Customer Response' and email ALL missing points.",
              linkPage: "contraindications",
              linkLabel: "Open contraindications →",
            },
            {
              id: "ta3",
              label: "Age 18–74, ID valid and matches account",
              hint: "ID can be expired for continuation (still first MedExpress order). Small mismatches → correct via Users page.",
            },
            {
              id: "ta4",
              label: "Confirm UK NHS GP (green tick or validated)",
              hint: "Validate via Google/NHS ODS if no tick. Correct small errors if needed.",
            },
          ],
        },
        {
          title: "BMI & Photo Verification",
          icon: "green",
          checks: [
            {
              id: "ta5",
              label: "Confirm BMI is ABOVE licence threshold",
              hint: "BMI ≥30, or 27–30 with comorbidity, or ≥27.5 with eligible ethnicity. Max 60. This is for ABOVE licence transfers.",
            },
            {
              id: "ta6",
              label: "Current weight verification photos acceptable",
              hint: "Full-length, fitted clothing, face visible, consistent with stated BMI. ID matches selfie.",
            },
          ],
        },
        {
          title: "Previous Use Evidence (PUE)",
          icon: "orange",
          checks: [
            {
              id: "ta7",
              label: "PUE document shows: name, drug, dose, date, regulated provider",
              hint: "Acceptable: dispatch note, prescription, dispensing label. Order confirmation ALONE is NOT enough. NHS/registered pharmacy/clinic.",
              linkPage: "pue",
              linkLabel: "Open PUE Protocol →",
            },
            {
              id: "ta8",
              label: "PUE date is within past 6 months",
              hint: "Evidence must be within 6 months for step-up/maintenance request.",
            },
            {
              id: "ta9",
              label: "If PUE <2 weeks old: send Macro 16",
              hint: "Approve but send <a href='#macro-16' onclick='navigateToMacro(16); return false;' style='color: var(--accent);'>Macro 16: PUE 2 Weeks Old</a> instructing patient NOT to start until current course complete.",
              warning: true,
            },
            {
              id: "ta10",
              label: "If PUE missing/inadequate: email + hold",
              hint: "Use <a href='#macro-14' onclick='navigateToMacro(14); return false;' style='color: var(--accent);'>Macro 14: Missing Information</a>. Add 'Pending Customer Response'. Without valid PUE → starter dose only.",
              warning: true,
            },
          ],
        },
        {
          title: "Dose & Timing Assessment",
          icon: "purple",
          checks: [
            {
              id: "ta11",
              label: "Requested dose fits gap-in-treatment guidance",
              hint: "Use PUE date + dose to check against Visual gap tables / Appendix 20 & 23.",
              linkPage: "titration",
              linkLabel: "Open Titration & Gap →",
            },
            {
              id: "ta12",
              label: "If switching GLP-1 drug: apply switching guidance",
              hint: "Use Visual Flow 2, Switching SOP, and dose equivalents table (Appendix 20). Complex cases → escalate.",
              linkPage: "switching",
              linkLabel: "Open Switching Protocol →",
            },
          ],
        },
        {
          title: "Hospitalisation & NHS Checks",
          icon: "blue",
          checks: [
            {
              id: "ta13",
              label: "No GLP-1-related hospitalisation",
              hint: "If hospitalisation indicated → hold + email to clarify. If confirmed GLP-1 related → REJECT.",
              danger: true,
            },
            {
              id: "ta14",
              label: "Patient NOT currently on NHS GLP-1",
              hint: "Current NHS treatment → NOT eligible for MedExpress. Stopped NHS treatment → NHS prescription can be used as PUE.",
              danger: true,
            },
          ],
        },
        {
          title: "SCR Screening",
          icon: "orange",
          checks: [
            {
              id: "ta15",
              label: "SCR checks done AFTER eligibility verified",
              hint: "Do NOT access SCR until eligibility steps are completed.",
              warning: true,
            },
            {
              id: "ta16",
              label: "Review SCR scraping tool outcome",
              hint: "Pass → prescribe without opening SCR. Flagged → open SCR. No person found → follow SCR unavailable guidance.",
              linkPage: "proto-scr",
              linkLabel: "Open SCR Protocol →",
            },
            {
              id: "ta17",
              label: "Document SCR outcome in patient record",
              hint: "Notes: 'SCR pass' / 'SCR checked no contraindication' / 'SCR unavailable' / 'contraindication found'.",
            },
          ],
        },
        {
          title: "Final Decision",
          icon: "green",
          checks: [
            {
              id: "ta18",
              label: "All checks passed — safe to prescribe continuation",
              hint: "Document: 'Transfer continuation – BMI above licence, PUE within 6 months and dose aligned with gap/titration guidance'.",
            },
          ],
        },
      ],
      "transfer-below": [
        {
          title: "Order Identification & Common Checks",
          icon: "blue",
          checks: [
            {
              id: "tb1",
              label: "Confirm order is in Transfer Continuation queue",
              hint: "Queue: 'GLP1s – New orders, continuation dose, screened / ready to be prescribed'. Patient is new to MedExpress but has had GLP-1 elsewhere.",
            },
            {
              id: "tb2",
              label: "Read full consultation and patient notes",
              hint: "Check for email updates, contraindications, GLP-1 hospitalisation history. If unclear, tag 'Pending Customer Response' and email ALL missing points.",
              linkPage: "contraindications",
              linkLabel: "Open contraindications →",
            },
            {
              id: "tb3",
              label: "Age 18–74, ID valid and matches account",
              hint: "ID can be expired for continuation. Small mismatches → correct via Users page.",
            },
            {
              id: "tb4",
              label: "Confirm UK NHS GP (green tick or validated)",
              hint: "Validate via Google/NHS ODS if no tick. Correct small errors if needed.",
            },
          ],
        },
        {
          title: "BMI Verification (Below Licence)",
          icon: "green",
          checks: [
            {
              id: "tb5",
              label: "Confirm BMI is BELOW licence but ≥25",
              hint: "BMI below 30 (or 27 without comorbidity). Below-licence transfers need BOTH proof of supply AND previous BMI photo.",
              warning: true,
            },
            {
              id: "tb6",
              label: "Current weight verification photos acceptable",
              hint: "Full-length, fitted clothing, face visible, consistent with current BMI. ID matches selfie.",
            },
          ],
        },
        {
          title: "Previous Use Evidence (PUE) Document",
          icon: "orange",
          checks: [
            {
              id: "tb7",
              label: "PUE document shows: name, drug, dose, date, regulated provider",
              hint: "Dispatch note, prescription, or dispensing label. Order confirmation ALONE is NOT enough. NHS/registered pharmacy/clinic.",
              linkPage: "pue",
              linkLabel: "Open PUE Protocol →",
            },
            {
              id: "tb8",
              label: "PUE date is within past 6 months",
              hint: "Evidence must be within 6 months for continuation request.",
            },
            {
              id: "tb9",
              label: "If PUE fails: email via 'Evidence missing information'",
              hint: "Explain what's wrong, what's needed. Add 'Pending Customer Response'. Below-licence with no valid PUE = NOT eligible.",
              warning: true,
            },
          ],
        },
        {
          title: "Previous BMI Photo (REQUIRED for Below Licence)",
          icon: "purple",
          checks: [
            {
              id: "tb10",
              label: "Previous BMI photo provided",
              hint: "REQUIRED for below-licence transfers. Must prove they met licence BMI when starting GLP-1.",
              danger: true,
            },
            {
              id: "tb11",
              label: "Photo taken within 30 days of starting GLP-1",
              hint: "Must be from when they started with previous provider, not current photos.",
            },
            {
              id: "tb12",
              label: "Photo quality: full-length, well-lit, fitted clothing",
              hint: "Must support that they met licence BMI at start and are not clearly underweight.",
            },
            {
              id: "tb13",
              label: "If previous BMI photo fails: apply correct tag",
              hint: "Use 'previous BMI verification failed' tag (NOT 'Weight verification failed'). Email explaining why photo failed.",
              warning: true,
            },
          ],
        },
        {
          title: "Dose & Timing Assessment",
          icon: "blue",
          checks: [
            {
              id: "tb14",
              label: "Requested dose fits gap-in-treatment guidance",
              hint: "Use PUE date + dose to check against Visual gap tables / Appendix 20 & 23.",
              linkPage: "titration",
              linkLabel: "Open Titration & Gap →",
            },
            {
              id: "tb15",
              label: "If PUE <2 weeks old: send Macro 16",
              hint: "Approve but send <a href='#macro-16' onclick='navigateToMacro(16); return false;' style='color: var(--accent);'>Macro 16: PUE 2 Weeks Old</a> instructing patient NOT to start until current course complete.",
            },
          ],
        },
        {
          title: "Hospitalisation & NHS Checks",
          icon: "orange",
          checks: [
            {
              id: "tb16",
              label: "No GLP-1-related hospitalisation",
              hint: "If hospitalisation indicated → hold + email to clarify. If confirmed GLP-1 related → REJECT.",
              danger: true,
            },
            {
              id: "tb17",
              label: "Patient NOT currently on NHS GLP-1",
              hint: "Current NHS treatment → NOT eligible. Stopped NHS treatment → NHS prescription can be used as PUE.",
              danger: true,
            },
          ],
        },
        {
          title: "SCR Screening",
          icon: "green",
          checks: [
            {
              id: "tb18",
              label: "SCR checks done AFTER eligibility verified",
              hint: "Do NOT access SCR until eligibility steps are completed.",
              warning: true,
            },
            {
              id: "tb19",
              label: "Review SCR scraping tool outcome + document",
              hint: "Pass → prescribe. Flagged → open SCR. Document outcome in patient record.",
              linkPage: "proto-scr",
              linkLabel: "Open SCR Protocol →",
            },
          ],
        },
        {
          title: "Final Decision",
          icon: "purple",
          checks: [
            {
              id: "tb20",
              label: "BOTH PUE document AND previous BMI photo acceptable",
              hint: "If either fails and cannot be corrected → patient is NOT eligible for MedExpress GLP-1 at below-licence BMI. Do NOT offer starter dose.",
              danger: true,
            },
            {
              id: "tb21",
              label: "All checks passed — safe to prescribe continuation",
              hint: "Document: 'Transfer continuation – below licence, PUE and starting-BMI photo requirements both met'.",
            },
          ],
        },
      ],
      repeat: [
        {
          title: "Step 1: Patient Confirmation & Basic Safety",
          icon: "blue",
          checks: [
            {
              id: "r1",
              label: "Confirm REPEAT GLP-1 patient (previous MedExpress GLP-1 prescribed and dispatched)",
              hint: "Order will be in repeat queue (not screened by Customer Care). Patient has had same GLP-1 before.",
              warning: true,
            },
            {
              id: "r2",
              label: "Age 18–74 years confirmed",
              hint: "Age must be 18–74. If outside range → Reject 'Clinically Unsuitable' with refund, no escalation needed.",
              danger: true,
              infoCard: {
                type: "warning",
                title: "Age Eligibility",
                content: "Age <18 or >74 → Automatic rejection with refund using 'Clinically Unsuitable'."
              }
            },
            {
              id: "r3",
              label: "ID verified (can be expired for repeats, must show full name, DOB, photo match)",
              hint: "For repeats, expired ID is acceptable. Must be official ID with photo matching account. Small discrepancies (nickname, day of DOB, married name) → correct via Users page before issuing.",
            },
            {
              id: "r4",
              label: "Consultation read in full and reviewed for new contraindications",
              hint: "Check for pregnancy, new serious disease, incomplete/unclear info. If incomplete → email patient, tag Pending Customer Response, send only one email covering all issues.",
              linkPage: "contraindications",
              linkLabel: "View contraindications →",
            },
            {
              id: "r5",
              label: "UK NHS GP confirmed and validated",
              hint: "Small details differ but surgery clearly valid → correct and prescribe. If GP cannot be validated or non-UK → tag 'Incomplete GP details', remove Prescriber Review, email to request UK NHS GP, do NOT prescribe until provided.",
              warning: true,
            },
          ],
        },
        {
          title: "Step 2: BMI, Ethnicity & Photos (Repeat Rules)",
          icon: "blue",
          checks: [
            {
              id: "r6",
              label: "Check return purchase timeframe and apply correct BMI threshold",
              hint: "Minimum BMI for ongoing treatment: 21 kg/m². Timeframe determines eligibility rules.",
              warning: true,
              infoCard: {
                type: "orange",
                title: "BMI Thresholds for Repeat Patients",
                content: "• Return <6 months: BMI ≥21 (PUE only if dose not aligned with gap rules)\n• Return 6–12 months: BMI ≥25 (PUE if dose not aligned with gap rules)\n• Return >12 months: Must meet full licensing BMI (30+ or 27+ with comorbidity/ethnicity)",
                linkPage: "pue",
                linkLabel: "View PUE Protocol →"
              }
            },
            {
              id: "r7",
              label: "If return <6 months: BMI ≥21 acceptable",
              hint: "May prescribe down to BMI 21. PUE needed only if dose not in line with gap rules.",
            },
            {
              id: "r8",
              label: "If return 6–12 months: BMI ≥25 required",
              hint: "May prescribe only if BMI ≥25. PUE needed if dose not aligned with gap rules.",
            },
            {
              id: "r9",
              label: "If return >12 months: Full licensing BMI required (30+ or 27+ with comorbidity/ethnicity)",
              hint: "Treat as new patient. Must meet BMI 30+ or 27+ with comorbidity or qualifying ethnicity.",
              danger: true,
            },
            {
              id: "r10",
              label: "Ethnicity-adjusted BMI applied correctly if applicable",
              hint: "Certain ethnicities lower threshold to 27.5 (system allows from BMI 27.5). Do NOT question ethnicity if doesn't align with ID. If materially affects eligibility (BMI<30) and causes concern → escalate on Jira 'Weight – other/BMI questions'.",
            },
            {
              id: "r11",
              label: "Photos reviewed: ID match and BMI range validated",
              hint: "Use photos to validate ID match and BMI range. Follow photo scenarios below.",
              infoCard: {
                type: "orange",
                title: "Photo Scenarios for Repeats",
                content: "• Borderline BMI but safe: Continue treatment per previous decision (maintain continuity). Do NOT request new photo or apply Weight verification failed.<br>• Clearly underweight: Send <a href='#macro-17' onclick='navigateToMacro(17); return false;' style='color: var(--accent);'>Macro 17: Weight/Height Verification</a> requesting GP verified height/weight, then escalate.<br>• Blurred/face covered/ID mismatch (genuine mistake): May request new photos following Weight verification failed process.",
                linkPage: "weight-monitoring",
                linkLabel: "View Weight Monitoring →"
              }
            },
          ],
        },
        {
          title: "Step 3: Titration Check (All Repeat Orders)",
          icon: "green",
          checks: [
            {
              id: "r12",
              label: "Check 'Has the patient titrated correctly?' for every repeat",
              hint: "Wegovy/Mounjaro: monthly titration. Nevolat: weekly titration (0.6mg increments up to 3mg max).",
              linkPage: "titration",
              linkLabel: "View Titration Guide →",
            },
            {
              id: "r13",
              label: "Scenario 3A: Normal upwards titration (previous ≤8 weeks, one step higher)",
              hint: "All checks OK → Prescribe next dose. Document: 'Simple titration repeat'.",
              infoCard: {
                type: "green",
                title: "Scenario 3A: Normal Upwards Titration",
                content: "Previous order within ≤8 weeks + requested dose one step higher + all other checks pass → Prescribe and document as 'Simple titration repeat'."
              }
            },
            {
              id: "r14",
              label: "Scenario 3B: Same dose or going down in strength",
              hint: "If no other issues → Prescribe, then send <a href='#macro-19' onclick='navigateToMacro(19); return false;' style='color: var(--accent);'>Macro 19: Not Titrated Up</a> or <a href='#macro-20' onclick='navigateToMacro(20); return false;' style='color: var(--accent);'>Macro 20: Went Down</a>. Safe to step down >1 dose. Do NOT hold if otherwise safe. Don't repeat macro if already sent and patient has reasonable explanation.",
              infoCard: {
                type: "orange",
                title: "Scenario 3B: Same/Lower Dose",
                content: "Patient orders same or lower dose → Prescribe if safe, send macro advising contact if support needed. Safe to step down by >1 dose. Don't resend macro if already sent + reasonable explanation (good response, manageable side effects, affordability)."
              }
            },
            {
              id: "r15",
              label: "Scenario 3C: Apparent skipped dose (including 1-pen/2-pen patterns)",
              hint: "System shows dose X steps lower/higher. Check full order history and dates including pen quantities. If dates of higher-dose pens (ignoring interim lower order) would still make patient eligible within normal titration spacing → may be acceptable.",
              danger: true,
              infoCard: {
                type: "orange",
                title: "Scenario 3C: Skipped Dose",
                content: "If still appears skipped after review → Send <a href='#macro-18' onclick='navigateToMacro(18); return false;' style='color: var(--accent); text-decoration: underline;'>Macro 18: Skipped Dose</a>. Offer 2 options: (1) Amend to correct dose per titration, (2) Provide evidence of missing dose from another provider (PUE). Tag Pending Customer Response and hold. If justification/PUE acceptable (cost, trial, accident, stock) → prescribe higher dose. If not → change to correct dose, email explanation.",
                linkPage: "titration",
                linkLabel: "View Titration Protocol →"
              }
            },
          ],
        },
        {
          title: "Step 4: Gap in Treatment Check",
          icon: "orange",
          checks: [
            {
              id: "r16",
              label: "Check 'Is there a gap between their orders?' for ALL repeat orders",
              hint: "Patients with >8 weeks gap automatically get 'Long treatment gap' tag. Use order date (not injection date) to measure gap.",
              warning: true,
              infoCard: {
                type: "orange",
                title: "Gap Rules Summary",
                content: "• ≤8 weeks: Normal repeat, may titrate up\n• >8 to ≤12 weeks: Continue last tolerated dose up to max restarting dose (see Appendix 23)\n• Up to 6 months (BMI ≥21) or up to 12 months (BMI ≥25): Use gap guidance tables for safe restarting dose\n• >12 months: Treat as restart, must meet full licensing BMI",
                linkPage: "titration",
                linkLabel: "View Gap Treatment Protocol →"
              }
            },
            {
              id: "r17",
              label: "Gap ≤8 weeks: Normal repeat (may titrate up to next dose)",
              hint: "Treat as normal simple repeat if all other checks pass.",
            },
            {
              id: "r18",
              label: "Gap >8 to ≤12 weeks: Continue last tolerated dose up to max restarting dose",
              hint: "Use Appendix 23 for multi-pen orders. If ordered higher than allowed → Amend order to appropriate restarting dose + email explanation, OR hold with Pending Customer Response to discuss options.",
            },
            {
              id: "r19",
              label: "Gap up to 6 months (BMI ≥21) or up to 12 months (BMI ≥25)",
              hint: "Confirm BMI meets threshold. Use gap-in-treatment visual tables to pick safe restarting dose (often last tolerated or lower). If requested dose above guidance → adjust or hold + email. Ensure weight change and side-effect checks still pass.",
              warning: true,
            },
            {
              id: "r20",
              label: "Gap >12 months: Treat as restart (full licensing BMI required)",
              hint: "Must meet BMI 30+ or 27+ with comorbidity/ethnicity. If not → reject as clinically unsuitable. If meets → treat like new start (starter dose) and document.",
              danger: true,
            },
          ],
        },
        {
          title: "Step 5: Weight Change Thresholds",
          icon: "purple",
          checks: [
            {
              id: "r21",
              label: "Check 'Is their weight gain within the 7% threshold?'",
              hint: "Weight gain since last MedExpress order must be <7%. If ≥7% → use Appendix 12 guidance for tailored advice. Consider maintain/reduce/pause. Large weight gain should NOT be routine repeat.",
              warning: true,
              infoCard: {
                type: "orange",
                title: "Weight Gain >7% Threshold",
                content: "Weight gain ≥7% since last order → Use Appendix 12 for guidance. Options: maintain current dose, reduce dose, or pause treatment. Very large gains require clinical judgement or escalation.",
                linkPage: "weight-monitoring",
                linkLabel: "View Weight Monitoring →"
              }
            },
            {
              id: "r22",
              label: "Check 'Is their weight loss within the 10% threshold?'",
              hint: "Weight loss since last MedExpress order must be <10%. If ≥10% → use Appendix 13 guidance. Very large weight loss should NOT be routine repeat; escalation expected.",
              warning: true,
              infoCard: {
                type: "orange",
                title: "Weight Loss >10% Threshold",
                content: "Weight loss ≥10% since last order → Use Appendix 13 for guidance. Very large weight loss requires clinical judgement or escalation. Not a routine repeat.",
                linkPage: "weight-monitoring",
                linkLabel: "View Weight Monitoring →"
              }
            },
          ],
        },
        {
          title: "Step 6: Side Effects & Hospitalisation",
          icon: "red",
          checks: [
            {
              id: "r23",
              label: "Check 'Has the patient experienced side effects?' and review PUE notes",
              hint: "Review for any adverse effects. Check hospitalisation specifically.",
              linkPage: "contraindications",
              linkLabel: "View contraindications →",
            },
            {
              id: "r24",
              label: "Non-serious side effects: Continue with advice/dose adjustment",
              hint: "No hospitalisation + no major safety concern → May continue at same or lower dose. Use <a href='#macro-28' onclick='navigateToMacro(28); return false;' style='color: var(--accent);'>Macro 28: Side Effects</a> or <a href='#macro-29' onclick='navigateToMacro(29); return false;' style='color: var(--accent);'>Macro 29: Injection Site</a> if needed.",
            },
            {
              id: "r25",
              label: "Hospitalisation linked to GLP-1: REJECT immediately",
              hint: "If consultation/PUE mentions hospitalisation → Place on hold and email to clarify. If patient confirms hospitalisation DUE TO GLP-1 → REJECT order. Patient NOT eligible for further MedExpress GLP-1 treatment.",
              danger: true,
              infoCard: {
                type: "red",
                title: "GLP-1 Hospitalisation = Permanent Exclusion",
                content: "Any confirmed hospitalisation due to GLP-1 (pancreatitis, severe gastroparesis, severe dehydration, allergic reaction) → Patient is permanently ineligible for MedExpress GLP-1 treatment. Reject order immediately.",
                linkPage: "contraindications",
                linkLabel: "View Contraindications →"
              }
            },
          ],
        },
        {
          title: "Step 7: Periodic Review (PR) Requirements",
          icon: "purple",
          checks: [
            {
              id: "r26",
              label: "Check if Periodic Review (PR) is due for this repeat patient",
              hint: "Wegovy/Mounjaro: PR at 6, 12, 18 months from first GLP-1 course (any provider) if weight loss <5%. Nevolat: 4-month check-in if weight loss <5%. PR clock resets when switching GLP-1 products.",
              warning: true,
              infoCard: {
                type: "purple",
                title: "Periodic Review (PR) Rules",
                content: "• Wegovy/Mounjaro: PR required at 6, 12, 18 months if overall weight loss <5%\n• Nevolat: 4-month check-in if weight loss <5%\n• PR 'clock' resets when patient switches GLP-1 product (e.g., Mounjaro → Wegovy)\n• Do NOT continue routine repeats until PR completed if due",
                linkPage: "reviews",
                linkLabel: "View 6 Month Reviews →"
              }
            },
            {
              id: "r27",
              label: "If PR due and not completed: Follow Periodic Review SOP",
              hint: "Generally do NOT continue routine repeats until review is done. If PR outcome is to continue → proceed with all simple-repeat checks.",
            },
          ],
        },
        {
          title: "Step 8: Final Decision & Documentation",
          icon: "purple",
          checks: [
            {
              id: "r28",
              label: "APPROVE: All checks passed (consultation, ID, GP, BMI/gap, titration, weight, side effects, PR)",
              hint: "Issue prescription. Document: 'Simple repeat – correct titration, BMI and weight change within SOP thresholds, no contraindications or PR due'.",
            },
            {
              id: "r29",
              label: "HOLD: Use appropriate tag (Pending Customer Response, Long treatment gap, Incomplete GP details)",
              hint: "Send ONE email covering all missing information. Do not send multiple CRMs.",
            },
            {
              id: "r30",
              label: "ESCALATE: Use escalated tag and remove Prescriber Review when uncertain",
              hint: "Escalate for: BMI/photo safety concerns, ethnicity/BMI concerns, complex PUE/titration, unusual side-effect patterns. Follow Appendix 7 escalation process.",
            },
            {
              id: "r31",
              label: "REJECT: Age outside 18–74, BMI rules not met, confirmed GLP-1 hospitalisation, no acceptable UK GP, contraindications",
              hint: "Use correct rejection reason from Appendix 16. Clearly document why. Reject for: age, BMI (cannot be resolved with PUE), GLP-1 hospitalisation, no UK GP, contraindications in Appendix 24.",
              danger: true,
            },
          ],
        },
      ],
      stepup: [
        {
          title: "Step 1: Order Type & Patient Status",
          icon: "blue",
          checks: [
            {
              id: "c1",
              label: "Identify if this is a NEW order (transfer) or existing MedExpress continuation",
              hint: "NEW order = never received GLP-1 from MedExpress before (transfer from another provider). Continuation = already receiving from MedExpress.",
              warning: true,
              infoCard: {
                type: "blue",
                title: "Transfer vs Continuation",
                content: "• NEW order (transfer): Requires PUE + BMI checks (see transfer-specific tabs)\n• Existing patient continuation: No PUE needed if already established on MedExpress GLP-1"
              }
            },
            {
              id: "c2",
              label: "If NEW order: verify continuation dose is appropriate (not starter)",
              hint: "New orders for continuation dose must meet transfer criteria. Check current BMI to determine above/below licence requirements.",
              danger: true,
            },
          ],
        },
        {
          title: "BMI Verification (All Continuation Orders)",
          icon: "blue",
          checks: [
            {
              id: "c3",
              label: "Current BMI documented and calculated correctly",
              hint: "Verify height and weight measurements. Calculate BMI = weight(kg) / height(m)².",
            },
            {
              id: "c4",
              label: "For ABOVE-licence BMI (≥30, or ≥27 with comorbidity): standard continuation criteria apply",
              hint: "Comorbidities: prediabetes, diabetes, heart disease, high BP, high cholesterol, sleep apnoea. These patients can continue as normal.",
            },
            {
              id: "c5",
              label: "For BELOW-licence BMI (<30, or <27 without comorbidity): PUE required for NEW orders only",
              hint: "If this is a NEW order (transfer patient) with below-licence BMI → PUE document AND starting BMI photo required. If continuation from existing MedExpress patient → PUE NOT required.",
              danger: true,
            },
          ],
        },
        {
          title: "PUE Requirements (NEW Orders Below-Licence Only)",
          icon: "orange",
          checks: [
            {
              id: "c6",
              label: "PUE document provided and acceptable",
              hint: "Must show: patient name, medication name, dose, prescriber details, date. Must be from legitimate prescriber.",
              danger: true,
            },
            {
              id: "c7",
              label: "Previous BMI photo provided showing STARTING BMI was above licence threshold",
              hint: "Photo must show BMI ≥30 (or ≥27 with comorbidity) at treatment start. If photo unavailable or shows below-licence → patient NOT eligible.",
              danger: true,
            },
            {
              id: "c8",
              label: "BOTH PUE and starting BMI photo requirements met",
              hint: "If either requirement fails → patient cannot receive below-licence continuation via MedExpress. Reject order.",
              danger: true,
            },
          ],
        },
        {
          title: "Dose Titration & Safety",
          icon: "green",
          checks: [
            {
              id: "c9",
              label: "Requested dose follows appropriate titration schedule",
              hint: "Review previous doses. Titration should follow manufacturer guidance (typically 4-week intervals).",
            },
            {
              id: "c10",
              label: "Check for any treatment gaps",
              hint: "Gap >90 days may require clinical review. Gap >180 days requires restart from starter dose.",
              warning: true,
            },
            {
              id: "c11",
              label: "No recent hospitalisations related to GLP-1",
              hint: "Check for: pancreatitis, severe gastroparesis, severe dehydration, allergic reaction. Any GLP-1 hospitalisation = permanent exclusion.",
              danger: true,
              linkPage: "contraindications",
              linkLabel: "View contraindications →",
            },
          ],
        },
        {
          title: "SCR Screening & Contraindications",
          icon: "red",
          checks: [
            {
              id: "c12",
              label: "SCR screening completed (if applicable)",
              hint: "Review Summary Care Record for relevant medical history, medications, allergies.",
            },
            {
              id: "c13",
              label: "No new contraindications identified",
              hint: "Check Appendix 24 for absolute and relative contraindications. Any new contraindications → escalate to senior clinician.",
              danger: true,
              linkPage: "contraindications",
              linkLabel: "View contraindications →",
            },
            {
              id: "c14",
              label: "No concerning drug interactions",
              hint: "Pay special attention to: insulin, sulfonylureas, warfarin, other diabetes medications.",
              warning: true,
            },
          ],
        },
        {
          title: "Clinical Review & Documentation",
          icon: "purple",
          checks: [
            {
              id: "c15",
              label: "Weight loss progress documented (if applicable)",
              hint: "Review weight trend. Minimum 5% weight loss expected after 6 months for continuation.",
            },
            {
              id: "c16",
              label: "Side effects reviewed and manageable",
              hint: "Common side effects: nausea, vomiting, diarrhea, constipation. Should improve with time. Severe/persistent → escalate.",
            },
            {
              id: "c17",
              label: "Patient consultation/review completed within last 12 months",
              hint: "All continuation patients need valid consultation within 12 months. If >12 months → new consultation required.",
              warning: true,
            },
          ],
        },
        {
          title: "Final Decision",
          icon: "purple",
          checks: [
            {
              id: "c18",
              label: "All eligibility criteria met",
              hint: "Confirm: BMI appropriate, no contraindications, safe dose progression, valid consultation.",
            },
            {
              id: "c19",
              label: "Clinical notes updated with decision rationale",
              hint: "Document: current BMI, dose justification, any PUE requirements met (if applicable), next review due.",
            },
            {
              id: "c20",
              label: "All checks passed — safe to prescribe continuation dose",
              hint: "Final confirmation that continuation prescription is clinically appropriate and safe to dispense.",
            },
          ],
        },
      ],
    };

    const sectionData = sections[type] || [];
    return sectionData
      .map(
        (section) => `
            <div class="checklist-section">
                <div class="section-header">
                    <div class="section-header-icon ${section.icon}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg>
                    </div>
                    <span>${section.title}</span>
                </div>
                ${section.checks
                  .map(
                    (check) => `
                    <div class="check-item" data-id="${
                      check.id
                    }" data-checklist="${type}" data-accent="${section.icon}">
                        <div class="checkbox">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div class="check-content">
                            <div class="check-label">${check.label}</div>
                            <div class="check-hint ${
                              check.danger ? "danger" : check.warning ? "warning" : ""
                            }">${check.hint}</div>
                            ${
                              check.linkPage
                                ? `<a class="check-link" href="#" data-page="${
                                    check.linkPage
                                  }">${check.linkLabel || "View protocol →"}</a>`
                                : ""
                            }
                            ${
                              check.infoCard
                                ? `<div class="info-card ${check.infoCard.type || 'blue'}" style="margin-top: 12px;">
                                    <div class="info-card-title">${check.infoCard.title}</div>
                                    <div class="info-card-text" style="white-space: pre-line;">${check.infoCard.content}</div>
                                    ${
                                      check.infoCard.linkPage
                                        ? `<a class="check-link" href="#" data-page="${check.infoCard.linkPage}" style="margin-top: 8px; display: inline-block;">${check.infoCard.linkLabel || "View protocol →"}</a>`
                                        : ""
                                    }
                                   </div>`
                                : ""
                            }
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `
      )
      .join("");
  },

  getProtocolContent(type) {
    return `
            <div class="protocol-page">
                <div class="back-btn" data-page="dashboard">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Back to Dashboard
                </div>
                <div class="protocol-page-header">
                  <h1 class="page-h1">${this.getProtocolTitle(type)}</h1>
                  <p class="page-lead">${this.getProtocolSubtitle(type)}</p>
                </div>
                ${this.getProtocolCards(type)}
            </div>
        `;
  },

  getProtocolTitle(type) {
    const titles = {
      core: "Core Checks Protocol",
      scr: "SCR Screening Protocol",
      pue: "Previous Use Evidence",
      titration: "Titration & Gap Treatment",
      weight: "Weight Monitoring",
      switching: "Switching & Side Effects",
      reviews: "6 Month Reviews",
    };
    return titles[type] || "Protocol";
  },

  getProtocolSubtitle(type) {
    const subtitles = {
      core: "Essential verification requirements for all prescriptions",
      scr: "How to use SCR + scraping tool to identify contraindications and document decisions",
      pue: "Requirements for transfer patients and skipped doses",
      titration: "Dose escalation and gap adjustment rules",
      weight: "Weight gain and loss thresholds",
      switching: "Medication changes and side effect management",
      reviews: "Review requirements for continuing treatment after 6 months",
    };
    return subtitles[type] || "";
  },

  getProtocolCards(type) {
    switch (type) {
      case "core":
        return this.getCoreProtocolCards();
      case "scr":
        return this.getSCRProtocolCards();
      case "pue":
        return this.getPUEProtocolCards();
      case "titration":
        return this.getTitrationProtocolCards();
      case "weight":
        return this.getWeightProtocolCards();
      case "switching":
        return this.getSwitchingProtocolCards();
      case "reviews":
        return this.getReviewsProtocolCards();
      default:
        return '<div class="protocol-card"><div class="protocol-text">Protocol content not found.</div></div>';
    }
  },

  getSCRProtocolCards() {
    // Full detailed SCR protocol content restored
    return `
      <div class="scr-protocol">
        <div class="protocol-tabs">
          <button class="protocol-tab" data-tab="workflow">Workflow & Steps</button>
          <button class="protocol-tab" data-tab="checking">Checking SCR</button>
          <button class="protocol-tab active" data-tab="absolute">Absolute Contraindications</button>
          <button class="protocol-tab" data-tab="table2">Table 2: Time-sensitive</button>
          <button class="protocol-tab" data-tab="table3">Table 3: Clinical Details</button>
          <button class="protocol-tab" data-tab="table4">Table 4: Patient Assessment</button>
          <button class="protocol-tab" data-tab="escalation">Escalation</button>
          <button class="protocol-tab" data-tab="rejecting">Rejecting Prescription</button>
          <button class="protocol-tab" data-tab="documentation">Documentation</button>
        </div>

        <!-- CRITICAL: Nevolat Thyroid/Liver Exclusion Warning Banner -->
        <div class="info-card red" style="margin: 20px 0; border: 3px solid var(--danger); background: rgba(239, 68, 68, 0.1);">
          <div class="info-card-title" style="font-size: 18px; font-weight: 700;">🚨 CRITICAL: Nevolat Thyroid & Liver Disease Exclusion</div>
          <div class="info-card-text" style="font-size: 15px;">
            <strong style="display: block; margin-bottom: 8px;">Patients with ANY thyroid disease OR liver disease/impairment CANNOT receive Nevolat.</strong>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 2px solid rgba(239, 68, 68, 0.3);">
              <div style="padding: 10px; background: rgba(16, 185, 129, 0.1); border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.3);">
                <strong style="color: var(--success);">✅ These patients CAN receive:</strong>
                <ul style="margin-top: 6px; margin-left: 20px;">
                  <li>Mounjaro (tirzepatide)</li>
                  <li>Wegovy (semaglutide)</li>
                </ul>
              </div>
              <div style="padding: 10px; background: rgba(239, 68, 68, 0.15); border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.4);">
                <strong style="color: var(--danger);">❌ These patients CANNOT receive:</strong>
                <ul style="margin-top: 6px; margin-left: 20px;">
                  <li>Nevolat (liraglutide)</li>
                </ul>
              </div>
            </div>

            <div style="margin-top: 12px; padding: 10px; background: var(--bg-elevated); border-radius: 6px;">
              <strong>Action if patient ordered Nevolat:</strong>
              <ol style="margin-top: 6px; margin-left: 20px;">
                <li>REJECT the Nevolat order immediately</li>
                <li>Use <a href="#macro-28" onclick="navigateToMacro(28); return false;" class="tag red" style="margin: 0 4px;">Macro 28</a> to explain rejection</li>
                <li>Inform patient they CAN use Mounjaro or Wegovy</li>
                <li>Patient must place new order with correct medication</li>
              </ol>
            </div>

            <div style="margin-top: 8px; padding: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 4px; border-left: 3px solid var(--warning);">
              <strong>⚠️ Note:</strong> CTP (Choose Treatment Page) automatically hides Nevolat for patients who answered "Yes" to thyroid/liver question. If patient somehow ordered Nevolat anyway, this is an error that must be corrected.
            </div>
          </div>
        </div>

        <div class="protocol-tab-content" data-tab-content="workflow">
          <div class="protocol-card">
            <div class="protocol-title">
              <div class="icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>
              SCR Workflow & Steps
            </div>
            <div class="protocol-text">Follow these steps when reviewing patient records:</div>
            <ol class="protocol-ol">
              <li>Open patient SCR in the system</li>
              <li>Review medical history for contraindications</li>
              <li>Check repeat medications</li>
              <li>Check acute medications (last 3 months)</li>
              <li>Review consultation answers</li>
              <li>Make prescribing decision based on protocol</li>
            </ol>
          </div>
        </div>
        <div class="protocol-tab-content" data-tab-content="checking">
          <div class="protocol-card">
            <div class="protocol-title">
              <div class="icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M9 11l3 3L22 4" />
                </svg>
              </div>
              How to Check SCR
            </div>
            <div class="protocol-text">Key areas to review in the SCR:</div>
            <ul class="protocol-list">
              <li><strong>Medical History:</strong> Look for contraindicated conditions</li>
              <li><strong>Repeat Medications:</strong> Check for insulin, oral diabetic meds, narrow therapeutic index medications</li>
              <li><strong>Acute Medications:</strong> Review last 3 months for time-sensitive contraindications</li>
              <li><strong>Surgery History:</strong> Check dates for bariatric surgery, cholecystectomy</li>
              <li><strong>Specialist Letters:</strong> Review any cardiology, oncology, or other specialist correspondence</li>
            </ul>
          </div>
        </div>
        <div class="protocol-tab-content active" data-tab-content="absolute">
            <div class="protocol-text" style="margin-bottom: 16px;"><strong>Absolute Contraindications:</strong> These conditions require immediate rejection. Do not email patient.</div>
            <div class="scr-tabbed-conditions">
              <div class="scr-tabs">
                <button class="scr-tab active" data-condition="pancreatitis">🔴 Pancreatitis</button>
                <button class="scr-tab" data-condition="eating">🍽️ Eating Disorders</button>
                <button class="scr-tab" data-condition="diabetes">💉 Type 1 Diabetes</button>
                <button class="scr-tab" data-condition="cirrhosis">🫀 Liver Cirrhosis</button>
                <button class="scr-tab" data-condition="transplant">🏥 Liver Transplant</button>
                <button class="scr-tab" data-condition="endocrine">⚕️ Endocrine Disorders</button>
                <button class="scr-tab" data-condition="colitis">🩺 Ulcerative Colitis</button>
                <button class="scr-tab" data-condition="crohn">🩺 Crohn's Disease</button>
                <button class="scr-tab" data-condition="gastroparesis">🫃 Gastroparesis</button>
                <button class="scr-tab" data-condition="men2">⚠️ MEN2</button>
                <button class="scr-tab" data-condition="medullary">🎗️ Medullary Thyroid Cancer</button>
                <button class="scr-tab" data-condition="thyroid">🦋 Thyroid Disease</button>
              </div>
              <div class="scr-tab-content active" data-condition-content="pancreatitis">
                <div class="scr-condition-title">🔴 Pancreatitis <span class="scr-condition-desc">Acute or chronic pancreatic insufficiency</span></div>
                <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
                <div class="scr-condition-row"><strong>Rationale:</strong> GLP-1s increase risk of pancreatitis. Absolute contraindication for patient safety.</div>
                <div class="scr-condition-row"><strong>What to check in SCR:</strong> <ul class="protocol-list"><li>History of acute pancreatitis</li><li>Chronic pancreatitis diagnosis</li><li>Pancreatic insufficiency</li><li>Elevated amylase/lipase in recent bloods</li></ul></div>
              </div>
              <div class="scr-tab-content" data-condition-content="eating">
                <div class="scr-condition-title">🍽️ Eating Disorders <span class="scr-condition-desc">Anorexia • Bulimia • BED • ARFID</span></div>
                <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
                <div class="scr-condition-row"><strong>Rationale:</strong> Weight loss medications contraindicated in eating disorders. Risk of psychological harm and worsening condition.</div>
                <div class="scr-condition-row"><strong>What to check in SCR:</strong> <ul class="protocol-list"><li>History of anorexia nervosa</li><li>Bulimia nervosa</li><li>Binge Eating Disorder (BED)</li><li>ARFID (Avoidant/Restrictive Food Intake Disorder)</li><li>Eating disorder services involvement</li></ul></div>
              </div>
              <div class="scr-tab-content" data-condition-content="diabetes">
                <div class="scr-condition-title">💉 Type 1 Diabetes <span class="scr-condition-desc">Insulin-dependent diabetes mellitus</span></div>
                <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
                <div class="scr-condition-row"><strong>Rationale:</strong> Type 1 diabetes requires specialist diabetes management. GLP-1s are not licensed for Type 1.</div>
                <div class="scr-condition-row"><strong>What to check in SCR:</strong> <ul class="protocol-list"><li>Type 1 Diabetes Mellitus diagnosis</li><li>IDDM (Insulin Dependent Diabetes Mellitus)</li><li>Diabetes diagnosed in childhood/young age</li><li>Diabetic ketoacidosis (DKA) history</li></ul></div>
              </div>
              <div class="scr-tab-content" data-condition-content="cirrhosis">
                <div class="scr-condition-title">🫀 Liver Cirrhosis</div>
                <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
                <div class="scr-condition-row"><strong>Rationale:</strong> Severe liver disease is absolute contraindication due to metabolism concerns and disease severity.</div>
                <div class="scr-condition-row"><strong>What to check in SCR:</strong> <ul class="protocol-list"><li>Liver cirrhosis diagnosis</li><li>Decompensated liver disease</li><li>Hepatology letters</li><li>Abnormal LFTs with cirrhosis</li></ul></div>
              </div>
              <div class="scr-tab-content" data-condition-content="transplant">
                <div class="scr-condition-title">🏥 Liver Transplant</div>
                <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
                <div class="scr-condition-row"><strong>Rationale:</strong> Post-transplant patients require specialist oversight. Complex medication interactions with immunosuppressants.</div>
                <div class="scr-condition-row"><strong>What to check in SCR:</strong> <ul class="protocol-list"><li>History of liver transplant</li><li>Transplant surgery records</li><li>Immunosuppressant medications</li><li>Hepatology/transplant clinic letters</li></ul></div>
              </div>
              <div class="scr-tab-content" data-condition-content="endocrine">
                <div class="scr-condition-title">⚕️ Endocrine Disorders <span class="scr-condition-desc">Acromegaly • Cushing's • Addison's • CAH</span></div>
                <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
                <div class="scr-condition-row"><strong>Rationale:</strong> Complex hormonal disorders affecting metabolism. Require specialist endocrinologist management.</div>
                <div class="scr-condition-row"><strong>What to check in SCR:</strong> <ul class="protocol-list"><li>Acromegaly (excess growth hormone)</li><li>Cushing's syndrome/disease</li><li>Addison's disease (adrenal insufficiency)</li><li>Congenital Adrenal Hyperplasia (CAH)</li><li>Endocrinology clinic involvement</li></ul></div>
              </div>
              <div class="scr-tab-content" data-condition-content="colitis">
                <div class="scr-condition-title">🩺 Ulcerative Colitis</div>
                <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
                <div class="scr-condition-row"><strong>Rationale:</strong> GLP-1s can cause GI side effects including diarrhea. Risk of exacerbating inflammatory bowel disease.</div>
                <div class="scr-condition-row"><strong>What to check in SCR:</strong> <ul class="protocol-list"><li>Ulcerative colitis diagnosis</li><li>IBD (Inflammatory Bowel Disease)</li><li>Gastroenterology letters</li><li>Immunosuppressant/biologic medications for UC</li></ul></div>
              </div>
              <div class="scr-tab-content" data-condition-content="crohn">
                <div class="scr-condition-title">🩺 Crohn's Disease</div>
                <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
                <div class="scr-condition-row"><strong>Rationale:</strong> GLP-1s can cause GI side effects. Risk of exacerbating inflammatory bowel disease.</div>
                <div class="scr-condition-row"><strong>What to check in SCR:</strong> <ul class="protocol-list"><li>Crohn's disease diagnosis</li><li>IBD (Inflammatory Bowel Disease)</li><li>Gastroenterology letters</li><li>Immunosuppressant/biologic medications for Crohn's</li></ul></div>
              </div>
              <div class="scr-tab-content" data-condition-content="gastroparesis">
                <div class="scr-condition-title">🫃 Gastroparesis <span class="scr-condition-desc">Delayed gastric emptying</span></div>
                <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
                <div class="scr-condition-row"><strong>Rationale:</strong> GLP-1s delay gastric emptying as mechanism of action. Will severely worsen gastroparesis symptoms.</div>
                <div class="scr-condition-row"><strong>What to check in SCR:</strong> <ul class="protocol-list"><li>Gastroparesis diagnosis</li><li>Delayed gastric emptying</li><li>Gastric emptying study results</li><li>Pro-motility medications (e.g., metoclopramide)</li></ul></div>
              </div>
              <div class="scr-tab-content" data-condition-content="men2">
                <div class="scr-condition-title">⚠️ MEN2 <span class="scr-condition-desc">Multiple Endocrine Neoplasia type 2</span></div>
                <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
                <div class="scr-condition-row"><strong>Rationale:</strong> MEN2 associated with medullary thyroid cancer. GLP-1s have black box warning for thyroid C-cell tumors.</div>
                <div class="scr-condition-row"><strong>What to check in SCR:</strong> <ul class="protocol-list"><li>MEN2A or MEN2B diagnosis</li><li>Family history of MEN2</li><li>RET gene mutation</li><li>Medullary thyroid cancer</li></ul></div>
              </div>
              <div class="scr-tab-content" data-condition-content="medullary">
                <div class="scr-condition-title">🎗️ Medullary Thyroid Cancer</div>
                <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
                <div class="scr-condition-row"><strong>Rationale:</strong> GLP-1s have black box warning against use in patients with medullary thyroid cancer or family history.</div>
                <div class="scr-condition-row"><strong>What to check in SCR:</strong> <ul class="protocol-list"><li>Medullary thyroid carcinoma diagnosis</li><li>Family history of medullary thyroid cancer</li><li>Elevated calcitonin levels</li><li>Thyroidectomy for medullary cancer</li></ul></div>
              </div>
              <div class="scr-tab-content" data-condition-content="thyroid">
                <div class="scr-condition-title">🦋 Thyroid Disease <span class="scr-condition-desc">ONLY for Nevolat prescriptions</span></div>
                <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT</span> for Nevolat ONLY<br><span class="decision-prescribe">PRESCRIBE</span> Wegovy or Mounjaro is acceptable</div>
                <div class="scr-condition-row"><strong>Rationale:</strong> Nevolat specifically contraindicated in thyroid disease. Wegovy and Mounjaro can be prescribed.</div>
                <div class="scr-condition-row"><strong>What to check in SCR:</strong> <ul class="protocol-list"><li>Hypothyroidism (under/overactive thyroid)</li><li>Hyperthyroidism</li><li>Thyroid nodules</li><li>Levothyroxine or other thyroid medications</li></ul></div>
                <div class="scr-condition-row"><strong>Important:</strong> Check which specific medication the patient is requesting!</div>
              </div>
            </div>
        </div>
        <div class="protocol-tab-content" data-tab-content="table2">
            <div class="protocol-text" style="margin-bottom: 16px;"><strong>Table 2:</strong> When timing information is needed, use appropriate macro. Reject when timing falls within contraindication window.</div>
            <div class="scr-tabbed-conditions">
              <div class="scr-tabs">
                <button class="scr-tab active" data-condition="bariatric">🏥 Bariatric Surgery</button>
                <button class="scr-tab" data-condition="cholecystectomy">🏥 Cholecystectomy</button>
                <button class="scr-tab" data-condition="insulin">💉 Insulin</button>
                <button class="scr-tab" data-condition="oral">💊 Oral Diabetic Meds</button>
                <button class="scr-tab" data-condition="narrow">⚠️ Narrow Therapeutic Index Meds</button>
                <button class="scr-tab" data-condition="orlistat">💊 Orlistat</button>
              </div>
              <div class="scr-tab-content active" data-condition-content="bariatric">
                <div class="scr-condition-title">🏥 Bariatric Surgery <span class="scr-condition-desc">RYGB • Sleeve • Gastric Band • BPD/DS • Mini Bypass • Gastric balloon</span></div>
                <div class="scr-condition-row"><strong>Timeframe:</strong> <span style="font-weight:700;color:var(--danger);font-size:14px;">&lt;12 months</span></div>
                <div class="scr-condition-row"><strong>Macro:</strong> <a href="#macro-1" onclick="navigateToMacro(1); return false;" class="tag blue">Macro 1</a></div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check SCR for surgery date</li><li>If timing unclear → hold + email</li><li>Add tag: <span class="tag orange">Pending Customer Response</span></li></ul></div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if &lt;12 months<br><span class="decision-prescribe">PRESCRIBE</span> if ≥12 months</div>
              </div>
              <div class="scr-tab-content" data-condition-content="cholecystectomy">
                <div class="scr-condition-title">🏥 Cholecystectomy <span class="scr-condition-desc">(gallbladder removal)</span></div>
                <div class="scr-condition-row"><strong>Timeframe:</strong> <span style="font-weight:700;color:var(--danger);font-size:14px;">&lt;12 months</span></div>
                <div class="scr-condition-row"><strong>Macro:</strong> <a href="#macro-1" onclick="navigateToMacro(1); return false;" class="tag blue">Macro 1</a></div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check SCR for surgery date</li><li>If timing unclear → hold + email</li><li>Add tag: <span class="tag orange">Pending Customer Response</span></li></ul></div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if &lt;12 months<br><span class="decision-prescribe">PRESCRIBE</span> if ≥12 months</div>
              </div>
              <div class="scr-tab-content" data-condition-content="insulin">
                <div class="scr-condition-title">💉 Insulin</div>
                <div class="scr-condition-row"><strong>Timeframe:</strong> <span style="font-weight:700;color:var(--danger);font-size:14px;">&lt;3 months</span> <strong style="color:var(--danger);">OR</strong> <span style="font-weight:700;color:var(--danger);">On repeat list</span></div>
                <div class="scr-condition-row"><strong>Macro:</strong> <a href="#macro-1" onclick="navigateToMacro(1); return false;" class="tag blue">Macro 1</a></div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check acute meds (last 3 months)</li><li>Check repeat medication list</li><li>If on repeat list → <strong>reject immediately</strong></li><li>If timing unclear → hold + email</li></ul></div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if prescribed within 3 months or on repeat list</div>
              </div>
              <div class="scr-tab-content" data-condition-content="oral">
                <div class="scr-condition-title">💊 Oral Diabetic Meds <span class="scr-condition-desc">Sulfonylureas • SGLT2 inhibitors • DPP-4 inhibitors • Thiazolidinediones</span></div>
                <div class="scr-condition-row"><strong>Timeframe:</strong> <span style="font-weight:700;color:var(--danger);font-size:14px;">&lt;3 months</span> <strong style="color:var(--danger);">OR</strong> <span style="font-weight:700;color:var(--danger);">On repeat list</span></div>
                <div class="scr-condition-row"><strong>Macro:</strong> <a href="#macro-1" onclick="navigateToMacro(1); return false;" class="tag blue">Macro 1</a></div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check acute meds (last 3 months)</li><li>Check repeat medication list</li><li>If on repeat list → <strong>reject immediately</strong></li><li>If timing unclear → hold + email</li></ul></div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if prescribed within 3 months or on repeat list</div>
              </div>
              <div class="scr-tab-content" data-condition-content="narrow">
                <div class="scr-condition-title">⚠️ Narrow Therapeutic Index Meds <span class="scr-condition-desc">Amiodarone • Carbamazepine • Ciclosporin • Clozapine • Digoxin • Lithium • Warfarin • Others</span></div>
                <div class="scr-condition-row"><strong>Timeframe:</strong> <span style="font-weight:700;color:var(--danger);font-size:14px;">&lt;3 months</span> <strong style="color:var(--danger);">OR</strong> <span style="font-weight:700;color:var(--danger);">On repeat list</span></div>
                <div class="scr-condition-row"><strong>Macro:</strong> <a href="#macro-1" onclick="navigateToMacro(1); return false;" class="tag blue">Macro 1</a></div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check acute meds (last 3 months)</li><li>Check repeat medication list</li><li>If on repeat list → <strong>reject immediately</strong></li><li>If timing unclear → hold + email</li></ul></div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if prescribed within 3 months or on repeat list</div>
              </div>
              <div class="scr-tab-content" data-condition-content="orlistat">
                <div class="scr-condition-title">💊 Orlistat <span class="scr-condition-desc">Alli • Xenical</span></div>
                <div class="scr-condition-row"><strong>Timeframe:</strong> <span style="font-weight:700;color:var(--danger);font-size:14px;">&lt;1 month</span></div>
                <div class="scr-condition-row"><strong>Macro:</strong> <a href="#macro-1" onclick="navigateToMacro(1); return false;" class="tag blue">Macro 1</a></div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check SCR for recent Orlistat</li><li>If timing unclear → hold + email</li><li>Add tag: <span class="tag orange">Pending Customer Response</span></li></ul></div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if &lt;1 month<br><em style="color: var(--text-muted); font-size: 0.9em;">Concurrent use contraindicated</em></div>
              </div>
            </div>
        </div>
        <div class="protocol-tab-content" data-tab-content="table3">
            <div class="protocol-text" style="margin-bottom: 16px;"><strong>Table 3:</strong> When clinical details are needed to make a prescribing decision.</div>
            <div class="scr-tabbed-conditions">
              <div class="scr-tabs">
                <button class="scr-tab active" data-condition="cholelithiasis">🩺 Cholelithiasis</button>
                <button class="scr-tab" data-condition="cholecystitis">🩺 Cholecystitis</button>
                <button class="scr-tab" data-condition="heartfailure">❤️ Heart Failure</button>
                <button class="scr-tab" data-condition="ckd">🫘 Chronic Kidney Disease</button>
              </div>
              <div class="scr-tab-content active" data-condition-content="cholelithiasis">
                <div class="scr-condition-title">🩺 Cholelithiasis <span class="scr-condition-desc">(gallstones)</span></div>
                <div class="scr-condition-row"><strong>Macro:</strong> <a href="#macro-2" onclick="navigateToMacro(2); return false;" class="tag blue">Macro 2</a></div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check SCR for cholecystectomy evidence</li><li>If no evidence → hold + email</li><li>Add tag: <span class="tag orange">Pending Customer Response</span></li></ul></div>
                <div class="scr-condition-row"><strong>Information to Request:</strong> Ask if patient had cholecystectomy (gallbladder removal surgery)</div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if no cholecystectomy<br><span class="decision-prescribe">PRESCRIBE</span> if cholecystectomy confirmed</div>
              </div>
              <div class="scr-tab-content" data-condition-content="cholecystitis">
                <div class="scr-condition-title">🩺 Cholecystitis <span class="scr-condition-desc">(gallbladder inflammation)</span></div>
                <div class="scr-condition-row"><strong>Macro:</strong> <a href="#macro-2" onclick="navigateToMacro(2); return false;" class="tag blue">Macro 2</a></div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check SCR for cholecystectomy evidence</li><li>If no evidence → hold + email</li><li>Add tag: <span class="tag orange">Pending Customer Response</span></li></ul></div>
                <div class="scr-condition-row"><strong>Information to Request:</strong> Ask if patient had cholecystectomy (gallbladder removal surgery)</div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if no cholecystectomy<br><span class="decision-prescribe">PRESCRIBE</span> if cholecystectomy confirmed</div>
              </div>
              <div class="scr-tab-content" data-condition-content="heartfailure">
                <div class="scr-condition-title">❤️ Heart Failure (HF)</div>
                <div class="scr-condition-row"><strong>Macro:</strong> <a href="#macro-4" onclick="navigateToMacro(4); return false;" class="tag blue">Macro 4</a></div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check SCR for HF stage</li><li>If stage unclear → hold + email</li><li>Add tag: <span class="tag orange">Pending Customer Response</span></li></ul></div>
                <div class="scr-condition-row"><strong>Information to Request:</strong> Request latest cardiology letter stating:<br>• HF stage, OR<br>• Confirmation if fit for GLP-1</div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if Stage IV<br><span class="decision-prescribe">PRESCRIBE</span> if Stage I, II, or III</div>
              </div>
              <div class="scr-tab-content" data-condition-content="ckd">
                <div class="scr-condition-title">🫘 Chronic Kidney Disease (CKD)</div>
                <div class="scr-condition-row"><strong>Macro:</strong> <a href="#macro-5" onclick="navigateToMacro(5); return false;" class="tag blue">Macro 5</a></div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check SCR for CKD stage or eGFR</li><li>If stage/eGFR unclear → hold + email</li><li>Add tag: <span class="tag orange">Pending Customer Response</span></li></ul></div>
                <div class="scr-condition-row"><strong>Information to Request:</strong> Request:<br>• Most recent eGFR result, AND/OR<br>• Latest specialist letter with CKD details</div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if eGFR &lt;30 or Stage 4/5<br><span class="decision-prescribe">PRESCRIBE</span> if eGFR ≥30 and Stage 1-3</div>
              </div>
            </div>
        </div>
        <div class="protocol-tab-content" data-tab-content="table4">
            <div class="protocol-text" style="margin-bottom: 16px;"><strong>Table 4:</strong> Patient assessment conditions requiring careful evaluation.</div>
            <div class="scr-tabbed-conditions">
              <div class="scr-tabs">
                <button class="scr-tab active" data-condition="cancer">🎗️ Cancer</button>
                <button class="scr-tab" data-condition="pregnancy">🤰 Pregnancy</button>
                <button class="scr-tab" data-condition="dementia">🧠 Dementia</button>
                <button class="scr-tab" data-condition="malabsorption">🩺 Malabsorption</button>
                <button class="scr-tab" data-condition="depression">😔 Depression/Anxiety</button>
                <button class="scr-tab" data-condition="suicidal">⚠️ Suicidal Ideation</button>
                <button class="scr-tab" data-condition="alcohol">🍺 Alcohol Abuse</button>
              </div>
              <div class="scr-tab-content active" data-condition-content="cancer">
                <div class="scr-condition-title">🎗️ Cancer <span class="scr-condition-desc">(excluding MEN2 or medullary thyroid cancer)</span></div>
                <div class="scr-condition-row"><strong>Macros:</strong> <a href="#macro-3" onclick="navigateToMacro(3); return false;" class="tag blue">Macro 3 - General Cancer</a> | <a href="#macro-31" onclick="navigateToMacro(31); return false;" class="tag blue">Macro 31 - Breast Cancer</a></div>
                <div class="scr-condition-row"><strong>⚕️ Important - Breast Cancer:</strong> History requires clarification, NOT automatic rejection. Email patient to confirm current status before making decision.</div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check SCR for cancer diagnosis and treatment status</li><li>Look for oncology discharge letters</li><li>If unclear → hold + email</li><li>Add tag: <span class="tag orange">Pending Customer Response</span></li></ul></div>
                <div class="scr-condition-row"><strong>Information to Request:</strong> Ask about:<br>• Cancer diagnosis details<br>• Current/awaiting treatment status<br>• Remission status<br>• Oncology team involvement<br>• <strong>For breast cancer:</strong> Hormone therapy only (e.g., tamoxifen, Zoladex)?</div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if currently on active treatment or under oncology care<br><span class="decision-prescribe">PRESCRIBE</span> if in remission, discharged from oncology, or on hormone therapy only with no active treatment</div>
              </div>
              <div class="scr-tab-content" data-condition-content="pregnancy">
                <div class="scr-condition-title">🤰 Pregnancy <span class="scr-condition-desc">Including breastfeeding and trying to conceive</span></div>
                <div class="scr-condition-row"><strong>Macro:</strong> <a href="#macro-6" onclick="navigateToMacro(6); return false;" class="tag blue">Macro 6</a></div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check consultation answers for pregnancy status</li><li>If unclear → hold + email</li><li>Add tag: <span class="tag orange">Pending Customer Response</span></li></ul></div>
                <div class="scr-condition-row"><strong>Information to Request:</strong> Confirm if patient is:<br>• Currently pregnant<br>• Breastfeeding<br>• Trying to conceive</div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if pregnant, breastfeeding, or trying to conceive<br><span class="decision-prescribe">PRESCRIBE</span> only if none of the above apply</div>
              </div>
              <div class="scr-tab-content" data-condition-content="dementia">
                <div class="scr-condition-title">🧠 Dementia</div>
                <div class="scr-condition-row"><strong>Macro:</strong> <a href="#macro-7" onclick="navigateToMacro(7); return false;" class="tag blue">Macro 7</a></div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check SCR for dementia diagnosis</li><li>Assess home safety concerns</li><li>If unclear → hold + email</li><li>Add tag: <span class="tag orange">Pending Customer Response</span></li></ul></div>
                <div class="scr-condition-row"><strong>Information to Request:</strong> Assess:<br>• Ability to self-administer medication safely<br>• Home support available<br>• Capacity to consent</div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if safety concerns or lack of capacity<br><span class="decision-prescribe">PRESCRIBE</span> if patient can safely self-administer with support</div>
              </div>
              <div class="scr-tab-content" data-condition-content="malabsorption">
                <div class="scr-condition-title">🩺 Malabsorption Syndrome</div>
                <div class="scr-condition-row"><strong>Macro:</strong> <a href="#macro-8" onclick="navigateToMacro(8); return false;" class="tag blue">Macro 8</a></div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check SCR for formal malabsorption diagnosis</li><li>If unclear → hold + email</li><li>Add tag: <span class="tag orange">Pending Customer Response</span></li></ul></div>
                <div class="scr-condition-row"><strong>Information to Request:</strong> Confirm formal diagnosis of malabsorption syndrome</div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if formal diagnosis confirmed</div>
              </div>
              <div class="scr-tab-content" data-condition-content="depression">
                <div class="scr-condition-title">😔 Depression/Anxiety</div>
                <div class="scr-condition-row"><strong>Timeframe:</strong> <span style="font-weight:700;color:var(--danger);font-size:14px;">&lt;3 months</span> <strong style="color:var(--danger);">if acutely unwell OR new antidepressant</strong></div>
                <div class="scr-condition-row"><strong>Macro:</strong> <a href="#macro-9" onclick="navigateToMacro(9); return false;" class="tag blue">Macro 9</a></div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check SCR for recent mental health episodes</li><li>Check for new antidepressant prescriptions</li><li>If timing unclear → hold + email</li><li>Add tag: <span class="tag orange">Pending Customer Response</span></li></ul></div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if acutely unwell &lt;3 months or new antidepressant &lt;3 months<br><span class="decision-prescribe">PRESCRIBE</span> if stable &gt;3 months</div>
              </div>
              <div class="scr-tab-content" data-condition-content="suicidal">
                <div class="scr-condition-title">⚠️ Suicidal Ideation</div>
                <div class="scr-condition-row"><strong>Timeframe:</strong> <span style="font-weight:700;color:var(--danger);font-size:14px;">&lt;12 months</span></div>
                <div class="scr-condition-row"><strong>Macro:</strong> <a href="#macro-9" onclick="navigateToMacro(9); return false;" class="tag blue">Macro 9</a></div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check SCR for mental health crisis history</li><li>Check consultation answers carefully</li><li>If any concern → <strong>REJECT immediately</strong></li></ul></div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if suicidal ideation &lt;12 months<br><span class="decision-prescribe">PRESCRIBE</span> only if &gt;12 months and fully stable</div>
              </div>
              <div class="scr-tab-content" data-condition-content="alcohol">
                <div class="scr-condition-title">🍺 Alcohol Abuse</div>
                <div class="scr-condition-row"><strong>Timeframe:</strong> <span style="font-weight:700;color:var(--danger);font-size:14px;">&lt;12 months</span> <strong style="color:var(--danger);">if in recovery OR current dependence</strong></div>
                <div class="scr-condition-row"><strong>Macro:</strong> <a href="#macro-10" onclick="navigateToMacro(10); return false;" class="tag blue">Macro 10</a></div>
                <div class="scr-condition-row"><strong>Before Emailing:</strong> <ul class="protocol-list"><li>Check SCR for alcohol dependence diagnosis</li><li>Look for addiction services involvement</li><li>If current dependence → <strong>REJECT immediately</strong></li><li>If timing unclear → hold + email</li></ul></div>
                <div class="scr-condition-row"><strong>After Patient Response:</strong> <span class="decision-reject">REJECT</span> if current dependence or in recovery &lt;12 months<br><span class="decision-prescribe">PRESCRIBE</span> if in recovery &gt;12 months and stable</div>
              </div>
            </div>
        </div>
        <div class="protocol-tab-content" data-tab-content="escalation">
          <div class="protocol-card">
            <div class="protocol-title">
              <div class="icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="4" y="4" width="16" height="16" rx="4"/>
                  <path d="M8 10h8M8 14h8"/>
                </svg>
              </div>
              Escalations (when and how)
            </div>
            <div class="protocol-text"><strong>Escalate when:</strong></div>
            <ul class="protocol-list">
              <li>You gathered further information using macros but are still unsure of the prescribing decision.</li>
              <li>You see SCR information and aren't sure if it's a contraindication to GLP-1s.</li>
              <li>You received an email response but aren't sure if it indicates a contraindication.</li>
            </ul>
            <div class="protocol-text"><strong>Actions:</strong></div>
            <ol class="protocol-ol">
              <li>Add a note to the customer's account.</li>
              <li>Create a Jira escalation ticket using option “SCR query”.</li>
              <li>Change tag from “prescriber review” to “escalated”.</li>
            </ol>
          </div>
        </div>
        <div class="protocol-tab-content" data-tab-content="rejecting">
          <div class="protocol-card">
            <div class="protocol-title">
              <div class="icon red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18"/>
                  <path d="M6 6l12 12"/>
                </svg>
              </div>
              Rejecting prescriptions (especially repeat patients)
            </div>
            <div class="protocol-text">If rejecting a repeat patient after several months of prescribing, use <a href="#macro-12" onclick="navigateToMacro(12); return false;" class="tag blue">Macro 12: Rejection for Repeat Patients</a>. If patients reply unhappy, senior pharmacists may call using these principles:</div>
            <ul class="protocol-list">
              <li><strong>Lead with empathy</strong> (“I can hear you are frustrated”).</li>
              <li><strong>Explain through safety</strong> (protection not restriction).</li>
              <li>Keep it simple, direct, reassuring (not defensive).</li>
              <li>Offer a path forward (signpost GP/alternatives).</li>
              <li>Maintain boundaries calmly; no exceptions if unsafe.</li>
            </ul>
          </div>
        </div>
        <div class="protocol-tab-content" data-tab-content="documentation">
          <div class="protocol-card">
            <div class="protocol-title">
              <div class="icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
              </div>
              Documentation Requirements
            </div>
            <div class="protocol-text"><strong>Document all decisions:</strong></div>
            <ul class="protocol-list">
              <li>Add clear notes to patient account for every decision</li>
              <li>Record which macros were sent and when</li>
              <li>Note key information from patient responses</li>
              <li>Document reason for approval or rejection</li>
              <li>Update tags appropriately throughout the process</li>
            </ul>
            <div class="protocol-text" style="margin-top: 16px;"><strong>Common tags:</strong></div>
            <ul class="protocol-list">
              <li><span class="tag orange">Pending Customer Response</span> - Awaiting patient reply to macro</li>
              <li><span class="tag purple">Escalated</span> - Referred to senior pharmacist</li>
              <li><span class="tag blue">Prescriber Review</span> - Active review in progress</li>
              <li><span class="tag green">Approved</span> - Prescription approved</li>
              <li><span class="tag red">Rejected</span> - Prescription rejected</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  },

  getSCRMacroAccordions() {
    return `
      <details class="accordion">
        <summary>Macro 1 — Request for further information (timing/details)</summary>
        <div class="accordion-body">
          <div class="scr-copy-row"><div class="scr-copy-title">Macro 1</div><button class="btn btn-secondary copy-btn" data-copy-target="macro-1">Copy</button></div>
          <pre id="macro-1" class="macro-box">Subject: Request for Further Information About Your Medical History\n\nDear [Patient’s Name],\n\nI can see from your records that you have had [X condition listed on Table 2]. Could you please provide us with a bit more information about when this occurred and any relevant details you feel may be important?\n\nYour response will help us ensure that we have an accurate and up-to-date understanding of your medical history when reviewing your request.\n\nThank you for your time, and please let us know if you have any questions.\n\nKind regards,\n[Your Name]\n[Your Role]\n[Organisation Name]</pre>
        </div>
      </details>

      <details class="accordion">
        <summary>Macro 2 — Previous gallbladder problems</summary>
        <div class="accordion-body">
          <div class="scr-copy-row"><div class="scr-copy-title">Macro 2</div><button class="btn btn-secondary copy-btn" data-copy-target="macro-2">Copy</button></div>
          <pre id="macro-2" class="macro-box">Subject: Follow-Up on Your Medical History\n\nDear [Patient Name],\n\nFrom your records, I can see you have had a gallbladder problem noted. Could you please confirm if you have had a cholecystectomy (gallbladder removal surgery) following this, and if so, when the surgery took place?\n\nThis information will help us ensure your medical history is accurate and up to date.\n\nKind regards,\n[Your Name]\n[Your Role]\n[Organisation Name]</pre>
        </div>
      </details>

      <details class="accordion">
        <summary>Macro 3 — Previous cancer diagnosis</summary>
        <div class="accordion-body">
          <div class="scr-copy-row"><div class="scr-copy-title">Macro 3</div><button class="btn btn-secondary copy-btn" data-copy-target="macro-3">Copy</button></div>
          <pre id="macro-3" class="macro-box">Subject: Follow-Up on Your Medical History\n\nDear &lt;&lt;Patient Name&gt;&gt;,\n\nWe would be grateful if you could provide us with some further details about your medical history:\n• Have you ever had a cancer diagnosis (excluding MEN2 or medullary thyroid cancer)? Are you currently on, or awaiting, any treatment such as surgery, chemotherapy, or radiotherapy?\n• Is the cancer in remission?\n• Have you been discharged from the oncology team? If so, please send a copy of your discharge letter or your most recent letter from the Oncology team.\n\nThank you for choosing MedExpress to support you on your weight loss journey. Your response will help us make sure we have an accurate and up-to-date understanding of your medical history.\n\nKind regards,\n&lt;&lt;Your Name&gt;&gt;\n&lt;&lt;Your Role&gt;&gt;\n&lt;&lt;Organisation Name&gt;&gt;</pre>
        </div>
      </details>

      <details class="accordion">
        <summary>Macro 4 — Heart failure information</summary>
        <div class="accordion-body">
          <div class="scr-copy-row"><div class="scr-copy-title">Macro 4</div><button class="btn btn-secondary copy-btn" data-copy-target="macro-4">Copy</button></div>
          <pre id="macro-4" class="macro-box">Subject: Request for Information on Heart Failure Diagnosis\n\nDear &lt;&lt;Patient Name&gt;&gt;,\n\nWe can see a coded diagnosis of heart failure in your records. To ensure we have the most accurate and up-to-date information about your condition, could you please provide us with:\n• A copy of your most recent cardiology letter, or\n• Any additional details regarding your diagnosis that you feel are relevant.\n\nThank you for choosing MedExpress to support you on your weight loss journey. Your response will help us provide the best possible care.\n\nKind regards,\n&lt;&lt;Your Name&gt;&gt;\n&lt;&lt;Your Role&gt;&gt;\n&lt;&lt;Organisation Name&gt;&gt;</pre>
        </div>
      </details>

      <details class="accordion">
        <summary>Macro 5 — CKD diagnosis</summary>
        <div class="accordion-body">
          <div class="scr-copy-row"><div class="scr-copy-title">Macro 5</div><button class="btn btn-secondary copy-btn" data-copy-target="macro-5">Copy</button></div>
          <pre id="macro-5" class="macro-box">Subject: Request for Information on CKD Diagnosis\n\nDear &lt;&lt;Patient Name&gt;&gt;,\n\nWe can see a diagnosis of chronic kidney disease (CKD) noted in your records. To ensure we have the most accurate and up-to-date information about your condition, could you please provide us with:\n• Your most recent eGFR result, and/or\n• A copy of the latest letter from your specialist with further details about your CKD.\n\nThank you for choosing MedExpress to support you on your weight loss journey. Your response will help us provide the best possible care.\n\nKind regards,\n&lt;&lt;Your Name&gt;&gt;\n&lt;&lt;Your Role&gt;&gt;\n&lt;&lt;Organisation Name&gt;&gt;</pre>
        </div>
      </details>

      <details class="accordion">
        <summary>Macro 6 — Pregnancy</summary>
        <div class="accordion-body">
          <div class="scr-copy-row"><div class="scr-copy-title">Macro 6</div><button class="btn btn-secondary copy-btn" data-copy-target="macro-6">Copy</button></div>
          <pre id="macro-6" class="macro-box">Subject: Follow-Up on Your Current Status\n\nDear &lt;&lt;Patient Name&gt;&gt;,\n\nTo help us provide the most appropriate care, could you please confirm your current status regarding the following:\n• Are you currently pregnant?\n• Are you breastfeeding?\n• Are you trying to conceive?\n\nYour response will ensure we have accurate and up-to-date information for your care.\nThank you for choosing MedExpress to support you on your weight loss journey.\n\nKind regards,\n&lt;&lt;Your Name&gt;&gt;\n&lt;&lt;Your Role&gt;&gt;\n&lt;&lt;Organisation Name&gt;&gt;</pre>
        </div>
      </details>

      <details class="accordion">
        <summary>Macro 7 — Dementia</summary>
        <div class="accordion-body">
          <div class="scr-copy-row"><div class="scr-copy-title">Macro 7</div><button class="btn btn-secondary copy-btn" data-copy-target="macro-7">Copy</button></div>
          <pre id="macro-7" class="macro-box">Subject: Follow-Up on Your Care and Support\n\nDear &lt;&lt;Patient Name&gt;&gt;,\n\nWe can see that dementia is noted in your records. To help us understand your needs and provide the best support, could you please let us know:\n• How you manage at home on a day-to-day basis?\n• Whether you have any help or support at home?\n\nThank you for choosing MedExpress to support you on your weight loss journey. Your response will help us ensure we have the most accurate and up-to-date information.\n\nKind regards,\n&lt;&lt;Your Name&gt;&gt;\n&lt;&lt;Your Role&gt;&gt;\n&lt;&lt;Organisation Name&gt;&gt;</pre>
        </div>
      </details>

      <details class="accordion">
        <summary>Macro 8 — Chronic malabsorption</summary>
        <div class="accordion-body">
          <div class="scr-copy-row"><div class="scr-copy-title">Macro 8</div><button class="btn btn-secondary copy-btn" data-copy-target="macro-8">Copy</button></div>
          <pre id="macro-8" class="macro-box">Subject: Request for Information on Chronic Malabsorption\n\nDear &lt;&lt;Patient Name&gt;&gt;,\n\nWe can see a note of chronic malabsorption in your records. To ensure we have accurate and up-to-date information about your condition, could you please provide us with:\n• Evidence of a formal diagnosis, or\n• A letter from your specialist with further details regarding your condition.\n\nThank you for choosing MedExpress to support you on your weight loss journey. Your response will help us provide the best possible care.\n\nKind regards,\n&lt;&lt;Your Name&gt;&gt;\n&lt;&lt;Your Role&gt;&gt;\n&lt;&lt;Organisation Name&gt;&gt;</pre>
        </div>
      </details>

      <details class="accordion">
        <summary>Macro 9 — Mental health</summary>
        <div class="accordion-body">
          <div class="scr-copy-row"><div class="scr-copy-title">Macro 9</div><button class="btn btn-secondary copy-btn" data-copy-target="macro-9">Copy</button></div>
          <pre id="macro-9" class="macro-box">Subject: Follow-Up on Your Mental Health\n\nDear &lt;&lt;Patient Name&gt;&gt;,\n\nWe can see depression or anxiety noted in your records. To help us provide the best care and support, could you please provide some information regarding:\n• How your mood has been recently.\n• Whether your mood has changed in the past few weeks or months.\n• If you have had any thoughts of self-harm.\n• If you have had any thoughts of ending your life.\n\nIf you are currently experiencing thoughts of self-harm or ending your life, please contact your GP or local crisis services immediately. In the UK, you can also contact Samaritans on 116 123.\n\nThank you for choosing MedExpress to support you on your weight loss journey. Your response will help us ensure we have the most accurate and up-to-date information.\n\nKind regards,\n&lt;&lt;Your Name&gt;&gt;\n&lt;&lt;Your Role&gt;&gt;\n&lt;&lt;Organisation Name&gt;&gt;</pre>
        </div>
      </details>

      <details class="accordion">
        <summary>Macro 10 — Alcohol abuse</summary>
        <div class="accordion-body">
          <div class="scr-copy-row"><div class="scr-copy-title">Macro 10</div><button class="btn btn-secondary copy-btn" data-copy-target="macro-10">Copy</button></div>
          <pre id="macro-10" class="macro-box">Subject: Follow-Up on Alcohol Use\n\nDear &lt;&lt;Patient Name&gt;&gt;,\n\nWe can see alcohol abuse or dependence noted in your records. To help us understand your situation and provide the best support, could you please provide some information regarding:\n• How much you are currently drinking.\n• Whether you have ever felt that you ought to cut down on your drinking.\n• Whether you get annoyed by criticism of your drinking.\n• Whether you ever feel guilty about your drinking.\n• Whether you ever take an early-morning drink (“eye-opener”) to get the day started or to relieve a hangover.\n\nThank you for choosing MedExpress to support you on your weight loss journey. Your response will help us ensure we have the most accurate and up-to-date information.\n\nKind regards,\n&lt;&lt;Your Name&gt;&gt;\n&lt;&lt;Your Role&gt;&gt;\n&lt;&lt;Organisation Name&gt;&gt;</pre>
        </div>
      </details>

      <details class="accordion">
        <summary>Macro 11 — Patient has not granted permission to view SCR</summary>
        <div class="accordion-body">
          <div class="scr-copy-row"><div class="scr-copy-title">Macro 11</div><button class="btn btn-secondary copy-btn" data-copy-target="macro-11">Copy</button></div>
          <pre id="macro-11" class="macro-box">Email Subject: Update Regarding Access to Summary Care Records (SCR)\n\nDear &lt;&lt;Patient Name&gt;&gt;,\n\nThank you for your recent order.\n\nWe wanted to let you know about an important change to our prescribing process. Unfortunately, we are now unable to prescribe medication if access to the Summary Care Record (SCR) is declined. Access to the SCR is essential to ensure that we prescribe safely and in accordance with clinical guidance.\n\nIt appears that you have not granted us access to your SCR. If you would like to review this decision or have any questions about what the SCR is, we would be happy to provide more information.\n\nIf you wish to change your mind and allow us access to your SCR, we would be happy to move forward with your prescription. However, if you choose not to grant access, we will need to reject your prescription request, and you will receive a full refund.\n\nPlease let us know how you would like to proceed.\n\nKind regards,\nMedExpress Clinical Team\n\n---\nIf patient grants permission: document permission obtained over email + add Zendesk link, then proceed to check SCR on NHS site.\nIf patient does not grant permission: reject the order.</pre>
        </div>
      </details>

      <details class="accordion">
        <summary>Macro 12 — Rejection email for repeat patients</summary>
        <div class="accordion-body">
          <div class="scr-copy-row"><div class="scr-copy-title">Macro 12</div><button class="btn btn-secondary copy-btn" data-copy-target="macro-12">Copy</button></div>
          <pre id="macro-12" class="macro-box">Email Subject: An important update on your treatment plan\n\nHi &lt;&lt;Patient Name&gt;&gt;,\n\nWe’re getting in touch to let you know that, following an updated review of your medical records, we’re no longer able to prescribe weight loss treatments such as Wegovy, Mounjaro or Nevolat.\nThis means your current order will be automatically cancelled and refunded.\n\nThis decision is based on new information from your Summary Care Record (SCR), which is a national database that includes details like your current medication, allergies, any diagnoses or medical conditions and previous reactions to medicines. Reviewing your SCR is a new step we’ve introduced to further improve the safety of our service.\n\nDuring these checks, we noted [add information about contraindication(s) found].\n\nFor your safety, please stop using your injectable treatment and take any remaining pens to your local pharmacy for safe disposal.\n\nWe understand this news may be disappointing, but your safety is our top priority. If you’d like to speak with one of our clinicians about this update, just reply to this email. We’ll get back to you as soon as possible.\n\nYou can also discuss your weight management options with your GP for more personalised support.\n\nKind regards,\nMedExpress Clinical Team</pre>
        </div>
      </details>
    `;
  },

  getCoreProtocolCards() {
    return `
      <!-- Core Checks Tabs -->
      <div class="protocol-tabs">
        <button class="protocol-tab active" data-tab="consultation">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          Consultation Review
        </button>
        <button class="protocol-tab" data-tab="identity">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="16" rx="2"/>
            <circle cx="15" cy="10" r="2"/>
          </svg>
          Identity & Age
        </button>
        <button class="protocol-tab" data-tab="biometric">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3v18M3 12h18"/>
            <circle cx="12" cy="12" r="9"/>
          </svg>
          BMI & Photo
        </button>
        <button class="protocol-tab" data-tab="gp">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <path d="M9 22V12h6v10"/>
          </svg>
          GP Details
        </button>
      </div>

      <!-- Tab 1: Consultation Review -->
      <div class="protocol-tab-content active" data-tab-content="consultation">

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          Consultation Answers
        </div>
        <div class="protocol-text">
          <strong>What to check:</strong> Read all consultation answers and check patient notes for any email updates from the patient.
        </div>
        <div class="protocol-text">
          Transfer patients are asked about <strong>hospitalisation due to side effects</strong>. If they confirm hospitalisation, <strong>reject the order</strong>.
        </div>
        <div class="protocol-section" style="margin-top: 16px;">
          <div class="protocol-section-title">If Further Information Required</div>
          <div class="protocol-text">
            Add tag <span class="tag orange">Pending Customer Response</span> and email the patient using appropriate macro.
          </div>
        </div>
      </div>

      </div>
      <!-- End Tab 1 -->

      <!-- Tab 2: Identity & Age -->
      <div class="protocol-tab-content" data-tab-content="identity">

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="16" rx="2"/>
              <circle cx="15" cy="10" r="2"/>
            </svg>
          </div>
          ID Verification
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">Requirements for Valid ID</div>
          <ul class="protocol-list">
            <li><strong>Full name, DoB, and photo</strong> must be visible and match account</li>
            <li>Must be from <strong>official governmental organisation</strong> (UK or overseas acceptable)</li>
            <li>Pass Cards and other formal ID may be accepted</li>
            <li><strong>First orders:</strong> ID must be in date</li>
            <li><strong>Repeat orders:</strong> Expired ID is acceptable</li>
          </ul>
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">If ID Fails (New Patient)</div>
          <div class="protocol-text">
            Add <span class="tag red">Failed ID</span> tag (triggers auto email in 5 minutes). Remove <span class="tag blue">Prescriber Review</span> tag.
          </div>
          <div class="info-card red" style="margin-top: 12px;">
            <div class="info-card-title">Important</div>
            <div class="info-card-text">
              <strong>Don't use Failed ID tag more than once.</strong> If already used, send personalised email and add <span class="tag orange">Pending Customer Response</span> instead.
            </div>
          </div>
        </div>
      </div>

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          Age Verification
        </div>
        <div class="protocol-text">
          Patient must be <strong>18–74 years old (inclusive)</strong>.
        </div>
        <div class="protocol-text">
          If outside this range, reject with code <strong>"Clinically Unsuitable"</strong>. No escalation needed for age rejections, even if prescriber is in probation period.
        </div>
      </div>

      </div>
      <!-- End Tab 2 -->

      <!-- Tab 3: BMI & Photo -->
      <div class="protocol-tab-content" data-tab-content="biometric">

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3v18M3 12h18"/>
              <circle cx="12" cy="12" r="9"/>
            </svg>
          </div>
          BMI Requirements
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">Starting Treatment (New Patients)</div>
          <div class="table-wrapper">
            <table class="dose-table">
              <tr>
                <th>Patient Type</th>
                <th>Minimum BMI</th>
                <th>Maximum BMI</th>
              </tr>
              <tr>
                <td><strong>Without comorbidities</strong></td>
                <td>30 kg/m²</td>
                <td rowspan="3">60 kg/m²</td>
              </tr>
              <tr>
                <td><strong>With comorbidities</strong> (prediabetes, diabetes, heart disease, high BP, high cholesterol, sleep apnoea)</td>
                <td>27 kg/m²</td>
              </tr>
              <tr>
                <td><strong>BAME patients</strong></td>
                <td>27.5 kg/m²</td>
              </tr>
            </table>
          </div>
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">Repeat Patients (Minimum BMI 21)</div>
          <div class="table-wrapper">
            <table class="dose-table">
              <tr>
                <th>Gap Since Last Order</th>
                <th>Minimum BMI</th>
              </tr>
              <tr>
                <td>&lt;6 months gap</td>
                <td><strong>21 kg/m²</strong></td>
              </tr>
              <tr>
                <td>6–12 months gap</td>
                <td><strong>25 kg/m²</strong></td>
              </tr>
              <tr>
                <td>&gt;12 months gap</td>
                <td><strong>Must meet licence threshold</strong> (27-30 kg/m²)</td>
              </tr>
            </table>
          </div>
        </div>
        <div class="info-card green" style="margin-top: 16px;">
          <div class="info-card-title">If Unsure About Patient's BMI</div>
          <div class="info-card-text">
            <strong>Escalate the order.</strong> Add <span class="tag purple">escalated</span> tag and remove <span class="tag blue">Prescriber Review</span> tag.
          </div>
        </div>
      </div>

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
          Photo Verification
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">Photo Must Show</div>
          <ul class="protocol-list">
            <li>Patient alone, <strong>full-length</strong> view, face clearly visible</li>
            <li>No sunglasses or phone covering face</li>
            <li><strong>Fitted clothing</strong> (may accept loose if BMI still validatable)</li>
            <li>Same person as appears in ID photo</li>
          </ul>
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">If Photo Fails (New Patient)</div>
          <div class="protocol-text">
            Add <span class="tag red">Weight verification failed</span> tag (triggers auto email in 5 minutes).
          </div>
          <div class="protocol-text">
            If tag already used, send personalised email and add <span class="tag orange">Pending Customer Response</span>.
          </div>
        </div>
        <div class="info-card red" style="margin-top: 12px;">
          <div class="info-card-title">⚠️ Inappropriate Photos</div>
          <div class="info-card-text">
            If genitalia is exposed in photo: place order on hold and ask Customer Service to delete the photo. <strong>Never prescribe based on a nude photo.</strong>
          </div>
        </div>
      </div>

      </div>
      <!-- End Tab 3 -->

      <!-- Tab 4: GP Details -->
      <div class="protocol-tab-content" data-tab-content="gp">

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <path d="M9 22V12h6v10"/>
            </svg>
          </div>
          GP Details
        </div>
        <div class="protocol-text">
          Patient must be registered with a <strong>UK NHS surgery</strong>.
        </div>
        <div class="protocol-text">
          <strong>Green tick</strong> = GP details have been verified by the system. If no tick is shown, validate the GP practice via Google search or NHS ODS Portal.
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">If GP Cannot Be Validated</div>
          <div class="protocol-text">
            Add <span class="tag orange">Incomplete GP details</span> tag (triggers automatic email to patient).
          </div>
        </div>
        <div class="info-card red" style="margin-top: 12px;">
          <div class="info-card-title">GP Outside UK</div>
          <div class="info-card-text">
            Email patient requesting UK GP details. If patient is unable to provide a UK GP, <strong>reject the order</strong> using <a href="#macro-27" onclick="navigateToMacro(27); return false;" style="color: var(--accent);">Macro 27: Standard Rejection</a>.
          </div>
        </div>
      </div>

      </div>
      <!-- End Tab 4 -->

    `;
  },

  getPUEProtocolCards() {
    return `
      <!-- PUE Tabs -->
      <div class="protocol-tabs">
        <button class="protocol-tab active" data-tab="requirements">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6"/>
          </svg>
          PUE Requirements
        </button>
        <button class="protocol-tab" data-tab="below-licence">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
          </svg>
          Below-Licence BMI
        </button>
        <button class="protocol-tab" data-tab="failures">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          PUE Failures
        </button>
        <button class="protocol-tab" data-tab="timing">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          Timing Issues
        </button>
      </div>

      <!-- Tab 1: PUE Requirements -->
      <div class="protocol-tab-content active" data-tab-content="requirements">
      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6"/>
            </svg>
          </div>
          When PUE is Required
        </div>
        <div class="protocol-text">
          <strong>Previous Use Evidence (PUE)</strong> is required in the following scenarios:
        </div>
        <ul class="protocol-list">
          <li><strong>Transfer patients</strong> — New to MedExpress but has previously used GLP-1 with another provider</li>
          <li><strong>Skipped doses</strong> — System shows "GLP1 product is X step(s) lower/higher than previous order"</li>
          <li><strong>Step-up or maintenance dose requests</strong> from patients who are new to MedExpress</li>
        </ul>
      </div>

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          What PUE Must Show
        </div>
        <div class="protocol-text">
          Valid Previous Use Evidence must include <strong>all four</strong> of the following:
        </div>
        <div class="table-wrapper">
          <table class="dose-table">
            <tr>
              <th>Requirement</th>
              <th>Details</th>
            </tr>
            <tr>
              <td><strong>1. Patient Name/Email</strong></td>
              <td>Full name (not nickname) OR patient's email address</td>
            </tr>
            <tr>
              <td><strong>2. Medication & Dose</strong></td>
              <td>Specific medication name and dosage prescribed</td>
            </tr>
            <tr>
              <td><strong>3. Date</strong></td>
              <td>Order date, prescription date, OR dispatch date</td>
            </tr>
            <tr>
              <td><strong>4. From Regulated Body</strong></td>
              <td>Must be from a legitimate healthcare provider/pharmacy</td>
            </tr>
          </table>
        </div>
        <div class="info-card red" style="margin-top: 16px;">
          <div class="info-card-title">⚠️ Order Confirmation is NOT Acceptable</div>
          <div class="info-card-text">
            PUE must be a <strong>dispatch notification, prescription, or dispensing label</strong>. Simple order confirmations do not qualify. Evidence may be provided over multiple screenshots.
          </div>
        </div>
      </div>
      </div>

      <!-- Tab 2: Below-Licence BMI -->
      <div class="protocol-tab-content" data-tab-content="below-licence">
      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          Below-Licence BMI Requirements
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">For Patients with BMI Below Licence</div>
          <div class="protocol-text">
            <strong>Cannot proceed without BOTH PUE AND previous BMI photo.</strong>
          </div>
          <div class="protocol-text">
            If either PUE or previous BMI photo fails requirements, patient is not eligible. Use <a href="#macro-15" class="tag blue" onclick="navigateToMacro(15); return false;">Macro 15: Evidence of Starting BMI</a>.
          </div>
        </div>
        <div class="divider"></div>
        <div class="protocol-section">
          <div class="protocol-section-title">If Previous BMI Photo Fails</div>
          <div class="protocol-text">
            Add <span class="tag purple">previous BMI verification failed</span> tag and remove <span class="tag blue">prescriber review</span> tag.
          </div>
          <div class="protocol-text">
            Send manual email explaining why the photo doesn't meet requirements.
          </div>
          <div class="info-card" style="margin-top: 12px;">
            <div class="info-card-title">Important Tag Note</div>
            <div class="info-card-text">
              <strong>DO NOT use "Weight verification failed" tag</strong> for previous BMI photos. That tag is only for current weight verification photos.
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- Tab 3: PUE Failures -->
      <div class="protocol-tab-content" data-tab-content="failures">
      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          If PUE Doesn't Meet Requirements
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">For Patients with BMI Above Licence</div>
          <div class="protocol-text">
            If PUE cannot be provided, the dose can be <strong>amended to starter dose</strong> by Customer Care team.
          </div>
          <div class="protocol-text">
            Message <strong>ME-Clinical-Communication</strong> Slack channel to request dose amendment.
          </div>
        </div>
        <div class="divider"></div>
        <div class="protocol-section">
          <div class="protocol-section-title">For Patients with BMI Below Licence</div>
          <div class="protocol-text">
            <strong>Cannot proceed without BOTH PUE AND previous BMI photo.</strong>
          </div>
          <div class="protocol-text">
            If either PUE or previous BMI photo fails requirements, patient is not eligible. Use <a href="#macro-15" class="tag blue" onclick="navigateToMacro(15); return false;">Macro 15: Evidence of Starting BMI</a>.
          </div>
        </div>
      </div>
      </div>

      <!-- Tab 4: Timing Issues -->
      <div class="protocol-tab-content" data-tab-content="timing">
      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          PUE Less Than 2 Weeks Old
        </div>
        <div class="protocol-text">
          <strong>Action required:</strong> Check the order date on patient's Previous Use Evidence.
        </div>
        <div class="protocol-text">
          If their last order with the previous provider was <strong>less than 2 weeks ago</strong> from their MedExpress order date:
        </div>
        <ul class="protocol-list">
          <li><strong>Prescribe the order</strong> as normal</li>
          <li>Send email using <a href="#macro-16" onclick="navigateToMacro(16); return false;" class="tag blue">Macro 16: PUE 2 Weeks Old</a></li>
          <li>Email reminds them to complete their current treatment before starting the MedExpress pen</li>
        </ul>
      </div>
      </div>
    `;
  },

  getTitrationProtocolCards() {
    return `
      <!-- Titration Tabs -->
      <div class="protocol-tabs">
        <button class="protocol-tab active" data-tab="schedules">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20V10M18 20V4M6 20v-4"/>
          </svg>
          Titration Schedules
        </button>
        <button class="protocol-tab" data-tab="skipped">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
          </svg>
          Skipped Doses
        </button>
        <button class="protocol-tab" data-tab="gaps">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          Treatment Gaps
        </button>
          <button class="protocol-tab" data-tab="workflow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            Workflow & Steps
          </button>
          <button class="protocol-tab" data-tab="checking">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="16" rx="2"/>
              <path d="M8 8h8M8 12h8M8 16h8"/>
            </svg>
            Checking SCR
          </button>
          <button class="protocol-tab" data-tab="decision">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
            Decision Making
          </button>
          <button class="protocol-tab" data-tab="escalation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            Escalation
          </button>
          <button class="protocol-tab" data-tab="rejecting">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18"/>
              <path d="M6 6l12 12"/>
            </svg>
            Rejecting Prescription
          </button>
          <button class="protocol-tab" data-tab="documentation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            Documentation
          </button>
              <th>Medication</th>
              <th>Titration Schedule</th>
            </tr>
            <tr>
              <td><strong>Mounjaro & Wegovy</strong></td>
              <td>Titrate up <strong>each month</strong></td>
            </tr>
            <tr>
              <td><strong>Nevolat</strong></td>
              <td><strong>Weekly titration</strong>, 0.6mg increments, maximum 3mg</td>
            </tr>
          </table>
        </div>
        <div class="info-card blue" style="margin-top: 16px;">
          <div class="info-card-title">Nevolat Pen Label Instruction</div>
          <div class="info-card-text">
            "Inject once daily under the skin at the same time each day. If switching from another weight loss medication, check your email for dosage instructions."
            <div style="margin-top: 8px;"><a href="#macro-25" onclick="navigateToMacro(25); return false;" class="tag blue">Macro 25: Nevolat Titration (New)</a> <a href="#macro-26" onclick="navigateToMacro(26); return false;" class="tag blue">Macro 26: Nevolat Switching</a></div>
          </div>
        </div>
      </div>
      </div>

      <!-- Tab 2: Skipped Doses -->
      <div class="protocol-tab-content" data-tab-content="skipped">
      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          Customer Skips a Dose
        </div>
        <div class="protocol-text">
          If patient skips a dose in the titration sequence, use <a href="#macro-18" onclick="navigateToMacro(18); return false;" class="tag blue">Macro 18: Skipped Dose</a>
        </div>
        <div class="protocol-text">
          Patient has <strong>two options</strong>:
        </div>
        <ul class="protocol-list">
          <li><strong>Option 1:</strong> We amend their order to the correct dose per titration guide</li>
          <li><strong>Option 2:</strong> Patient provides evidence they received the missing dose from an alternative provider</li>
        </ul>
        <div class="protocol-text">
          Tag order with <span class="tag orange">Pending Customer Response</span> and wait for patient reply.
        </div>
      </div>

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          Patient Stays Same or Goes Down
        </div>
        <div class="protocol-text">
          If patient stays on same dose or reduces strength: <strong>Prescribe first, then contact afterwards</strong> using <a href="#macro-19" onclick="navigateToMacro(19); return false;" class="tag blue">Macro 19: Not Titrated Up</a> or <a href="#macro-20" onclick="navigateToMacro(20); return false;" class="tag blue">Macro 20: Went Down</a>
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">Justifiable Reasons (No Need to Re-send Macro)</div>
          <ul class="protocol-list">
            <li>Seeing positive weight loss results at lower dose</li>
            <li>Side effects are minimal and manageable at current dose</li>
            <li>Struggling to afford the increased price of higher doses</li>
          </ul>
        </div>
      </div>
      </div>

      <!-- Tab 3: Treatment Gaps -->
      <div class="protocol-tab-content" data-tab-content="gaps">
      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          Gap in Treatment Protocol
        </div>
        <div class="protocol-text">
          Orders with <strong>&gt;8 week gap</strong> automatically receive <span class="tag orange">Long treatment gap</span> tag.
        </div>
        <div class="protocol-text">
          <strong>How to use this table:</strong> Find the gap length since patient's last dose in the left column, then see the maximum dose they can restart on in the right columns.
        </div>
        <div class="table-wrapper">
          <table class="dose-table">
            <tr>
              <th>Gap Length</th>
              <th>Action Required</th>
              <th>Max Restart Dose</th>
            </tr>
            <tr>
              <td><strong>≤8 weeks</strong></td>
              <td>May titrate up to next dose level</td>
              <td>N/A (normal progression)</td>
            </tr>
            <tr>
              <td><strong>&gt;8 to ≤12 weeks</strong></td>
              <td>Continue last tolerated dose, up to maximum shown</td>
              <td>
                Wegovy 1mg<br>
                Mounjaro 10mg<br>
                Nevolat 1.8mg
              </td>
            </tr>
            <tr>
              <td><strong>&gt;12 to ≤24 weeks</strong></td>
              <td>Restart one dose lower than last tolerated</td>
              <td>
                Wegovy 1mg<br>
                Mounjaro 5mg<br>
                Nevolat 1.2mg
              </td>
            </tr>
            <tr>
              <td><strong>&gt;24 weeks</strong></td>
              <td>Restart at lowest dose (if BMI ≥25)</td>
              <td>
                Wegovy 0.25mg<br>
                Mounjaro 2.5mg<br>
                Nevolat 0.6mg
              </td>
            </tr>
            <tr>
              <td><strong>&gt;12 months</strong></td>
              <td>Restart at lowest dose, must meet new patient criteria</td>
              <td>Starter doses only</td>
            </tr>
          </table>
        </div>
        <div class="protocol-section" style="margin-top: 16px;">
          <div class="protocol-section-title">If Dose Doesn't Meet Gap Criteria</div>
          <div class="protocol-text">
            Patient can either:
          </div>
          <ul class="protocol-list">
            <li>Provide PUE from alternative provider during the gap period, OR</li>
            <li>Consent for us to amend their order to appropriate dose</li>
          </ul>
          <div class="protocol-text">
            Use <a href="#macro-16" onclick="navigateToMacro(16); return false;" class="tag blue">Macro 16: PUE 2 Weeks Old</a> and add <span class="tag orange">Pending Customer Response</span> tag.
          </div>
        </div>
      </div>
      </div>

      <!-- Tab 4: Additional Pens -->
      <div class="protocol-tab-content" data-tab-content="additional">
      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          Requesting Additional Pens
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">Travel Allowance</div>
          <ul class="protocol-list">
            <li><strong>Dose escalation patients:</strong> Maximum 2 extra pens (8 doses total) if going on holiday</li>
            <li><strong>Maintenance dose patients:</strong> Maximum 3 extra pens (12 doses total) if going on holiday</li>
          </ul>
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">Bundles for BMI 21-25 Patients</div>
          <div class="protocol-text">
            Patients may order 2-3 pens of the same dose. Next order can be placed <strong>2 weeks before pens run out</strong> (e.g., 3-pen bundle = 12 weeks supply, can reorder at week 10).
          </div>
        </div>
        <div class="info-card red" style="margin-top: 12px;">
          <div class="info-card-title">Stock Issues</div>
          <div class="info-card-text">
            DO NOT give multiple doses to match an equivalent (e.g., 2×5mg instead of 10mg). Redirect patient to stay on same dose until their next dose comes back in stock.
          </div>
        </div>
      </div>
      </div>
    `;
  },

  getWeightProtocolCards() {
    return `
      <!-- Weight Monitoring Tabs -->
      <div class="protocol-tabs">
        <button class="protocol-tab active" data-tab="weight-gain">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
          Weight Gain >7%
        </button>
        <button class="protocol-tab" data-tab="weight-loss">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
          Weight Loss >10%
        </button>
      </div>

      <!-- Tab 1: Weight Gain -->
      <div class="protocol-tab-content active" data-tab-content="weight-gain">
      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </div>
          Weight Gain Over 7%
        </div>
        <div class="protocol-text">
          <strong>What to check:</strong> Verify that weight gain hasn't exceeded 7% on 2 consecutive orders (outside of 6 month review period).
        </div>
        <div class="protocol-text">
          The email macro <em>MedExpress Order (Action required) - >7% Weight Gain</em> will be automatically sent by the first prescriber who reviews the patient's repeat order.
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">System Tags Explained</div>
          <ul class="protocol-list">
            <li><span class="tag orange">Patient gained weight between orders</span> — <strong>First instance</strong> of &gt;7% weight gain. No action required from prescriber. Order falls into Simple Repeats queue.</li>
            <li><span class="tag red">Patient has two consecutive weight gains</span> — <strong>Second consecutive instance</strong>. Falls into Complex Repeats queue. Order placed on hold until patient responds. Use <a href="#macro-23" onclick="navigateToMacro(23); return false;" class="tag blue">Macro 23: Weight Increased</a> if needed.</li>
          </ul>
        </div>
      </div>

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          &gt;7% Weight Gain — Tailored Response Guide
        </div>
        <div class="protocol-text">
          <strong>How to use this table:</strong> Review patient's answers to the weight gain questionnaire. Use this table to determine appropriate action based on their responses.
        </div>
        <div class="table-wrapper">
          <table class="dose-table">
            <tr>
              <th style="width: 25%;">Question</th>
              <th style="width: 35%;">When to Approve</th>
              <th style="width: 40%;">Additional Actions / Guidance</th>
            </tr>
          <tr>
            <td><strong>Difficulties injecting?</strong></td>
            <td>Approve if <strong>minor pain</strong> at injection site</td>
            <td>Send <a href="#macro-29" onclick="navigateToMacro(29); return false;" class="tag blue">Macro 29: Injection Site Reaction</a> with guidance on proper injection technique (ice pack before injection, antihistamine cream)</td>
          </tr>
          <tr>
            <td></td>
            <td><strong>Reconsider</strong> if severe pain/swelling</td>
            <td>Refer to GLP1 Knowledge Base. If unsure → escalate via Jira</td>
          </tr>
          <tr>
            <td></td>
            <td><strong>Stop treatment</strong> if allergic reaction</td>
            <td>Advise patient to stop injecting and seek medical attention via 111</td>
          </tr>
          <tr>
            <td><strong>How often are you injecting?</strong></td>
            <td>Approve if <strong>occasionally forgetting</strong> doses</td>
            <td>Reinforce importance of maintaining schedule. Suggest setting reminders/alarms on phone</td>
          </tr>
          <tr>
            <td></td>
            <td><strong>Hold order</strong> if missed multiple doses or stopped due to side effects</td>
            <td>Consider: (i) lowering dose, or (ii) ceasing medication entirely. If unsure → escalate via Jira</td>
          </tr>
          <tr>
            <td><strong>How is your appetite?</strong></td>
            <td>Approve <strong>regardless of response</strong></td>
            <td>Offer advice on managing hunger: more fibre and protein. Reassure that appetite suppression improves as dose increases</td>
          </tr>
          <tr>
            <td><strong>Exercise routine?</strong></td>
            <td>Approve</td>
            <td>If lack of exercise → encourage physical activity, starting with walking or light home workouts</td>
          </tr>
          <tr>
            <td><strong>Side effects?</strong></td>
            <td>Approve if <strong>mild</strong> side effects (nausea, dizziness)</td>
            <td>Use <a href="#macro-28" onclick="navigateToMacro(28); return false;" class="tag blue">Macro 28: Side Effects Query</a> or <a href="#macro-29" onclick="navigateToMacro(29); return false;" class="tag blue">Macro 29: Injection Site</a></td>
          </tr>
          <tr>
            <td></td>
            <td><strong>Pause treatment</strong> if severe side effects</td>
            <td>Submit PSI via Jira → "Clinically significant Side Effects". Also submit Yellow Card report</td>
          </tr>
          <tr>
            <td><strong>Medical condition or medication changes?</strong></td>
            <td>Approve if new medication has <strong>no known GLP-1 interactions</strong></td>
            <td>Use GLP1 Knowledge Base to check. If condition shows "Reject now" → reject immediately</td>
          </tr>
          <tr>
            <td></td>
            <td><strong>Escalate</strong> if condition not in Knowledge Base</td>
            <td>Escalate via Jira if unsure after consulting SOP and Knowledge Base</td>
          </tr>
          <tr>
            <td><strong>Anything else contributing to weight gain?</strong></td>
            <td>Approve</td>
            <td>If stress/holidays/routine changes → provide reassurance. If mental health concerns → consult GLP1 Knowledge Base</td>
          </tr>
        </table>
        <div class="info-card red" style="margin-top: 16px;">
          <div class="info-card-title">⚠️ Escalate Immediately When</div>
          <div class="info-card-text">
            Severe pain/swelling at injection site | New medication or diagnosis | Deviating from injection schedule (multiple doses at once, micro-dosing, injecting more/less than once weekly)
          </div>
        </div>
      </div>
      </div>

      <!-- Tab 2: Weight Loss -->
      <div class="protocol-tab-content" data-tab-content="weight-loss">
      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </div>
          Weight Loss Exceeding Threshold
        </div>
        <div class="protocol-text">
          <strong>What to check:</strong> Verify that weight loss since last order doesn't exceed the threshold (outside of 6 month review period).
        </div>
        <div class="protocol-text">
          Email macro <em>MedExpress Order (Action required) - >10% Weight Loss</em> will be sent by the first prescriber who reviews the order.
        </div>
        <div class="protocol-text">
          <strong>How to use this table:</strong> Check order type against maximum allowed weight loss. System automatically adds tag when threshold exceeded.
        </div>
        <div class="table-wrapper">
          <table class="dose-table">
            <tr>
              <th>Order Type</th>
              <th>Maximum Weight Loss Allowed</th>
            </tr>
            <tr>
              <td>Single pen order</td>
              <td><strong>10%</strong></td>
            </tr>
            <tr>
              <td>2 pen bundle</td>
              <td><strong>15%</strong></td>
            </tr>
            <tr>
              <td>3 pen bundle</td>
              <td><strong>20%</strong></td>
            </tr>
          </table>
        </div>
        <div class="protocol-text">
          System adds <span class="tag red">Weight loss between orders exceeds threshold</span> tag. Order is placed on hold until patient responds. Use <a href="#macro-24" onclick="navigateToMacro(24); return false;" class="tag blue">Macro 24: Rapid Weight Loss</a> to contact patient.
        </div>
      </div>

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          &gt;10% Weight Loss — Tailored Response Guide
        </div>
        <div class="protocol-text">
          <strong>How to use this table:</strong> Review patient's answers to the weight loss questionnaire and follow guidance below for each response.
        </div>
        <div class="table-wrapper">
          <table class="dose-table">
            <tr>
              <th style="width: 30%;">Question</th>
              <th style="width: 35%;">When to Approve</th>
              <th style="width: 35%;">Additional Actions / Guidance</th>
            </tr>
          <tr>
            <td><strong>Side effects? (nausea, vomiting, diarrhoea)</strong></td>
            <td>Approve if <strong>mild</strong> side effects</td>
            <td>Mild SEs are common with GLP-1s. Use <a href="#macro-28" onclick="navigateToMacro(28); return false;" class="tag blue">Macro 28: Side Effects Query</a></td>
          </tr>
          <tr>
            <td></td>
            <td><strong>Raise PSI</strong> if severe side effects</td>
            <td>Submit PSI via Jira → "Clinically significant Side Effects". Submit Yellow Card report</td>
          </tr>
          <tr>
            <td><strong>Medical condition or medication changes?</strong></td>
            <td>Approve if new medication has <strong>no known GLP-1 interactions</strong></td>
            <td>Use GLP1 Knowledge Base. If "Reject now" advice shown → reject immediately</td>
          </tr>
          <tr>
            <td></td>
            <td><strong>Escalate</strong> if condition not covered in Knowledge Base</td>
            <td>Escalate via Jira if unsure after checking SOP and Knowledge Base</td>
          </tr>
          <tr>
            <td><strong>Injection frequency & consistency?</strong></td>
            <td>Approve if <strong>occasionally forgetting</strong> doses</td>
            <td>Reinforce importance of consistent schedule. Suggest setting reminders/alarms</td>
          </tr>
          <tr>
            <td></td>
            <td><strong>Hold order</strong> if used multiple doses at same time</td>
            <td>Email with relevant macro. Escalate via Jira. Senior Prescriber decides if PSI required</td>
          </tr>
          <tr>
            <td><strong>Eating recommended daily protein?</strong></td>
            <td>Approve if eating recommended protein but experiencing rapid weight loss</td>
            <td>Reinforce protein importance. General guidance: 0.75-1g protein per kg body weight daily</td>
          </tr>
          <tr>
            <td></td>
            <td>Approve but <strong>contact patient</strong> if NOT meeting protein intake</td>
            <td>Advise on dietary adjustments to prevent muscle mass loss. Calculate their specific requirement</td>
          </tr>
          <tr>
            <td><strong>Signs of dehydration?</strong> (excessive thirst, dry mouth, dark urine, dizziness, fatigue)</td>
            <td><strong>Hold order</strong> and contact patient for more information</td>
            <td>Use side effects macros. Submit PSI via Jira → "Clinically significant Side Effects". Submit Yellow Card</td>
          </tr>
        </table>
        <div class="info-card red" style="margin-top: 16px;">
          <div class="info-card-title">⚠️ Stop Treatment When</div>
          <div class="info-card-text">
            Diarrhoea or vomiting while taking oral antibiotics (pause treatment) | Hospitalised due to side effects (stop treatment permanently)
          </div>
        </div>
      </div>
      </div>
    `;
  },

  getSwitchingProtocolCards() {
    return `
      <!-- Switching & Side Effects Tabs -->
      <div class="protocol-tabs">
        <button class="protocol-tab active" data-tab="switching">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/>
          </svg>
          Switching Medications
        </button>
        <button class="protocol-tab" data-tab="contraception">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v2M12 15h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Contraception Guidance
        </button>
        <button class="protocol-tab" data-tab="orlistat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          Orlistat Switching
        </button>
        <button class="protocol-tab" data-tab="side-effects">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Side Effects
        </button>
      </div>

      <!-- Tab 1: Switching Medications -->
      <div class="protocol-tab-content active" data-tab-content="switching">

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/>
            </svg>
          </div>
          Switching Between GLP-1 Medications
        </div>
        <div class="protocol-text">
          Patient does <strong>NOT need to provide a reason</strong> for switching medications. The process depends on whether they're experiencing side effects:
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">No Side Effects = Low Risk</div>
          <div class="protocol-text">
            <strong>Action:</strong> Proceed with prescribing dose equivalent to their last dose as per titration guide.
          </div>
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">Moderate Side Effects = Low Risk</div>
          <div class="protocol-text">
            <strong>Action:</strong> Can only prescribe dose <strong>equivalent to one step below</strong> their last treatment dose.
          </div>
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">Severe Side Effects = High Risk</div>
          <div class="protocol-text">
            <strong>Action:</strong> Nurse team must contact patient first before prescribing.
          </div>
          <div class="protocol-text">
            <strong>Only prescribe if:</strong>
          </div>
          <ul class="protocol-list">
            <li>Internal note (NOT critical note) has been left by nurse team, AND</li>
            <li><span class="tag green">Clinical Review</span> tag has been added</li>
          </ul>
          <div class="protocol-text">
            If nurse determines side effects are severe → stop treatment, leave critical note, add Clinical Review tag. In this case, prescriber should reject the order.
          </div>
        </div>
        <div class="divider"></div>
        <div class="protocol-section">
          <div class="protocol-section-title">Switching Workflows by Medication Type</div>
          <div class="table-wrapper">
            <table class="dose-table">
              <tr>
                <th>Switch Type</th>
                <th>Side Effects Question?</th>
              </tr>
              <tr>
                <td><strong>Mounjaro → Wegovy</strong></td>
                <td>✅ Built-in question in consultation</td>
              </tr>
              <tr>
                <td><strong>Any other switch</strong></td>
                <td>❌ Manually check using macro in Switching SOP</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      </div>
      <!-- End Tab 1 -->

      <!-- Tab 2: Contraception Guidance -->
      <div class="protocol-tab-content" data-tab-content="contraception">

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2M12 15h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          Contraception Guidance When Switching
        </div>
        <div class="protocol-text">
          <strong>Important:</strong> If patient is switching between GLP-1 medications, inform them of contraception requirements.
        </div>
        <div class="protocol-text">
          <strong>How to use this table:</strong> Check which medication patient is switching TO, then advise on contraception requirements.
        </div>
        <div class="table-wrapper">
          <table class="dose-table">
            <tr>
              <th>Medication</th>
              <th>Contraception Advice for Oral Contraceptive Users</th>
            </tr>
            <tr>
              <td><strong>Wegovy</strong> (Semaglutide)</td>
              <td>No additional barrier contraception needed with oral contraceptives</td>
            </tr>
            <tr>
              <td><strong>Mounjaro</strong> (Tirzepatide)</td>
              <td>
                <strong>Must use barrier method</strong> (e.g., condoms) alongside oral contraceptives for:<br>
                • <strong>4 weeks after starting</strong> Mounjaro, AND<br>
                • <strong>4 weeks after each dose increase</strong><br>
                <br>
                Reason: Mounjaro impacts oral contraceptive bioavailability. Alternatively, switch to IUD or implant.
              </td>
            </tr>
          </table>
        </div>
      </div>

      </div>
      <!-- End Tab 2 -->

      <!-- Tab 3: Orlistat Switching -->
      <div class="protocol-tab-content" data-tab-content="orlistat">

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          Orlistat to GLP-1 Switching
        </div>
        <div class="protocol-text">
          Patients may request to switch from Orlistat to GLP-1 medication.
        </div>
        <div class="protocol-text">
          <strong>Action:</strong> Check patient's order history under "Patient Record" section to verify if they were previously prescribed Orlistat.
        </div>
        <div class="protocol-text">
          If confirmed, proceed with GLP-1 prescription following standard protocols.
        </div>
      </div>

      </div>
      <!-- End Tab 3 -->

      <!-- Tab 4: Side Effects -->
      <div class="protocol-tab-content" data-tab-content="side-effects">

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          Side Effects Management
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">Mild Side Effects</div>
          <div class="protocol-text">
            <strong>Action:</strong> Use side effects macros available on prescribing interface and ZenDesk.
          </div>
          <div class="protocol-text">
            Common mild side effects include: nausea, vomiting, diarrhoea, constipation, injection site reactions.
          </div>
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">Severe Side Effects — Required Actions</div>
          <ul class="protocol-list">
            <li><strong>Step 1:</strong> Use severe side effects macros available on prescribing interface</li>
            <li><strong>Step 2:</strong> Submit <strong>Patient Safety Incident (PSI)</strong> via Jira → "Clinically significant Side Effects" → answer "Did these side effects require medical attention?"</li>
            <li><strong>Step 3:</strong> Duty GP will review PSI within 8 working hours</li>
            <li><strong>Step 4:</strong> Submit <strong>Yellow Card report</strong> to MHRA</li>
          </ul>
        </div>
        <div class="info-card red" style="margin-top: 12px;">
          <div class="info-card-title">⚠️ All Severe Side Effects Must Be Escalated</div>
          <div class="info-card-text">
            <strong>Every severe side effect</strong> must be raised as a PSI for the Medical Team to review. Do not skip this step.
          </div>
        </div>
      </div>

      </div>
      <!-- End Tab 4 -->
    `;
  },

  getReviewsProtocolCards() {
    return `
      <!-- 6 Month Reviews Tabs -->
      <div class="protocol-tabs">
        <button class="protocol-tab active" data-tab="requirements">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          Review Requirements
        </button>
        <button class="protocol-tab" data-tab="weight-loss">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
          </svg>
          Weight Loss Criteria
        </button>
        <button class="protocol-tab" data-tab="linked-accounts">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
          </svg>
          Linked Accounts
        </button>
      </div>

      <!-- Tab 1: Review Requirements -->
      <div class="protocol-tab-content active" data-tab-content="requirements">

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          When 6 Month Reviews Are Required
        </div>
        <div class="protocol-text">
          <strong>Who needs reviews:</strong> Patients at <strong>6, 12, or 18 months</strong> of treatment who have <strong>NOT achieved at least 5% weight loss</strong>.
        </div>
        <div class="protocol-text">
          Orders requiring review are tagged with <span class="tag green">Completed six month review</span>.
        </div>
        <div class="info-card blue" style="margin-top: 12px;">
          <div class="info-card-title">Prescriber Experience Requirement</div>
          <div class="info-card-text">
            Prescribers won't be expected to prescribe 6 month review orders unless they have been prescribing GLP-1 medications for MedExpress for <strong>more than 2 months</strong>.
          </div>
        </div>
      </div>

      </div>
      <!-- End Tab 1 -->

      <!-- Tab 2: Weight Loss Criteria -->
      <div class="protocol-tab-content" data-tab-content="weight-loss">

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
            </svg>
          </div>
          Patients with &lt;5% Weight Loss
        </div>
        <div class="protocol-text">
          <strong>Requirement:</strong> Must complete 6-month review questionnaire between their 6th and 10th month of treatment.
        </div>
        <div class="protocol-text">
          Patient has a <strong>3-month window</strong> to complete the review (months 6-9).
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">Timeline & Actions</div>
          <div class="table-wrapper">
            <table class="dose-table">
              <tr>
                <th>Treatment Period</th>
                <th>Prescriber Action</th>
              </tr>
              <tr>
                <td><strong>Months 6-9</strong></td>
                <td>May still prescribe even if review incomplete</td>
              </tr>
              <tr>
                <td><strong>Month 9 onwards</strong></td>
                <td>If review still not completed → <strong>place order on hold</strong> until questionnaire completed</td>
              </tr>
              <tr>
                <td><strong>Subsequent reviews</strong> (12, 18 months)</td>
                <td>Optional if patient can continue treatment</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          Patients with ≥5% Weight Loss
        </div>
        <div class="protocol-text">
          <strong>Good news:</strong> Patients who have achieved 5% or more weight loss are <strong>NOT required</strong> to complete the 6-month review questionnaire.
        </div>
        <div class="protocol-text">
          The questionnaire remains <strong>optional</strong> if they wish to complete it at 6-monthly intervals for their own tracking.
        </div>
      </div>

      </div>
      <!-- End Tab 2 -->

      <!-- Tab 3: Linked Accounts -->
      <div class="protocol-tab-content" data-tab-content="linked-accounts">

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
          </div>
          Linked Accounts (MedExpress & Levity)
        </div>
        <div class="protocol-text">
          Patient may have accounts with both <strong>MedExpress</strong> and <strong>Levity</strong> (historical brand that stopped operations on 1st September 2025).
        </div>
        <div class="protocol-text">
          The system automatically checks for linked accounts across both brands.
        </div>
        <div class="protocol-section">
          <div class="protocol-section-title">If Linked Accounts Are Found</div>
          <ul class="protocol-list">
            <li>Tag order with <span class="tag purple">Linked accounts</span></li>
            <li>Add order URL to Linked Accounts Spreadsheet</li>
            <li>Details visible under "Patient Record" section</li>
          </ul>
        </div>
        <div class="info-card green" style="margin-top: 12px;">
          <div class="info-card-title">Dermatica Accounts — No Action Needed</div>
          <div class="info-card-text">
            If patient also has Dermatica account (skincare), <strong>no action required</strong>. There are no known interactions between GLP-1 medications and skincare products. You can approve without checking Dermatica interface.
          </div>
        </div>
      </div>

      </div>
      <!-- End Tab 3 -->
    `;
  },

  getDefinitionsContent() {
    return `
      <div class="protocol-page">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">Definitions</h1>

        <!-- Definitions Tabs -->
        <div class="protocol-tabs">
          <button class="protocol-tab active" data-tab="patient-types">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
            </svg>
            Patient Types
          </button>
          <button class="protocol-tab" data-tab="terminology">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6"/>
            </svg>
            Terminology
          </button>
        </div>

        <!-- Tab 1: Patient Types -->
        <div class="protocol-tab-content active" data-tab-content="patient-types">
        <div class="definitions-grid" style="display: flex; flex-direction: column; gap: 16px;">

          <div class="definition-card">
            <div class="definition-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div class="definition-icon new" style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #34D399 0%, #10B981 100%); display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="width: 20px; height: 20px;">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
              <div class="definition-title" style="font-size: 18px; font-weight: 700;">New GLP-1 Patient</div>
            </div>
            <div class="definition-text" style="color: var(--text-secondary); line-height: 1.6;">
              Has <strong>NOT had GLP-1 medications</strong> prescribed and dispatched from MedExpress before. Only sees <strong>starter doses</strong> on the Choose Treatment Page (CTP).
            </div>
          </div>

          <div class="definition-card">
            <div class="definition-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div class="definition-icon repeat" style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%); display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="width: 20px; height: 20px;">
                  <path d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/>
                </svg>
              </div>
              <div class="definition-title" style="font-size: 18px; font-weight: 700;">Repeat GLP-1 Patient</div>
            </div>
            <div class="definition-text" style="color: var(--text-secondary); line-height: 1.6;">
              <strong>HAS had GLP-1 prescribed and dispatched from MedExpress</strong> before. Sees <strong>all available doses</strong> on the Choose Treatment Page (CTP).
            </div>
          </div>

          <div class="definition-card">
            <div class="definition-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div class="definition-icon transfer" style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%); display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="width: 20px; height: 20px;">
                  <path d="M16 3h5v5M4 20L21 3M21 16v5h-5"/>
                </svg>
              </div>
              <div class="definition-title" style="font-size: 18px; font-weight: 700;">Transfer Patient</div>
            </div>
            <div class="definition-text" style="color: var(--text-secondary); line-height: 1.6;">
              <strong>New to MedExpress</strong> but has previously used GLP-1 medication from another provider. Must provide <strong>proof of supply</strong>. If BMI below licence, must also provide <strong>previous BMI photo</strong>. <span class="tag red">NHS patients cannot transfer to private.</span>
            </div>
          </div>

          <div class="definition-card">
            <div class="definition-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div class="definition-icon pue" style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #F472B6 0%, #EC4899 100%); display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="width: 20px; height: 20px;">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path d="M14 2v6h6"/>
                </svg>
              </div>
              <div class="definition-title" style="font-size: 18px; font-weight: 700;">Previous Use Evidence <span class="definition-acronym" style="font-size: 11px; font-weight: 600; color: var(--text-muted); background: var(--bg-elevated); padding: 2px 6px; border-radius: 4px; margin-left: 8px;">PUE</span></div>
            </div>
            <div class="definition-text" style="color: var(--text-secondary); line-height: 1.6;">
              Patients <strong>previously treated by MedExpress</strong> who also received GLP-1 from another provider during gaps in treatment. Distinct from Transfer Patients.
            </div>
          </div>

        </div>
        </div>
        <!-- End Tab 1 -->

        <!-- Tab 2: Terminology -->
        <div class="protocol-tab-content" data-tab-content="terminology">
        <div class="definitions-grid" style="display: flex; flex-direction: column; gap: 16px;">

          <div class="definition-card">
            <div class="definition-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div class="definition-icon ctp" style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%); display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="width: 20px; height: 20px;">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
              </div>
              <div class="definition-title" style="font-size: 18px; font-weight: 700;">Choose Treatment Page <span class="definition-acronym" style="font-size: 11px; font-weight: 600; color: var(--text-muted); background: var(--bg-elevated); padding: 2px 6px; border-radius: 4px; margin-left: 8px;">CTP</span></div>
            </div>
            <div class="definition-text" style="color: var(--text-secondary); line-height: 1.6;">
              Webpage displayed after consultation where patient selects their medication and dose. <strong>New patients</strong> only see starter doses. Patients with liver or thyroid disease will <strong>NOT see Nevolat</strong> as an option (only Mounjaro and Wegovy available).
            </div>
          </div>

          <div class="definition-card">
            <div class="definition-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div class="definition-icon switch" style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #FB923C 0%, #F97316 100%); display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="width: 20px; height: 20px;">
                  <path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/>
                </svg>
              </div>
              <div class="definition-title" style="font-size: 18px; font-weight: 700;">Switching Patient</div>
            </div>
            <div class="definition-text" style="color: var(--text-secondary); line-height: 1.6;">
              Patient was previously on one GLP-1 medication and has now ordered a <strong>different medication</strong> (e.g., Mounjaro → Wegovy, or Wegovy → Nevolat).
            </div>
          </div>

        </div>
        </div>
        <!-- End Tab 2 -->
      </div>
    `;
  },

  getContraindicationsContent() {
    return `
      <div class="protocol-page">
        <div class="page-header-with-search">
          <h1 style="font-size: 24px; font-weight: 700; margin: 0;">Contraindications</h1>
          <div class="local-search-container">
            <svg class="local-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              id="contraindicationsSearch"
              class="local-search-input"
              placeholder="Search within contraindications..."
            />
            <div id="localOccurrenceControls" class="occurrence-controls" style="display: none;">
              <span id="localOccurrenceCount" class="occurrence-count">0/0</span>
              <button id="localPrevOccurrence" class="occurrence-nav" title="Previous">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <button id="localNextOccurrence" class="occurrence-nav" title="Next">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
            <button id="localSearchClear" class="search-clear" style="display: none;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="info-card red" style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0;">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <path d="M12 9v4M12 17h.01"/>
            </svg>
            <div>
              <strong>SCR Screening SOP v3.2</strong> — If patient has absolute contraindication, reject immediately. If condition requires more information, email patient using appropriate macro and hold. If uncertain, escalate via Jira.
            </div>
          </div>
        </div>

        <!-- Contraindications Tabs -->
        <div class="protocol-tabs">
          <button class="protocol-tab active" data-tab="absolute">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            Absolute Contraindications
          </button>
          <button class="protocol-tab" data-tab="time-sensitive">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            Time-Sensitive Conditions
          </button>
          <button class="protocol-tab" data-tab="clinical-details">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
            Clinical Details Required
          </button>
          <button class="protocol-tab" data-tab="patient-assessment">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <path d="M20 8v6M23 11h-6"/>
            </svg>
            Patient Assessment Required
          </button>
        </div>

        <!-- Tab 1: Absolute Contraindications -->
        <div class="protocol-tab-content active" data-tab-content="absolute">

        <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 20px;">Absolute Contraindications</h2>

        <div class="info-card red" style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0;">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <path d="M12 9v4M12 17h.01"/>
            </svg>
            <div>
              <strong>REJECT immediately</strong> if patient has ANY of the following absolute contraindications. No further information is required.
            </div>
          </div>
        </div>

        <!-- Nested Condition Tabs -->
        <div class="scr-tabbed-conditions">
          <div class="scr-tabs">
            <button class="scr-tab active" data-condition="pancreatitis">🔴 Pancreatitis</button>
            <button class="scr-tab" data-condition="eating-disorders">🍽️ Eating Disorders</button>
            <button class="scr-tab" data-condition="diabetes-t1">💉 Type 1 Diabetes</button>
            <button class="scr-tab" data-condition="liver">🫀 Liver Conditions</button>
            <button class="scr-tab" data-condition="endocrine">⚕️ Endocrine Disorders</button>
            <button class="scr-tab" data-condition="gi">🩺 GI Conditions</button>
            <button class="scr-tab" data-condition="thyroid-cancer">🎗️ Thyroid & Cancer</button>
            <button class="scr-tab" data-condition="medications">💊 Medications</button>
            <button class="scr-tab" data-condition="kidney">🫘 Kidney Disease</button>
            <button class="scr-tab" data-condition="cardiac">❤️ Cardiac Conditions</button>
          </div>

          <!-- Pancreatitis Tab -->
          <div class="scr-tab-content active" data-condition-content="pancreatitis">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--danger);">🔴 Pancreatitis</h3>
            <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
            <div class="scr-condition-row"><strong>Includes:</strong> Pancreatitis, acute pancreatic insufficiency, chronic pancreatic insufficiency</div>
            <div class="scr-condition-row"><strong>Rationale:</strong> GLP-1s have black box warning for increased risk of pancreatitis.</div>
          </div>

          <!-- Eating Disorders Tab -->
          <div class="scr-tab-content" data-condition-content="eating-disorders">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--danger);">🍽️ Eating Disorders</h3>
            <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
            <div class="scr-condition-row"><strong>Conditions:</strong>
              <ul class="protocol-list">
                <li>Anorexia nervosa</li>
                <li>Bulimia nervosa</li>
                <li>Binge Eating Disorder (BED)</li>
                <li>Avoidant/Restrictive Food Intake Disorder (ARFID)</li>
              </ul>
            </div>
            <div class="scr-condition-row"><strong>Rationale:</strong> GLP-1s suppress appetite and can worsen eating disorder pathology.</div>
          </div>

          <!-- Type 1 Diabetes Tab -->
          <div class="scr-tab-content" data-condition-content="diabetes-t1">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--danger);">💉 Type 1 Diabetes</h3>
            <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
            <div class="scr-condition-row"><strong>Also known as:</strong> Insulin-dependent diabetes mellitus (IDDM)</div>
            <div class="scr-condition-row"><strong>Rationale:</strong> GLP-1s are not licensed for Type 1 diabetes treatment. Risk of diabetic ketoacidosis.</div>
          </div>

          <!-- Liver Conditions Tab -->
          <div class="scr-tab-content" data-condition-content="liver">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--danger);">🫀 Liver Conditions</h3>
            <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
            <div class="scr-condition-row"><strong>Conditions:</strong>
              <ul class="protocol-list">
                <li><strong>Liver cirrhosis</strong></li>
                <li><strong>Liver transplant</strong></li>
                <li><strong>Severe hepatic impairment</strong></li>
              </ul>
            </div>
            <div class="scr-condition-row"><strong>Rationale:</strong> Severe liver impairment affects drug metabolism and safety.</div>
          </div>

          <!-- Endocrine Disorders Tab -->
          <div class="scr-tab-content" data-condition-content="endocrine">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--danger);">⚕️ Endocrine Disorders</h3>
            <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
            <div class="scr-condition-row"><strong>Conditions:</strong>
              <ul class="protocol-list">
                <li><strong>Acromegaly</strong> (Growth hormone disorder)</li>
                <li><strong>Cushing's syndrome</strong></li>
                <li><strong>Addison's disease</strong> (Adrenal insufficiency)</li>
                <li><strong>Congenital Adrenal Hyperplasia</strong></li>
                <li><strong>Overactive thyroid</strong> awaiting radioactive iodine or surgery</li>
              </ul>
            </div>
            <div class="scr-condition-row"><strong>Rationale:</strong> These hormonal disorders can cause secondary obesity requiring specialist management.</div>
          </div>

          <!-- GI Conditions Tab -->
          <div class="scr-tab-content" data-condition-content="gi">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--danger);">🩺 GI Conditions</h3>
            <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
            <div class="scr-condition-row"><strong>Conditions:</strong>
              <ul class="protocol-list">
                <li><strong>Ulcerative Colitis</strong></li>
                <li><strong>Crohn's disease</strong></li>
                <li><strong>Gastroparesis</strong> (delayed gastric emptying)</li>
                <li><strong>Chronic malabsorption syndrome</strong></li>
              </ul>
            </div>
            <div class="scr-condition-row"><strong>Rationale:</strong> GLP-1s delay gastric emptying which can worsen these conditions.</div>
          </div>

          <!-- Thyroid & Cancer Tab -->
          <div class="scr-tab-content" data-condition-content="thyroid-cancer">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--danger);">🎗️ Thyroid & Cancer</h3>
            <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
            <div class="scr-condition-row"><strong>Conditions:</strong>
              <ul class="protocol-list">
                <li><strong>Multiple Endocrine Neoplasia type 2 (MEN2)</strong></li>
                <li><strong>Medullary Thyroid cancer</strong> (personal or family history)</li>
                <li><strong>Thyroid disease</strong> — for <strong>Nevolat prescriptions ONLY</strong></li>
                <li><strong>Any form of cancer</strong> currently being treated by specialist</li>
              </ul>
            </div>
            <div class="scr-condition-row"><strong>Rationale:</strong> GLP-1s have black box warning against use with medullary thyroid cancer or MEN2.</div>
          </div>

          <!-- Medications Tab -->
          <div class="scr-tab-content" data-condition-content="medications">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--danger);">💊 Contraindicated Medications</h3>
            <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT</span> if on <strong>repeat medication list</strong></div>

            <div style="margin-top: 16px;">
              <div class="protocol-section-title" style="color: var(--danger);">Insulin:</div>
              <ul class="protocol-list">
                <li>Any insulin on repeat medication list</li>
              </ul>
            </div>

            <div style="margin-top: 16px;">
              <div class="protocol-section-title" style="color: var(--danger);">Oral Diabetic Medications:</div>
              <div class="scr-two-col">
                <div>
                  <strong style="color: var(--warning);">Sulfonylureas:</strong>
                  <ul class="protocol-list">
                    <li>Diamicron [gliclazide]</li>
                    <li>Daonil [glibenclamide]</li>
                    <li>Rastin [tolbutamide]</li>
                  </ul>
                  <strong style="color: var(--warning);">SGLT2 inhibitors:</strong>
                  <ul class="protocol-list">
                    <li>Jardiance [empagliflozin]</li>
                    <li>Forxiga [dapagliflozin]</li>
                    <li>Invokana [canagliflozin]</li>
                  </ul>
                </div>
                <div>
                  <strong style="color: var(--warning);">DPP-4 inhibitors:</strong>
                  <ul class="protocol-list">
                    <li>Januvia [sitagliptin]</li>
                    <li>Galvus [vildagliptin]</li>
                    <li>Trajenta [linagliptin]</li>
                  </ul>
                  <strong style="color: var(--warning);">Thiazolidinediones:</strong>
                  <ul class="protocol-list">
                    <li>Actos [pioglitazone]</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style="margin-top: 16px;">
              <div class="protocol-section-title" style="color: var(--danger);">Narrow Therapeutic Index Medications:</div>
              <div class="scr-two-col">
                <div>
                  <ul class="protocol-list">
                    <li>Amiodarone</li>
                    <li>Carbamazepine</li>
                    <li>Ciclosporin</li>
                    <li>Clozapine</li>
                    <li>Digoxin</li>
                    <li>Fenfluramine</li>
                    <li>Lithium</li>
                    <li>Mycophenolate mofetil</li>
                  </ul>
                </div>
                <div>
                  <ul class="protocol-list">
                    <li>Oral methotrexate</li>
                    <li>Phenobarbital</li>
                    <li>Phenytoin</li>
                    <li>Somatrogon</li>
                    <li>Tacrolimus</li>
                    <li>Theophylline</li>
                    <li>Warfarin</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Kidney Disease Tab -->
          <div class="scr-tab-content" data-condition-content="kidney">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--danger);">🫘 Kidney Disease</h3>
            <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
            <div class="scr-condition-row"><strong>Condition:</strong> Chronic kidney disease with eGFR less than 30ml/min (severe/Stage 4-5)</div>
            <div class="scr-condition-row"><strong>Rationale:</strong> Severe renal impairment affects drug clearance and increases risk of adverse effects.</div>
            <div class="scr-condition-row"><strong>If needed:</strong> Request eGFR result using <a href="#macro-5" onclick="navigateToMacro(5); return false;" class="tag blue">Macro 5</a></div>
          </div>

          <!-- Cardiac Conditions Tab -->
          <div class="scr-tab-content" data-condition-content="cardiac">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--danger);">❤️ Cardiac Conditions</h3>
            <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span></div>
            <div class="scr-condition-row"><strong>Conditions:</strong>
              <ul class="protocol-list">
                <li><strong>Heart failure</strong> with shortness of breath at rest (Stage IV)</li>
                <li><strong>Active retinopathy</strong></li>
              </ul>
            </div>
            <div class="scr-condition-row"><strong>Rationale:</strong> Severe heart failure increases risk of adverse cardiovascular events.</div>
            <div class="scr-condition-row"><strong>If needed:</strong> Request cardiology letter using <a href="#macro-4" onclick="navigateToMacro(4); return false;" class="tag blue">Macro 4</a></div>
          </div>

        </div>
        <!-- End scr-tabbed-conditions -->

        </div>
        <!-- End Tab 1 -->

        <!-- Tab 2: Time-Sensitive Conditions -->
        <div class="protocol-tab-content" data-tab-content="time-sensitive">

        <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 20px;">Time-Sensitive Conditions</h2>

        <div class="info-card orange" style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0;">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            <div>
              <strong>Timing Matters:</strong> If timing information is missing, email patient using <a href="#macro-1" onclick="navigateToMacro(1); return false;" class="tag blue">Macro 1</a>. Reject when timing falls within contraindication window.
            </div>
          </div>
        </div>

        <!-- Nested Condition Tabs -->
        <div class="scr-tabbed-conditions">
          <div class="scr-tabs">
            <button class="scr-tab active" data-condition="bariatric">🔪 Bariatric Surgery</button>
            <button class="scr-tab" data-condition="gallbladder">🫀 Gallbladder Removal</button>
            <button class="scr-tab" data-condition="diabetic-meds">💊 Diabetic Medications</button>
            <button class="scr-tab" data-condition="nti-meds">⚠️ NTI Medications</button>
            <button class="scr-tab" data-condition="orlistat">💊 Orlistat</button>
          </div>

          <!-- Bariatric Surgery Tab -->
          <div class="scr-tab-content active" data-condition-content="bariatric">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--warning);">🔪 Bariatric Surgery</h3>
            <div class="scr-condition-row"><strong>Time Restriction:</strong> <span class="decision-reject">REJECT</span> if &lt;12 months post-surgery</div>
            <div class="scr-condition-row"><strong>Safe to Prescribe:</strong> If surgery was ≥12 months ago (1 year or more)</div>
            <div class="scr-condition-row"><strong>Surgery Types:</strong>
              <ul class="protocol-list">
                <li>Roux-en-Y Gastric Bypass (RYGB)</li>
                <li>Sleeve Gastrectomy</li>
                <li>Adjustable Gastric Band (Lap-Band)</li>
                <li>Biliopancreatic Diversion with Duodenal Switch (BPD/DS)</li>
                <li>Mini Gastric Bypass (OAGB)</li>
                <li>Endoscopic Bariatric Procedures (gastric balloon)</li>
              </ul>
            </div>
            <div class="scr-condition-row"><strong>If timing unknown:</strong> Email using <a href="#macro-1" onclick="navigateToMacro(1); return false;" class="tag blue">Macro 1</a></div>
          </div>

          <!-- Gallbladder Removal Tab -->
          <div class="scr-tab-content" data-condition-content="gallbladder">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--warning);">🫀 Cholecystectomy (Gallbladder Removal)</h3>
            <div class="scr-condition-row"><strong>Time Restriction:</strong> <span class="decision-reject">REJECT</span> if &lt;12 months post-surgery</div>
            <div class="scr-condition-row"><strong>Safe to Prescribe:</strong> If surgery was ≥12 months ago (1 year or more)</div>
            <div class="scr-condition-row"><strong>Rationale:</strong> Increased risk of gallstones with GLP-1s. 12-month recovery period needed.</div>
            <div class="scr-condition-row"><strong>If timing unknown:</strong> Email using <a href="#macro-1" onclick="navigateToMacro(1); return false;" class="tag blue">Macro 1</a></div>
          </div>

          <!-- Diabetic Medications Tab -->
          <div class="scr-tab-content" data-condition-content="diabetic-meds">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--danger);">💊 Insulin or Oral Diabetic Medications</h3>
            <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT</span> if EITHER condition applies:</div>
            <div class="scr-condition-row">
              <ul class="protocol-list">
                <li>Prescribed within last <strong>3 months as acute</strong></li>
                <li><strong>OR</strong> present on <strong>repeat medication list</strong></li>
              </ul>
            </div>

            <div style="margin-top: 16px;">
              <div class="protocol-section-title" style="color: var(--danger);">Oral Diabetic Medications:</div>
              <div class="scr-two-col">
                <div>
                  <strong style="color: var(--warning);">Sulfonylureas:</strong>
                  <ul class="protocol-list">
                    <li>Diamicron [gliclazide]</li>
                    <li>Daonil [glibenclamide]</li>
                    <li>Rastin [tolbutamide]</li>
                  </ul>
                  <strong style="color: var(--warning);">SGLT2 inhibitors:</strong>
                  <ul class="protocol-list">
                    <li>Jardiance [empagliflozin]</li>
                    <li>Forxiga [dapagliflozin]</li>
                    <li>Invokana [canagliflozin]</li>
                  </ul>
                </div>
                <div>
                  <strong style="color: var(--warning);">DPP-4 inhibitors:</strong>
                  <ul class="protocol-list">
                    <li>Januvia [sitagliptin]</li>
                    <li>Galvus [vildagliptin]</li>
                    <li>Trajenta [linagliptin]</li>
                  </ul>
                  <strong style="color: var(--warning);">Thiazolidinediones:</strong>
                  <ul class="protocol-list">
                    <li>Actos [pioglitazone]</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- NTI Medications Tab -->
          <div class="scr-tab-content" data-condition-content="nti-meds">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--danger);">⚠️ Narrow Therapeutic Index Medications</h3>
            <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT</span> if EITHER condition applies:</div>
            <div class="scr-condition-row">
              <ul class="protocol-list">
                <li>Prescribed within last <strong>3 months as acute</strong></li>
                <li><strong>OR</strong> present on <strong>repeat medication list</strong></li>
              </ul>
            </div>

            <div style="margin-top: 16px;">
              <div class="protocol-section-title" style="color: var(--danger);">NTI Medications List:</div>
              <div class="scr-two-col">
                <div>
                  <ul class="protocol-list">
                    <li>Amiodarone</li>
                    <li>Carbamazepine</li>
                    <li>Ciclosporin</li>
                    <li>Clozapine</li>
                    <li>Digoxin</li>
                    <li>Fenfluramine</li>
                    <li>Lithium</li>
                    <li>Mycophenolate mofetil</li>
                  </ul>
                </div>
                <div>
                  <ul class="protocol-list">
                    <li>Oral methotrexate</li>
                    <li>Phenobarbital</li>
                    <li>Phenytoin</li>
                    <li>Somatrogon</li>
                    <li>Tacrolimus</li>
                    <li>Theophylline</li>
                    <li>Warfarin</li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="scr-condition-row" style="margin-top: 16px;"><strong>Rationale:</strong> GLP-1s delay gastric emptying, which can affect absorption and blood levels of these medications.</div>
          </div>

          <!-- Orlistat Tab -->
          <div class="scr-tab-content" data-condition-content="orlistat">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--warning);">💊 Orlistat (Alli / Xenical)</h3>
            <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT</span> if GLP prescribed &lt;1 month after stopping Orlistat</div>
            <div class="scr-condition-row"><strong>Requirement:</strong> Patient must be off Orlistat for at least 1 month before starting GLP-1</div>
            <div class="scr-condition-row"><strong>Rationale:</strong> Concurrent use is contraindicated.</div>

            <div class="info-card warning" style="margin-top: 16px;">
              <div class="info-card-title">⚠️ Edge Case: Transfer Patients with Recent PUE</div>
              <div class="info-card-text">Transfer patients will have PUE for the past month. In these cases, <strong>follow up with email</strong> rather than rejecting. Use <a href="#macro-16" onclick="navigateToMacro(16); return false;" style="color: var(--accent);">Macro 16: PUE 2 Weeks Old</a></div>
            </div>
          </div>

        </div>
        <!-- End scr-tabbed-conditions -->

        </div>
        <!-- End Tab 2 -->

        <!-- Tab 3: Clinical Details Required -->
        <div class="protocol-tab-content" data-tab-content="clinical-details">

        <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 20px;">Clinical Details Required</h2>

        <div class="info-card blue" style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0;">
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            <div>
              <strong>Missing Information:</strong> Email patient to gather required information before making a decision.
            </div>
          </div>
        </div>

        <!-- Nested Condition Tabs -->
        <div class="scr-tabbed-conditions">
          <div class="scr-tabs">
            <button class="scr-tab active" data-condition="gallstones">🫀 Gallstones</button>
            <button class="scr-tab" data-condition="heart-failure">❤️ Heart Failure</button>
            <button class="scr-tab" data-condition="ckd">🫘 Chronic Kidney Disease</button>
          </div>

          <!-- Gallstones Tab -->
          <div class="scr-tab-content active" data-condition-content="gallstones">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--warning);">🫀 Cholelithiasis (Gallstones) or Cholecystitis</h3>
            <div class="scr-condition-row"><strong>Action:</strong> If no evidence of cholecystectomy → <strong>Hold order</strong></div>
            <div class="scr-condition-row"><strong>Email patient:</strong> <a href="#macro-2" onclick="navigateToMacro(2); return false;" class="tag blue">Macro 2</a></div>
            <div class="scr-condition-row"><strong>Question to ask:</strong> "Have you had your gallbladder removed? If yes, when?"</div>

            <div style="margin-top: 16px;">
              <div class="info-card red">
                <div class="info-card-title">REJECT if:</div>
                <div class="info-card-text">Patient confirms <strong>NO cholecystectomy</strong> (gallbladder still present)</div>
              </div>
              <div class="info-card green" style="margin-top: 8px;">
                <div class="info-card-title">PRESCRIBE if:</div>
                <div class="info-card-text">Cholecystectomy confirmed by patient (even if not visible on SCR)</div>
              </div>
            </div>
          </div>

          <!-- Heart Failure Tab -->
          <div class="scr-tab-content" data-condition-content="heart-failure">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--danger);">❤️ Heart Failure (HF)</h3>
            <div class="scr-condition-row"><strong>Action:</strong> If no information on stage → <strong>Email patient</strong></div>
            <div class="scr-condition-row"><strong>Email patient:</strong> <a href="#macro-4" onclick="navigateToMacro(4); return false;" class="tag blue">Macro 4</a></div>
            <div class="scr-condition-row"><strong>Request:</strong> Last letter from cardiologist stating stage OR fitness for GLP-1</div>

            <div style="margin-top: 16px;">
              <div class="info-card red">
                <div class="info-card-title">REJECT if:</div>
                <div class="info-card-text">Patient confirms <strong>Stage IV heart failure</strong> (shortness of breath at rest)</div>
              </div>
              <div class="info-card green" style="margin-top: 8px;">
                <div class="info-card-title">PRESCRIBE if:</div>
                <div class="info-card-text">Stage I, II, or III confirmed</div>
              </div>
            </div>
          </div>

          <!-- CKD Tab -->
          <div class="scr-tab-content" data-condition-content="ckd">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--warning);">🫘 Chronic Kidney Disease (CKD)</h3>
            <div class="scr-condition-row"><strong>Action:</strong> If no eGFR information → <strong>Email patient</strong></div>
            <div class="scr-condition-row"><strong>Email patient:</strong> <a href="#macro-5" onclick="navigateToMacro(5); return false;" class="tag blue">Macro 5</a></div>
            <div class="scr-condition-row"><strong>Request:</strong> Most recent eGFR result</div>

            <div style="margin-top: 16px;">
              <div class="info-card red">
                <div class="info-card-title">REJECT if:</div>
                <div class="info-card-text">eGFR <strong>&lt;30 ml/min</strong> (Stage 4-5 / Severe CKD)</div>
              </div>
              <div class="info-card green" style="margin-top: 8px;">
                <div class="info-card-title">PRESCRIBE if:</div>
                <div class="info-card-text">eGFR ≥30 ml/min (Stage 1-3)</div>
              </div>
            </div>
          </div>

        </div>
        <!-- End scr-tabbed-conditions -->

        </div>
        <!-- End Tab 3 -->

        <!-- Tab 4: Patient Assessment Required -->
        <div class="protocol-tab-content" data-tab-content="patient-assessment">

        <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 20px;">Patient Assessment Required</h2>

        <div class="info-card purple" style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0;">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <path d="M20 8v6M23 11h-6"/>
            </svg>
            <div>
              <strong>Clinical Judgment:</strong> These conditions require individual assessment. Email patient for details and use clinical judgment to determine safety.
            </div>
          </div>
        </div>

        <!-- Nested Condition Tabs -->
        <div class="scr-tabbed-conditions">
          <div class="scr-tabs">
            <button class="scr-tab active" data-condition="cancer">🎗️ Cancer</button>
            <button class="scr-tab" data-condition="pregnancy">🤰 Pregnancy</button>
            <button class="scr-tab" data-condition="dementia">🧠 Dementia</button>
            <button class="scr-tab" data-condition="malabsorption">🩺 Malabsorption</button>
            <button class="scr-tab" data-condition="mental-health">💭 Mental Health</button>
            <button class="scr-tab" data-condition="suicidal">⚠️ Suicidal Ideation</button>
            <button class="scr-tab" data-condition="alcohol">🍺 Alcohol</button>
          </div>

          <!-- Cancer Tab -->
          <div class="scr-tab-content active" data-condition-content="cancer">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--accent);">🎗️ Cancer Diagnosis</h3>
            <div class="scr-condition-row"><strong>Exclusion:</strong> Medullary thyroid cancer and MEN2 are <strong>absolute contraindications</strong></div>
            <div class="scr-condition-row"><strong>For general cancer:</strong> Email patient using <a href="#macro-3" onclick="navigateToMacro(3); return false;" class="tag blue">Macro 3</a></div>
            <div class="scr-condition-row"><strong>For breast cancer specifically:</strong> Email patient using <a href="#macro-31" onclick="navigateToMacro(31); return false;" class="tag blue">Macro 31</a></div>
            <div class="scr-condition-row"><strong>Information needed:</strong>
              <ul class="protocol-list">
                <li>Treatment status (active, in remission, cured)</li>
                <li>Remission status and duration</li>
                <li>Oncology team discharge status</li>
                <li><strong>For breast cancer:</strong> Whether on hormone therapy only (e.g., tamoxifen, Zoladex)</li>
              </ul>
            </div>

            <div style="margin-top: 16px;">
              <div class="info-card blue">
                <div class="info-card-title">⚕️ Breast Cancer - Special Consideration</div>
                <div class="info-card-text">Breast cancer history requires clarification, not automatic rejection. Email patient to confirm current cancer status before making decision.</div>
              </div>
              <div class="info-card red" style="margin-top: 8px;">
                <div class="info-card-title">REJECT if:</div>
                <div class="info-card-text">
                  <ul class="protocol-list">
                    <li>Currently under oncology care</li>
                    <li>Receiving active cancer treatment (chemotherapy, radiotherapy, targeted therapy)</li>
                    <li>Recent recurrence or spread of cancer</li>
                  </ul>
                </div>
              </div>
              <div class="info-card green" style="margin-top: 8px;">
                <div class="info-card-title">PRESCRIBE if:</div>
                <div class="info-card-text">
                  <ul class="protocol-list">
                    <li>Cancer in remission and discharged from oncology team</li>
                    <li>On long-term hormone therapy only (tamoxifen/Zoladex) with no active treatment</li>
                    <li>No recent recurrence or current oncology involvement</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Pregnancy Tab -->
          <div class="scr-tab-content" data-condition-content="pregnancy">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--accent);">🤰 Pregnancy, Breastfeeding & Conception</h3>
            <div class="scr-condition-row"><strong>Action:</strong> Email patient using <a href="#macro-6" onclick="navigateToMacro(6); return false;" class="tag blue">Macro 6</a></div>
            <div class="scr-condition-row"><strong>Questions to ask:</strong>
              <ul class="protocol-list">
                <li>Are you currently pregnant?</li>
                <li>Are you breastfeeding?</li>
                <li>Are you trying to conceive?</li>
              </ul>
            </div>

            <div style="margin-top: 16px;">
              <div class="info-card red">
                <div class="info-card-title">REJECT if:</div>
                <div class="info-card-text">
                  <ul class="protocol-list">
                    <li>Currently pregnant</li>
                    <li>Breastfeeding</li>
                    <li>Planning pregnancy within 3 months</li>
                  </ul>
                </div>
              </div>
              <div class="info-card green" style="margin-top: 8px;">
                <div class="info-card-title">PRESCRIBE if:</div>
                <div class="info-card-text">Patient confirms none of the above apply</div>
              </div>
            </div>
          </div>

          <!-- Dementia Tab -->
          <div class="scr-tab-content" data-condition-content="dementia">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--accent);">🧠 Dementia / Cognitive Impairment</h3>
            <div class="scr-condition-row"><strong>Action:</strong> Email patient using <a href="#macro-7" onclick="navigateToMacro(7); return false;" class="tag blue">Macro 7</a></div>
            <div class="scr-condition-row"><strong>Assessment needed:</strong>
              <ul class="protocol-list">
                <li>How they manage at home day-to-day</li>
                <li>Whether they have help or support at home</li>
                <li>Ability to safely use injectable medication</li>
              </ul>
            </div>

            <div style="margin-top: 16px;">
              <div class="info-card red">
                <div class="info-card-title">REJECT if:</div>
                <div class="info-card-text">Patient unable to safely self-administer medication or lacks adequate support</div>
              </div>
              <div class="info-card green" style="margin-top: 8px;">
                <div class="info-card-title">PRESCRIBE if:</div>
                <div class="info-card-text">Patient has adequate support and can safely use medication</div>
              </div>
            </div>
          </div>

          <!-- Malabsorption Tab -->
          <div class="scr-tab-content" data-condition-content="malabsorption">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--accent);">🩺 Chronic Malabsorption</h3>
            <div class="scr-condition-row"><strong>Action:</strong> Email patient using <a href="#macro-8" onclick="navigateToMacro(8); return false;" class="tag blue">Macro 8</a></div>
            <div class="scr-condition-row"><strong>Request:</strong> Evidence of formal diagnosis OR letter from specialist</div>

            <div style="margin-top: 16px;">
              <div class="info-card red">
                <div class="info-card-title">REJECT if:</div>
                <div class="info-card-text">Patient provides evidence of formal chronic malabsorption syndrome diagnosis</div>
              </div>
              <div class="info-card green" style="margin-top: 8px;">
                <div class="info-card-title">PRESCRIBE if:</div>
                <div class="info-card-text">No formal diagnosis confirmed (may be historical/resolved)</div>
              </div>
            </div>
          </div>

          <!-- Mental Health Tab -->
          <div class="scr-tab-content" data-condition-content="mental-health">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--accent);">💭 Depression or Anxiety</h3>
            <div class="scr-condition-row"><strong>Action:</strong> Email patient using <a href="#macro-9" onclick="navigateToMacro(9); return false;" class="tag blue">Macro 9</a></div>
            <div class="scr-condition-row"><strong>Assessment questions:</strong>
              <ul class="protocol-list">
                <li>How has your mood been recently?</li>
                <li>Has your mood changed in past few weeks/months?</li>
                <li>Any thoughts of self-harm?</li>
                <li>Any thoughts of ending your life?</li>
              </ul>
            </div>

            <div style="margin-top: 16px;">
              <div class="info-card red">
                <div class="info-card-title">REJECT if:</div>
                <div class="info-card-text">
                  <ul class="protocol-list">
                    <li>Acutely unwell &lt;3 months</li>
                    <li>Started new antidepressant recently</li>
                    <li>Active thoughts of self-harm or suicide</li>
                  </ul>
                </div>
              </div>
              <div class="info-card warning" style="margin-top: 8px;">
                <div class="info-card-title">⚠️ Crisis Support</div>
                <div class="info-card-text">If patient reports active suicidal ideation, direct them to GP or crisis services (Samaritans: 116 123)</div>
              </div>
            </div>
          </div>

          <!-- Suicidal Ideation Tab -->
          <div class="scr-tab-content" data-condition-content="suicidal">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--danger);">⚠️ Active Suicidal Ideation</h3>
            <div class="scr-condition-row"><strong>Action:</strong> <span class="decision-reject">REJECT IMMEDIATELY</span> if mentioned in last 12 months</div>
            <div class="scr-condition-row"><strong>Email patient:</strong> <a href="#macro-9" onclick="navigateToMacro(9); return false;" class="tag blue">Macro 9</a> (if need to assess)</div>
            <div class="scr-condition-row"><strong>Safety:</strong> Direct patient to immediate support:
              <ul class="protocol-list">
                <li>Contact GP immediately</li>
                <li>Local crisis services</li>
                <li>Samaritans: 116 123 (UK)</li>
                <li>Emergency services: 999 (if immediate danger)</li>
              </ul>
            </div>
          </div>

          <!-- Alcohol Tab -->
          <div class="scr-tab-content" data-condition-content="alcohol">
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--warning);">🍺 Alcohol Abuse or Dependence</h3>
            <div class="scr-condition-row"><strong>Action:</strong> Email patient using <a href="#macro-10" onclick="navigateToMacro(10); return false;" class="tag blue">Macro 10</a></div>
            <div class="scr-condition-row"><strong>CAGE Screening Questions:</strong>
              <ul class="protocol-list">
                <li>How much are you currently drinking?</li>
                <li>Have you felt you ought to <strong>Cut down</strong>?</li>
                <li>Do you get <strong>Annoyed</strong> by criticism of your drinking?</li>
                <li>Do you feel <strong>Guilty</strong> about drinking?</li>
                <li>Do you need an <strong>Eye-opener</strong> (morning drink)?</li>
              </ul>
            </div>

            <div style="margin-top: 16px;">
              <div class="info-card red">
                <div class="info-card-title">REJECT if:</div>
                <div class="info-card-text">
                  <ul class="protocol-list">
                    <li>Current alcohol abuse or dependence</li>
                    <li>Alcohol abuse mentioned in last 12 months</li>
                    <li>In treatment/rehabilitation</li>
                  </ul>
                </div>
              </div>
              <div class="info-card green" style="margin-top: 8px;">
                <div class="info-card-title">PRESCRIBE if:</div>
                <div class="info-card-text">Historical alcohol issues (>12 months ago) and currently stable</div>
              </div>
            </div>
          </div>

        </div>
        <!-- End scr-tabbed-conditions -->

        </div>
        <!-- End Tab 4 -->

      </div>
    `;
  },

  getDosageProtocolCards() {
    return `
      <div class="protocol-card" id="bariatric-surgery">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--warning); flex-shrink: 0;">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <strong>Bariatric Surgery — 12 Month Exclusion</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>Time restriction:</strong> &lt;12 months post-surgery = <strong class="tag red">REJECT</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            Surgery types include:
          </div>
          <ul class="protocol-list">
            <li>Roux-en-Y Gastric Bypass (RYGB)</li>
            <li>Sleeve Gastrectomy</li>
            <li>Adjustable Gastric Band (Lap-Band)</li>
            <li>Biliopancreatic Diversion with Duodenal Switch (BPD/DS)</li>
            <li>Mini Gastric Bypass (OAGB – One Anastomosis Gastric Bypass)</li>
            <li>Endoscopic Bariatric Procedures (e.g., gastric balloon)</li>
          </ul>
          <div class="info-card green" style="margin-top: 12px;">
            <div class="info-card-title">Safe to prescribe</div>
            <div class="info-card-text">If surgery was <strong>≥12 months ago</strong> (more than a year)</div>
          </div>
        </div>

        <div class="protocol-card" id="cholecystectomy">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--warning); flex-shrink: 0;">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <strong>Cholecystectomy (Gallbladder Removal) — 12 Month Exclusion</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>Time restriction:</strong> &lt;12 months post-surgery = <strong class="tag red">REJECT</strong>
          </div>
          <div class="info-card green" style="margin-top: 12px;">
            <div class="info-card-title">Safe to prescribe</div>
            <div class="info-card-text">If surgery was <strong>≥12 months ago</strong> (more than a year)</div>
          </div>
        </div>

        <div class="protocol-card" id="insulin-diabetic-meds">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--danger); flex-shrink: 0;">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <strong>Insulin or Oral Diabetic Medications</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong class="tag red">REJECT</strong> if either condition applies:
          </div>
          <ul class="protocol-list" style="margin-bottom: 16px;">
            <li>Prescribed within the last <strong>3 months as acute</strong></li>
            <li><strong>OR</strong> present on list of <strong>repeat medication</strong></li>
          </ul>

          <div class="protocol-section-title" style="margin-top: 16px;">Oral Diabetic Medications:</div>
          <div class="scr-two-col">
            <div>
              <strong style="color: var(--warning);">Sulfonylureas:</strong>
              <ul class="protocol-list">
                <li>Diamicron [gliclazide]</li>
                <li>Daonil [glibenclamide]</li>
                <li>Rastin [tolbutamide]</li>
              </ul>
              <strong style="color: var(--warning);">SGLT2 inhibitors:</strong>
              <ul class="protocol-list">
                <li>Jardiance [empagliflozin]</li>
                <li>Forxiga [dapagliflozin]</li>
                <li>Invokana [canagliflozin]</li>
              </ul>
            </div>
            <div>
              <strong style="color: var(--warning);">DPP-4 inhibitors:</strong>
              <ul class="protocol-list">
                <li>Januvia [sitagliptin]</li>
                <li>Galvus [vildagliptin]</li>
                <li>Trajenta [linagliptin]</li>
              </ul>
              <strong style="color: var(--warning);">Thiazolidinediones:</strong>
              <ul class="protocol-list">
                <li>Actos [pioglitazone]</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="protocol-card" id="narrow-therapeutic-medications">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--danger); flex-shrink: 0;">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
            <strong>Narrow Therapeutic Index Medications</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong class="tag red">REJECT</strong> if either condition applies:
          </div>
          <ul class="protocol-list" style="margin-bottom: 16px;">
            <li>Prescribed within the last <strong>3 months as acute</strong></li>
            <li><strong>OR</strong> present on list of <strong>repeat medication</strong></li>
          </ul>

          <div class="scr-two-col">
            <div>
              <ul class="protocol-list">
                <li><strong>Amiodarone</strong></li>
                <li><strong>Carbamazepine</strong></li>
                <li><strong>Ciclosporin</strong></li>
                <li><strong>Clozapine</strong></li>
                <li><strong>Digoxin</strong></li>
                <li><strong>Fenfluramine</strong></li>
                <li><strong>Lithium</strong></li>
                <li><strong>Mycophenolate mofetil</strong></li>
              </ul>
            </div>
            <div>
              <ul class="protocol-list">
                <li><strong>Oral methotrexate</strong></li>
                <li><strong>Phenobarbital</strong></li>
                <li><strong>Phenytoin</strong></li>
                <li><strong>Somatrogon</strong></li>
                <li><strong>Tacrolimus</strong></li>
                <li><strong>Theophylline</strong></li>
                <li><strong>Warfarin</strong></li>
              </ul>
            </div>
          </div>
        </div>

        <div class="protocol-card" id="orlistat">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--warning); flex-shrink: 0;">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            <strong>Orlistat (Alli / Xenical)</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong class="tag red">REJECT</strong> if GLP prescription issued <strong>&lt;1 month</strong> after Orlistat
          </div>
          <div class="protocol-text">
            Concurrent use is a contraindication. Patient must be off Orlistat for at least 1 month before starting GLP-1.
          </div>
          <div class="info-card warning" style="margin-top: 12px;">
            <div class="info-card-title">Edge case: Transfer patients with recent PUE</div>
            <div class="info-card-text">Transfer patients will have PUE for the past month. In these cases please <strong>follow up with an email</strong> as per main SOP rather than rejecting. Use <a href="#macro-16" style="color: var(--accent);">Macro 16: PUE 2 Weeks Old</a></div>
          </div>
        </div>

        </div>
        <!-- End Tab 2 -->

        <!-- Tab 3: Clinical Details Required -->
        <div class="protocol-tab-content" data-tab-content="clinical-details">

        <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid var(--border);">Clinical Details Required</h2>

        <div class="info-card blue" style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0;">
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            <div>
              <strong>Missing Information:</strong> If you do not have the relevant information, you must reach out to the patient to make a decision.
            </div>
          </div>
        </div>

        <div class="protocol-card" id="gallstones-cholecystitis">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--warning); flex-shrink: 0;">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <strong>Cholelithiasis (Gallstones) or Cholecystitis</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>If no evidence of cholecystectomy:</strong>
          </div>
          <ul class="protocol-list" style="margin-bottom: 16px;">
            <li>Put order on <strong>hold</strong></li>
            <li>Email patient using <strong class="tag orange">Macro 2</strong></li>
            <li>Ask: "Have you had your gallbladder removed? If yes, when?"</li>
          </ul>
          <div class="info-card red">
            <div class="info-card-title">Reject if:</div>
            <div class="info-card-text">Customer confirms <strong>no cholecystectomy</strong> (gallbladder still present)</div>
          </div>
          <div class="info-card green" style="margin-top: 8px;">
            <div class="info-card-title">Prescribe if:</div>
            <div class="info-card-text">Cholecystectomy confirmed by patient (even if not visible on SCR)</div>
          </div>
        </div>

        <div class="protocol-card" id="heart-failure">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--danger); flex-shrink: 0;">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <strong>Heart Failure (HF)</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>If no information on stage:</strong>
          </div>
          <ul class="protocol-list" style="margin-bottom: 16px;">
            <li>Email patient using <strong class="tag orange">Macro 4</strong></li>
            <li>Request: Last letter from cardiologist stating stage OR fitness for GLP1</li>
          </ul>
          <div class="info-card red">
            <div class="info-card-title">Reject if:</div>
            <div class="info-card-text">Customer confirms <strong>Stage IV heart failure</strong></div>
          </div>
          <div class="info-card green" style="margin-top: 8px;">
            <div class="info-card-title">Prescribe if:</div>
            <div class="info-card-text">Stage I, II, or III confirmed</div>
          </div>
        </div>

        <div class="protocol-card" id="chronic-kidney-disease">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--accent); flex-shrink: 0;">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <strong>Chronic Kidney Disease (CKD)</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>If no information on eGFR or stage:</strong>
          </div>
          <ul class="protocol-list" style="margin-bottom: 16px;">
            <li>Email patient using <strong class="tag orange">Macro 5</strong></li>
            <li>Request: Most recent eGFR result</li>
          </ul>
          <div class="info-card red">
            <div class="info-card-title">Reject if:</div>
            <div class="info-card-text"><strong>eGFR &lt;30</strong> or <strong>Stage 4 CKD</strong> confirmed</div>
          </div>
          <div class="info-card green" style="margin-top: 8px;">
            <div class="info-card-title">Prescribe if:</div>
            <div class="info-card-text">eGFR ≥30 (Stage 1, 2, or 3)</div>
          </div>
        </div>

        </div>
        <!-- End Tab 3 -->

        <!-- Tab 4: Patient Assessment Required -->
        <div class="protocol-tab-content" data-tab-content="patient-assessment">

        <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid var(--border);">Patient Assessment Required</h2>

        <div class="info-card purple" style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0;">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <div>
              <strong>Clinical Judgement:</strong> These conditions require gathering information from the patient to determine safety and prescribing decision.
            </div>
          </div>
        </div>

        <div class="protocol-card" id="cancer-assessment">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--warning); flex-shrink: 0;">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01"/>
            </svg>
            <strong>Cancer Diagnosis (excluding MEN2 / medullary thyroid cancer)</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>Information required in ALL cases</strong> — Email using <strong class="tag orange">Macro 3</strong>
          </div>
          <ul class="protocol-list">
            <li>Are they currently undergoing treatment from an oncology team?</li>
            <li>Is the cancer in remission?</li>
            <li>Have they been discharged from the oncology team?</li>
            <li>Request: Discharge letter / most recent letter from the Oncology team</li>
          </ul>
          <div class="info-card green" style="margin-top: 12px;">
            <div class="info-card-title">Can prescribe if:</div>
            <div class="info-card-text">
              <ul style="margin: 0; padding-left: 16px;">
                <li>Cancer in remission</li>
                <li>Discharged from oncology team</li>
                <li>Medication for remission maintenance (e.g., tamoxifen)</li>
              </ul>
            </div>
          </div>
          <div class="info-card red" style="margin-top: 8px;">
            <div class="info-card-title">Reject if:</div>
            <div class="info-card-text">Active cancer currently undergoing treatment from an oncology team</div>
          </div>
          <div class="protocol-text" style="margin-top: 12px;">
            If unclear whether OK to prescribe after receiving patient information, escalate to Senior Prescribers.
          </div>
        </div>

        <div class="protocol-card" id="pregnancy-assessment">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--danger); flex-shrink: 0;">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <strong>Pregnancy</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>More information needed in ALL cases</strong> — Email using <a href="#macro-6" onclick="navigateToMacro(6); return false;" class="tag orange">Macro 6: Pregnancy</a>
          </div>
          <ul class="protocol-list" style="margin-bottom: 16px;">
            <li>Are you currently pregnant?</li>
            <li>Are you breastfeeding?</li>
            <li>Are you trying to conceive?</li>
          </ul>
          <div class="info-card red">
            <div class="info-card-title">REJECT if:</div>
            <div class="info-card-text">Currently pregnant, breastfeeding, or trying to conceive</div>
          </div>
          <div class="info-card green" style="margin-top: 8px;">
            <div class="info-card-title">APPROVE if:</div>
            <div class="info-card-text">None of the above apply</div>
          </div>
        </div>

        <div class="protocol-card" id="dementia-assessment">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--accent); flex-shrink: 0;">
              <path d="M12 2a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9s9-4.03 9-9a9 9 0 0 0-9-9z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            <strong>Dementia / Cognitive Impairment</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>More information needed in ALL cases</strong> — Email using <strong class="tag orange">Macro 7</strong>
          </div>
          <ul class="protocol-list" style="margin-bottom: 16px;">
            <li>Are they safe at home to use the medication?</li>
            <li>How do they manage day-to-day tasks?</li>
            <li>Do they have help/support at home?</li>
            <li>Are they capable of safely self-administering injectable medication?</li>
          </ul>
          <div class="protocol-text">
            <strong>Clinical decision:</strong> Prescribe or reject according to the patient's ability to take the medication safely and support around the patient.
          </div>
        </div>

        <div class="protocol-card" id="malabsorption-assessment">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--warning); flex-shrink: 0;">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <strong>Chronic Malabsorption</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>More information needed in ALL cases</strong> — Email using <strong class="tag orange">Macro 8</strong>
          </div>
          <ul class="protocol-list" style="margin-bottom: 16px;">
            <li>Request evidence of formal diagnosis or specialist letter</li>
          </ul>
          <div class="info-card red">
            <div class="info-card-title">REJECT if:</div>
            <div class="info-card-text">Patient has a <strong>formal diagnosis</strong> of chronic malabsorption</div>
          </div>
        </div>

        <div class="protocol-card" id="depression-anxiety-assessment">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--danger); flex-shrink: 0;">
              <path d="M12 2a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9s9-4.03 9-9a9 9 0 0 0-9-9z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <strong>Depression or Anxiety — Acutely Mentally Unwell</strong>
          </div>
          <div class="info-card blue" style="margin-bottom: 12px;">
            <div class="info-card-text"><strong>Note:</strong> Depression and anxiety are NOT contraindications on their own. Only acutely mentally unwell is a contraindication.</div>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            If diagnosis added <strong>within 3 months</strong>, email using <strong class="tag orange">Macro 9</strong> to find out more about their mental state and whether they have thoughts of self-harm. If they respond that they are fine, you can prescribe. If in doubt, escalate.
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>Check SCR for timing:</strong>
          </div>
          <ul class="protocol-list" style="margin-bottom: 16px;">
            <li>Added to SCR &lt;3 months ago? → Email for more info. If stable → <strong class="tag green">Prescribe</strong></li>
            <li>Entry older than 3 months? → <strong class="tag green">Prescribe</strong> (no need for further info)</li>
          </ul>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>Antidepressant medications can be used as a proxy:</strong>
          </div>
          <ul class="protocol-list">
            <li>New antidepressant or dose increase in last 3 months? → Email to find out about mental state. If stable → <strong class="tag green">Prescribe</strong></li>
            <li>Started medication ≥3 months ago with no dose increase? → <strong class="tag green">Prescribe</strong></li>
          </ul>
        </div>

        <div class="protocol-card" id="suicidal-ideation-assessment">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--danger); flex-shrink: 0;">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
            <strong>Active Suicidal Ideation</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            If mention of suicidal ideation in the <strong>last year</strong>, put prescription on hold and reach out using <strong class="tag orange">Macro 9</strong> for more information.
          </div>
          <ul class="protocol-list" style="margin-bottom: 12px;">
            <li>Are they currently having suicidal thoughts?</li>
            <li>Have they tried to end their life recently?</li>
            <li>If any concerns, ensure they are getting help and escalate appropriately</li>
          </ul>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>Check SCR for timing:</strong>
          </div>
          <ul class="protocol-list">
            <li>Added to SCR in the last year (&lt;12 months)? → <strong class="tag red">REJECT</strong></li>
            <li>Added ≥12 months ago? → <strong class="tag green">Prescribe</strong></li>
          </ul>
        </div>

        <div class="protocol-card" id="alcohol-abuse-assessment">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--warning); flex-shrink: 0;">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              <path d="M9 10h.01M15 10h.01M9.5 15.5c1 .5 2.5 .5 3.5 .5s2.5 0 3.5-.5"/>
            </svg>
            <strong>Current Alcohol Abuse or Dependence</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            Email using <strong class="tag orange">Macro 10</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            If mention of alcohol dependence or alcohol abuse in the <strong>last year</strong>, put prescription on hold and reach out using <strong class="tag orange">Macro 10</strong> to find out how much they are currently drinking.
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>CAGE Screening Questions:</strong>
          </div>
          <ul class="protocol-list" style="margin-bottom: 16px;">
            <li>How much are you currently drinking?</li>
            <li>Have you ever felt that you ought to <strong>C</strong>ut down on your drinking?</li>
            <li>Do you get <strong>A</strong>nnoyed by criticism of your drinking?</li>
            <li>Do you ever feel <strong>G</strong>uilty about your drinking?</li>
            <li>Do you ever take an early-morning drink (<strong>E</strong>ye-opener) to get the day started or to get rid of a hangover?</li>
          </ul>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>Check SCR for timing:</strong>
          </div>
          <ul class="protocol-list">
            <li>Added to SCR in the last year (&lt;12 months) OR current alcohol abuse? → <strong class="tag red">REJECT</strong></li>
            <li>Added ≥12 months ago AND no current abuse? → <strong class="tag green">Prescribe</strong></li>
          </ul>
          <div class="info-card blue" style="margin-top: 12px;">
            <div class="info-card-title">Important Note</div>
            <div class="info-card-text">Only <strong>current alcohol dependence</strong> is an exclusion criteria. Past history (&gt;12 months) is acceptable if patient is no longer dependent.</div>
          </div>
        </div>

        </div>
        <!-- End Tab 4 -->

      </div>
    `;
  },

  getTagsContent() {
    return `
      <div class="protocol-page">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Tags Reference</h1>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">Quick reference guide for order tags and required actions</p>

        <div class="info-card blue" style="margin-bottom: 20px;">
          <div class="info-card-title">How to Use This Reference</div>
          <div class="info-card-text"><strong>Action Tags</strong> require you to take specific steps before approving/rejecting. <strong>System Tags</strong> are informational only and show patient history or status.</div>
        </div>

        <!-- Tags Reference Tabs -->
        <div class="protocol-tabs">
          <button class="protocol-tab active" data-tab="action-tags">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
            Action Tags
          </button>
          <button class="protocol-tab" data-tab="system-tags">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            System Tags
          </button>
        </div>

        <!-- Tab 1: Action Tags -->
        <div class="protocol-tab-content active" data-tab-content="action-tags">

        <div class="protocol-card">
          <div class="protocol-title">
            <div class="icon orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            Action Tags — Require Your Action
          </div>
          <div class="table-wrapper">
            <table class="dose-table">
              <tr>
                <th style="width: 25%;">Tag</th>
                <th style="width: 35%;">What It Means</th>
                <th style="width: 40%;">Action Required</th>
              </tr>
            <tr>
              <td><span class="tag orange">Pending Customer Response</span></td>
              <td>Patient has been emailed for additional information</td>
              <td>Wait for patient reply. Check back in 48 hours. Auto-reject after 7 days.</td>
            </tr>
            <tr>
              <td><span class="tag red">Failed ID</span></td>
              <td>ID verification failed (new patients only)</td>
              <td>Email patient requesting valid photo ID. Add Pending Customer Response tag.</td>
            </tr>
            <tr>
              <td><span class="tag red">Photo Doesn't Match ID</span></td>
              <td>Selfie photo doesn't match ID photo</td>
              <td>Email patient requesting new selfie. If suspicious, escalate to Senior Prescriber.</td>
            </tr>
            <tr>
              <td><span class="tag purple">escalated</span></td>
              <td>Consultation requires Senior Prescriber review</td>
              <td><strong style="color: var(--danger);">Do not approve/reject.</strong> Senior Prescriber will review within 24 hours.</td>
            </tr>
            <tr>
              <td><span class="tag blue">Requested PUE</span></td>
              <td>Patient has been asked to upload proof of previous use</td>
              <td>Wait for PUE upload. Check back in 48 hours. Follow PUE protocol when received.</td>
            </tr>
            <tr>
              <td><span class="tag orange">6-Month Review Due</span></td>
              <td>Patient has been on treatment 6 months</td>
              <td>Check if patient completed review questionnaire. If not, email reminder.</td>
            </tr>
            <tr>
              <td><span class="tag red">Weight Gain >7%</span></td>
              <td>Patient gained >7% since starting treatment</td>
              <td>Follow weight monitoring protocol. Assess tolerance, adherence, contraindications.</td>
            </tr>
            <tr>
              <td><span class="tag orange">GP Contact Required</span></td>
              <td>Need to verify patient details with GP</td>
              <td>Contact GP surgery to confirm registration. Document outcome in notes.</td>
            </tr>
            <tr>
              <td><span class="tag orange">Long treatment gap</span></td>
              <td>Patient has gap >8 weeks since last dose</td>
              <td>Use Gap Adjustment Table in Titration Guide to determine safe restart dose.</td>
            </tr>
            </table>
          </div>
        </div>

        </div>
        <!-- End Tab 1 -->

        <!-- Tab 2: System Tags -->
        <div class="protocol-tab-content" data-tab-content="system-tags">

        <div class="protocol-card">
          <div class="protocol-title">
            <div class="icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            System Tags — Informational Only
          </div>

          <div class="table-wrapper">
            <table class="dose-table">
              <tr>
                <th style="width: 30%;">Tag</th>
                <th>What It Means</th>
              </tr>
            <tr>
              <td><span class="tag green">Completed six month review</span></td>
              <td>Patient has completed the 6-month review questionnaire</td>
            </tr>
            <tr>
              <td><span class="tag blue">Transfer Patient</span></td>
              <td>Patient transferred from another GLP-1 provider</td>
            </tr>
            <tr>
              <td><span class="tag purple">Switching Medication</span></td>
              <td>Patient is changing from one GLP-1 to another (use Dose Equivalence Table)</td>
            </tr>
            <tr>
              <td><span class="tag orange">Previous NHS Supply</span></td>
              <td><strong style="color: var(--danger);">Patient previously received GLP-1 through NHS</strong> (cannot continue privately)</td>
            </tr>
            <tr>
              <td><span class="tag green">PUE Verified</span></td>
              <td>Previous Use Evidence has been reviewed and accepted</td>
            </tr>
            <tr>
              <td><span class="tag blue">Linked Accounts</span></td>
              <td>Patient has multiple accounts (duplicate detected - verify identity)</td>
            </tr>
            <tr>
              <td><span class="tag orange">Gap in Treatment >8 weeks</span></td>
              <td>Patient had significant gap between orders (see Titration Guide for dose adjustment)</td>
            </tr>
            <tr>
              <td><span class="tag red">Previous Rejection</span></td>
              <td>Patient was previously rejected (check rejection reason before proceeding)</td>
            </tr>
            <tr>
              <td><span class="tag orange">Order Cancellation Requested</span></td>
              <td><strong style="color: var(--danger);">DO NOT prescribe or reject.</strong> Patient has 24 hours to confirm cancellation.</td>
            </tr>
          </table>
        </div>

        <div class="info-card" style="margin-top: 20px;">
          <div class="info-card-title">Tag Management</div>
          <div class="info-card-text">Tags are automatically applied by the system based on patient actions and consultation answers. You may need to manually add tags like <span class="tag orange">Pending Customer Response</span> or <span class="tag purple">escalated</span> when required.</div>
        </div>

        </div>
        <!-- End Tab 2 -->
      </div>
    `;
  },

  getMacrosContent() {
    return `
      <div class="protocol-page">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Email Macros & Documentation</h1>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">Pre-written templates for patient communication and documentation notes.</p>

        <!-- Main Tabs: Email Macros vs Documentation Notes -->
        <div class="protocol-tabs" style="margin-bottom: 24px;">
          <button class="protocol-tab active" data-tab="email-macros">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Email Macros
          </button>
          <button class="protocol-tab" data-tab="doc-notes">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Documentation Notes
          </button>
        </div>

        <!-- Tab Content: Email Macros -->
        <div class="tab-panel active" data-panel="email-macros">
        
        <div class="info-card blue" style="margin-bottom: 20px;">
          <div class="info-card-title">How to Use Macros</div>
          <div class="info-card-text">
            <strong>1.</strong> Find the appropriate macro for your scenario using the category tabs below<br>
            <strong>2.</strong> Click to expand the template<br>
            <strong>3.</strong> Click the <strong>Copy</strong> button to copy to clipboard<br>
            <strong>4.</strong> Paste into your email and replace placeholders like <code>&lt;&lt;Patient Name&gt;&gt;</code>
          </div>
        </div>

        <div class="info-card orange" style="margin-bottom: 24px;">
          <div class="info-card-title">Important Reminder</div>
          <div class="info-card-text">After emailing a patient, always: <strong>1)</strong> Add note to patient record (see <a href="#doc-scr-hold" onclick="navigateToMacro('doc-scr-hold')" style="color: var(--accent);">Documentation Notes</a>) <strong>2)</strong> Change tag to "Pending Customer Response" <strong>3)</strong> Put order on hold. <strong>Rule:</strong> Send only ONE email covering all information requirements.</div>
        </div>

        <!-- Sub-tabs for macro categories -->
        <div class="protocol-tabs" style="margin-bottom: 20px; flex-wrap: wrap;">
          <button class="protocol-tab active" data-subtab="scr-macros" style="font-size: 13px; padding: 8px 14px;">
            SCR/Clinical
          </button>
          <button class="protocol-tab" data-subtab="pue-macros" style="font-size: 13px; padding: 8px 14px;">
            Transfer/PUE
          </button>
          <button class="protocol-tab" data-subtab="titration-macros" style="font-size: 13px; padding: 8px 14px;">
            Titration
          </button>
          <button class="protocol-tab" data-subtab="verification-macros" style="font-size: 13px; padding: 8px 14px;">
            ID/Photos
          </button>
          <button class="protocol-tab" data-subtab="weight-macros" style="font-size: 13px; padding: 8px 14px;">
            Weight Changes
          </button>
          <button class="protocol-tab" data-subtab="nevolat-macros" style="font-size: 13px; padding: 8px 14px;">
            Nevolat
          </button>
          <button class="protocol-tab" data-subtab="rejection-macros" style="font-size: 13px; padding: 8px 14px;">
            Rejections
          </button>
        </div>

        <!-- SCR/Clinical Macros Sub-panel -->
        <div class="sub-panel active" data-subpanel="scr-macros">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--text);">SCR & Clinical Information Macros</h3>

        <!-- Macro 1 -->
        <div class="macro-card" id="macro-1">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 1</span>
              <span class="macro-name">Request for Further Information (General/Time-Sensitive)</span>
            </div>
            <div class="macro-tags">
              <span class="tag orange">Time-Sensitive Conditions</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> You need to confirm timing of a condition (bariatric surgery, cholecystectomy, medications, etc.) from Table 2 conditions.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Subject: Request for Further Information About Your Medical History

Dear &lt;&lt;Patient Name&gt;&gt;,

I can see from your records that you have had [X condition]. Could you please provide us with a bit more information about when this occurred and any relevant details you feel may be important?

Your response will help us ensure that we have an accurate and up-to-date understanding of your medical history when reviewing your request.

Thank you for your time, and please let us know if you have any questions.

Kind regards,
&lt;&lt;Your Name&gt;&gt;
&lt;&lt;Your Role&gt;&gt;
MedExpress</pre>
            </div>
          </div>
        </div>

        <!-- Macro 2 -->
        <div class="macro-card" id="macro-2">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 2</span>
              <span class="macro-name">Previous Gallbladder Problems</span>
            </div>
            <div class="macro-tags">
              <span class="tag blue">Clinical Details Required</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> SCR shows cholelithiasis (gallstones) or cholecystitis (gallbladder inflammation) but no evidence of cholecystectomy.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Subject: Follow-Up on Your Medical History

Dear &lt;&lt;Patient Name&gt;&gt;,

From your records, I can see you have had a gallbladder problem noted. Could you please confirm if you have had a cholecystectomy (gallbladder removal surgery) following this, and if so, when the surgery took place?

This information will help us ensure your medical history is accurate and up to date.

Kind regards,
&lt;&lt;Your Name&gt;&gt;
&lt;&lt;Your Role&gt;&gt;
MedExpress</pre>
            </div>
          </div>
        </div>

        <!-- Macro 3 -->
        <div class="macro-card" id="macro-3">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 3</span>
              <span class="macro-name">Previous Cancer Diagnosis</span>
            </div>
            <div class="macro-tags">
              <span class="tag purple">Patient Assessment Required</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> SCR shows any cancer diagnosis (excluding MEN2 or medullary thyroid cancer). Information required in ALL cases.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Subject: Follow-Up on Your Medical History

Dear &lt;&lt;Patient Name&gt;&gt;,

We would be grateful if you could provide us with some further details about your medical history:

• Have you ever had a cancer diagnosis (excluding MEN2 or medullary thyroid cancer)?
• Are you currently on, or awaiting, any treatment such as surgery, chemotherapy, or radiotherapy?
• Is the cancer in remission?
• Have you been discharged from the oncology team? If so, please send a copy of your discharge letter or your most recent letter from the Oncology team.

Thank you for choosing MedExpress to support you on your weight loss journey. Your response will help us make sure we have an accurate and up-to-date understanding of your medical history.

Kind regards,
&lt;&lt;Your Name&gt;&gt;
&lt;&lt;Your Role&gt;&gt;
MedExpress</pre>
            </div>
          </div>
        </div>

        <!-- Macro 4 -->
        <div class="macro-card" id="macro-4">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 4</span>
              <span class="macro-name">Heart Failure Information</span>
            </div>
            <div class="macro-tags">
              <span class="tag blue">Clinical Details Required</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> SCR shows heart failure diagnosis but no information on stage. Reject if Stage IV confirmed.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Subject: Request for Information on Heart Failure Diagnosis

Dear &lt;&lt;Patient Name&gt;&gt;,

We can see a coded diagnosis of heart failure in your records. To ensure we have the most accurate and up-to-date information about your condition, could you please provide us with:

• A copy of your most recent cardiology letter, or
• Any additional details regarding your diagnosis that you feel are relevant.

Thank you for choosing MedExpress to support you on your weight loss journey. Your response will help us provide the best possible care.

Kind regards,
&lt;&lt;Your Name&gt;&gt;
&lt;&lt;Your Role&gt;&gt;
MedExpress</pre>
            </div>
          </div>
        </div>

        <!-- Macro 5 -->
        <div class="macro-card" id="macro-5">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 5</span>
              <span class="macro-name">CKD Diagnosis</span>
            </div>
            <div class="macro-tags">
              <span class="tag blue">Clinical Details Required</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> SCR shows chronic kidney disease but no information on eGFR or stage. Reject if eGFR &lt;30 or Stage 4.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Subject: Request for Information on CKD Diagnosis

Dear &lt;&lt;Patient Name&gt;&gt;,

We can see a diagnosis of chronic kidney disease (CKD) noted in your records. To ensure we have the most accurate and up-to-date information about your condition, could you please provide us with:

• Your most recent eGFR result, and/or
• A copy of the latest letter from your specialist with further details about your CKD.

Thank you for choosing MedExpress to support you on your weight loss journey. Your response will help us provide the best possible care.

Kind regards,
&lt;&lt;Your Name&gt;&gt;
&lt;&lt;Your Role&gt;&gt;
MedExpress</pre>
            </div>
          </div>
        </div>

        <!-- Macro 6 -->
        <div class="macro-card" id="macro-6">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 6</span>
              <span class="macro-name">Pregnancy Status</span>
            </div>
            <div class="macro-tags">
              <span class="tag purple">Patient Assessment Required</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> SCR shows pregnancy noted. Reject if currently pregnant, breastfeeding, or trying to conceive.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Subject: Follow-Up on Your Current Status

Dear &lt;&lt;Patient Name&gt;&gt;,

To help us provide the most appropriate care, could you please confirm your current status regarding the following:

• Are you currently pregnant?
• Are you breastfeeding?
• Are you trying to conceive?

Your response will ensure we have accurate and up-to-date information for your care.

Thank you for choosing MedExpress to support you on your weight loss journey.

Kind regards,
&lt;&lt;Your Name&gt;&gt;
&lt;&lt;Your Role&gt;&gt;
MedExpress</pre>
            </div>
          </div>
        </div>

        <!-- Macro 7 -->
        <div class="macro-card" id="macro-7">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 7</span>
              <span class="macro-name">Dementia / Cognitive Impairment</span>
            </div>
            <div class="macro-tags">
              <span class="tag purple">Patient Assessment Required</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> SCR shows dementia or cognitive impairment. Need to assess if patient can safely use injectable medication.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Subject: Follow-Up on Your Care and Support

Dear &lt;&lt;Patient Name&gt;&gt;,

We can see that dementia is noted in your records. To help us understand your needs and provide the best support, could you please let us know:

• How you manage at home on a day-to-day basis?
• Whether you have any help or support at home?

Thank you for choosing MedExpress to support you on your weight loss journey. Your response will help us ensure we have the most accurate and up-to-date information.

Kind regards,
&lt;&lt;Your Name&gt;&gt;
&lt;&lt;Your Role&gt;&gt;
MedExpress</pre>
            </div>
          </div>
        </div>

        <!-- Macro 8 -->
        <div class="macro-card" id="macro-8">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 8</span>
              <span class="macro-name">Chronic Malabsorption</span>
            </div>
            <div class="macro-tags">
              <span class="tag purple">Patient Assessment Required</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> SCR shows chronic malabsorption noted. Reject if patient has formal diagnosis.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Subject: Request for Information on Chronic Malabsorption

Dear &lt;&lt;Patient Name&gt;&gt;,

We can see a note of chronic malabsorption in your records. To ensure we have accurate and up-to-date information about your condition, could you please provide us with:

• Evidence of a formal diagnosis, or
• A letter from your specialist with further details regarding your condition.

Thank you for choosing MedExpress to support you on your weight loss journey. Your response will help us provide the best possible care.

Kind regards,
&lt;&lt;Your Name&gt;&gt;
&lt;&lt;Your Role&gt;&gt;
MedExpress</pre>
            </div>
          </div>
        </div>

        <!-- Macro 9 -->
        <div class="macro-card" id="macro-9">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 9</span>
              <span class="macro-name">Mental Health (Depression, Anxiety, Suicidal Ideation)</span>
            </div>
            <div class="macro-tags">
              <span class="tag purple">Patient Assessment Required</span>
              <span class="tag red">Sensitive</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> SCR shows depression/anxiety added &lt;3 months ago OR suicidal ideation in last 12 months. Need to assess current mental state.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Subject: Follow-Up on Your Mental Health

Dear &lt;&lt;Patient Name&gt;&gt;,

We can see depression or anxiety noted in your records. To help us provide the best care and support, could you please provide some information regarding:

• How your mood has been recently.
• Whether your mood has changed in the past few weeks or months.
• If you have had any thoughts of self-harm.
• If you have had any thoughts of ending your life.

If you are currently experiencing thoughts of self-harm or ending your life, please contact your GP or local crisis services immediately. In the UK, you can also contact Samaritans on 116 123.

Thank you for choosing MedExpress to support you on your weight loss journey. Your response will help us ensure we have the most accurate and up-to-date information.

Kind regards,
&lt;&lt;Your Name&gt;&gt;
&lt;&lt;Your Role&gt;&gt;
MedExpress</pre>
            </div>
          </div>
        </div>

        <!-- Macro 10 -->
        <div class="macro-card" id="macro-10">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 10</span>
              <span class="macro-name">Alcohol Abuse / Dependence</span>
            </div>
            <div class="macro-tags">
              <span class="tag purple">Patient Assessment Required</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> SCR shows alcohol abuse or dependence in last 12 months. CAGE screening questions included.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Subject: Follow-Up on Alcohol Use

Dear &lt;&lt;Patient Name&gt;&gt;,

We can see alcohol abuse or dependence noted in your records. To help us understand your situation and provide the best support, could you please provide some information regarding:

• How much you are currently drinking.
• Whether you have ever felt that you ought to cut down on your drinking.
• Whether you get annoyed by criticism of your drinking.
• Whether you ever feel guilty about your drinking.
• Whether you ever take an early-morning drink ("eye-opener") to get the day started or to relieve a hangover.

Thank you for choosing MedExpress to support you on your weight loss journey. Your response will help us ensure we have the most accurate and up-to-date information.

Kind regards,
&lt;&lt;Your Name&gt;&gt;
&lt;&lt;Your Role&gt;&gt;
MedExpress</pre>
            </div>
          </div>
        </div>

        <!-- Macro 11 -->
        <div class="macro-card" id="macro-11">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 11</span>
              <span class="macro-name">SCR Permission Not Granted</span>
            </div>
            <div class="macro-tags">
              <span class="tag orange">SCR Access</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Patient has not granted permission to view their SCR (for orders placed before permission was mandatory).
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Subject: Update Regarding Access to Summary Care Records (SCR)

Dear &lt;&lt;Patient Name&gt;&gt;,

Thank you for your recent order.

We wanted to let you know about an important change to our prescribing process.

Unfortunately, we are now unable to prescribe medication if access to the Summary Care Record (SCR) is declined. Access to the SCR is essential to ensure that we prescribe safely and in accordance with clinical guidance.

It appears that you have not granted us access to your SCR. If you would like to review this decision or have any questions about what the SCR is, we would be happy to provide more information.

If you wish to change your mind and allow us access to your SCR, we would be happy to move forward with your prescription. However, if you choose not to grant access, we will need to reject your prescription request, and you will receive a full refund.

Please let us know how you would like to proceed.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        <!-- Macro 12 -->
        <div class="macro-card" id="macro-12">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 12</span>
              <span class="macro-name">Rejection Email for Repeat Patients</span>
            </div>
            <div class="macro-tags">
              <span class="tag red">Rejection</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Rejecting a repeat patient based on SCR findings. This template is reviewed by Brand Team for sensitive communication.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Subject: An important update on your treatment plan

Hi &lt;&lt;Patient Name&gt;&gt;,

We're getting in touch to let you know that, following an updated review of your medical records, we're no longer able to prescribe weight loss treatments such as Wegovy, Mounjaro or Nevolat.

This means your current order will be automatically cancelled and refunded.

This decision is based on new information from your Summary Care Record (SCR), which is a national database that includes details like your current medication, allergies, any diagnoses or medical conditions and previous reactions to medicines. Reviewing your SCR is a new step we've introduced to further improve the safety of our service.

During these checks, we noted [add information about contraindication(s) found].

For your safety, please stop using your injectable treatment and take any remaining pens to your local pharmacy for safe disposal.

We understand this news may be disappointing, but your safety is our top priority. If you'd like to speak with one of our clinicians about this update, just reply to this email. We'll get back to you as soon as possible.

You can also discuss your weight management options with your GP for more personalised support.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        <!-- Macro 13 -->
        <div class="macro-card" id="macro-13">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 13</span>
              <span class="macro-name">PUE/Transfer Evidence Requirements</span>
            </div>
            <div class="macro-tags">
              <span class="tag orange">Transfer Patients</span>
              <span class="tag blue">Below Licence BMI</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Transfer patient has submitted PUE (Previous Use Evidence) that is incomplete or missing required details. Also used when below-licence BMI patient needs to verify their starting BMI from previous provider.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Dear &lt;&lt;Patient Name&gt;&gt;,

Thank you for providing evidence of your previous GLP‑1 treatment.

We've reviewed the information submitted. While some details are present, it does not currently meet our verification requirements, and we'll need some additional information before we can proceed.


1. Evidence of previous GLP‑1 use (PUE)

To be accepted, evidence of previous GLP‑1 use must clearly show all of the following:

• Patient name or email – your full name (not a nickname) or the email address used with the previous provider
• Medication and dose – the exact medication name and strength prescribed
• Date – order date, prescription date, or dispatch date
• Regulated provider – the name of the healthcare provider, clinic, or pharmacy that supplied the treatment (for example an NHS service or a registered UK online pharmacy/clinic)

At present, the evidence provided is missing [INSERT MISSING DETAILS], so we're unable to verify that the treatment was supplied by a regulated service.


2. Weight/BMI verification at treatment start

Because your current BMI is below the standard licensing threshold, we also need to confirm that you met the licence criteria when you first started GLP‑1 with your previous provider.

For this, we require a previous BMI weight‑verification photo that:

• Was taken within 30 days of starting GLP‑1 treatment with your previous provider
• Shows you full‑length or nearly full‑length in fitted clothing
• Is well lit and clear enough for us to see your body shape
• Allows us to confirm that you met the licensed BMI at that time and do not appear underweight

The images we have so far do not meet these requirements, so we cannot yet verify your starting BMI.


What we need from you

To continue your review, please send:

1. Updated evidence of previous use that includes the name of the prescribing provider or pharmacy and clearly shows your name, medicine, dose and date; and
2. A weight‑verification photo from when you first started GLP‑1 treatment that meets the criteria above, and (if possible) a brief note of the approximate date it was taken.

Once we have both acceptable previous‑use evidence and a suitable starting‑BMI photo, we'll reassess your order and let you know whether it is safe to prescribe a continuation dose.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        </div>
        <!-- End SCR/Clinical Macros Sub-panel -->

        <!-- Transfer/PUE Macros Sub-panel -->
        <div class="sub-panel" data-subpanel="pue-macros">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--text);">Transfer &amp; PUE Macros</h3>

        <!-- Macro 14 - Clinical Evidence Missing Information -->
        <div class="macro-card" id="macro-14">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 14</span>
              <span class="macro-name">Clinical Evidence - Missing Information</span>
            </div>
            <div class="macro-tags">
              <span class="tag orange">Transfer Patients</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Transfer patient has submitted clinical evidence that does not contain all required information (name, medication/dose, date, provider).
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Dear &lt;&lt;Patient Name&gt;&gt;,

Thank you for providing evidence of your previous GLP-1 treatment.

Unfortunately, the evidence submitted does not currently meet our verification requirements. For the evidence to be acceptable it must include all of the following:

• Patient name or email – your full name (not a nickname) or the email address used with the previous provider
• Medication and dose – the exact medication name and strength prescribed
• Date – order date, prescription date, or dispatch date
• Regulated provider – the name of the healthcare provider, clinic, or pharmacy that supplied the treatment

At present, the evidence provided is missing [INSERT MISSING DETAILS].

Please provide updated evidence that includes all of the above information so we can continue with your review.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        <!-- Macro 15 - Clinical Evidence of Starting BMI -->
        <div class="macro-card" id="macro-15">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 15</span>
              <span class="macro-name">Clinical Evidence of Starting BMI</span>
            </div>
            <div class="macro-tags">
              <span class="tag orange">Transfer Patients</span>
              <span class="tag blue">Below Licence BMI</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Transfer patient is currently below licence BMI and needs to provide evidence they met licence criteria when starting treatment.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Dear &lt;&lt;Patient Name&gt;&gt;,

Thank you for your order.

Your current BMI is below the standard licensing threshold for this medication. To continue treatment, we need to verify that you met the licence criteria when you first started GLP-1 therapy.

Please provide a previous BMI weight-verification photo that:

• Was taken within 30 days of starting GLP-1 treatment with your previous provider
• Shows you full-length or nearly full-length in fitted clothing
• Is well lit and clear enough for us to see your body shape
• Allows us to confirm that you met the licensed BMI at that time

If possible, please also provide the approximate date the photo was taken.

Once we receive acceptable evidence, we'll reassess your order.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        <!-- Macro 16 - Clinical PUE 2 Weeks Old -->
        <div class="macro-card" id="macro-16">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 16</span>
              <span class="macro-name">Clinical PUE 2 Weeks Old</span>
            </div>
            <div class="macro-tags">
              <span class="tag orange">Transfer Patients</span>
              <span class="tag purple">Time-Sensitive</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Transfer patient's PUE is more than 2 weeks old since their last dose - need to determine if they should restart at maintenance or lower dose.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Dear &lt;&lt;Patient Name&gt;&gt;,

Thank you for your order.

We can see from your previous use evidence that there has been a gap of more than 2 weeks since your last GLP-1 injection. 

For safety reasons, if you have missed more than 2 consecutive weeks of treatment, we may need to restart you at a lower dose rather than your previous maintenance dose.

Please confirm:

1. When did you take your last injection?
2. How long have you been without medication?

Once we have this information, we can determine the appropriate dose for you to restart on.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        <!-- Macro 17 - Repeat Customer Weight/Height Verification -->
        <div class="macro-card" id="macro-17">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 17</span>
              <span class="macro-name">Repeat Customer Weight/Height Verification</span>
            </div>
            <div class="macro-tags">
              <span class="tag blue">Repeat Patients</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Repeat patient needs to provide weight/height verification (photo appears inconsistent with declared weight).
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Dear &lt;&lt;Patient Name&gt;&gt;,

Thank you for your recent order.

To continue processing your prescription, we need to verify your current weight. Please provide:

• A clear, full-length photo taken within the last 30 days
• The photo should show you in fitted clothing
• Good lighting so we can clearly see your body shape

Alternatively, you can provide a photo showing your weight on scales.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        </div>
        <!-- End Transfer/PUE Macros Sub-panel -->

        <!-- Titration Macros Sub-panel -->
        <div class="sub-panel" data-subpanel="titration-macros">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--text);">Titration Macros</h3>

        <!-- Macro 18 - Skipped Dose -->
        <div class="macro-card" id="macro-18">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 18</span>
              <span class="macro-name">Clinical Evidence Request - Skipped Dose</span>
            </div>
            <div class="macro-tags">
              <span class="tag purple">Titration Query</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Patient indicates they skipped a dose during titration and you need to understand why.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Dear &lt;&lt;Patient Name&gt;&gt;,

Thank you for your order.

We noticed that you indicated skipping a dose during your treatment. To ensure we prescribe the most appropriate dose for you, could you please let us know:

• Why did you skip the dose?
• Did you experience any side effects?
• How did you feel after missing the dose?

This information will help us determine whether to continue at your current dose level or adjust your treatment plan.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        <!-- Macro 19 - Did Not Titrate Up -->
        <div class="macro-card" id="macro-19">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 19</span>
              <span class="macro-name">Clinical Did Not Titrate Up</span>
            </div>
            <div class="macro-tags">
              <span class="tag purple">Titration Query</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Patient should have titrated up but has ordered the same dose again.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Dear &lt;&lt;Patient Name&gt;&gt;,

Thank you for your order.

We noticed that you have ordered the same dose as your previous prescription rather than titrating up to the next dose level. Before we proceed, could you please confirm why you wish to stay at your current dose?

• Are you experiencing any side effects at this dose?
• Do you prefer to remain on this dose for any particular reason?

Please let us know so we can ensure we prescribe the most appropriate treatment for you.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        <!-- Macro 20 - Went Down in Dose -->
        <div class="macro-card" id="macro-20">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 20</span>
              <span class="macro-name">Clinical Went Down in Dose</span>
            </div>
            <div class="macro-tags">
              <span class="tag purple">Titration Query</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Patient has ordered a lower dose than their previous prescription.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Dear &lt;&lt;Patient Name&gt;&gt;,

Thank you for your order.

We noticed that you have ordered a lower dose than your previous prescription. Before we proceed, could you please let us know:

• Why do you wish to reduce your dose?
• Did you experience any side effects at the higher dose?
• How severe were these side effects?

This will help us determine whether reducing your dose is the best approach, or whether there are other options to help manage any side effects.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        </div>
        <!-- End Titration Macros Sub-panel -->

        <!-- ID/Photos Verification Macros Sub-panel -->
        <div class="sub-panel" data-subpanel="verification-macros">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--text);">ID &amp; Photo Verification Macros</h3>

        <!-- Macro 21 - Failed ID (automated reference) -->
        <div class="macro-card" id="macro-21">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 21</span>
              <span class="macro-name">Failed ID Email (Automated)</span>
            </div>
            <div class="macro-tags">
              <span class="tag gray">Automated</span>
              <span class="tag blue">Reference Only</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Note:</strong> This email is sent automatically by the system when ID verification fails. Provided for reference only.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Automated Email (Reference)</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">[This is an automated system email sent when ID verification fails]

Subject: ID Verification Required

Dear Customer,

Unfortunately, we were unable to verify your identity from the documents you provided. This may be because the image was unclear, the document was expired, or the details didn't match our records.

Please log in to your account and upload a new photo of a valid ID document (passport, driving licence, or national ID card).

Kind regards,
MedExpress</pre>
            </div>
          </div>
        </div>

        <!-- Macro 22 - Weight Verification Failed -->
        <div class="macro-card" id="macro-22">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 22</span>
              <span class="macro-name">Weight Verification Failed (Automated)</span>
            </div>
            <div class="macro-tags">
              <span class="tag gray">Automated</span>
              <span class="tag blue">Reference Only</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Note:</strong> This email is sent automatically when weight photo verification fails. Provided for reference only.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Automated Email (Reference)</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">[This is an automated system email sent when weight photo fails verification]

Subject: Weight Verification Photo Required

Dear Customer,

Unfortunately, we were unable to verify your weight from the photo you provided. For us to proceed with your order, we need a clear photo that shows your full body.

Please upload a new photo that:
• Shows your full body (head to toe)
• Is taken in fitted clothing
• Has good lighting
• Is clear and not blurry

Kind regards,
MedExpress</pre>
            </div>
          </div>
        </div>

        </div>
        <!-- End ID/Photos Verification Macros Sub-panel -->

        <!-- Weight Changes Macros Sub-panel -->
        <div class="sub-panel" data-subpanel="weight-macros">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--text);">Weight Changes Macros</h3>

        <!-- Macro 23 - Weight Increased -->
        <div class="macro-card" id="macro-23">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 23</span>
              <span class="macro-name">Weight Has Increased</span>
            </div>
            <div class="macro-tags">
              <span class="tag orange">Weight Query</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Repeat patient's weight has increased since their last order.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Dear &lt;&lt;Patient Name&gt;&gt;,

Thank you for your recent order.

We noticed that your weight has increased since your last order. Before we proceed with your prescription, we wanted to check in with you:

• Have you experienced any changes in your lifestyle or diet recently?
• Have you been taking your medication as prescribed?
• Have you experienced any issues with the medication?

Please let us know so we can ensure your treatment plan is still appropriate for you.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        <!-- Macro 24 - Rapid Weight Loss -->
        <div class="macro-card" id="macro-24">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 24</span>
              <span class="macro-name">Rapid Weight Loss Query</span>
            </div>
            <div class="macro-tags">
              <span class="tag red">Safety Check</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Patient appears to be losing weight too rapidly (more than expected for their dose/duration).
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Dear &lt;&lt;Patient Name&gt;&gt;,

Thank you for your order.

We noticed that you appear to be losing weight quite rapidly. While this medication can be very effective, we want to make sure your weight loss is healthy and sustainable.

Could you please let us know:

• Are you eating regular meals?
• Are you experiencing any side effects such as nausea, vomiting, or loss of appetite?
• How are you feeling generally?

Healthy weight loss is typically around 1-2 lbs per week. If you're losing more than this, we may need to review your treatment plan.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        </div>
        <!-- End Weight Changes Macros Sub-panel -->

        <!-- Nevolat Macros Sub-panel -->
        <div class="sub-panel" data-subpanel="nevolat-macros">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--text);">Nevolat Titration Macros</h3>

        <!-- Macro 25 - Nevolat New Patient Titration -->
        <div class="macro-card" id="macro-25">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 25</span>
              <span class="macro-name">Nevolat Titration Guidance (New Patients)</span>
            </div>
            <div class="macro-tags">
              <span class="tag teal">Nevolat</span>
              <span class="tag green">New Patient</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> New patient starting Nevolat who needs titration guidance.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Subject: Your tailored Nevolat guidance

Hi &lt;&lt;Patient First Name&gt;&gt;,

We hope you're well and thank you for trusting MedExpress with your weight loss journey.

Your prescription for Nevolat has now been issued and being sent to our dispensary for dispatch!

We'd like to make sure you have everything you need to start safely and confidently.

Section 1: Your Dose

The dose of Nevolat you receive depends on the volume of liquid injected. During the first 4 weeks of treatment, you will increase the dose of Nevolat each week by increasing the volume of liquid you inject.

IMPORTANT: Nevolat is injected ONCE DAILY (not weekly like Wegovy/Mounjaro)

Your Weekly Titration Schedule:

Week 1: 0.6mg per day (inject EVERY DAY for 7 days)
Week 2: 1.2mg per day (inject EVERY DAY for 7 days)
Week 3: 1.8mg per day (inject EVERY DAY for 7 days)
  Note: If you cannot select your full dose on your pen, it does not contain enough medication. Use your next pen and select the dose from there.
Week 4: 2.4mg per day (inject EVERY DAY for 7 days)
  Note: You will need to start using the 3rd pen in your pack this week.
Week 5 and onwards: 3mg per day (MAINTENANCE DOSE)
  Continue to use this dose steadily throughout your treatment.
  If you ordered a 3 pen starter pack, your 3rd pen will run out in week 5 and you will need to order more pens.

Section 2: How to Use Your Nevolat Pen

You can find clear video guides and written instructions on the official Nevolat website:
https://liraglutide.co.uk/nevolat-patient/taking-nevolat/how-to-prepare-your-pen

On this page you will find short videos and information covering:
• How to prepare and use your pen correctly
• How to store it safely
• What to do if you miss a dose

Critical Reminders:
• Inject ONCE DAILY at the same time each day
• Dose depends on volume of liquid injected (see pen dial)
• Do NOT exceed 3.0mg once daily
• Rotate injection sites (thigh, abdomen, upper arm)
• If you miss a dose and it's within 12 hours, take it as soon as possible; otherwise, skip it and continue the next day

If you have any questions or would like to discuss your treatment further, please contact our support team.

Thank you for your continued trust in our service. We're here to make your GLP-1 journey as smooth and safe as possible.

Warm regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        <!-- Macro 26 - Nevolat Switching from Wegovy/Mounjaro -->
        <div class="macro-card" id="macro-26">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 26</span>
              <span class="macro-name">Nevolat Switching Guidance</span>
            </div>
            <div class="macro-tags">
              <span class="tag teal">Nevolat</span>
              <span class="tag orange">Switching</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Patient switching to Nevolat from Wegovy or Mounjaro.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Subject: Your tailored Nevolat guidance

Hi &lt;&lt;Patient First Name&gt;&gt;,

We hope you're well.

Your prescription for Nevolat has now been issued and being sent to our dispensary for dispatch!

We'd like to make sure you have everything you need to start safely and confidently.

Section 1: Your Dose

As you are able to tolerate GLP1s, we are pleased to inform you that you do not need to start on the lowest dose of Nevolat.

Please set your Nevolat pen to the following dose: &lt;&lt;INSERT PATIENT-SPECIFIC DOSE&gt;&gt;

This dose matches your previous treatment step, so you can continue your weight loss journey without interruption.

If you experience any new or unexpected side effects, please contact us or your clinician promptly.

A week after you have been on this dose, please increase your dose to the next dose in 0.6mg increments.

For example, if you are now on 1.8mg, on your next week of Nevolat increase to 2.4mg and the following week to 3mg, until you reach 3mg (maximum dose).

Section 2: How to Use Your Nevolat Pen

You can find clear video guides and written instructions on the official Nevolat website:
https://liraglutide.co.uk/nevolat-patient/taking-nevolat/how-to-prepare-your-pen

On this page you will find short videos and information covering:
• How to prepare and use your pen correctly
• How to store it safely
• What to do if you miss a dose

Section 3: Switching to Nevolat

It's really important to make sure that you are not taking 2 GLP-1 medications at the same time. Because you are switching from a weekly injection to a DAILY injection, please make sure you do not start your Nevolat pen until you are due to take your next weekly injection. Then, you can transition smoothly to injecting Nevolat daily safely.

Critical Reminders:
• Nevolat is injected ONCE DAILY (not weekly like Wegovy/Mounjaro)
• Start first Nevolat dose when your next weekly injection would be due
• Do NOT take both medications together
• Do NOT exceed 3.0mg once daily

If you have any questions or would like to discuss your treatment further, please contact our support team.

Thank you for your continued trust in our service. We're here to make your GLP-1 journey as smooth and safe as possible.

Warm regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        <!-- Macro 27 - Nevolat Maintenance Dose -->
        <div class="macro-card" id="macro-27">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 27</span>
              <span class="macro-name">Nevolat Maintenance Dose (3mg)</span>
            </div>
            <div class="macro-tags">
              <span class="tag teal">Nevolat</span>
              <span class="tag green">Maintenance</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Patient on Nevolat has reached the maintenance dose of 3mg daily.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Dear &lt;&lt;Patient Name&gt;&gt;,

Congratulations on reaching your Nevolat maintenance dose!

You are now on the maximum dose of Nevolat: 3mg once daily.

Important reminders:
• Continue injecting 3mg EVERY DAY at the same time
• Do NOT exceed 3.0mg once daily
• Rotate injection sites (thigh, abdomen, upper arm)
• Continue monitoring your weight and side effects

This is your maintenance dose - you should stay at 3mg daily unless advised otherwise by your clinician.

You can find clear video guides and written instructions on the official Nevolat website:
https://liraglutide.co.uk/nevolat-patient/taking-nevolat/how-to-prepare-your-pen

If you have any questions or concerns, please contact us.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        <!-- Macro 28 - Thyroid/Liver Disease Rejection for Nevolat -->
        <div class="macro-card" id="macro-28">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 28</span>
              <span class="macro-name">Rejection: Thyroid/Liver Disease (Nevolat Contraindication)</span>
            </div>
            <div class="macro-tags">
              <span class="tag red">Rejection</span>
              <span class="tag teal">Nevolat</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Rejecting Nevolat order due to thyroid or liver disease. Patient CAN use Mounjaro or Wegovy instead.
            </div>
            <div class="macro-info-box">
              <div class="info-title">🚨 CRITICAL SAFETY INFORMATION</div>
              <p>Nevolat (liraglutide) is specifically contraindicated for patients with ANY thyroid disease or liver disease/impairment. This is a medication-specific restriction that does NOT apply to Mounjaro (tirzepatide) or Wegovy (semaglutide).</p>
              <p><strong>Patient CAN still use GLP-1 medications</strong> - just not Nevolat. Offer Mounjaro or Wegovy as alternatives.</p>
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Dear &lt;&lt;Patient Name&gt;&gt;,

Thank you for your order with MedExpress.

After reviewing your medical history, we regret to inform you that we cannot prescribe Nevolat at this time.

Our records show you have &lt;&lt;thyroid disease/liver disease/liver impairment&gt;&gt;. Nevolat (liraglutide) is specifically contraindicated for patients with thyroid or liver conditions.

GOOD NEWS: You CAN still use GLP-1 medications for weight loss!

We can prescribe either:
• Mounjaro (tirzepatide), OR
• Wegovy (semaglutide)

These medications are equally effective for weight loss and do NOT have the same thyroid/liver restriction.

What to do next:
1. Place a new order on our website
2. Select either Mounjaro or Wegovy from the Choose Treatment Page
3. Choose the appropriate starter dose for your situation
4. Your order will be reviewed and processed normally

If you have any questions about which medication to choose, or need help placing a new order, please don't hesitate to contact our Customer Support team on 0208 123 0508 or reply to this email.

We look forward to supporting you on your weight loss journey with the right medication for your needs.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
            <div class="macro-decision-guide">
              <div class="decision-section reject">
                <div class="decision-title">❌ REJECT Nevolat if patient has:</div>
                <ul>
                  <li>ANY thyroid disease (hypothyroidism, hyperthyroidism, thyroid nodules, etc.)</li>
                  <li>ANY liver disease or liver impairment</li>
                  <li>Taking levothyroxine or other thyroid medications</li>
                  <li>History of thyroid/liver conditions even if currently managed</li>
                </ul>
              </div>
              <div class="decision-section approve">
                <div class="decision-title">✅ Patient CAN receive:</div>
                <ul>
                  <li>Mounjaro (tirzepatide) - NO thyroid/liver restriction</li>
                  <li>Wegovy (semaglutide) - NO thyroid/liver restriction</li>
                  <li>Direct patient to place new order with correct medication</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        </div>
        <!-- End Nevolat Macros Sub-panel -->

        <!-- Rejection Macros Sub-panel -->
        <div class="sub-panel" data-subpanel="rejection-macros">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--text);">Rejection Macros</h3>
        
        <div class="info-card red" style="margin-bottom: 20px;">
          <div class="info-card-title">Important: Rejection Emails</div>
          <div class="info-card-text">Rejection emails to repeat patients are reviewed by the Brand Team for sensitive communication. Always include specific contraindication reason found.</div>
        </div>

        <!-- Macro 27 - Standard Rejection -->
        <div class="macro-card" id="macro-27">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 27</span>
              <span class="macro-name">Standard Rejection - New Patient</span>
            </div>
            <div class="macro-tags">
              <span class="tag red">Rejection</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Rejecting a new patient due to contraindication.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Dear &lt;&lt;Patient Name&gt;&gt;,

Thank you for your order.

Unfortunately, after reviewing your medical information, we are unable to prescribe this medication to you at this time.

This decision was made because [INSERT CONTRAINDICATION REASON].

Your order will be cancelled and a full refund will be processed automatically.

We recommend discussing weight management options with your GP, who can provide personalised advice based on your full medical history.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        <!-- Macro 28 - Side Effects Rejection -->
        <div class="macro-card" id="macro-28">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 28</span>
              <span class="macro-name">Side Effects Query</span>
            </div>
            <div class="macro-tags">
              <span class="tag purple">Side Effects</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Patient reports experiencing side effects and needs guidance.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Dear &lt;&lt;Patient Name&gt;&gt;,

Thank you for letting us know about the side effects you're experiencing.

The side effects you've described ([INSERT SIDE EFFECTS]) are [common/less common] with this medication.

[For common side effects:]
These usually improve within the first few weeks of treatment. We recommend:
• Eating smaller, more frequent meals
• Staying hydrated
• Avoiding fatty or spicy foods
• Taking your medication in the evening if nausea is an issue

[For concerning side effects:]
Given the symptoms you've described, we recommend speaking with your GP or contacting NHS 111 for further advice.

Please let us know if your symptoms persist or worsen.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        <!-- Macro 29 - Minor SES Injection Site -->
        <div class="macro-card" id="macro-29">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 29</span>
              <span class="macro-name">Minor SES - Injection Site Reaction</span>
            </div>
            <div class="macro-tags">
              <span class="tag purple">Side Effects</span>
              <span class="tag blue">Minor</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Patient reports injection site reactions (redness, swelling, pain at injection site).
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Dear &lt;&lt;Patient Name&gt;&gt;,

Thank you for getting in touch about your injection site reaction.

Mild reactions at the injection site such as redness, swelling, or discomfort are common and usually resolve on their own within a few days.

To help reduce injection site reactions:
• Rotate your injection sites (thigh, abdomen, upper arm)
• Allow the medication to reach room temperature before injecting
• Ensure the injection site is clean and dry
• Apply a cold compress after injecting if needed

If the reaction persists for more than a week, spreads beyond the injection site, or you develop signs of infection (increasing redness, warmth, pus, or fever), please contact your GP.

Kind regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        <!-- Macro 30 - Photo Requirements -->
        <div class="macro-card" id="macro-30">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 30</span>
              <span class="macro-name">Photo Requirements Not Met</span>
            </div>
            <div class="macro-tags">
              <span class="tag orange">Verification</span>
              <span class="tag blue">Photos</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Patient's uploaded photo does not meet the requirements for prescribing (unclear, oversized clothing, not showing full body, etc.).
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Hello &lt;&lt;Patient Name&gt;&gt;,

Thank you for your recent order with MedExpress.

Unfortunately the photo uploaded did not meet our requirements to prescribe. Please respond to this email with a new photo which meets the following requirements:

• Shows your current body shape in fitted clothing - please do not wear oversized clothing.
• Pictures you standing, facing the camera, head to toes.
• Shows your face clearly in good lighting and without sunglasses.
• Is not edited or retouched.

You may also wish to include a photo showing your side profile as well as one facing forward. This will provide our prescribers with additional evidence to assess your eligibility for treatment.

Please reply directly to this email with the attached photo(s), and we will promptly upload it to your patient account.

Patient safety is our top priority. This photo will only be used to assess prescription eligibility by our clinical team and will not be shared anywhere else. Rest assured, we adhere strictly to the guidelines outlined in the Data Protection Act 1998 and GDPR. We maintain a rigorous confidentiality policy and do not disclose any personal information to third parties.

If you need further assistance, you can also call our Customer Support team on 0208 123 0508.

Your order will be placed on hold whilst we await your response.

Kind Regards,
MedExpress Clinical Team</pre>
            </div>
          </div>
        </div>

        <!-- Macro 31 - Breast Cancer History -->
        <div class="macro-card" id="macro-31">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Macro 31</span>
              <span class="macro-name">Breast Cancer History Clarification</span>
            </div>
            <div class="macro-tags">
              <span class="tag purple">Cancer</span>
              <span class="tag blue">Clarification</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Patient has breast cancer history in their SCR. This requires further information, NOT automatic rejection. Email patient to confirm current cancer status and treatment details before prescribing.
            </div>
            <div class="macro-info-box">
              <div class="info-title">📋 What the SOP Requires</div>
              <p>The SOP flags "any cancer diagnosis (excluding MEN2 or medullary thyroid cancer)" as a condition requiring clarification on whether the cancer is active and if oncology is still involved.</p>
              <p><strong>GLP-1 may be prescribed if:</strong></p>
              <ul>
                <li>Cancer is in remission</li>
                <li>Patient is NOT on active chemotherapy/radiotherapy or under current oncology care</li>
                <li>Patient remains on hormone therapy only (e.g., tamoxifen until 2027) - this is permitted</li>
              </ul>
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Email Template</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">Subject: Follow-Up on Your Breast Cancer Medical History

Dear &lt;&lt;Patient Name&gt;&gt;,

Thank you for your recent order with MedExpress. We have reviewed your medical history and would like to clarify some information regarding your breast cancer diagnosis before we can proceed with your prescription.

Could you please confirm the following:

1. Are you currently under the care of an oncology team for your breast cancer?

2. Are you receiving any active cancer treatments now or planned soon? (e.g., chemotherapy, radiotherapy, targeted therapy)

3. Are you on long-term hormone therapy only (e.g., tamoxifen, Zoladex)? If so, has there been any recent recurrence or spread of the cancer?

Please note that being on long-term hormone therapy alone does not prevent us from prescribing GLP-1 medication, as long as you are not receiving active cancer treatment and are not currently under oncology care.

Your response will help us ensure that this medication is safe and appropriate for you.

Thank you for choosing MedExpress to support you on your weight loss journey. We look forward to hearing from you soon.

Kind regards,
&lt;&lt;Your Name&gt;&gt;
&lt;&lt;Your Role&gt;&gt;
MedExpress Clinical Team</pre>
            </div>
            <div class="macro-decision-guide">
              <div class="decision-section reject">
                <div class="decision-title">❌ REJECT if patient confirms:</div>
                <ul>
                  <li>Currently under oncology care</li>
                  <li>Receiving active cancer treatment (chemotherapy, radiotherapy, targeted therapy)</li>
                  <li>Recent recurrence or spread of cancer</li>
                </ul>
              </div>
              <div class="decision-section approve">
                <div class="decision-title">✅ PRESCRIBE if patient confirms:</div>
                <ul>
                  <li>Cancer is in remission and discharged from oncology team</li>
                  <li>On long-term hormone therapy only (tamoxifen/Zoladex) with no active treatment</li>
                  <li>No recent recurrence or current oncology involvement</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        </div>
        <!-- End Rejection Macros Sub-panel -->

        </div>
        <!-- End Email Macros Tab Panel -->

        <!-- Tab Content: Documentation Notes -->
        <div class="tab-panel" data-panel="doc-notes">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--text);">Documentation Notes</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">Standard notes to add to patient records after SCR checks.</p>

        <!-- Doc Note: SCR Pass -->
        <div class="macro-card" id="doc-scr-pass">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Doc</span>
              <span class="macro-name">SCR Pass - No Contraindications</span>
            </div>
            <div class="macro-tags">
              <span class="tag green">Approve</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Scraping tool passed or SCR checked manually with no contraindications found.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Patient Note</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">SCR pass - no contraindications to GLP1s

Patient ID and Weight verification photo reviewed, eligible for medication according to information provided and no contraindications flagged by scraping tool. Prescription issued.</pre>
            </div>
          </div>
        </div>

        <!-- Doc Note: SCR Checked -->
        <div class="macro-card" id="doc-scr-checked">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Doc</span>
              <span class="macro-name">SCR Checked - No Contraindications</span>
            </div>
            <div class="macro-tags">
              <span class="tag green">Approve</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Scraping tool flagged keyword but after reviewing SCR, no contraindications found.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Patient Note</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">SCR checked - no contraindications to GLP1s

Patient ID and Weight verification photo reviewed, eligible for medication according to information provided and no contraindications found on SCR consultation. Prescription issued.</pre>
            </div>
          </div>
        </div>

        <!-- Doc Note: Absolute Contraindication -->
        <div class="macro-card" id="doc-scr-reject">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Doc</span>
              <span class="macro-name">Absolute Contraindication Found</span>
            </div>
            <div class="macro-tags">
              <span class="tag red">Reject</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Absolute contraindication found on SCR. Add as CRITICAL note.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Patient Note (CRITICAL)</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">SCR checked - [CONTRAINDICATION REASON] - [DATE NOTED IN SCR]

Absolute rejection reason found on SCR.

Patient ID and Weight verification photo reviewed, not eligible for medication according to information found on SCR consultation. Contraindication found - [REASON].</pre>
            </div>
          </div>
        </div>

        <!-- Doc Note: Further Info Needed -->
        <div class="macro-card" id="doc-scr-hold">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Doc</span>
              <span class="macro-name">Further Information Needed</span>
            </div>
            <div class="macro-tags">
              <span class="tag orange">Hold</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> Need more information from patient before making decision.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Patient Note</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">SCR checked - further information needed - email sent [ADD ZENDESK LINK]

Tag changed to "Pending Customer Response"</pre>
            </div>
          </div>
        </div>

        <!-- Doc Note: SCR Unavailable -->
        <div class="macro-card" id="doc-scr-unavail">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Doc</span>
              <span class="macro-name">SCR Unavailable</span>
            </div>
            <div class="macro-tags">
              <span class="tag blue">Proceed</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> No SCR found for patient. Proceed with standard prescribing. Do NOT hold or email patient.
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Patient Note</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">SCR unavailable

Proceed according to standard prescription SOP. No hold/email purely for missing SCR.</pre>
            </div>
          </div>
        </div>

        <!-- Doc Note: SCR Limited -->
        <div class="macro-card" id="doc-scr-limited">
          <div class="macro-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="macro-title">
              <span class="macro-number">Doc</span>
              <span class="macro-name">SCR Limited</span>
            </div>
            <div class="macro-tags">
              <span class="tag blue">Proceed</span>
            </div>
            <svg class="macro-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div class="macro-content">
            <div class="macro-description">
              <strong>Use when:</strong> SCR available but has limited information (locked/restricted).
            </div>
            <div class="macro-template">
              <div class="macro-template-header">
                <span>Patient Note</span>
                <button class="copy-btn" onclick="copyMacro(this)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  Copy
                </button>
              </div>
              <pre class="macro-text">SCR checked but limited - no contraindications to GLP1 found

Proceed according to standard prescription SOP. Hold only if specific information is required about a condition/medication.</pre>
            </div>
          </div>
        </div>

        </div>
        <!-- End Documentation Notes Tab Panel -->

      </div>
    `;
  },

  getTransferContent() {
    return `
      <div class="protocol-page">
        <div class="back-btn" data-page="dashboard" style="margin-bottom: 20px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Dashboard
        </div>

        <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 12px;">Transfer Patients</h1>
        <p style="font-size: 15px; color: var(--text-secondary); margin-bottom: 32px; line-height: 1.6;">New MedExpress patients with previous GLP-1 use from another private provider</p>

        <div class="info-card red" style="margin-bottom: 24px;">
          <div class="info-card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px !important; height: 20px !important;">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>
            </svg>
            NHS Transfers NOT Allowed
          </div>
          <div class="info-card-text">Transfer patients must have previous GLP-1 use from another <strong>private provider</strong>. NHS-prescribed GLP-1 patients cannot transfer to MedExpress.</div>
        </div>

        <!-- Tabs -->
        <div class="protocol-tabs" style="margin-bottom: 24px;">
          <button class="protocol-tab active" data-tab="overview">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
            Overview & Rules
          </button>
          <button class="protocol-tab" data-tab="above">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            Above Licence (BMI ≥27)
          </button>
          <button class="protocol-tab" data-tab="below">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>
            </svg>
            Below Licence (BMI <27)
          </button>
        </div>

        <!-- Tab: Overview -->
        <div class="protocol-tab-content active" data-tab-content="overview">

        <div class="protocol-card">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--accent); flex-shrink: 0;">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <strong>BMI-Based Requirements</strong>
          </div>

          <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-elevated); border-radius: 8px; border-left: 3px solid var(--accent);">
            <strong>Assessment Rule:</strong> Requirements depend on the patient's <strong>current BMI</strong>. Check their BMI first, then verify appropriate evidence.
          </div>

          <div class="table-wrapper">
            <table class="dose-table" style="margin-top: 16px;">
              <tr>
                <th style="width: 20%;">Current BMI</th>
                <th style="width: 40%;">Required Evidence</th>
                <th style="width: 40%;">Action if Evidence Missing/Fails</th>
              </tr>
            <tr>
              <td><strong style="color: var(--success);">BMI ≥27</strong><br><span style="font-size: 12px; color: var(--text-secondary);">(Above licence threshold)</span></td>
              <td>
                <strong>Proof of Previous GLP-1 Supply (PUE)</strong><br>
                <span style="font-size: 12px; color: var(--text-secondary);">Just PUE needed — no previous BMI photo required</span>
              </td>
              <td>
                If no PUE provided → Customer Care can amend order to starter dose<br>
                <span style="font-size: 12px; color: var(--accent);">Message: <strong>ME-Clinical-Communication</strong> Slack channel</span>
              </td>
            </tr>
            <tr>
              <td><strong style="color: var(--danger);">BMI &lt;27</strong><br><span style="font-size: 12px; color: var(--text-secondary);">(Below licence threshold)</span></td>
              <td>
                <strong>BOTH required:</strong><br>
                1️⃣ Proof of Previous GLP-1 Supply (PUE)<br>
                2️⃣ Previous BMI Photo showing BMI ≥27
              </td>
              <td>
                <strong style="color: var(--danger);">Cannot proceed without BOTH</strong><br>
                If either missing → Patient NOT eligible<br>
                <span style="font-size: 12px;">Use <a href="#macro-13" onclick="navigateToMacro(13); return false;" class="tag blue">Macro 13: PUE/Transfer Evidence</a> or <a href="#macro-15" onclick="navigateToMacro(15); return false;" class="tag blue">Macro 15: Starting BMI</a></span>
              </td>
            </tr>
            </table>
          </div>
        </div>

        <div class="protocol-card" style="margin-top: 20px;">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--success); flex-shrink: 0;">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
            <strong>Acceptable Proof of Previous Supply (PUE)</strong>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 16px;">
            <div style="padding: 16px; background: var(--bg-elevated); border-radius: 8px; border-left: 3px solid var(--success);">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; color: var(--success);">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <strong>Prescription Label</strong>
              </div>
              <div style="font-size: 13px; color: var(--text-secondary);">From previous provider showing medication name and date</div>
            </div>

            <div style="padding: 16px; background: var(--bg-elevated); border-radius: 8px; border-left: 3px solid var(--success);">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; color: var(--success);">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <strong>Order Confirmation</strong>
              </div>
              <div style="font-size: 13px; color: var(--text-secondary);">Email from previous private provider</div>
            </div>

            <div style="padding: 16px; background: var(--bg-elevated); border-radius: 8px; border-left: 3px solid var(--success);">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; color: var(--success);">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <strong>Pharmacy Receipt</strong>
              </div>
              <div style="font-size: 13px; color: var(--text-secondary);">Showing GLP-1 medication purchase</div>
            </div>

            <div style="padding: 16px; background: var(--bg-elevated); border-radius: 8px; border-left: 3px solid var(--success);">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; color: var(--success);">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <strong>Medication Photo</strong>
              </div>
              <div style="font-size: 13px; color: var(--text-secondary);">Box/pen with patient's name visible</div>
            </div>

            <div style="padding: 16px; background: var(--bg-elevated); border-radius: 8px; border-left: 3px solid var(--success);">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; color: var(--success);">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <strong>Prescription Record</strong>
              </div>
              <div style="font-size: 13px; color: var(--text-secondary);">From previous provider's system</div>
            </div>
          </div>

          <div class="info-card red" style="margin-top: 20px;">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px;">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <strong>NHS Transfers Prohibited:</strong> Patients previously receiving GLP-1 via NHS prescription <strong>cannot</strong> transfer to private MedExpress treatment. They must continue with the NHS pathway.
              </div>
            </div>
          </div>
        </div>

        <div class="protocol-card" style="margin-top: 20px;">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--purple); flex-shrink: 0;">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
            <strong>Previous BMI Photo Requirements (BMI &lt;27 only)</strong>
          </div>

          <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-elevated); border-radius: 8px; border-left: 3px solid var(--purple);">
            <strong>When Required:</strong> Only for patients with <strong>current BMI &lt;27</strong>. Must prove they started treatment with BMI ≥27.
          </div>

          <div style="margin-top: 16px;">
            <strong style="display: block; margin-bottom: 12px;">Photo Must Show:</strong>
            <div class="table-wrapper">
              <table class="dose-table">
                <tr>
                  <th style="width: 30%;">Requirement</th>
                  <th style="width: 70%;">Details</th>
                </tr>
              <tr>
                <td><strong>Full Body on Scales</strong></td>
                <td>Patient must be standing on weighing scales with full body visible</td>
              </tr>
              <tr>
                <td><strong>Clear Scale Display</strong></td>
                <td>Weight reading must be clearly visible and legible</td>
              </tr>
              <tr>
                <td><strong>Date Visible</strong></td>
                <td>Within last 12 months, ideally when they started GLP-1 treatment</td>
              </tr>
              <tr>
                <td><strong>Patient Identifiable</strong></td>
                <td>Must be able to confirm it's the same patient</td>
              </tr>
              <tr>
                <td><strong>BMI ≥27 Verified</strong></td>
                <td>Calculate BMI from visible weight and stated height — must be ≥27</td>
              </tr>
              </table>
            </div>
          </div>

          <div class="info-card orange" style="margin-top: 20px;">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px;">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <path d="M12 9v4M12 17h.01"/>
              </svg>
              <div>
                <strong>If Previous BMI Photo Fails:</strong><br>
                1. Add tag: <span style="display: inline-block; margin: 4px 4px; padding: 3px 8px; background: var(--purple-bg); color: var(--purple); border-radius: 4px; font-size: 11px; font-weight: 600;">previous BMI verification failed</span><br>
                2. Remove tag: <span style="display: inline-block; margin: 4px 4px; padding: 3px 8px; background: var(--accent-bg); color: var(--accent); border-radius: 4px; font-size: 11px; font-weight: 600;">prescriber review</span><br>
                3. Send <a href="#macro-13" onclick="navigateToMacro(13); return false;" class="tag blue" style="margin: 2px 0;">Macro 13: PUE/Transfer Evidence</a> or <a href="#macro-15" onclick="navigateToMacro(15); return false;" class="tag blue" style="margin: 2px 0;">Macro 15: Starting BMI</a><br>
                <strong style="color: var(--danger);">⚠️ Do NOT use "Weight verification failed" tag</strong> — that's only for current weight photos
              </div>
            </div>
          </div>
        </div>

        <div class="protocol-card" style="margin-top: 20px;">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--success); flex-shrink: 0;">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <strong>Transfer Patient Checklist</strong>
          </div>

          <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-elevated); border-radius: 8px;">
            Complete all checks below in addition to standard core protocol checks:
          </div>

          <div style="display: grid; gap: 12px; margin-top: 16px;">
            <div style="display: flex; align-items: start; gap: 12px; padding: 12px; background: var(--bg-elevated); border-radius: 8px;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--success); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 700; font-size: 12px;">1</div>
              <div>
                <strong>Verify Proof of Previous GLP-1 Supply (PUE)</strong><br>
                <span style="font-size: 13px; color: var(--text-secondary);">Must be from private provider (see acceptable evidence list above)</span>
              </div>
            </div>

            <div style="display: flex; align-items: start; gap: 12px; padding: 12px; background: var(--bg-elevated); border-radius: 8px;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--success); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 700; font-size: 12px;">2</div>
              <div>
                <strong>Check Current BMI Eligibility</strong><br>
                <span style="font-size: 13px; color: var(--text-secondary);">Determine if BMI ≥27 or &lt;27 to know evidence requirements</span>
              </div>
            </div>

            <div style="display: flex; align-items: start; gap: 12px; padding: 12px; background: var(--bg-elevated); border-radius: 8px;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--success); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 700; font-size: 12px;">3</div>
              <div>
                <strong>If BMI &lt;27: Verify Previous BMI Photo</strong><br>
                <span style="font-size: 13px; color: var(--text-secondary);">Must show patient on scales with BMI ≥27 when they started treatment</span>
              </div>
            </div>

            <div style="display: flex; align-items: start; gap: 12px; padding: 12px; background: var(--bg-elevated); border-radius: 8px;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--success); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 700; font-size: 12px;">4</div>
              <div>
                <strong>Confirm NOT NHS Transfer</strong><br>
                <span style="font-size: 13px; color: var(--text-secondary);">Verify previous supply was from private provider only</span>
              </div>
            </div>

            <div style="display: flex; align-items: start; gap: 12px; padding: 12px; background: var(--bg-elevated); border-radius: 8px;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--success); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 700; font-size: 12px;">5</div>
              <div>
                <strong>Verify Dose Appropriateness</strong><br>
                <span style="font-size: 13px; color: var(--text-secondary);">Check dose is suitable for transfer patient (refer to Titration & Gap protocol)</span>
              </div>
            </div>

            <div style="display: flex; align-items: start; gap: 12px; padding: 12px; background: var(--bg-elevated); border-radius: 8px;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--success); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 700; font-size: 12px;">6</div>
              <div>
                <strong>Complete Standard Verification Checks</strong><br>
                <span style="font-size: 13px; color: var(--text-secondary);">ID verification, age check, photo verification, GP notification consent</span>
              </div>
            </div>
          </div>

          <div style="margin-top: 20px; padding: 14px; background: var(--accent-bg); border-radius: 8px; border-left: 3px solid var(--accent);">
            <strong>✓ Next Steps:</strong> Once all transfer patient checks are complete, proceed to <strong>Core Checks</strong>, <strong>Previous Use Evidence</strong>, and <strong>Titration & Gap</strong> protocols as needed.
          </div>
        </div>
        </div>

        <!-- Tab: Above Licence -->
        <div class="protocol-tab-content" data-tab-content="above">
          <div class="info-card green" style="margin-bottom: 24px;">
            <div class="info-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px !important; height: 20px !important;">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              Transfer Patient: Above Licence (BMI ≥27)
            </div>
            <div class="info-card-text">Patient has current BMI ≥27 (above licence threshold). Only proof of previous use (PUE) required — no starting BMI photo needed.</div>
          </div>

          <div class="protocol-card">
            <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--success); flex-shrink: 0;">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              <strong>Requirements Summary</strong>
            </div>
            <div class="table-wrapper" style="margin-top: 16px;">
              <table class="dose-table">
                <tr>
                  <th style="width: 30%;">Requirement</th>
                  <th style="width: 70%;">Details</th>
                </tr>
                <tr>
                  <td><strong>Current BMI</strong></td>
                  <td>≥30 kg/m² (or ≥27 with comorbidity, or ≥27.5 with eligible ethnicity). Max 60.</td>
                </tr>
                <tr>
                  <td><strong>PUE Required</strong></td>
                  <td>✅ Yes — must show drug name, dose, date, patient name, regulated provider</td>
                </tr>
                <tr>
                  <td><strong>Previous BMI Photo</strong></td>
                  <td>❌ Not required for above-licence transfers</td>
                </tr>
                <tr>
                  <td><strong>Current Photos</strong></td>
                  <td>✅ Standard weight verification photos required</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="protocol-card" style="margin-top: 20px;">
            <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--accent); flex-shrink: 0;">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              <strong>PUE Timing Rules</strong>
            </div>
            <div class="table-wrapper" style="margin-top: 16px;">
              <table class="dose-table">
                <tr>
                  <th>PUE Age</th>
                  <th>Action</th>
                </tr>
                <tr>
                  <td><strong>&lt;2 weeks old</strong></td>
                  <td>Approve but send <a href="#macro-16" onclick="navigateToMacro(16); return false;" class="tag blue">Macro 16: PUE 2 Weeks Old</a> — patient should finish current course first</td>
                </tr>
                <tr>
                  <td><strong>2 weeks – 6 months</strong></td>
                  <td>✅ Valid for continuation dose</td>
                </tr>
                <tr>
                  <td><strong>&gt;6 months</strong></td>
                  <td>Follow gap-in-treatment guidance for appropriate dose</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="protocol-card" style="margin-top: 20px;">
            <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--orange); flex-shrink: 0;">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>
              </svg>
              <strong>If PUE Missing or Inadequate</strong>
            </div>
            <ul class="protocol-list" style="margin-top: 12px;">
              <li>Send <a href="#macro-14" onclick="navigateToMacro(14); return false;" class="tag blue">Macro 14: Missing Information</a></li>
              <li>Add tag: <span class="tag orange">Pending Customer Response</span></li>
              <li>Place order on hold</li>
              <li><strong>Without valid PUE:</strong> Can only prescribe starter dose (not continuation)</li>
            </ul>
            <div class="info-card blue" style="margin-top: 16px;">
              <div class="info-card-title">Alternative: Amend to Starter</div>
              <div class="info-card-text">Customer Care can amend order to starter dose if patient unable to provide PUE. Message <strong>ME-Clinical-Communication</strong> Slack channel.</div>
            </div>
          </div>

          <div class="protocol-card" style="margin-top: 20px;">
            <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--success); flex-shrink: 0;">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <strong>Approval Checklist</strong>
            </div>
            <div style="display: grid; gap: 8px; margin-top: 16px;">
              <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-elevated); border-radius: 6px;">
                <span style="color: var(--success);">☑</span> Current BMI ≥27 (with applicable adjustments)
              </div>
              <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-elevated); border-radius: 6px;">
                <span style="color: var(--success);">☑</span> Valid PUE from private provider (not NHS)
              </div>
              <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-elevated); border-radius: 6px;">
                <span style="color: var(--success);">☑</span> Dose appropriate for gap-in-treatment
              </div>
              <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-elevated); border-radius: 6px;">
                <span style="color: var(--success);">☑</span> No GLP-1 related hospitalisation
              </div>
              <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-elevated); border-radius: 6px;">
                <span style="color: var(--success);">☑</span> SCR screening completed
              </div>
              <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-elevated); border-radius: 6px;">
                <span style="color: var(--success);">☑</span> Standard verification checks passed (ID, photos, GP)
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Below Licence -->
        <div class="protocol-tab-content" data-tab-content="below">
          <div class="info-card red" style="margin-bottom: 24px;">
            <div class="info-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px !important; height: 20px !important;">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>
              </svg>
              Transfer Patient: Below Licence (BMI &lt;27)
            </div>
            <div class="info-card-text"><strong>High scrutiny required.</strong> Patient has current BMI &lt;27 (below licence threshold). BOTH PUE AND starting BMI photo required to proceed.</div>
          </div>

          <div class="protocol-card">
            <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--danger); flex-shrink: 0;">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>
              </svg>
              <strong>Requirements Summary</strong>
            </div>
            <div class="table-wrapper" style="margin-top: 16px;">
              <table class="dose-table">
                <tr>
                  <th style="width: 30%;">Requirement</th>
                  <th style="width: 70%;">Details</th>
                </tr>
                <tr>
                  <td><strong>Current BMI</strong></td>
                  <td>&lt;27 kg/m² (below licence threshold)</td>
                </tr>
                <tr>
                  <td><strong>PUE Required</strong></td>
                  <td>✅ Yes — must show drug name, dose, date, patient name, regulated provider</td>
                </tr>
                <tr>
                  <td><strong>Previous BMI Photo</strong></td>
                  <td>✅ <strong>REQUIRED</strong> — Must prove starting BMI was ≥27</td>
                </tr>
                <tr>
                  <td><strong>Current Photos</strong></td>
                  <td>✅ Standard weight verification photos required</td>
                </tr>
              </table>
            </div>
            <div class="info-card red" style="margin-top: 16px;">
              <div class="info-card-title">⚠️ Critical Rule</div>
              <div class="info-card-text"><strong>Cannot proceed without BOTH PUE AND previous BMI photo.</strong> If either is missing or fails requirements, patient is NOT eligible.</div>
            </div>
          </div>

          <div class="protocol-card" style="margin-top: 20px;">
            <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--purple); flex-shrink: 0;">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
              </svg>
              <strong>Previous BMI Photo Requirements</strong>
            </div>
            <div style="margin-top: 16px; padding: 12px; background: var(--bg-elevated); border-radius: 8px; border-left: 3px solid var(--purple);">
              Photo must prove patient's BMI was ≥27 when they started GLP-1 treatment
            </div>
            <div class="table-wrapper" style="margin-top: 16px;">
              <table class="dose-table">
                <tr>
                  <th style="width: 30%;">Requirement</th>
                  <th style="width: 70%;">Details</th>
                </tr>
                <tr>
                  <td><strong>Full Body on Scales</strong></td>
                  <td>Patient standing on weighing scales with full body visible</td>
                </tr>
                <tr>
                  <td><strong>Clear Scale Display</strong></td>
                  <td>Weight reading must be clearly visible and legible</td>
                </tr>
                <tr>
                  <td><strong>Date</strong></td>
                  <td>Within last 12 months, ideally when they started GLP-1</td>
                </tr>
                <tr>
                  <td><strong>Patient Identifiable</strong></td>
                  <td>Must be able to confirm it's the same patient</td>
                </tr>
                <tr>
                  <td><strong>BMI Calculation</strong></td>
                  <td>Calculate from visible weight and stated height — must be ≥27</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="protocol-card" style="margin-top: 20px;">
            <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--orange); flex-shrink: 0;">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>
              </svg>
              <strong>If Previous BMI Photo Fails</strong>
            </div>
            <div style="display: grid; gap: 12px; margin-top: 16px;">
              <div style="display: flex; align-items: start; gap: 12px; padding: 12px; background: var(--bg-elevated); border-radius: 8px;">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--purple); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 700; font-size: 12px;">1</div>
                <div>Add tag: <span class="tag purple">previous BMI verification failed</span></div>
              </div>
              <div style="display: flex; align-items: start; gap: 12px; padding: 12px; background: var(--bg-elevated); border-radius: 8px;">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--purple); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 700; font-size: 12px;">2</div>
                <div>Remove tag: <span class="tag blue">prescriber review</span></div>
              </div>
              <div style="display: flex; align-items: start; gap: 12px; padding: 12px; background: var(--bg-elevated); border-radius: 8px;">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--purple); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 700; font-size: 12px;">3</div>
                <div>Send <a href="#macro-15" onclick="navigateToMacro(15); return false;" class="tag blue">Macro 15: Evidence of Starting BMI</a></div>
              </div>
            </div>
            <div class="info-card orange" style="margin-top: 16px;">
              <div class="info-card-title">⚠️ Important</div>
              <div class="info-card-text">Do <strong>NOT</strong> use "Weight verification failed" tag — that's only for current weight photos, not previous BMI photos.</div>
            </div>
          </div>

          <div class="protocol-card" style="margin-top: 20px;">
            <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--success); flex-shrink: 0;">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <strong>Approval Checklist</strong>
            </div>
            <div style="display: grid; gap: 8px; margin-top: 16px;">
              <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-elevated); border-radius: 6px;">
                <span style="color: var(--success);">☑</span> Valid PUE from private provider (not NHS)
              </div>
              <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-elevated); border-radius: 6px;">
                <span style="color: var(--success);">☑</span> Previous BMI photo shows starting BMI ≥27
              </div>
              <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-elevated); border-radius: 6px;">
                <span style="color: var(--success);">☑</span> Dose appropriate for gap-in-treatment
              </div>
              <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-elevated); border-radius: 6px;">
                <span style="color: var(--success);">☑</span> No GLP-1 related hospitalisation
              </div>
              <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-elevated); border-radius: 6px;">
                <span style="color: var(--success);">☑</span> SCR screening completed
              </div>
              <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-elevated); border-radius: 6px;">
                <span style="color: var(--success);">☑</span> Standard verification checks passed (ID, photos, GP)
              </div>
            </div>
          </div>
        </div>

      </div>
    `;
  },

  getConsultationContent() {
    return `
      <div class="protocol-page">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Consultation Questions</h1>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">Required answers and patient eligibility criteria</p>

        <div class="info-card blue" style="margin-bottom: 20px;">
          <div class="info-card-title">How to Use This Reference</div>
          <div class="info-card-text">All patients must complete consultation form covering age, BMI eligibility, medical history, contraindications, current medications, and consent. The tables below show required answers for approval.</div>
        </div>

        <!-- Consultation Questions Tabs -->
        <div class="protocol-tabs">
          <button class="protocol-tab active" data-tab="eligibility">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
            </svg>
            BMI Eligibility
          </button>
          <button class="protocol-tab" data-tab="critical">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            Critical Questions
          </button>
          <button class="protocol-tab" data-tab="medications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <path d="M12 9v4M12 17h.01"/>
            </svg>
            Medications
          </button>
          <button class="protocol-tab" data-tab="consent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            Consent & Branching
          </button>
        </div>

        <!-- Tab 1: BMI Eligibility -->
        <div class="protocol-tab-content active" data-tab-content="eligibility">

        <div class="protocol-card">
          <div class="protocol-title">
            <div class="icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
              </svg>
            </div>
            BMI Eligibility Thresholds
          </div>
          <div class="table-wrapper">
            <table class="dose-table">
              <tr>
                <th>Patient Characteristics</th>
                <th>BMI Threshold</th>
                <th>Notes</th>
              </tr>
            <tr>
              <td><strong>Standard Eligibility</strong><br><span style="color: var(--text-secondary); font-size: 12px;">White ethnicity, no comorbidities</span></td>
              <td><strong>≥30 kg/m²</strong></td>
              <td>Default BMI requirement</td>
            </tr>
            <tr>
              <td><strong>High-Risk Ethnicity</strong><br><span style="color: var(--text-secondary); font-size: 12px;">Asian, Black, Middle Eastern, Mixed</span></td>
              <td><strong>≥27.5 kg/m²</strong></td>
              <td>Lowered threshold for higher diabetes/CVD risk populations</td>
            </tr>
            <tr>
              <td><strong>With Comorbidities</strong><br><span style="color: var(--text-secondary); font-size: 12px;">Any ethnicity + qualifying comorbidity</span></td>
              <td><strong>≥27 kg/m²</strong></td>
              <td>See comorbidities list below</td>
            </tr>
            <tr>
              <td><strong>Transfer Patients</strong><br><span style="color: var(--text-secondary); font-size: 12px;">Below licence with previous BMI photo</span></td>
              <td><strong>≥25 kg/m²</strong></td>
              <td>Must provide proof of supply + previous BMI photo showing BMI ≥27</td>
            </tr>
          </table>
          </div>
        </div>

        <div class="protocol-card" style="margin-top: 20px;">
          <div class="protocol-title">
            <div class="icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            Comorbidities (Lowers BMI to 27)
          </div>

          <div class="protocol-text" style="margin-bottom: 16px;">
            If patient selects <strong>ANY</strong> of the following comorbidities, their eligible BMI lowers from 30 to 27 kg/m²:
          </div>

          <ul class="protocol-list">
            <li><strong>Prediabetes</strong></li>
            <li><strong>Type 2 diabetes</strong></li>
            <li><strong>High blood pressure</strong></li>
            <li><strong>High cholesterol</strong></li>
            <li><strong>Heart or blood vessel disease</strong> (including previous heart attack)</li>
            <li><strong>Previous stroke</strong></li>
            <li><strong>Obstructive sleep apnoea</strong></li>
            <li><strong>Acid reflux/GORD</strong> <em>(only if taking regular medication)</em></li>
            <li><strong>MASLD</strong> (non-alcoholic fatty liver disease)</li>
            <li><strong>Osteoarthritis</strong></li>
            <li><strong>Depression</strong> <em>(only if taking regular medication AND stable for &gt;3 months)</em></li>
            <li><strong>Erectile dysfunction</strong></li>
            <li><strong>Polycystic ovary syndrome (PCOS)</strong></li>
          </ul>

          <div class="info-card orange" style="margin-top: 16px;">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px;">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <path d="M12 9v4M12 17h.01"/>
              </svg>
              <div>
                <strong>Depression as Comorbidity:</strong> Patient must be stable and on unchanged treatment for &gt;3 months. Reject if diagnosis is new or mood is unstable/worsening within last 3 months. Changes in dosage/medication may indicate mood instability.
              </div>
            </div>
          </div>
        </div>

        </div>
        <!-- End Tab 1 -->

        <!-- Tab 2: Critical Questions -->
        <div class="protocol-tab-content" data-tab-content="critical">

        <div class="protocol-card">
          <div class="protocol-title">
            <div class="icon orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            Age & Critical Questions
          </div>

          <div class="info-card orange" style="margin-bottom: 16px;">
            <div class="info-card-title">Mandatory Requirements</div>
            <div class="info-card-text">If patient does not meet these requirements, reject consultation with appropriate reason.</div>
          </div>

          <div class="table-wrapper">
            <table class="dose-table">
              <tr>
                <th>Question</th>
                <th>Required Answer</th>
                <th>If Incorrect</th>
              </tr>
            <tr>
              <td>Are you aged 18 to 74 years old?</td>
              <td><strong style="color: var(--success);">Yes</strong></td>
              <td>Reject with "Clinically Unsuitable"</td>
            </tr>
            <tr>
              <td>Are you currently pregnant, breastfeeding, or planning pregnancy in next 3 months?</td>
              <td><strong style="color: var(--success);">No</strong></td>
              <td><span style="color: var(--danger);">Absolute contraindication — reject immediately</span></td>
            </tr>
            <tr>
              <td>Have you experienced allergic reaction to Wegovy/Ozempic, Mounjaro, Saxenda/Nevolat/Victoza?</td>
              <td><strong style="color: var(--success);">"I have other allergies"</strong> OR <strong style="color: var(--success);">"None of the above"</strong></td>
              <td>If allergic to any GLP-1 → reject</td>
            </tr>
            <tr>
              <td>Have you been diagnosed with thyroid disease, or liver disease or impairment?</td>
              <td><strong>Yes</strong> or <strong>No</strong></td>
              <td>If Yes → Nevolat NOT shown on CTP (only Mounjaro/Wegovy available)</td>
            </tr>
          </table>
          </div>
        </div>

        </div>
        <!-- End Tab 2 -->

        <!-- Tab 3: Medications -->
        <div class="protocol-tab-content" data-tab-content="medications">

        <div class="protocol-card">
          <div class="protocol-title">
            <div class="icon red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <path d="M12 9v4M12 17h.01"/>
              </svg>
            </div>
            Interacting Medications
          </div>

          <div class="protocol-text" style="margin-bottom: 16px;">
            Patient must answer <strong>"No"</strong> to the question: "Are you currently taking any of the following medications?" If <strong>Yes</strong> to any → reject consultation.
          </div>

          <div class="dose-table">
            <div class="dose-table-row">
              <div style="flex: 1;">Amiodarone</div>
              <div style="flex: 1;">Carbamazepine</div>
              <div style="flex: 1;">Ciclosporin</div>
            </div>
            <div class="dose-table-row">
              <div style="flex: 1;">Clozapine</div>
              <div style="flex: 1;">Digoxin</div>
              <div style="flex: 1;">Fenfluramine</div>
            </div>
            <div class="dose-table-row">
              <div style="flex: 1;">Lithium</div>
              <div style="flex: 1;">Mycophenolate mofetil</div>
              <div style="flex: 1;">Oral methotrexate</div>
            </div>
            <div class="dose-table-row">
              <div style="flex: 1;">Phenobarbital</div>
              <div style="flex: 1;">Phenytoin</div>
              <div style="flex: 1;">Somatrogon</div>
            </div>
            <div class="dose-table-row">
              <div style="flex: 1;">Tacrolimus</div>
              <div style="flex: 1;">Theophylline</div>
              <div style="flex: 1;">Warfarin</div>
            </div>
          </div>
        </div>

        </div>
        <!-- End Tab 3 -->

        <!-- Tab 4: Consent & Branching -->
        <div class="protocol-tab-content" data-tab-content="consent">

        <div class="protocol-card">
          <div class="protocol-title">
            <div class="icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            Repeat Patient Branching
          </div>

          <div class="protocol-text" style="margin-bottom: 12px;">
            Repeat patients meeting these criteria get a <strong>shorter consultation</strong> (only answering questions about medical changes):
          </div>

          <ul class="protocol-list">
            <li>Repeat MedExpress patient with GLP-1 order in past 6 months</li>
            <li>Age 18-74 (verified from stored date of birth)</li>
          </ul>

          <div class="protocol-text" style="margin-top: 16px;">
            <strong>Changed Answers Display:</strong> If patient reports changes, system shows which questions changed vs their last consultation. First time changes reported = all answers shown. Second time = only specific changed question shown.
          </div>
        </div>

        <div class="protocol-card" style="margin-top: 20px;">
          <div class="protocol-title">
            <div class="icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            Consent Checkboxes
          </div>

          <div class="protocol-text" style="margin-bottom: 16px;">
            Patients must tick <strong>ALL</strong> compulsory consent boxes. Cannot proceed without all ticked:
          </div>

          <ul class="protocol-list">
            <li>I understand rapid weight loss can raise risk of pancreatitis and gallbladder issues</li>
            <li>I understand severe diarrhoea &gt;24 hours or vomiting within 3 hours of contraceptive pill can reduce effectiveness</li>
            <li>I understand GLP-1s should not be combined with other weight loss medications</li>
            <li>I recognise these treatments may affect mood — will stop and consult doctor if low mood or mental health issues</li>
            <li>Treatment is solely for my own use</li>
            <li>I will read the patient information leaflet</li>
            <li>I will contact MedExpress/GP if I experience side effects or begin new medication</li>
            <li>I agree to MedExpress notifying my GP</li>
            <li>I give permission for MedExpress to request further medical information from GP if necessary</li>
          </ul>

          <div class="info-card blue" style="margin-top: 16px;">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px;">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
              <div>
                <strong>Repeat Customer Consent:</strong> For repeat customers, prescribers must confirm and record that informed consent for any off-label or unlicensed use (e.g., GLP-1 switching, compounded medication) has been provided, with visibility of consent record in customer file.
              </div>
            </div>
          </div>
        </div>

        </div>
        <!-- End Tab 4 -->
      </div>
    `;
  },

  getTitrationGuideContent() {
    return `
      <div class="protocol-page">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Titration & Gap Management</h1>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">Dose equivalence tables and treatment gap adjustments</p>

        <div class="info-card blue" style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0;">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            <div>
              <strong>Important:</strong> The "step" system helps find equivalent doses across medications based on tolerance and side effects, <strong>NOT clinical efficacy</strong>. Always document clinical decisions for deviations.
            </div>
          </div>
        </div>

        <!-- Titration Guide Tabs -->
        <div class="protocol-tabs">
          <button class="protocol-tab active" data-tab="equivalence">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20V10M18 20V4M6 20v-4"/>
            </svg>
            Dose Equivalence
          </button>
          <button class="protocol-tab" data-tab="gaps">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            Treatment Gaps
          </button>
        </div>

        <!-- Tab 1: Dose Equivalence -->
        <div class="protocol-tab-content active" data-tab-content="equivalence">

        <div class="protocol-card">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--accent); flex-shrink: 0;">
              <path d="M12 20V10M18 20V4M6 20v-4"/>
            </svg>
            <strong>Dose Equivalence Table</strong>
          </div>

          <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-elevated); border-radius: 8px; border-left: 3px solid var(--accent);">
            Use the <strong>"Step"</strong> to find appropriate doses when switching medications or managing tolerability. These represent the most suitable dose for expected tolerance, side effects, and weight loss outcomes.
          </div>

          <div class="table-wrapper">
            <table class="dose-table">
              <tr>
                <th style="width: 12%; background: var(--bg-elevated);">Step</th>
              <th style="width: 22%; background: rgba(99, 102, 241, 0.1);">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                  <strong style="color: var(--accent);">Mounjaro</strong>
                  <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">Tirzepatide (SC Weekly)</span>
                </div>
              </th>
              <th style="width: 22%; background: rgba(34, 197, 94, 0.1);">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                  <strong style="color: var(--success);">Wegovy</strong>
                  <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">Semaglutide (SC Weekly)</span>
                </div>
              </th>
              <th style="width: 22%; background: rgba(245, 158, 11, 0.1);">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                  <strong style="color: var(--warning);">Nevolat</strong>
                  <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">Liraglutide (SC Daily)</span>
                </div>
              </th>
              <th style="width: 22%; background: rgba(168, 85, 247, 0.1);">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                  <strong style="color: var(--purple);">Rybelsus</strong>
                  <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">Semaglutide (Oral Daily)</span>
                </div>
              </th>
            </tr>
            <tr>
              <td><strong style="color: var(--accent);">Step 1A</strong></td>
              <td style="color: var(--text-muted);">—</td>
              <td style="color: var(--text-muted);">—</td>
              <td><strong>0.6mg</strong></td>
              <td><strong>3mg</strong></td>
            </tr>
            <tr style="background: rgba(245, 158, 11, 0.05);">
              <td><strong style="color: var(--accent);">Step 1B**</strong></td>
              <td style="color: var(--text-muted);">—</td>
              <td><strong>0.25mg</strong></td>
              <td><strong>1.2mg</strong></td>
              <td><strong>7mg</strong></td>
            </tr>
            <tr style="background: rgba(99, 102, 241, 0.05);">
              <td><strong style="color: var(--accent);">Step 2*</strong></td>
              <td><strong style="color: var(--accent);">2.5mg</strong></td>
              <td><strong>0.5mg</strong></td>
              <td><strong>1.8mg</strong></td>
              <td><strong>14mg</strong></td>
            </tr>
            <tr style="background: rgba(99, 102, 241, 0.05);">
              <td><strong style="color: var(--accent);">Step 3*</strong></td>
              <td><strong style="color: var(--accent);">5mg</strong></td>
              <td><strong>1.0mg</strong></td>
              <td><strong>2.4mg</strong></td>
              <td style="color: var(--text-muted);">—</td>
            </tr>
            <tr style="background: rgba(99, 102, 241, 0.05);">
              <td><strong style="color: var(--accent);">Step 4*</strong></td>
              <td><strong style="color: var(--accent);">7.5mg</strong></td>
              <td><strong>1.7mg</strong></td>
              <td><strong>3.0mg</strong></td>
              <td style="color: var(--text-muted);">—</td>
            </tr>
            <tr style="background: rgba(99, 102, 241, 0.05);">
              <td><strong style="color: var(--accent);">Step 5*</strong></td>
              <td><strong style="color: var(--accent);">10mg</strong></td>
              <td><strong>2.4mg</strong></td>
              <td style="color: var(--text-muted);">—</td>
              <td style="color: var(--text-muted);">—</td>
            </tr>
            <tr>
              <td><strong style="color: var(--accent);">Step 6</strong></td>
              <td><strong style="color: var(--accent);">12.5mg</strong></td>
              <td style="color: var(--text-muted);">—</td>
              <td style="color: var(--text-muted);">—</td>
              <td style="color: var(--text-muted);">—</td>
            </tr>
            <tr>
              <td><strong style="color: var(--accent);">Step 7</strong></td>
              <td><strong style="color: var(--accent);">15mg</strong></td>
              <td style="color: var(--text-muted);">—</td>
              <td style="color: var(--text-muted);">—</td>
              <td style="color: var(--text-muted);">—</td>
            </tr>
          </table>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
            <div style="padding: 12px; background: rgba(99, 102, 241, 0.1); border-radius: 8px; border-left: 3px solid var(--accent);">
              <div style="font-size: 12px; font-weight: 700; color: var(--accent); margin-bottom: 4px;">* Steps 2-5</div>
              <div style="font-size: 13px; color: var(--text-secondary);">Dose <strong>increases</strong> when switching from Mounjaro to Wegovy</div>
            </div>
            <div style="padding: 12px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border-left: 3px solid var(--warning);">
              <div style="font-size: 12px; font-weight: 700; color: var(--warning); margin-bottom: 4px;">** Step 1B</div>
              <div style="font-size: 13px; color: var(--text-secondary);">Dose <strong>increase</strong> when switching Mounjaro/Wegovy to Nevolat or Rybelsus</div>
            </div>
          </div>
        </div>

        </div>
        <!-- End Tab 1 -->

        <!-- Tab 2: Treatment Gaps -->
        <div class="protocol-tab-content" data-tab-content="gaps">

        <div class="protocol-card">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--warning); flex-shrink: 0;">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            <strong>Gap in Treatment — Dose Adjustments</strong>
          </div>

          <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-elevated); border-radius: 8px; border-left: 3px solid var(--warning);">
            <strong>How to use:</strong> Find the patient's last step in the left column, then look across to find the appropriate restart dose based on gap length since last dose.
          </div>

          <div class="table-wrapper">
            <table class="dose-table">
              <tr>
                <th style="width: 15%; background: var(--bg-elevated);">Last Step</th>
              <th style="width: 21.25%; background: rgba(34, 197, 94, 0.1);"><strong style="color: var(--success);">≤4 weeks</strong><br><span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">Short gap</span></th>
              <th style="width: 21.25%; background: rgba(245, 158, 11, 0.1);"><strong style="color: var(--warning);">&gt;4 to ≤8 weeks</strong><br><span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">Medium gap</span></th>
              <th style="width: 21.25%; background: rgba(239, 68, 68, 0.1);"><strong style="color: var(--danger);">&gt;8 to ≤12 weeks</strong><br><span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">Long gap</span></th>
              <th style="width: 21.25%; background: rgba(168, 85, 247, 0.1);"><strong style="color: var(--purple);">&gt;12 weeks</strong><br><span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">Extended gap</span></th>
            </tr>
            <tr>
              <td><strong>Step 1A</strong></td>
              <td style="background: rgba(34, 197, 94, 0.05);"><strong>Step 1A</strong></td>
              <td style="background: rgba(245, 158, 11, 0.05);"><strong>Step 1A</strong></td>
              <td style="background: rgba(239, 68, 68, 0.05);"><strong>Step 1A</strong></td>
              <td style="background: rgba(168, 85, 247, 0.05);"><strong>Step 1A</strong></td>
            </tr>
            <tr>
              <td><strong>Step 1B</strong></td>
              <td style="background: rgba(34, 197, 94, 0.05);"><strong>Step 1B</strong></td>
              <td style="background: rgba(245, 158, 11, 0.05);"><strong style="color: var(--warning);">Step 1A</strong> ↓</td>
              <td style="background: rgba(239, 68, 68, 0.05);"><strong style="color: var(--danger);">Step 1A</strong> ↓</td>
              <td style="background: rgba(168, 85, 247, 0.05);"><strong style="color: var(--purple);">Step 1A</strong> ↓</td>
            </tr>
            <tr>
              <td><strong>Step 2</strong></td>
              <td style="background: rgba(34, 197, 94, 0.05);"><strong>Step 2</strong></td>
              <td style="background: rgba(245, 158, 11, 0.05);"><strong style="color: var(--warning);">Step 1B</strong> ↓</td>
              <td style="background: rgba(239, 68, 68, 0.05);"><strong style="color: var(--danger);">Step 1A</strong> ↓↓</td>
              <td style="background: rgba(168, 85, 247, 0.05);"><strong style="color: var(--purple);">Step 1A</strong> ↓↓</td>
            </tr>
            <tr>
              <td><strong>Step 3</strong></td>
              <td style="background: rgba(34, 197, 94, 0.05);"><strong>Step 3</strong></td>
              <td style="background: rgba(245, 158, 11, 0.05);"><strong style="color: var(--warning);">Step 2</strong> ↓</td>
              <td style="background: rgba(239, 68, 68, 0.05);"><strong style="color: var(--danger);">Step 1B</strong> ↓↓</td>
              <td style="background: rgba(168, 85, 247, 0.05);"><strong style="color: var(--purple);">Step 1A</strong> ↓↓↓</td>
            </tr>
            <tr>
              <td><strong>Step 4</strong></td>
              <td style="background: rgba(34, 197, 94, 0.05);"><strong>Step 4</strong></td>
              <td style="background: rgba(245, 158, 11, 0.05);"><strong style="color: var(--warning);">Step 3</strong> ↓</td>
              <td style="background: rgba(239, 68, 68, 0.05);"><strong style="color: var(--danger);">Step 2</strong> ↓↓</td>
              <td style="background: rgba(168, 85, 247, 0.05);"><strong style="color: var(--purple);">Step 1B</strong> ↓↓↓</td>
            </tr>
            <tr>
              <td><strong>Step 5</strong></td>
              <td style="background: rgba(34, 197, 94, 0.05);"><strong>Step 5</strong></td>
              <td style="background: rgba(245, 158, 11, 0.05);"><strong style="color: var(--warning);">Step 3</strong> ↓↓</td>
              <td style="background: rgba(239, 68, 68, 0.05);"><strong style="color: var(--danger);">Step 2</strong> ↓↓↓</td>
              <td style="background: rgba(168, 85, 247, 0.05);"><strong style="color: var(--purple);">Step 1B</strong> ↓↓↓↓</td>
            </tr>
            <tr>
              <td><strong>Step 6</strong></td>
              <td style="background: rgba(34, 197, 94, 0.05);"><strong>Step 6</strong></td>
              <td style="background: rgba(245, 158, 11, 0.05);"><strong style="color: var(--warning);">Step 3</strong> ↓↓↓</td>
              <td style="background: rgba(239, 68, 68, 0.05);"><strong style="color: var(--danger);">Step 2</strong> ↓↓↓↓</td>
              <td style="background: rgba(168, 85, 247, 0.05);"><strong style="color: var(--purple);">Step 1B</strong> ↓↓↓↓↓</td>
            </tr>
            <tr>
              <td><strong>Step 7</strong></td>
              <td style="background: rgba(34, 197, 94, 0.05);"><strong>Step 7</strong></td>
              <td style="background: rgba(245, 158, 11, 0.05);"><strong style="color: var(--warning);">Step 3</strong> ↓↓↓↓</td>
              <td style="background: rgba(239, 68, 68, 0.05);"><strong style="color: var(--danger);">Step 2</strong> ↓↓↓↓↓</td>
              <td style="background: rgba(168, 85, 247, 0.05);"><strong style="color: var(--purple);">Step 1B</strong> ↓↓↓↓↓↓</td>
            </tr>
          </table>
          </div>

          <div class="info-card orange" style="margin-top: 16px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0;">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <path d="M12 9v4M12 17h.01"/>
              </svg>
              <div>
                <strong>Gap Duration:</strong> Periods shown are gaps since the patient's <strong>last dose</strong>. Arrows (↓) indicate step reductions for safety when restarting after gaps.
              </div>
            </div>
          </div>
        </div>

        </div>
        <!-- End Tab 2 -->

        <div class="info-card purple" style="margin-top: 20px;">
          <div style="display: flex; align-items: flex-start; gap: 10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px;">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            <div>
              <strong>Clinical Decision Authority:</strong> Switching doses or deviating from these tables is a clinical decision. If there's a clinical reason not to follow the step table, this <strong>must be documented</strong> on the patient's record with clear justification.
            </div>
          </div>
        </div>
      </div>
    `;
  },

  getRejectionsContent() {
    return `
      <div class="protocol-page">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Rejection Reasons</h1>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">Manual rejection reasons and when to use them</p>

        <!-- Rejection Reasons Tabs -->
        <div class="protocol-tabs">
          <button class="protocol-tab active" data-tab="manual">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            Manual Rejections
          </button>
          <button class="protocol-tab" data-tab="cancellations">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            Order Cancellations
          </button>
        </div>

        <!-- Tab 1: Manual Rejections -->
        <div class="protocol-tab-content active" data-tab-content="manual">

        <div class="protocol-card">
          <div class="protocol-title">
            <div class="icon red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            Manual Rejection Reasons
          </div>
          <div class="table-wrapper">
            <table class="dose-table">
              <tr>
                <th>Reason</th>
                <th>When to Use</th>
              </tr>
            <tr>
              <td><strong>Medical Reason</strong></td>
              <td>GP letter or patient informs us of medical information which is a contraindication. If identified via SCR check → use "SCR Check Fail"</td>
            </tr>
            <tr>
              <td><strong>Drug interaction with your current medication list</strong></td>
              <td>GP letter or patient informs us they're on a contraindicated medication. If identified via SCR → use "SCR Check Fail"</td>
            </tr>
            <tr>
              <td><strong>Due to medical history we are unable to provide treatment online</strong></td>
              <td>GP letter or patient informs us of medical information which is a contraindication. If identified via SCR → use "SCR Check Fail"</td>
            </tr>
            <tr>
              <td><strong>Patient contacted - ID not provided</strong></td>
              <td>ID was not provided after CS outreach OR failed ID (information on ID doesn't match account)</td>
            </tr>
            <tr>
              <td><strong>Patient cannot be contacted for ID check</strong></td>
              <td>Patient cannot be contacted</td>
            </tr>
            <tr>
              <td><strong>Cancel order request by patient - wrong order</strong></td>
              <td>Patient placed wrong order (medication, dose, quantity) and requested to cancel</td>
            </tr>
            <tr>
              <td><strong>Cancel order request by patient - changed mind</strong></td>
              <td>Patient changed their mind and no longer wants medication. For outreach cases with no response → use more relevant rejection reason</td>
            </tr>
            <tr>
              <td><strong>Cancel order request by patient - no reason given</strong></td>
              <td>Patient requested to cancel without providing any reason</td>
            </tr>
            <tr>
              <td><strong>Incomplete address - no response from patient</strong></td>
              <td>Patient didn't provide complete delivery address and has been unresponsive</td>
            </tr>
            <tr>
              <td><strong>Patient over age limit</strong></td>
              <td>Patient is over 74 years old. Ensure DoB on account is updated correctly</td>
            </tr>
            <tr>
              <td><strong>Patient is underaged</strong></td>
              <td>Patient is under 18 years old. Ensure DoB on account is updated correctly</td>
            </tr>
            <tr>
              <td><strong>Multiple Accounts Detected</strong></td>
              <td>Patient has multiple active accounts ordering GLP-1 medications</td>
            </tr>
            <tr>
              <td><strong>Patient can not be contacted for clinical review</strong></td>
              <td>Patient didn't supply necessary information for prescribers to review (unable to reach via phone/email, didn't supply medication list/past medical history)</td>
            </tr>
            <tr>
              <td><strong>Clinically unsuitable to supply - refer to GP</strong></td>
              <td>Patient does not appear to have eligible BMI from photos uploaded</td>
            </tr>
            <tr>
              <td><strong>Patient contacted - missing ID photo and selfie</strong></td>
              <td>ID and weight verification selfie both missing or both inappropriate</td>
            </tr>
            <tr>
              <td><strong>Missing evidence of previous use of GLP-1 weight loss medications</strong></td>
              <td>PUE is missing or does not contain necessary information</td>
            </tr>
            <tr>
              <td><strong>Weight verification process failed</strong></td>
              <td>Weight verification photo not provided or inappropriate after outreach</td>
            </tr>
            <tr>
              <td><strong>Higher Than Recommended Strength Ordered</strong></td>
              <td>Patient ordered higher strength than recommended, unable to provide PUE, and requested to cancel</td>
            </tr>
            <tr>
              <td><strong>Cancel order request by patient - processing delay</strong></td>
              <td>Patient requested to cancel due to delay in processing</td>
            </tr>
            <tr>
              <td><strong>Cancel order request by patient - cheaper elsewhere</strong></td>
              <td>Patient found treatment cheaper elsewhere</td>
            </tr>
            <tr>
              <td><strong>Cancel order request by patient - ordered by mistake</strong></td>
              <td>Patient made a mistake and did not mean to place order</td>
            </tr>
            <tr>
              <td><strong>SCR Check Fail</strong></td>
              <td>A contraindication was found in the patient's SCR</td>
            </tr>
          </table>
        </div>

        </div>
        <!-- End Tab 1 -->

        <!-- Tab 2: Order Cancellations -->
        <div class="protocol-tab-content" data-tab-content="cancellations">

        <div class="protocol-card">
          <div class="protocol-title">
            <div class="icon orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            Order Cancellation Requests
          </div>

          <div class="protocol-text">Patients can initiate cancellation via Zendesk. They have <strong>24 hours</strong> to click confirmation link. If they don't click within 24 hours, cancellation request expires and order returns to prescribing queue.</div>

          <div class="protocol-section" style="margin-top: 16px;">
            <div class="protocol-section-title">Order Cancellation Requested Tag</div>
            <div class="protocol-text"><strong>Do NOT prescribe or manually reject</strong> orders tagged with <span class="tag orange">Order Cancellation Requested</span>. Allow the patient the full 24-hour window to decide.</div>
          </div>

          <div class="divider"></div>

          <div class="protocol-section">
            <div class="protocol-section-title">Self Cancellation Flow - Zendesk Ticket Status</div>
            <div class="table-wrapper">
              <table class="dose-table">
                <tr>
                  <th>Reason</th>
                  <th>Ticket Status</th>
                </tr>
              <tr>
                <td>BY_PATIENT_CHANGED_MIND</td>
                <td>Automatically closed</td>
              </tr>
              <tr>
                <td>BY_PATIENT_HEALTH_CHANGES</td>
                <td>Ticket to Customer Care → triaged to Clinical</td>
              </tr>
              <tr>
                <td>BY_PATIENT_NEW_MEDICATION</td>
                <td>Ticket to Customer Care → triaged to Clinical</td>
              </tr>
              <tr>
                <td>BY_PATIENT_SIDE_EFFECTS</td>
                <td>Ticket to Customer Care → triaged to Clinical</td>
              </tr>
              <tr>
                <td>BY_PATIENT_WRONG_ORDER</td>
                <td>Automatically closed</td>
              </tr>
              <tr>
                <td>PROCESSING_TOOK_TOO_LONG</td>
                <td>Automatically closed</td>
              </tr>
              <tr>
                <td>OTHER</td>
                <td>Ticket to Customer Care, may be triaged to Clinical</td>
              </tr>
              </table>
            </div>
          </div>
        </div>

        <div class="protocol-card" style="margin-top: 20px;">
          <div class="protocol-title">
            <div class="icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            Answer Change Response (Comorbidities)
          </div>

          <div class="protocol-text" style="margin-bottom: 16px;">When patients change their comorbidity answer between consultations:</div>

          <div class="table-wrapper">
            <table class="dose-table">
              <tr>
                <th>Change</th>
                <th>Starting BMI</th>
                <th>Action</th>
              </tr>
            <tr>
              <td><strong>Yes → No</strong></td>
              <td>&lt;30</td>
              <td>Contact patient with "Confirmation of Comorbidities" macro. If patient confirms NO comorbidities → reject, send email why, add critical note, raise PSI</td>
            </tr>
            <tr>
              <td><strong>Yes → No</strong></td>
              <td>&gt;30</td>
              <td>Review remaining consultation answers for relevant clinical details. Otherwise no further action</td>
            </tr>
            <tr>
              <td><strong>No → Yes</strong></td>
              <td>&gt;30 by default</td>
              <td>Review remaining consultation answers for relevant clinical details. Otherwise no further action</td>
            </tr>
            </table>
          </div>
          </div>

          <div class="protocol-section" style="margin-top: 16px;">
            <div class="protocol-section-title">Multiple Submissions - GLP1 Consultation</div>
            <div class="table-wrapper">
              <table class="dose-table">
                <tr>
                  <th>Change</th>
                  <th>Initial Answer</th>
                  <th>Action</th>
                </tr>
              <tr>
                <td><strong>No → Yes</strong> (eating disorder or Type 1 diabetes)</td>
                <td>Yes</td>
                <td>Proceed to prescribe based on final answer. If clinically necessary, use <em>ME::multiple submissions - GLP1 consultation</em> macro to contact after prescription</td>
              </tr>
              <tr>
                <td><strong>Weight/height adjusted (BMI)</strong></td>
                <td>N/A</td>
                <td>No action required. This flag tracks data entry errors. Base prescribing decision on BMI value submitted.</td>
              </tr>
              </table>
            </div>
          </div>
        </div>

        </div>
        <!-- End Tab 2 -->
      </div>
    `;
  },

  attachEventListeners(pageId) {
    if (pageId === "dashboard") {
      // Prescription card clicks
      document.querySelectorAll(".prescription-card").forEach((card) => {
        card.addEventListener("click", () => {
          AppState.currentChecklist = card.dataset.type;
          console.log("Prescription card clicked:", card.dataset.type);
          console.log("AppState.currentChecklist set to:", AppState.currentChecklist);
          NavigationManager.goToPage("checklists");
        });
      });

      // Quick action clicks
      document.querySelectorAll(".quick-action").forEach((action) => {
        action.addEventListener("click", () => {
          NavigationManager.goToPage(action.dataset.page);
        });
      });
    }

    if (pageId === "checklists") {
      // Protocol links inside checklist items
      document.querySelectorAll(".check-link[data-page]").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          NavigationManager.goToPage(link.dataset.page);
        });
      });

      // Check item clicks
      document.querySelectorAll(".check-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          if (!e.target.closest(".check-link")) {
            ChecklistManager.toggleCheck(item);
          }
        });
      });

      // Reset button
      document.querySelectorAll(".btn-reset").forEach((btn) => {
        btn.addEventListener("click", () => {
          ChecklistManager.resetChecklist(btn.dataset.checklist);
        });
      });

      // Sign button
      document.querySelectorAll(".btn-sign").forEach((btn) => {
        btn.addEventListener("click", () => {
          ChecklistManager.handleSign(btn.dataset.checklist);
        });
      });

      // Checklist type tabs - switch between prescription types
      document.querySelectorAll(".checklist-type-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          const newType = tab.dataset.checklistType;
          AppState.currentChecklist = newType;
          ContentManager.loadPage("checklists");
        });
      });
    }

    // Back button in protocol pages
    const backBtn = document.querySelector(".back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        NavigationManager.goToPage(backBtn.dataset.page || "dashboard");
      });
    }

    // Protocol tabs (for all protocols with tabs)
    if (
      pageId === "proto-core" ||
      pageId === "proto-pue" ||
      pageId === "proto-titration" ||
      pageId === "proto-scr" ||
      pageId === "proto-weight" ||
      pageId === "proto-switching" ||
      pageId === "proto-reviews" ||
      pageId === "contraindications" ||
      pageId === "transfer" ||
      pageId === "definitions" ||
      pageId === "consultation" ||
      pageId === "titration-guide" ||
      pageId === "rejections" ||
      pageId === "macros" ||
      pageId === "tags"
    ) {
      const tabs = document.querySelectorAll(".protocol-tab");
      const tabContents = document.querySelectorAll(".protocol-tab-content");

      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const tabId = tab.dataset.tab;

          // Remove active class from all tabs and contents
          tabs.forEach((t) => t.classList.remove("active"));
          tabContents.forEach((content) => content.classList.remove("active"));

          // Add active class to clicked tab and corresponding content
          tab.classList.add("active");
          const activeContent = document.querySelector(`[data-tab-content="${tabId}"]`);
          if (activeContent) {
            activeContent.classList.add("active");
          }

          // Reinitialize condition tabs when switching main tabs
          if (pageId === "proto-scr" || pageId === "contraindications") {
            setTimeout(() => {
              if (window.initConditionTabs) {
                window.initConditionTabs();
              }
            }, 10);
          }
        });
      });

      // Initialize condition tabs on page load
      if (pageId === "proto-scr" || pageId === "contraindications") {
        setTimeout(() => {
          if (window.initConditionTabs) {
            window.initConditionTabs();
          }
        }, 10);
      }
    }

    // Handle macros page main tabs (email-macros vs doc-notes) and sub-tabs
    if (pageId === "macros") {
      // Main tabs: Email Macros vs Documentation Notes
      const mainTabs = document.querySelectorAll(".protocol-tab[data-tab]");
      const mainPanels = document.querySelectorAll(".tab-panel[data-panel]");
      
      mainTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const tabId = tab.dataset.tab;
          
          mainTabs.forEach((t) => t.classList.remove("active"));
          mainPanels.forEach((panel) => panel.classList.remove("active"));
          
          tab.classList.add("active");
          const activePanel = document.querySelector(`.tab-panel[data-panel="${tabId}"]`);
          if (activePanel) {
            activePanel.classList.add("active");
          }
        });
      });
      
      // Sub-tabs for macro categories
      const subTabs = document.querySelectorAll(".protocol-tab[data-subtab]");
      const subPanels = document.querySelectorAll(".sub-panel[data-subpanel]");
      
      subTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const subtabId = tab.dataset.subtab;
          
          subTabs.forEach((t) => t.classList.remove("active"));
          subPanels.forEach((panel) => panel.classList.remove("active"));
          
          tab.classList.add("active");
          const activePanel = document.querySelector(`.sub-panel[data-subpanel="${subtabId}"]`);
          if (activePanel) {
            activePanel.classList.add("active");
          }
        });
      });
    }

    if (pageId === "proto-scr") {
      const copyButtons = document.querySelectorAll(".copy-btn[data-copy-target]");

      const tryCopyText = async (text) => {
        if (!text) return false;

        // Preferred modern API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(text);
            return true;
          } catch (e) {
            // Fall through to legacy method
          }
        }

        // Legacy fallback (works in many file:// contexts)
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "absolute";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          const ok = document.execCommand("copy");
          document.body.removeChild(ta);
          return ok;
        } catch (e) {
          return false;
        }
      };

      copyButtons.forEach((btn) => {
        btn.addEventListener("click", async () => {
          const targetId = btn.dataset.copyTarget;
          const el = document.getElementById(targetId);
          const text = el ? el.textContent : "";

          const original = btn.textContent;
          const ok = await tryCopyText(text);
          btn.textContent = ok ? "Copied" : "Copy failed";
          btn.disabled = true;

          setTimeout(() => {
            btn.textContent = original;
            btn.disabled = false;
          }, 1200);
        });
      });
    }
  },
};

// ============================================
// Checklist Management
// ============================================
const ChecklistManager = {
  toggleCheck(item) {
    const id = item.dataset.id;
    const checklist = item.dataset.checklist;

    AppState.checklists[checklist].checks[id] =
      !AppState.checklists[checklist].checks[id];
    item.classList.toggle("checked", AppState.checklists[checklist].checks[id]);

    this.updateProgress(checklist);
    Utils.saveState();
  },

  updateProgress(checklist) {
    const data = AppState.checklists[checklist];
    const checked = Object.values(data.checks).filter(Boolean).length;
    const total = data.total;
    const percent = (checked / total) * 100;

    // Update progress circle (circumference = 2 * π * 27 ≈ 169.6)
    const circumference = 169.6;
    const offset = circumference - (percent / 100) * circumference;
    const progressEl = document.getElementById(`progress-${checklist}`);
    if (progressEl) {
      progressEl.style.strokeDashoffset = offset;
    }

    // Update text
    const textEl = document.getElementById(`progress-text-${checklist}`);
    if (textEl) {
      textEl.textContent = `${checked}/${total}`;
    }

    // Update status badge
    const badge = document.getElementById(`status-badge-${checklist}`);
    const btn = document.getElementById(`btn-sign-${checklist}`);

    if (badge && btn) {
      if (checked === total) {
        badge.className = "status-badge complete";
        badge.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>Complete</span>`;
        btn.classList.add("ready");
      } else {
        badge.className = "status-badge pending";
        badge.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Pending</span>`;
        btn.classList.remove("ready");
      }
    }
  },

  resetChecklist(checklist) {
    AppState.checklists[checklist].checks = {};
    document.querySelectorAll(`[data-checklist="${checklist}"]`).forEach((item) => {
      if (item.classList.contains("check-item")) {
        item.classList.remove("checked");
      }
    });
    this.updateProgress(checklist);
    Utils.saveState();
  },

  handleSign(checklist) {
    const names = {
      starting: "Starting Dose",
      stepup: "Step Up Dose",
      repeat: "Repeat Order",
      "transfer-above": "Transfer (Above Licence)",
      "transfer-below": "Transfer (Below Licence)",
    };

    const now = Utils.formatDateTime();
    alert(
      `✓ ${names[checklist]} checks complete\n\nTimestamp: ${now}\n\nSafe to sign prescription.`
    );
    this.resetChecklist(checklist);
  },
};

// ============================================
// Initialize Application
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    // Add event listener for sidebar toggle button with chevron direction
    const navbarToggleBtn = document.getElementById("navbarToggleBtn");
    const navbarToggleIcon = document.getElementById("navbarToggleIcon");
    const sidebar = document.getElementById("sidebar") || document.querySelector(".sidebar");
    const mainContent = document.getElementById("mainContent") || document.querySelector(".main");
    let sidebarCollapsed = false;
    function setChevronDirection(collapsed) {
      if (!navbarToggleIcon) return;
      if (collapsed) {
        // right chevron
        navbarToggleIcon.innerHTML = '<polyline points="9 18 15 12 9 6" />';
      } else {
        // left chevron
        navbarToggleIcon.innerHTML = '<polyline points="15 18 9 12 15 6" />';
      }
    }
    if (navbarToggleBtn && sidebar && mainContent) {
      navbarToggleBtn.addEventListener("click", function() {
        sidebarCollapsed = !sidebarCollapsed;
        if (sidebarCollapsed) {
          sidebar.classList.add("collapsed");
          mainContent.classList.add("expanded");
        } else {
          sidebar.classList.remove("collapsed");
          mainContent.classList.remove("expanded");
        }
        setChevronDirection(sidebarCollapsed);
      });
      setChevronDirection(sidebarCollapsed);
    }
  // Load saved state
  Utils.loadState();

  // Initialize modules
  ThemeManager.init();
  NavigationManager.init();
  SearchManager.init();

  // Global click handler for macro links
  document.addEventListener("click", (e) => {
    const macroLink = e.target.closest('a[href^="#macro-"]');
    if (macroLink) {
      e.preventDefault();
      const href = macroLink.getAttribute("href");
      const macroNumber = parseInt(href.replace("#macro-", ""));
      if (macroNumber && !isNaN(macroNumber)) {
        navigateToMacro(macroNumber);
      }
    }
  });

  // Update time every minute
  setInterval(() => {
    const timeEl = document.getElementById("current-time");
    if (timeEl) {
      timeEl.textContent = Utils.formatDateTime();
    }
  }, 60000);

  console.log("GLP-1 Prescribing Portal loaded successfully");
});

// ============================================
// Service Worker Registration (for PWA support)
// ============================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => console.log("Service Worker registered"))
      .catch((err) => console.log("Service Worker registration failed:", err));
  });
}
