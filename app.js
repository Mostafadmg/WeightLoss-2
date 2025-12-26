// ============================================
// State Management
// ============================================
const AppState = {
  currentPage: "dashboard",
  currentChecklist: null,
  theme: localStorage.getItem("theme") || "dark",
  font: localStorage.getItem("font") || "Manrope",
  checklists: {
    starting: { total: 12, checks: {} },
    stepup: { total: 9, checks: {} },
    repeat: { total: 12, checks: {} },
    "transfer-above": { total: 10, checks: {} },
    "transfer-below": { total: 12, checks: {} },
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
      }
    }
  },
};

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
        context: "REJECT if Stage IV - email patient for cardiology letter (Macro 4)",
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
        context: "REJECT if eGFR <30 or Stage 4 - request eGFR (Macro 5)",
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
        context: "Excluding MEN2/medullary thyroid - request oncology letter (Macro 3)",
        page: "contraindications",
        sectionId: "cancer-assessment",
        category: "Patient Assessment",
        keywords: ["cancer", "malignancy", "oncology", "tumor", "carcinoma", "neoplasm"],
      },
      {
        title: "Dementia / Cognitive Impairment",
        context: "Assess safety at home and ability to use medication (Macro 7)",
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
        context: "REJECT if formal diagnosis confirmed (Macro 8)",
        page: "contraindications",
        sectionId: "malabsorption-assessment",
        category: "Patient Assessment",
        keywords: ["malabsorption", "chronic malabsorption", "absorption disorder"],
      },
      {
        title: "Depression / Anxiety",
        context: "REJECT if acutely unwell <3 months or new antidepressant (Macro 9)",
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
        context: "REJECT if <12 months - active suicidal thoughts (Macro 9)",
        page: "contraindications",
        sectionId: "suicidal-ideation-assessment",
        category: "Patient Assessment",
        keywords: ["suicidal", "suicide", "self harm", "suicidal ideation"],
      },
      {
        title: "Alcohol Abuse",
        context: "REJECT if current dependence or <12 months (Macro 10)",
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
        context: "Patient must grant permission to view SCR - use Macro 11 if missing",
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
        setTimeout(() => {
          const section = document.getElementById(sectionId);
          if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
            section.style.animation = "highlight-pulse 2s ease-in-out";
            setTimeout(() => {
              section.style.animation = "";
            }, 2000);
          }
        }, 80);
      }
      this.pendingNavigation = null;
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
      checklists: ["Safety Checklists", "Complete all required checks before signing"],
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
                    <h3>Starting Dose</h3>
                    <p>New patients beginning GLP-1 treatment for the first time</p>
                    <div class="checks-count">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg>
                      12 checks required
                    </div>
                </div>

                <div class="prescription-card" data-type="stepup">
                    <div class="prescription-icon stepup">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    </div>
                    <h3>Step Up Dose</h3>
                    <p>Existing patients titrating to a higher dose</p>
                    <div class="checks-count">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg>
                        9 checks required
                    </div>
                </div>

                <div class="prescription-card" data-type="repeat">
                    <div class="prescription-icon repeat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
                    </div>
                    <h3>Repeat Order</h3>
                    <p>Existing patients ordering same dose (maintenance)</p>
                    <div class="checks-count">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg>
                        12 checks required
                    </div>
                </div>

                <div class="prescription-card" data-type="transfer-above">
                    <div class="prescription-icon transfer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3l4 4-4 4"/><path d="M20 7H4"/></svg>
                    </div>
                    <h3>Transfer (Above Licence)</h3>
                    <p>Patients from another provider with BMI ≥25</p>
                    <div class="checks-count">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg>
                        10 checks required
                    </div>
                </div>

                <div class="prescription-card" data-type="transfer-below">
                    <div class="prescription-icon switching">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/></svg>
                    </div>
                    <h3>Transfer (Below Licence)</h3>
                    <p>Patients from another provider with BMI 21-25</p>
                    <div class="checks-count">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg>
                        12 checks required
                    </div>
                </div>
            </div>
        `;
  },

  getChecklistsContent() {
    return `
            <div class="checklist-panel active" id="checklist-starting">
                <div class="checklist-header">
                    <div class="checklist-title">
                        <h2>Starting Dose Checklist</h2>
                        <span class="type-badge starter">New Patient</span>
                    </div>
                    <div class="progress-ring">
                        <div class="progress-circle">
                            <svg width="56" height="56">
                                <circle class="bg" cx="28" cy="28" r="24"/>
                                <circle class="progress" cx="28" cy="28" r="24" stroke-dasharray="150.8" stroke-dashoffset="150.8" id="progress-starting"/>
                            </svg>
                <span class="progress-text" id="progress-text-starting">0/12</span>
                        </div>
                        <div class="progress-label">Checks<br>Complete</div>
                    </div>
                </div>

                ${this.getChecklistSections("starting")}

                <div class="status-bar">
                    <div class="status-info">
                        <div class="status-badge pending" id="status-badge-starting">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                            <span>Pending</span>
                        </div>
                        <span style="color: var(--text-secondary); font-size: 14px;">Complete all checks to enable signing</span>
                    </div>
                    <div class="btn-actions">
                        <button class="btn btn-reset" data-checklist="starting">Reset</button>
                        <button class="btn btn-sign" id="btn-sign-starting" data-checklist="starting">
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
              label: "Consultation answers reviewed — no contraindications",
              hint: "Check patient notes for email updates. Confirm eligibility.",
              linkPage: "contraindications",
              linkLabel: "Open contraindications →",
            },
            {
              id: "s2",
              label: "Age is 18–74 years old (inclusive)",
              hint: 'Outside range → Reject "Clinically Unsuitable"',
              warning: true,
              linkPage: "consultation",
              linkLabel: "Open consultation questions →",
            },
            {
              id: "s3",
              label: "BMI within eligible range",
              hint: "≥30 (no comorbidities) or ≥27 (with). Max 60. BAME ≥27.5",
            },
          ],
        },
        {
          title: "ID & Photo Verification",
          icon: "green",
          checks: [
            {
              id: "s4",
              label: "ID valid and in date (first orders must be in date)",
              hint: "Full name, DoB, photo visible. Official govt org.",
            },
            {
              id: "s5",
              label: "ID matches patient account details",
              hint: "Small differences → Amend account before prescribing",
              warning: true,
            },
            {
              id: "s6",
              label: "Weight verification photo meets requirements",
              hint: "Full-length, fitted clothing, face visible, same person as ID",
            },
          ],
        },
        {
          title: "SCR Screening (Pre-Prescription)",
          icon: "orange",
          checks: [
            {
              id: "s9",
              label: "SCR checks are done after ID & weight verification",
              hint: "Do NOT enter SCR until eligibility steps are completed (wrongful access = incident).",
              warning: true,
            },
            {
              id: "s10",
              label: "Review SCR scraping tool outcome",
              hint: "Pass = prescribe without opening SCR. Flagged = open SCR. No person found = follow SCR unavailable guidance.",
              linkPage: "proto-scr",
            },
            {
              id: "s11",
              label: "If flagged: review SCR for contraindications and required details",
              hint: "Check Acute/Repeat Meds + Diagnoses + Problems/Issues. Reject for absolute contraindication; email/hold only if more info needed.",
            },
            {
              id: "s12",
              label: "Document SCR outcome in patient record",
              hint: "Use consistent notes (SCR pass / SCR checked no contraindication / SCR unavailable / limited SCR / contraindication found).",
            },
          ],
        },
        {
          title: "GP & Final",
          icon: "purple",
          checks: [
            {
              id: "s7",
              label: "GP details verified (UK NHS surgery)",
              hint: "Green tick = verified. No tick → validate via Google/NHS ODS",
            },
            {
              id: "s8",
              label: "All checks passed — safe to prescribe starting dose",
              hint: "Confirm all above items are verified before signing",
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
    return `
      <div class="scr-protocol">
        <div class="protocol-hero">
          <div class="protocol-hero-title">SCR workflow — quick view</div>
          <div class="protocol-hero-subtitle">
            Use SCR as an <strong>independent safety verification</strong> step before prescribing GLP‑1s.
            <strong>Do not</strong> use SCR to verify BMI/biometrics or Weight‑Related Co‑Morbidities (WRCM).
          </div>

          <div class="scr-flow">
            <div class="scr-flow-card green">
              <div class="scr-flow-top">
                <span class="scr-chip green">Step 1</span>
                <span class="scr-flow-title">Eligibility first</span>
              </div>
              <div class="scr-flow-text">Confirm ID + weight verification + questionnaire eligibility <strong>before</strong> SCR.</div>
            </div>
            <div class="scr-flow-card blue">
              <div class="scr-flow-top">
                <span class="scr-chip blue">Step 2</span>
                <span class="scr-flow-title">Scraping tool</span>
              </div>
              <div class="scr-flow-text">Pass → prescribe (no need to open SCR). Flagged → open SCR. No person found → follow SCR unavailable guidance.</div>
            </div>
            <div class="scr-flow-card orange">
              <div class="scr-flow-top">
                <span class="scr-chip orange">Step 3</span>
                <span class="scr-flow-title">Decision</span>
              </div>
              <div class="scr-flow-text">Absolute contraindication → reject. Needs more info → email patient (one email with all questions) + hold.</div>
            </div>
            <div class="scr-flow-card purple">
              <div class="scr-flow-top">
                <span class="scr-chip purple">Step 4</span>
                <span class="scr-flow-title">Document</span>
              </div>
              <div class="scr-flow-text">Use consistent notes (examples below). Wrongful access → PSI.</div>
            </div>
          </div>
        </div>

        <div class="protocol-card">
          <div class="protocol-title">
            <div class="icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            Step 1 — When to check SCR (and in what order)
          </div>
          <ul class="protocol-list">
            <li><strong>New patients:</strong> after ID + weight verification and questionnaire eligibility checks, proceed to SCR pathway.</li>
            <li><strong>Repeat patients (when eligible for SCR checks):</strong> still confirm eligibility (ID/BMI), then review SCR, then complete usual clinical checks (dose/type, gaps, tags).</li>
            <li><strong>One email rule:</strong> if anything needs clarification (SCR + PUE/dose issues + tags), send <strong>one single email</strong> containing <strong>every question</strong> needed to decide.</li>
          </ul>
          <div class="info-card red" style="margin-top: 12px;">
            <div class="info-card-title">Wrongful SCR access = incident</div>
            <div class="info-card-text">Entering SCR <strong>before</strong> ID + weight verification is an incident → complete a PSI. Accidental wrong-patient SCR access is also a PSI.</div>
          </div>
          <div class="info-card blue" style="margin-top: 12px;">
            <div class="info-card-title">Repeat rejections</div>
            <div class="info-card-text">If a <strong>repeat</strong> order is rejected based on SCR information, complete a PSI using “Patient provided incorrect information - SCR confirmed”.</div>
          </div>
        </div>

        <div class="protocol-card">
          <div class="protocol-title">
            <div class="icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            Step 2 — Scraping tool outcomes (what to do)
          </div>
          <div class="scr-outcomes">
            <div class="scr-outcome-card green">
              <div class="scr-outcome-title"><span class="scr-chip green">PASS</span> No keyword match</div>
              <div class="scr-outcome-text">Valid for 6 months. <strong>Prescribe without opening SCR.</strong> Document “SCR pass”.</div>
            </div>
            <div class="scr-outcome-card orange">
              <div class="scr-outcome-title"><span class="scr-chip orange">FLAGGED</span> Keyword match</div>
              <div class="scr-outcome-text"><strong>Open SCR</strong> to determine: absolute contraindication vs needs more information.</div>
            </div>
            <div class="scr-outcome-card purple">
              <div class="scr-outcome-title"><span class="scr-chip purple">NO RECORD</span> No person found</div>
              <div class="scr-outcome-text">Follow SCR unavailable guidance: document, proceed per questionnaire. <strong>Do not</strong> hold or email purely due to missing SCR.</div>
            </div>
          </div>
        </div>

        <div class="protocol-card">
          <div class="protocol-title">
            <div class="icon orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l9 4v6c0 5-3.8 9.7-9 10-5.2-.3-9-5-9-10V6l9-4z"/>
                <path d="M12 8v4"/>
                <path d="M12 16h.01"/>
              </svg>
            </div>
            Step 3 — Permission to view SCR
          </div>
          <div class="protocol-text">If a patient has not granted permission to view SCR (legacy orders placed before permission was mandatory):</div>
          <ul class="protocol-list">
            <li>Email the patient using <strong>Macro 11</strong> (template below).</li>
            <li>If permission is granted over email: document permission + link to Zendesk ticket, then proceed to check SCR on NHS site.</li>
            <li>If permission is not granted: <strong>reject</strong> the order.</li>
          </ul>
        </div>

        <div class="protocol-card">
          <div class="protocol-title">
            <div class="icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <path d="M8 8h8M8 12h8M8 16h8"/>
              </svg>
            </div>
            Step 4 — If flagged: how to enter & review SCR
          </div>
          <div class="scr-two-col">
            <div>
              <div class="protocol-section-title">Accessing SCR</div>
              <ol class="protocol-ol">
                <li>Open SCR via NHS Spine Services (or “open NHS site” button in interface).</li>
                <li>Login with HeliosX email + password.</li>
                <li>Enter the 6-digit verification code (Authenticator app).</li>
                <li>Select the appropriate role, then Continue to Find patient.</li>
              </ol>
            </div>
            <div>
              <div class="protocol-section-title">Searching & reviewing</div>
              <ol class="protocol-ol">
                <li>Use “Advanced” search.</li>
                <li>Enter Gender, First name, Last name, DOB (single date).</li>
                <li>Find patient → verify demographics (address if multiple matches).</li>
                <li>Enter record → Clinical tab → confirm permission to view.</li>
                <li>Review: Acute meds, Repeat meds, Diagnoses, Problems/Issues.</li>
              </ol>
            </div>
          </div>

          <details class="accordion">
            <summary>SCR not available / limited — what to do</summary>
            <div class="accordion-body">
              <table class="protocol-table">
                <tr><th style="width: 35%;">Scenario</th><th>Prescriber action</th></tr>
                <tr><td><strong>SCR available</strong></td><td>Proceed with SCR review, document outcome, and act accordingly.</td></tr>
                <tr><td><strong>SCR not available</strong></td><td>Document “SCR unavailable”. Proceed based on questionnaire/standard SOP. <strong>Do not</strong> hold the order. <strong>Do not</strong> email patient purely due to missing SCR.</td></tr>
                <tr><td><strong>SCR available but limited</strong></td><td>Document “SCR checked but limited”. Proceed per standard SOP. Do not hold unless specific information is required about a condition/medication.</td></tr>
              </table>
              <div class="protocol-text" style="margin-top: 10px;">Common reasons: recently registered NHS patient, mismatched demographics, outside England (Wales/Scotland/NI), opted out/limited, GP practice not fully enabled, not registered with GP, enhanced privacy.</div>
            </div>
          </details>
        </div>

        <div class="protocol-card">
          <div class="protocol-title">
            <div class="icon red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <path d="M12 9v4"/>
                <path d="M12 17h.01"/>
              </svg>
            </div>
            Decision-making (flagged SCR)
          </div>
          <div class="protocol-text">If the scraping tool flags a keyword, open SCR and decide between: <strong>absolute contraindication</strong> (reject) vs <strong>needs further information</strong> (email + hold) vs <strong>escalate</strong> if uncertain.</div>

          <details class="accordion" open>
            <summary>Absolute contraindications — reject immediately</summary>
            <div class="accordion-body">
              <div class="protocol-text"><strong>Table 1:</strong> If any of these conditions are present, <strong>reject the prescription immediately</strong>. No further information needed.</div>
              <table class="protocol-table">
                <tr><th>Condition</th><th style="width: 140px;">Action</th></tr>
                <tr><td><strong>Pancreatitis</strong><br>Including acute or chronic pancreatic insufficiency</td><td><span class="tag red">Reject</span></td></tr>
                <tr><td><strong>Eating disorders:</strong><br>• Anorexia nervosa<br>• Bulimia nervosa<br>• Binge Eating Disorder (BED)<br>• Avoidant/Restrictive Food Intake Disorder (ARFID)</td><td><span class="tag red">Reject</span></td></tr>
                <tr><td><strong>Type 1 diabetes</strong><br>Aka Insulin-dependent diabetes mellitus (IDDM)</td><td><span class="tag red">Reject</span></td></tr>
                <tr><td><strong>Liver cirrhosis</strong></td><td><span class="tag red">Reject</span></td></tr>
                <tr><td><strong>Liver transplant</strong></td><td><span class="tag red">Reject</span></td></tr>
                <tr><td><strong>Endocrine disorders</strong> (acromegaly, Cushing’s, Addison’s, congenital adrenal hyperplasia)</td><td><span class="tag red">Reject</span></td></tr>
                <tr><td><strong>Ulcerative colitis</strong></td><td><span class="tag red">Reject</span></td></tr>
                <tr><td><strong>Crohn’s disease</strong></td><td><span class="tag red">Reject</span></td></tr>
                <tr><td><strong>Gastroparesis</strong><br>(Delayed gastric emptying)</td><td><span class="tag red">Reject</span></td></tr>
                <tr><td><strong>Multiple Endocrine Neoplasia type 2 (MEN2)</strong></td><td><span class="tag red">Reject</span></td></tr>
                <tr><td><strong>Medullary Thyroid cancer</strong></td><td><span class="tag red">Reject</span></td></tr>
                <tr><td><strong>Oral diabetic medication</strong> on repeat medication list<br><em>See detailed list below</em></td><td><span class="tag red">Reject</span></td></tr>
                <tr><td><strong>Medication with Narrow Therapeutic Index</strong> on repeat medication list<br><em>See detailed list below</em></td><td><span class="tag red">Reject</span></td></tr>
                <tr><td><strong>Insulin</strong> on repeat medication list</td><td><span class="tag red">Reject</span></td></tr>
                <tr><td><strong>Thyroid disease</strong><br>(For <strong>Nevolat</strong> prescriptions ONLY)</td><td><span class="tag red">Reject</span></td></tr>
              </table>

              <div class="protocol-section-title" style="margin-top: 20px;">Oral diabetic medications (reject if on repeat list)</div>
              <div class="scr-two-col">
                <div>
                  <strong>Sulfonylureas:</strong>
                  <ul class="protocol-list">
                    <li>Diamicron [gliclazide]</li>
                    <li>Daonil [glibenclamide]</li>
                    <li>Rastin [tolbutamide]</li>
                  </ul>
                  <strong>SGLT2 inhibitors:</strong>
                  <ul class="protocol-list">
                    <li>Jardiance [empagliflozin]</li>
                    <li>Forxiga [dapagliflozin]</li>
                    <li>Invokana [canagliflozin]</li>
                  </ul>
                </div>
                <div>
                  <strong>DPP-4 inhibitors:</strong>
                  <ul class="protocol-list">
                    <li>Januvia [sitagliptin]</li>
                    <li>Galvus [vildagliptin]</li>
                    <li>Trajenta [linagliptin]</li>
                  </ul>
                  <strong>Thiazolidinediones:</strong>
                  <ul class="protocol-list">
                    <li>Actos [pioglitazone]</li>
                  </ul>
                </div>
              </div>

              <div class="protocol-section-title" style="margin-top: 20px;">Narrow Therapeutic Index medications (reject if on repeat list)</div>
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
                  </ul>
                </div>
                <div>
                  <ul class="protocol-list">
                    <li>Mycophenolate mofetil</li>
                    <li><strong>Oral</strong> methotrexate</li>
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
          </details>

          <details class="accordion">
            <summary>Table 2: Time-sensitive conditions — workflow with macros</summary>
            <div class="accordion-body">
              <div class="protocol-text"><strong>Table 2:</strong> When timing information is needed, use appropriate macro. Reject when timing falls within contraindication window.</div>
              <table class="protocol-table">
                <tr>
                  <th>Condition</th>
                  <th style="width: 110px;">Timeframe</th>
                  <th style="width: 110px;">Macro</th>
                  <th>Before Emailing</th>
                  <th>After Patient Response</th>
                </tr>
                <tr>
                  <td><strong>🏥 Bariatric Surgery</strong><br><span style=\"font-size: 0.85em; color: var(--text-muted); font-style: italic;\">RYGB • Sleeve • Gastric Band • BPD/DS • Mini Bypass • Gastric balloon</span></td>
                  <td><span style=\"font-weight: 700; color: var(--danger); font-size: 14px;\">&lt;12 months</span></td>
                  <td><a href=\"#macro-1\" class=\"tag blue\">Macro 1</a></td>
                  <td><div class=\"checklist-item\">Check SCR for surgery date</div><div class=\"checklist-item\">If timing unclear → hold + email</div><div class=\"checklist-item\">Add tag: <span class=\"tag orange\">Pending Customer Response</span></div></td>
                  <td><span class=\"decision-reject\">REJECT</span> if &lt;12 months<br><br><span class=\"decision-prescribe\">PRESCRIBE</span> if ≥12 months</td>
                </tr>
                <tr>
                  <td><strong>🏥 Cholecystectomy</strong><br><span style=\"font-size: 0.85em; color: var(--text-muted); font-style: italic;\">(gallbladder removal)</span></td>
                  <td><span style=\"font-weight: 700; color: var(--danger); font-size: 14px;\">&lt;12 months</span></td>
                  <td><a href=\"#macro-1\" class=\"tag blue\">Macro 1</a></td>
                  <td><div class=\"checklist-item\">Check SCR for surgery date</div><div class=\"checklist-item\">If timing unclear → hold + email</div><div class=\"checklist-item\">Add tag: <span class=\"tag orange\">Pending Customer Response</span></div></td>
                  <td><span class=\"decision-reject\">REJECT</span> if &lt;12 months<br><br><span class=\"decision-prescribe\">PRESCRIBE</span> if ≥12 months</td>
                </tr>
                <tr>
                  <td><strong>💉 Insulin</strong></td>
                  <td><span style=\"font-weight: 700; color: var(--danger); font-size: 14px;\">&lt;3 months</span><br><strong style=\"color: var(--danger);\">OR</strong><br><span style=\"font-weight: 700; color: var(--danger);\">On repeat list</span></td>
                  <td><a href=\"#macro-1\" class=\"tag blue\">Macro 1</a></td>
                  <td><div class=\"checklist-item\">Check acute meds (last 3 months)</div><div class=\"checklist-item\">Check repeat medication list</div><div class=\"checklist-item\">If on repeat list → <strong>reject immediately</strong></div><div class=\"checklist-item\">If timing unclear → hold + email</div></td>
                  <td><span class=\"decision-reject\">REJECT</span> if prescribed within 3 months or on repeat list</td>
                </tr>
                <tr>
                  <td><strong>💊 Oral Diabetic Meds</strong><br><span style=\"font-size: 0.85em; color: var(--text-muted); font-style: italic;\">Sulfonylureas • SGLT2 inhibitors • DPP-4 inhibitors • Thiazolidinediones</span></td>
                  <td><span style=\"font-weight: 700; color: var(--danger); font-size: 14px;\">&lt;3 months</span><br><strong style=\"color: var(--danger);\">OR</strong><br><span style=\"font-weight: 700; color: var(--danger);\">On repeat list</span></td>
                  <td><a href=\"#macro-1\" class=\"tag blue\">Macro 1</a></td>
                  <td><div class=\"checklist-item\">Check acute meds (last 3 months)</div><div class=\"checklist-item\">Check repeat medication list</div><div class=\"checklist-item\">If on repeat list → <strong>reject immediately</strong></div><div class=\"checklist-item\">If timing unclear → hold + email</div></td>
                  <td><span class=\"decision-reject\">REJECT</span> if prescribed within 3 months or on repeat list</td>
                </tr>
                <tr>
                  <td><strong>⚠️ Narrow Therapeutic Index Meds</strong><br><span style=\"font-size: 0.85em; color: var(--text-muted); font-style: italic;\">Amiodarone • Carbamazepine • Ciclosporin • Clozapine • Digoxin • Lithium • Warfarin • Others</span></td>
                  <td><span style=\"font-weight: 700; color: var(--danger); font-size: 14px;\">&lt;3 months</span><br><strong style=\"color: var(--danger);\">OR</strong><br><span style=\"font-weight: 700; color: var(--danger);\">On repeat list</span></td>
                  <td><a href=\"#macro-1\" class=\"tag blue\">Macro 1</a></td>
                  <td><div class=\"checklist-item\">Check acute meds (last 3 months)</div><div class=\"checklist-item\">Check repeat medication list</div><div class=\"checklist-item\">If on repeat list → <strong>reject immediately</strong></div><div class=\"checklist-item\">If timing unclear → hold + email</div></td>
                  <td><span class=\"decision-reject\">REJECT</span> if prescribed within 3 months or on repeat list</td>
                </tr>
                <tr>
                  <td><strong>💊 Orlistat</strong><br><span style=\"font-size: 0.85em; color: var(--text-muted); font-style: italic;\">Alli • Xenical</span></td>
                  <td><span style=\"font-weight: 700; color: var(--danger); font-size: 14px;\">&lt;1 month</span></td>
                  <td><a href=\"#macro-1\" class=\"tag blue\">Macro 1</a></td>
                  <td><div class=\"checklist-item\">Check SCR for recent Orlistat</div><div class=\"checklist-item\">If timing unclear → hold + email</div><div class=\"checklist-item\">Add tag: <span class=\"tag orange\">Pending Customer Response</span></div></td>
                  <td><span class=\"decision-reject\">REJECT</span> if &lt;1 month<br><br><em style=\"color: var(--text-muted); font-size: 0.9em;\">Concurrent use contraindicated</em></td>
                </tr>
              </table>
              <div class="info-card warning" style="margin-top: 12px;">
                <div class="info-card-title">Transfer edge case</div>
                <div class="info-card-text">If GLP‑1 is flagged for a transfer patient with PUE within the last month, follow up using main SOP (macro “PUE &lt;2 Weeks Old”) rather than rejecting.</div>
              </div>
            </div>
          </details>

          <details class="accordion">
            <summary>Table 3: Clinical details needed — macros & decision pathway</summary>
            <div class="accordion-body">
              <div class="protocol-text"><strong>Table 3:</strong> When clinical details are needed to make a prescribing decision.</div>
              <table class="protocol-table">
                <tr>
                  <th>Condition</th>
                  <th style="width: 110px;">Macro</th>
                  <th>Before Emailing</th>
                  <th style="width: 160px;">Information to Request</th>
                  <th>After Patient Response</th>
                </tr>
                <tr>
                  <td><strong>🩺 Cholelithiasis</strong><br><span style="font-size: 0.85em; color: var(--text-muted); font-style: italic;">(gallstones)</span></td>
                  <td><a href="#macro-2" class="tag blue">Macro 2</a></td>
                  <td><div class="checklist-item">Check SCR for cholecystectomy evidence</div><div class="checklist-item">If no evidence → hold + email</div><div class="checklist-item">Add tag: <span class="tag orange">Pending Customer Response</span></div></td>
                  <td>Ask if patient had cholecystectomy (gallbladder removal surgery)</td>
                  <td><span class="decision-reject">REJECT</span> if no cholecystectomy<br><br><span class="decision-prescribe">PRESCRIBE</span> if cholecystectomy confirmed</td>
                </tr>
                <tr>
                  <td><strong>🩺 Cholecystitis</strong><br><span style="font-size: 0.85em; color: var(--text-muted); font-style: italic;">(gallbladder inflammation)</span></td>
                  <td><a href="#macro-2" class="tag blue">Macro 2</a></td>
                  <td><div class="checklist-item">Check SCR for cholecystectomy evidence</div><div class="checklist-item">If no evidence → hold + email</div><div class="checklist-item">Add tag: <span class="tag orange">Pending Customer Response</span></div></td>
                  <td>Ask if patient had cholecystectomy (gallbladder removal surgery)</td>
                  <td><span class="decision-reject">REJECT</span> if no cholecystectomy<br><br><span class="decision-prescribe">PRESCRIBE</span> if cholecystectomy confirmed</td>
                </tr>
                <tr>
                  <td><strong>❤️ Heart Failure (HF)</strong></td>
                  <td><a href="#macro-4" class="tag blue">Macro 4</a></td>
                  <td><div class="checklist-item">Check SCR for HF stage</div><div class="checklist-item">If stage unclear → hold + email</div><div class="checklist-item">Add tag: <span class="tag orange">Pending Customer Response</span></div></td>
                  <td>Request latest cardiology letter stating:<br>• HF stage, OR<br>• Confirmation if fit for GLP-1</td>
                  <td><span class="decision-reject">REJECT</span> if Stage IV<br><br><span class="decision-prescribe">PRESCRIBE</span> if Stage I, II, or III</td>
                </tr>
                <tr>
                  <td><strong>🫘 Chronic Kidney Disease (CKD)</strong></td>
                  <td><a href="#macro-5" class="tag blue">Macro 5</a></td>
                  <td><div class="checklist-item">Check SCR for eGFR or CKD stage</div><div class="checklist-item">If eGFR/stage unclear → hold + email</div><div class="checklist-item">Add tag: <span class="tag orange">Pending Customer Response</span></div></td>
                  <td>Request:<br>• Most recent eGFR result, OR<br>• Latest specialist letter with CKD details</td>
                  <td><span class="decision-reject">REJECT</span> if eGFR &lt;30 or Stage 4/5<br><br><span class="decision-prescribe">PRESCRIBE</span> if eGFR ≥30 or Stage 1/2/3</td>
                </tr>
              </table>
            </div>
          </details>

          <details class="accordion">
            <summary>Conditions requiring patient assessment (Macros 3 / 6 / 7 / 8 / 9 / 10)</summary>
            <div class="accordion-body">
              <div class="protocol-text"><strong>Table 4:</strong> Additional conditions that require gathering information from the patient to determine safety and prescribing decision.</div>

              <table class="protocol-table">
                <tr><th>Condition</th><th>Macro</th><th>Before Emailing</th><th>Information to Request</th><th>After Patient Response</th></tr>
                <tr>
                  <td><strong>🎗️ Any Cancer Diagnosis</strong><br><span style="font-size: 0.85em; color: var(--text-muted); font-style: italic;">(excluding MEN2 or medullary thyroid cancer)</span></td>
                  <td><a href="#macro-3" class="tag blue">Macro 3</a></td>
                  <td><div class="checklist-item">Check SCR for cancer type and timeline</div><div class="checklist-item">Always require patient input</div><div class="checklist-item">Add tag: <span class="tag orange">Pending Customer Response</span></div></td>
                  <td>Ask if:<br>• Currently under oncology care?<br>• Cancer in remission?<br>• Request discharge/latest oncology letter</td>
                  <td><span class="decision-reject">REJECT</span> if active cancer/undergoing treatment<br><br><span class="decision-clinical">CLINICAL DECISION</span> if in remission (review oncology letter)</td>
                </tr>
                <tr>
                  <td><strong>🤰 Pregnancy</strong></td>
                  <td><a href="#macro-6" class="tag blue">Macro 6</a></td>
                  <td><div class="checklist-item">Always require confirmation</div><div class="checklist-item">Add tag: <span class="tag orange">Pending Customer Response</span></div></td>
                  <td>Ask if currently:<br>• Pregnant?<br>• Breastfeeding?<br>• Trying to conceive?</td>
                  <td><span class="decision-reject">REJECT</span> if pregnant, breastfeeding, or trying to conceive<br><br><span class="decision-prescribe">PRESCRIBE</span> if none of the above</td>
                </tr>
                <tr>
                  <td><strong>🧠 Dementia / Cognitive Impairment</strong></td>
                  <td><a href="#macro-7" class="tag blue">Macro 7</a></td>
                  <td><div class="checklist-item">Always require patient/carer input</div><div class="checklist-item">Add tag: <span class="tag orange">Pending Customer Response</span></div></td>
                  <td>Ask:<br>• Safe to use medication at home?<br>• Support available?<br>• Ability to self-administer?</td>
                  <td><span class="decision-clinical">CLINICAL DECISION</span> based on:<br>• Patient's ability to take medication safely<br>• Support network around patient</td>
                </tr>
                <tr>
                  <td><strong>🫃 Chronic Malabsorption</strong></td>
                  <td><a href="#macro-8" class="tag blue">Macro 8</a></td>
                  <td><div class="checklist-item">Always require confirmation</div><div class="checklist-item">Add tag: <span class="tag orange">Pending Customer Response</span></div></td>
                  <td>Ask if patient has formal diagnosis of chronic malabsorption</td>
                  <td><span class="decision-reject">REJECT</span> if formal diagnosis confirmed<br><br><span class="decision-prescribe">PRESCRIBE</span> if no formal diagnosis</td>
                </tr>
                <tr>
                  <td><strong>😔 Depression or Anxiety</strong><br><br><span style="font-size: 0.85em; color: var(--danger); font-weight: 600;">⚠️ Contraindication: acutely mentally unwell</span></td>
                  <td><a href="#macro-9" class="tag blue">Macro 9</a></td>
                  <td><div class="checklist-item">Check SCR entry date</div><div class="checklist-item">Check antidepressant start/dose change dates</div><div class="checklist-item">If &lt;3 months → hold + email</div><div class="checklist-item">Add tag: <span class="tag orange">Pending Customer Response</span></div></td>
                  <td>Request confirmation of:<br>• When condition added to SCR<br>• Any new antidepressants or dose changes in last 3 months</td>
                  <td><span class="decision-reject">REJECT</span> if entry &lt;3 months old OR new antidepressant/dose increase in last 3 months<br><br><span class="decision-prescribe">PRESCRIBE</span> if ≥3 months</td>
                </tr>
                <tr>
                  <td><strong>⚠️ Active Suicidal Ideation</strong></td>
                  <td><a href="#macro-9" class="tag blue">Macro 9</a></td>
                  <td><div class="checklist-item">Check SCR entry date</div><div class="checklist-item">If &lt;12 months → hold + email</div><div class="checklist-item">Add tag: <span class="tag orange">Pending Customer Response</span></div></td>
                  <td>Request confirmation of when suicidal ideation was added to SCR</td>
                  <td><span class="decision-reject">REJECT</span> if &lt;12 months<br><br><span class="decision-prescribe">PRESCRIBE</span> if ≥12 months</td>
                </tr>
                <tr>
                  <td><strong>🍺 Current Alcohol Abuse or Dependence</strong></td>
                  <td><a href="#macro-10" class="tag blue">Macro 10</a></td>
                  <td><div class="checklist-item">Check SCR entry date</div><div class="checklist-item">If &lt;12 months or "current" → hold + email</div><div class="checklist-item">Add tag: <span class="tag orange">Pending Customer Response</span></div></td>
                  <td>Request confirmation of:<br>• When alcohol abuse was added to SCR<br>• Current alcohol use status</td>
                  <td><span class="decision-reject">REJECT</span> if &lt;12 months or current abuse<br><br><span class="decision-prescribe">PRESCRIBE</span> if ≥12 months and no current abuse</td>
                </tr>
              </table>

              <div class="protocol-section-title" style="margin-top: 20px;">Cancer assessment (Macro 3)</div>
              <div class="protocol-text">For any cancer diagnosis (excluding MEN2 or medullary thyroid cancer), ask the patient:</div>
              <ul class="protocol-list">
                <li>Are they under a specialist / currently undergoing treatment from an oncology team?</li>
                <li>Is the cancer in remission? Have they been discharged from oncology?</li>
                <li>Ask for discharge letter / latest oncology letter.</li>
              </ul>
            </div>
          </details>
        </div>

        <div class="protocol-card">
          <div class="protocol-title">
            <div class="icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
            </div>
            Escalations (when and how)
          </div>
          <div class="protocol-text"><strong>Escalate when:</strong></div>
          <ul class="protocol-list">
            <li>You gathered further information using macros but are still unsure of the prescribing decision.</li>
            <li>You see SCR information and aren’t sure if it’s a contraindication to GLP‑1s.</li>
            <li>You received an email response but aren’t sure if it indicates a contraindication.</li>
          </ul>
          <div class="protocol-text"><strong>Actions:</strong></div>
          <ol class="protocol-ol">
            <li>Add a note to the customer’s account.</li>
            <li>Create a Jira escalation ticket using option “SCR query”.</li>
            <li>Change tag from “prescriber review” to “escalated”.</li>
          </ol>
        </div>

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
          <div class="protocol-text">If rejecting a repeat patient after several months of prescribing, use <strong>Macro 12</strong>. If patients reply unhappy, senior pharmacists may call using these principles:</div>
          <ul class="protocol-list">
            <li><strong>Lead with empathy</strong> (“I can hear you are frustrated”).</li>
            <li><strong>Explain through safety</strong> (protection not restriction).</li>
            <li>Keep it simple, direct, reassuring (not defensive).</li>
            <li>Offer a path forward (signpost GP/alternatives).</li>
            <li>Maintain boundaries calmly; no exceptions if unsafe.</li>
          </ul>
        </div>

        <div class="protocol-card">
          <div class="protocol-title">
            <div class="icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            Documentation — copy-ready examples
          </div>

          <div class="scr-copy-row"><div class="scr-copy-title">SCR pass (scraping tool)</div><button class="btn btn-secondary copy-btn" data-copy-target="scr-doc-pass">Copy</button></div>
          <pre id="scr-doc-pass" class="macro-box">SCR pass - no contraindications to GLP1s\n\nPatient ID and Weight verification photo reviewed, eligible for medication according to information provided and no contraindications flagged by scrapping tool. Prescription issued.</pre>

          <div class="scr-copy-row"><div class="scr-copy-title">Flagged, then clear on SCR</div><button class="btn btn-secondary copy-btn" data-copy-target="scr-doc-clear">Copy</button></div>
          <pre id="scr-doc-clear" class="macro-box">SCR checked - no contraindications to GLP1s\n\nPatient ID and Weight verification photo reviewed, eligible for medication according to information provided and no contraindications found on SCR consultation. Prescription issued.</pre>

          <div class="scr-copy-row"><div class="scr-copy-title">Absolute contraindication</div><button class="btn btn-secondary copy-btn" data-copy-target="scr-doc-abs">Copy</button></div>
          <pre id="scr-doc-abs" class="macro-box">SCR checked [reason for contra-indication] [date noted in SCR]\n\nPatient ID and Weight verification photo reviewed, not eligible for medication according to information found on SCR consultation. Contraindication found - [e.g. history of pancreatitis].</pre>

          <div class="scr-copy-row"><div class="scr-copy-title">Further information needed</div><button class="btn btn-secondary copy-btn" data-copy-target="scr-doc-more">Copy</button></div>
          <pre id="scr-doc-more" class="macro-box">SCR checked - further information needed - email sent [add zendesk link]\n\nTag changed from “prescriber review” to “awaiting customer response”.</pre>

          <div class="scr-copy-row"><div class="scr-copy-title">SCR unavailable / limited</div><button class="btn btn-secondary copy-btn" data-copy-target="scr-doc-unavail">Copy</button></div>
          <pre id="scr-doc-unavail" class="macro-box">SCR unavailable\n\nProceed according to standard prescription SOP. No hold/email purely for missing SCR.</pre>
          <pre class="macro-box" style="margin-top: 10px;">SCR checked but limited - no contraindications to GLP1 found\n\nProceed according to standard prescription SOP. Hold only if specific information is required about a condition/medication.</pre>
        </div>

        <div class="protocol-card">
          <div class="protocol-title">
            <div class="icon orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l9 4v6c0 5-3.8 9.7-9 10-5.2-.3-9-5-9-10V6l9-4z"/>
              </svg>
            </div>
            Email templates (Macros)
          </div>
          <div class="protocol-text">Use these when additional information is required or when permission/rejection messaging is needed.</div>
          ${this.getSCRMacroAccordions()}
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
        <div class="protocol-section">
          <div class="protocol-section-title">Repeat Patients (Minimum BMI 21)</div>
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
            Email patient requesting UK GP details. If patient is unable to provide a UK GP, <strong>reject the order</strong>.
          </div>
        </div>
      </div>
    `;
  },

  getPUEProtocolCards() {
    return `
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
        <div class="info-card red" style="margin-top: 16px;">
          <div class="info-card-title">⚠️ Order Confirmation is NOT Acceptable</div>
          <div class="info-card-text">
            PUE must be a <strong>dispatch notification, prescription, or dispensing label</strong>. Simple order confirmations do not qualify. Evidence may be provided over multiple screenshots.
          </div>
        </div>
      </div>

      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
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
            If either PUE or previous BMI photo fails requirements, patient is not eligible. Use email template <em>Clinical: Evidence of starting BMI</em>.
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
              <strong>Do NOT use "Weight verification failed" tag</strong> for previous BMI photos. That tag is only for current weight verification photos.
            </div>
          </div>
        </div>
      </div>

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
          <li>Send email using template: <em>Clinical: PUE &lt;2 Weeks Old</em></li>
          <li>Email reminds them to complete their current treatment before starting the MedExpress pen</li>
        </ul>
      </div>
    `;
  },

  getTitrationProtocolCards() {
    return `
      <div class="protocol-card">
        <div class="protocol-title">
          <div class="icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20V10M18 20V4M6 20v-4"/>
            </svg>
          </div>
          Correct Titration
        </div>
        <div class="protocol-text">
          <strong>For patients on 2nd+ order:</strong> Check that patients are titrating up doses as expected.
        </div>
        <div class="protocol-text">
          Titration schedules differ by medication:
        </div>
        <table class="dose-table">
          <tr>
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
        <div class="info-card blue" style="margin-top: 16px;">
          <div class="info-card-title">Nevolat Pen Label Instruction</div>
          <div class="info-card-text">
            "Inject once daily under the skin at the same time each day. If switching from another weight loss medication, check your email for dosage instructions."
          </div>
        </div>
      </div>

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
          If patient skips a dose in the titration sequence, use email template: <em>Clinical: Evidence request - Skipped Dose (GLP1)</em>
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
          If patient stays on same dose or reduces strength: <strong>Prescribe first, then contact afterwards</strong> using template <em>Clinical: Did not titrate up / Went down in strength (GLP1)</em>
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
            Use email template <em>Clinical: Gap in treatment (GLP1)</em> and add <span class="tag orange">Pending Customer Response</span> tag.
          </div>
        </div>
      </div>

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
            Do NOT give multiple doses to match an equivalent (e.g., 2×5mg instead of 10mg). Redirect patient to stay on same dose until their next dose comes back in stock.
          </div>
        </div>
      </div>
    `;
  },

  getWeightProtocolCards() {
    return `
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
            <li><span class="tag red">Patient has two consecutive weight gains</span> — <strong>Second consecutive instance</strong>. Falls into Complex Repeats queue. Order placed on hold until patient responds.</li>
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
        <table class="dose-table">
          <tr>
            <th style="width: 25%;">Question</th>
            <th style="width: 35%;">When to Approve</th>
            <th style="width: 40%;">Additional Actions / Guidance</th>
          </tr>
          <tr>
            <td><strong>Difficulties injecting?</strong></td>
            <td>Approve if <strong>minor pain</strong> at injection site</td>
            <td>Send <em>Minor SEs - Injection Site Reaction</em> macro with guidance on proper injection technique (ice pack before injection, antihistamine cream)</td>
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
            <td>Use Side Effects Macros available on prescribing interface and ZenDesk</td>
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
        <div class="protocol-text">
          System adds <span class="tag red">Weight loss between orders exceeds threshold</span> tag. Order is placed on hold until patient responds.
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
        <table class="dose-table">
          <tr>
            <th style="width: 30%;">Question</th>
            <th style="width: 35%;">When to Approve</th>
            <th style="width: 35%;">Additional Actions / Guidance</th>
          </tr>
          <tr>
            <td><strong>Side effects? (nausea, vomiting, diarrhoea)</strong></td>
            <td>Approve if <strong>mild</strong> side effects</td>
            <td>Mild SEs are common with GLP-1s. Use Side Effects Macros available on interface</td>
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
    `;
  },

  getSwitchingProtocolCards() {
    return `
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
    `;
  },

  getReviewsProtocolCards() {
    return `
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
    `;
  },

  getDefinitionsContent() {
    return `
      <div class="protocol-page">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">Definitions</h1>
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
              <strong>DO NOT PRESCRIBE</strong> if patient has ANY of the following absolute contraindications. Reject the consultation immediately.
            </div>
          </div>
        </div>

        <div class="protocol-card" id="pregnancy-contraindication">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--danger); flex-shrink: 0;">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <strong>Pregnancy & Reproduction</strong>
          </div>
          <ul class="protocol-list">
            <li><strong>Pregnancy</strong> — confirmed or suspected</li>
            <li><strong>Planning pregnancy</strong> — within next 2 months</li>
            <li><strong>Breastfeeding</strong> — currently breastfeeding</li>
            <li><strong>Inadequate contraception</strong> — sexually active women of childbearing potential must use reliable contraception</li>
          </ul>
        </div>

        <div class="protocol-card" id="diabetes-contraindication">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--warning); flex-shrink: 0;">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <strong>Diabetes & Metabolic Conditions</strong>
          </div>
          <ul class="protocol-list">
            <li><strong>Type 1 diabetes</strong></li>
            <li><strong>Diabetic ketoacidosis</strong> (history or current)</li>
            <li><strong>Diabetic retinopathy</strong> (for GLP-1 medications)</li>
          </ul>
        </div>

        <div class="protocol-card" id="thyroid-contraindication">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--accent); flex-shrink: 0;">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            <strong>Thyroid & Endocrine</strong>
          </div>
          <ul class="protocol-list">
            <li><strong>Personal history of medullary thyroid carcinoma (MTC)</strong></li>
            <li><strong>Family history of medullary thyroid carcinoma</strong></li>
            <li><strong>Multiple endocrine neoplasia syndrome type 2 (MEN2)</strong></li>
            <li><strong>History of thyroid cancer</strong> (any type)</li>
          </ul>
        </div>

        <div class="protocol-card" id="gastrointestinal-contraindication">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--warning); flex-shrink: 0;">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <strong>Gastrointestinal</strong>
          </div>
          <ul class="protocol-list">
            <li><strong>Active pancreatitis</strong></li>
            <li><strong>History of pancreatitis</strong></li>
            <li><strong>Inflammatory bowel disease</strong> (Crohn's disease, ulcerative colitis) — active or significant history</li>
            <li><strong>Gastroparesis</strong></li>
          </ul>
        </div>

        <div class="protocol-card" id="renal-hepatic-contraindication">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--danger); flex-shrink: 0;">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <strong>Renal & Hepatic</strong>
          </div>
          <ul class="protocol-list">
            <li><strong>Severe renal impairment</strong> — eGFR &lt;30 mL/min/1.73m²</li>
            <li><strong>End-stage renal disease (ESRD)</strong></li>
            <li><strong>Severe hepatic impairment</strong> — decompensated cirrhosis, acute liver failure</li>
          </ul>
        </div>

        <div class="protocol-card" id="allergies-contraindication">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--danger); flex-shrink: 0;">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <path d="M12 9v4M12 17h.01"/>
            </svg>
            <strong>Allergies & Previous Reactions</strong>
          </div>
          <ul class="protocol-list">
            <li><strong>Known hypersensitivity</strong> to semaglutide, tirzepatide, liraglutide, or any excipients</li>
            <li><strong>Previous severe reaction</strong> to any GLP-1 agonist</li>
          </ul>
        </div>

        <div class="protocol-card" id="psychiatric-contraindication">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--accent); flex-shrink: 0;">
              <path d="M12 2a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9s9-4.03 9-9a9 9 0 0 0-9-9z"/>
              <path d="M12 6v6l4 2"/>
              <path d="M16.5 12c.28 0 .5.22.5.5s-.22.5-.5.5-.5-.22-.5-.5.22-.5.5-.5z"/>
            </svg>
            <strong>Psychiatric & Behavioral</strong>
          </div>
          <ul class="protocol-list">
            <li><strong>Active eating disorder</strong> — anorexia nervosa, bulimia nervosa</li>
            <li><strong>Active suicidal ideation</strong></li>
            <li><strong>Severe untreated depression</strong> or psychiatric instability</li>
          </ul>
        </div>

        <div class="protocol-card" id="age-restrictions">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--accent); flex-shrink: 0;">
              <circle cx="12" cy="8" r="7"/>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
            </svg>
            <strong>Age Restrictions</strong>
          </div>
          <ul class="protocol-list">
            <li><strong>Under 18 years old</strong> — unless exceptional circumstances with specialist input</li>
            <li><strong>Over 75 years old</strong> — caution required, may need specialist review</li>
          </ul>
        </div>

        <div class="protocol-card" id="other-contraindications">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--danger); flex-shrink: 0;">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <strong>Other Absolute Contraindications</strong>
          </div>
          <ul class="protocol-list">
            <li><strong>Malignancy</strong> — active cancer or recent cancer (within 5 years) except basal cell carcinoma</li>
            <li><strong>Substance abuse</strong> — active drug or alcohol abuse</li>
            <li><strong>Inability to give informed consent</strong></li>
          </ul>
        </div>

        <div class="protocol-card" id="interacting-medications">
          <div class="protocol-title" style="display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--danger); flex-shrink: 0;">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <path d="M12 9v4M12 17h.01"/>
            </svg>
            <strong>Interacting Medications</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            Patient must answer <strong>"No"</strong> to the question: "Are you currently taking any of the following medications?" If <strong>Yes</strong> to any → reject consultation.
          </div>
          <ul class="protocol-list">
            <li>Amiodarone</li>
            <li>Carbamazepine</li>
            <li>Ciclosporin</li>
            <li>Clozapine</li>
            <li>Digoxin</li>
            <li>Fenfluramine</li>
            <li>Lithium</li>
            <li>Mycophenolate mofetil</li>
            <li>Oral methotrexate</li>
            <li>Phenobarbital</li>
            <li>Phenytoin</li>
            <li>Somatrogon</li>
            <li>Tacrolimus</li>
            <li>Theophylline</li>
            <li>Warfarin</li>
          </ul>
        </div>

        <div class="info-card blue" style="margin-top: 20px;">
          <div style="display: flex; align-items: flex-start; gap: 10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px;">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            <div>
              <strong>Caution Required (Not Absolute Contraindications):</strong> Moderate renal/hepatic impairment, history of gallbladder disease, cardiovascular disease, hypoglycemia risk (when used with insulin/sulfonylureas), gastrointestinal disease, age &gt;75 years. These require careful assessment but are not automatic rejections.
            </div>
          </div>
        </div>

        <div class="info-card blue" style="margin-top: 20px;">
          <div style="display: flex; align-items: flex-start; gap: 10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px;">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            <div>
              <strong>Caution Required (Not Absolute Contraindications):</strong> Moderate renal/hepatic impairment, history of gallbladder disease, cardiovascular disease, hypoglycemia risk (when used with insulin/sulfonylureas), gastrointestinal disease, age &gt;75 years. These require careful assessment but are not automatic rejections.
            </div>
          </div>
        </div>

        <h2 style="font-size: 22px; font-weight: 700; margin-top: 48px; margin-bottom: 24px; padding-top: 24px; border-top: 2px solid var(--border);">Time-Sensitive Conditions</h2>

        <div class="info-card orange" style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0;">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            <div>
              <strong>Timing Matters:</strong> If timing information is missing, email patient (Macro 1). Reject when timing falls within contraindication window.
            </div>
          </div>
        </div>

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
            <div class="info-card-text">Transfer patients will have PUE for the past month. In these cases please <strong>follow up with an email</strong> as per main SOP rather than rejecting. Email macro titled <strong>'PUE &lt;2 Weeks Old'</strong></div>
          </div>
        </div>

        <h2 style="font-size: 22px; font-weight: 700; margin-top: 48px; margin-bottom: 24px; padding-top: 24px; border-top: 2px solid var(--border);">Clinical Details Required</h2>

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

        <h2 style="font-size: 22px; font-weight: 700; margin-top: 48px; margin-bottom: 24px; padding-top: 24px; border-top: 2px solid var(--border);">Patient Assessment Required</h2>

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
            <li>Are they under a specialist / currently undergoing treatment from an oncology team?</li>
            <li>Is the cancer in remission? Have they been discharged from oncology?</li>
            <li>Request: Discharge letter / latest oncology letter</li>
          </ul>
          <div class="protocol-text" style="margin-top: 12px;">
            Use clinical judgement based on response to prescribe or reject.
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
            <strong>More information needed in ALL cases</strong> — Email using <strong class="tag orange">Macro 6</strong>
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
          <div class="protocol-text" style="margin-bottom: 12px;">
            Email using <strong class="tag orange">Macro 9</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>Check SCR for timing:</strong>
          </div>
          <ul class="protocol-list" style="margin-bottom: 16px;">
            <li>Added to SCR &lt;3 months ago? → <strong class="tag red">REJECT</strong></li>
            <li>Entry older than 3 months? → <strong class="tag green">Prescribe</strong></li>
          </ul>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>Antidepressant medications can be used as a proxy:</strong>
          </div>
          <ul class="protocol-list">
            <li>New antidepressant or dose increase in last 3 months? → <strong class="tag red">REJECT</strong></li>
            <li>New antidepressant or increased dose was ≥3 months ago? → <strong class="tag green">Prescribe</strong></li>
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
            Email using <strong class="tag orange">Macro 9</strong>
          </div>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>Check SCR for timing:</strong>
          </div>
          <ul class="protocol-list">
            <li>Added to SCR in the last year (&lt;12 months)? → <strong class="tag red">REJECT</strong></li>
            <li>Added ≥12 months ago or more? → <strong class="tag green">Prescribe</strong></li>
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
            <strong>Ask patient about current drinking:</strong>
          </div>
          <ul class="protocol-list" style="margin-bottom: 16px;">
            <li>How much are they currently drinking?</li>
            <li>CAGE-style prompts: cut down, annoyed by criticism, guilty, eye-opener?</li>
          </ul>
          <div class="protocol-text" style="margin-bottom: 12px;">
            <strong>Check SCR for timing:</strong>
          </div>
          <ul class="protocol-list">
            <li>Added to SCR in the last year (&lt;12 months) OR current alcohol abuse? → <strong class="tag red">REJECT</strong></li>
            <li>Added ≥12 months ago? → <strong class="tag green">Prescribe</strong></li>
          </ul>
          <div class="info-card blue" style="margin-top: 12px;">
            <div class="info-card-title">Important Note</div>
            <div class="info-card-text">Only <strong>current alcohol dependence</strong> is an exclusion. Past history (&gt;12 months) is acceptable if patient is no longer dependent.</div>
          </div>
        </div>
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

        <div class="protocol-card" style="margin-top: 20px;">
          <div class="protocol-title">
            <div class="icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            System Tags — Informational Only
          </div>

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
    `;
  },

  getTransferContent() {
    return `
      <div class="protocol-page">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 24px;">Transfer Patients</h1>

        <div class="info-card purple" style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; flex-shrink: 0;">
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5"/>
            </svg>
            <div>
              <strong>Transfer Patient:</strong> A new MedExpress patient who has previously used GLP-1 medication from another <strong>private provider</strong>. Must provide proof of previous supply. <span style="display: inline-block; margin-left: 8px; padding: 2px 8px; background: var(--danger); color: white; border-radius: 4px; font-size: 11px; font-weight: 700;">NHS TRANSFERS NOT ALLOWED</span>
            </div>
          </div>
        </div>

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
                <span style="font-size: 12px; color: var(--accent);">Use email template: <em>Clinical: Evidence of starting BMI</em></span>
              </td>
            </tr>
          </table>
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
                3. Send manual email explaining the failure<br>
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

        <div class="protocol-card" style="margin-top: 20px;">
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

        <div class="protocol-card" style="margin-top: 20px;">
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

        <div class="protocol-card" style="margin-top: 20px;">
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

        <div class="protocol-card" style="margin-top: 20px;">
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

        <div class="protocol-card" style="margin-top: 20px;">
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

          <div class="protocol-section" style="margin-top: 16px;">
            <div class="protocol-section-title">Multiple Submissions - GLP1 Consultation</div>
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
    `;
  },

  attachEventListeners(pageId) {
    if (pageId === "dashboard") {
      // Prescription card clicks
      document.querySelectorAll(".prescription-card").forEach((card) => {
        card.addEventListener("click", () => {
          AppState.currentChecklist = card.dataset.type;
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
    }

    // Back button in protocol pages
    const backBtn = document.querySelector(".back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        NavigationManager.goToPage(backBtn.dataset.page || "dashboard");
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

    // Update progress circle
    const circumference = 150.8;
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
  // Load saved state
  Utils.loadState();

  // Initialize modules
  ThemeManager.init();
  NavigationManager.init();
  SearchManager.init();

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
