/* ==========================================================================
   SpendWise – script.js
   Vanilla JavaScript. No frameworks, no build step.
   Data lives in this browser's localStorage only (not synced, not encrypted).
   Sections:
     1. Constants and icons
     2. Utilities (dates, money, DOM helpers)
     3. Storage and state
     4. Calculations
     5. UI helpers (toasts, dialogs, charts)
     6. Page renderers
     7. Forms and actions
     8. Navigation and initialisation
   ========================================================================== */
(function () {
  'use strict';

  /* ======================================================================
     1. CONSTANTS AND ICONS
     ====================================================================== */
  var APP_PREFIX = 'spendwise.v1.';
  var KEYS = {
    transactions: APP_PREFIX + 'transactions',
    budgets: APP_PREFIX + 'budgets',
    goal: APP_PREFIX + 'goal',
    settings: APP_PREFIX + 'settings',
    seeded: APP_PREFIX + 'seeded'
  };

  var EXPENSE_CATEGORIES = ['Food', 'Transport', 'Education', 'Shopping', 'Entertainment', 'Other'];
  var INCOME_CATEGORIES = ['Pocket Money', 'Part-time Job', 'Scholarship', 'Gift', 'Other Income'];
  var PAYMENT_METHODS = ['UPI', 'Cash', 'Debit Card', 'Credit Card', 'Net Banking', 'Other'];

  var CATEGORY_META = {
    'Food': { icon: 'food', color: '#D97706' },
    'Transport': { icon: 'transport', color: '#2563EB' },
    'Education': { icon: 'education', color: '#7C3AED' },
    'Shopping': { icon: 'shopping', color: '#DB2777' },
    'Entertainment': { icon: 'entertainment', color: '#0891B2' },
    'Other': { icon: 'other', color: '#64748B' },
    'Pocket Money': { icon: 'wallet', color: '#047857' },
    'Part-time Job': { icon: 'job', color: '#0F766E' },
    'Scholarship': { icon: 'scholarship', color: '#4F46E5' },
    'Gift': { icon: 'gift', color: '#C026D3' },
    'Other Income': { icon: 'trendUp', color: '#16A34A' }
  };

  var CURRENCIES = {
    INR: { code: 'INR', locale: 'en-IN', name: 'Indian Rupee' },
    USD: { code: 'USD', locale: 'en-US', name: 'US Dollar' },
    EUR: { code: 'EUR', locale: 'en-IE', name: 'Euro' },
    GBP: { code: 'GBP', locale: 'en-GB', name: 'British Pound' },
    AED: { code: 'AED', locale: 'en-AE', name: 'UAE Dirham' },
    AUD: { code: 'AUD', locale: 'en-AU', name: 'Australian Dollar' },
    CAD: { code: 'CAD', locale: 'en-CA', name: 'Canadian Dollar' },
    SGD: { code: 'SGD', locale: 'en-SG', name: 'Singapore Dollar' },
    JPY: { code: 'JPY', locale: 'ja-JP', name: 'Japanese Yen' }
  };

  var PAGES = {
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    budgets: 'Budgets',
    reports: 'Reports',
    settings: 'Settings'
  };

  var MAX_AMOUNT = 1000000000;
  var MIN_DATE = '2000-01-01';
  var DATE_LOCALE = 'en-IN';

  /* Stroke-based icons. Each value is the inner markup of a 24x24 svg. */
  var ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    transactions: '<path d="M7 7h13"/><path d="M16 3l4 4-4 4"/><path d="M17 17H4"/><path d="M8 13l-4 4 4 4"/>',
    budgets: '<path d="M21.2 15.9A10 10 0 1 1 8 2.8"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    reports: '<path d="M3 3v18h18"/><path d="M8 17v-6"/><path d="M13 17V7"/><path d="M18 17v-4"/>',
    settings: '<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    trendUp: '<path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    trendDown: '<path d="M22 17l-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    close: '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    errorCircle: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    food: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
    transport: '<rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16"/><path d="M8 21v-4"/><path d="M16 21v-4"/><path d="M8 14h.01"/><path d="M16 14h.01"/>',
    education: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    shopping: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    entertainment: '<circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4z"/>',
    other: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    job: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    scholarship: '<path d="M22 10L12 5 2 10l10 5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>'
  };

  /* ======================================================================
     2. UTILITIES
     ====================================================================== */
  function $(id) { return document.getElementById(id); }

  /** Build an SVG element for a named icon (static markup only). */
  function svgIcon(name) {
    var tpl = document.createElement('template');
    tpl.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
    return tpl.content.firstChild;
  }

  /** Fill every empty [data-icon] placeholder under root with its svg. */
  function setIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (node) {
      if (!node.firstChild) node.appendChild(svgIcon(node.getAttribute('data-icon')));
    });
  }

  /**
   * Safe element builder. Text is always added as text nodes or textContent,
   * so user-entered strings can never be interpreted as HTML.
   */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === 'class') el.className = value;
        else if (key === 'text') el.textContent = value;
        else if (key === 'style') Object.assign(el.style, value);
        else if (key.indexOf('on') === 0 && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
        else if (value === true) el.setAttribute(key, '');
        else el.setAttribute(key, String(value));
      });
    }
    var children = Array.prototype.slice.call(arguments, 2);
    appendChildren(el, children);
    return el;
  }

  function appendChildren(el, children) {
    children.forEach(function (child) {
      if (Array.isArray(child)) { appendChildren(el, child); return; }
      if (child === null || child === undefined || child === false) return;
      el.appendChild(child.nodeType ? child : document.createTextNode(String(child)));
    });
  }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function cleanText(value, max) {
    return String(value === null || value === undefined ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
  }

  /* ----- Dates (always local time, stored as YYYY-MM-DD strings) ----- */
  function toISODate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  function parseISODate(str) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || ''));
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    var date = new Date(y, mo - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
    return date;
  }

  function monthKeyOf(date) { return date.getFullYear() + '-' + pad(date.getMonth() + 1); }
  function monthKey(isoDate) { return isoDate.slice(0, 7); }
  function currentMonthKey() { return monthKeyOf(new Date()); }

  function monthKeyToDate(key) {
    var parts = key.split('-');
    return new Date(+parts[0], +parts[1] - 1, 1);
  }

  /** Every month key from fromKey to toKey inclusive (capped for safety). */
  function monthRange(fromKey, toKey) {
    var keys = [];
    var cursor = monthKeyToDate(fromKey);
    var end = monthKeyToDate(toKey);
    while (cursor <= end && keys.length < 240) {
      keys.push(monthKeyOf(cursor));
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return keys;
  }

  function lastMonthKeys(count) {
    var now = new Date();
    var keys = [];
    for (var i = count - 1; i >= 0; i--) keys.push(monthKeyOf(new Date(now.getFullYear(), now.getMonth() - i, 1)));
    return keys;
  }

  function formatDate(iso) {
    var d = parseISODate(iso);
    return d ? d.toLocaleDateString(DATE_LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }) : iso;
  }
  function formatMonthLong(key) { return monthKeyToDate(key).toLocaleDateString(DATE_LOCALE, { month: 'long', year: 'numeric' }); }
  function formatMonthShort(key) { return monthKeyToDate(key).toLocaleDateString(DATE_LOCALE, { month: 'short', year: '2-digit' }); }
  function formatToday() {
    return new Date().toLocaleDateString(DATE_LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ----- Money ----- */
  var wholeFmt, decimalFmt, compactFmt, currencySymbol = '₹';

  function rebuildFormatters() {
    var cur = CURRENCIES[state.settings.currency] || CURRENCIES.INR;
    var base = { style: 'currency', currency: cur.code, currencyDisplay: 'narrowSymbol' };
    wholeFmt = new Intl.NumberFormat(cur.locale, Object.assign({ minimumFractionDigits: 0, maximumFractionDigits: 0 }, base));
    decimalFmt = new Intl.NumberFormat(cur.locale, Object.assign({ minimumFractionDigits: 2, maximumFractionDigits: 2 }, base));
    compactFmt = new Intl.NumberFormat(cur.locale, Object.assign({ notation: 'compact', maximumFractionDigits: 1 }, base));
    var part = decimalFmt.formatToParts(0).filter(function (p) { return p.type === 'currency'; })[0];
    currencySymbol = part ? part.value : cur.code;
  }

  /** Whole amounts show without decimals; others always show two. */
  function formatMoney(n) {
    var value = round2(Number(n) || 0);
    return Number.isInteger(value) ? wholeFmt.format(value) : decimalFmt.format(value);
  }
  function formatCompact(n) { return compactFmt.format(n); }

  /**
   * Parse a user-typed amount. Returns { value } or { error }.
   * Accepts digits with an optional decimal part (commas ignored).
   */
  function parseAmount(raw, allowZero) {
    var text = String(raw === null || raw === undefined ? '' : raw).trim().replace(/,/g, '');
    if (text === '') return { error: 'Enter an amount.' };
    if (/^[-\u2212]/.test(text)) return { error: 'Amount must be ' + (allowZero ? '0 or more.' : 'greater than zero.') };
    if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) return { error: 'Enter a valid number, like 250 or 99.50.' };
    var parts = text.split('.');
    if (parts[1] && parts[1].length > 2) return { error: 'Use at most two decimal places.' };
    var value = Number(text);
    if (!Number.isFinite(value)) return { error: 'Enter a valid number, like 250 or 99.50.' };
    if (value === 0 && !allowZero) return { error: 'Amount must be greater than zero.' };
    if (value > MAX_AMOUNT) return { error: 'Amount is too large.' };
    return { value: round2(value) };
  }

  /* ======================================================================
     3. STORAGE AND STATE
     ====================================================================== */
  var storageOk = true;
  var storageWarned = false;

  function testStorage() {
    try {
      var probe = APP_PREFIX + 'probe';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return true;
    } catch (e) { return false; }
  }

  /** Read and parse a key. status: 'missing' | 'ok' | 'corrupt'. */
  function readStored(key) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return { status: 'missing', value: null };
      return { status: 'ok', value: JSON.parse(raw) };
    } catch (e) {
      return { status: 'corrupt', value: null };
    }
  }

  function writeStored(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      storageOk = false;
      if (!storageWarned) {
        storageWarned = true;
        showToast('Could not save to browser storage. Changes may be lost when you close this tab.', 'error');
      }
      return false;
    }
  }

  var DEFAULT_SETTINGS = { theme: 'light', currency: 'INR', name: 'Student' };

  var state = {
    transactions: [],
    budgets: {},
    goal: { name: 'Savings goal', target: 10000, saved: 0 },
    settings: Object.assign({}, DEFAULT_SETTINGS),
    page: 'dashboard',
    filters: { search: '', type: 'all', category: 'all', sort: 'date-desc' },
    budgetMonth: currentMonthKey(),
    report: { preset: 'last-6', from: '', to: '' },
    editingTxId: null,
    editingBudgetCategory: null,
    today: toISODate(new Date())
  };

  /* ----- Validation of stored data (protects against corrupted storage) ----- */
  function normalizeTransaction(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var type = raw.type === 'income' || raw.type === 'expense' ? raw.type : null;
    var amount = Number(raw.amount);
    var date = typeof raw.date === 'string' && parseISODate(raw.date) ? raw.date : null;
    if (!type || !Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT || !date) return null;
    var validCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    var fallbackCategory = type === 'income' ? 'Other Income' : 'Other';
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      type: type,
      amount: round2(amount),
      description: cleanText(raw.description, 60) || 'Untitled',
      category: validCategories.indexOf(raw.category) !== -1 ? raw.category : fallbackCategory,
      date: date,
      payment: PAYMENT_METHODS.indexOf(raw.payment) !== -1 ? raw.payment : '',
      createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now()
    };
  }

  function normalizeTransactions(list) {
    if (!Array.isArray(list)) return [];
    return list.map(normalizeTransaction).filter(Boolean);
  }

  function normalizeBudgets(raw) {
    var result = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
    EXPENSE_CATEGORIES.forEach(function (cat) {
      var v = Number(raw[cat]);
      if (Number.isFinite(v) && v > 0 && v <= MAX_AMOUNT) result[cat] = round2(v);
    });
    return result;
  }

  function normalizeGoal(raw) {
    var goal = { name: 'Savings goal', target: 10000, saved: 0 };
    if (!raw || typeof raw !== 'object') return goal;
    var target = Number(raw.target);
    var saved = Number(raw.saved);
    goal.name = cleanText(raw.name, 40) || goal.name;
    if (Number.isFinite(target) && target > 0 && target <= MAX_AMOUNT) goal.target = round2(target);
    if (Number.isFinite(saved) && saved >= 0 && saved <= MAX_AMOUNT) goal.saved = round2(saved);
    return goal;
  }

  function normalizeSettings(raw) {
    var settings = Object.assign({}, DEFAULT_SETTINGS);
    if (!raw || typeof raw !== 'object') return settings;
    if (raw.theme === 'dark' || raw.theme === 'light') settings.theme = raw.theme;
    if (typeof raw.currency === 'string' && CURRENCIES[raw.currency]) settings.currency = raw.currency;
    var name = cleanText(raw.name, 30);
    if (name) settings.name = name;
    return settings;
  }

  /* ----- Sample data (first visit only, or when the user resets) ----- */
  function buildSeedData() {
    var now = new Date();
    var factors = [1.0, 0.95, 1.2, 0.9, 1.1, 1.0]; // index = months ago
    // [day, type, category, description, amount, payment, scalesWithMonth]
    var template = [
      [1, 'income', 'Pocket Money', 'Monthly pocket money', 8000, 'UPI', false],
      [2, 'expense', 'Education', 'Notebooks and stationery', 340, 'Cash', true],
      [3, 'expense', 'Food', 'Canteen lunch', 110, 'Cash', true],
      [4, 'expense', 'Transport', 'Metro card recharge', 500, 'UPI', true],
      [6, 'expense', 'Food', 'Dinner with friends', 450, 'UPI', true],
      [7, 'expense', 'Entertainment', 'Movie tickets', 380, 'UPI', true],
      [8, 'income', 'Part-time Job', 'Weekend tutoring', 1500, 'UPI', false],
      [10, 'expense', 'Food', 'Groceries and snacks', 260, 'UPI', true],
      [12, 'expense', 'Shopping', 'T-shirt', 790, 'Debit Card', true],
      [14, 'expense', 'Education', 'Online course subscription', 499, 'Net Banking', false],
      [15, 'expense', 'Transport', 'Auto rickshaw rides', 220, 'Cash', true],
      [17, 'expense', 'Food', 'Biryani takeaway', 320, 'UPI', true],
      [19, 'expense', 'Entertainment', 'Streaming subscription', 199, 'Debit Card', false],
      [21, 'expense', 'Other', 'Phone recharge', 299, 'UPI', false],
      [23, 'expense', 'Food', 'Cafe coffee', 180, 'Cash', true],
      [25, 'expense', 'Education', 'Printing and photocopies', 90, 'Cash', true],
      [27, 'expense', 'Transport', 'Weekend bus trip home', 350, 'Cash', true],
      [28, 'expense', 'Food', 'Mess extra items', 200, 'Cash', true]
    ];
    var extras = [
      [3, 10, 'income', 'Scholarship', 'Merit scholarship', 4000, 'Net Banking'],
      [1, 14, 'income', 'Gift', 'Birthday gift from uncle', 1000, 'UPI']
    ];

    var list = [];
    for (var monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
      var first = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
      var daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      var entries = template.map(function (t) { return { day: t[0], type: t[1], cat: t[2], desc: t[3], amt: t[4], pay: t[5], scale: t[6] }; });
      extras.forEach(function (x) {
        if (x[0] === monthsAgo) entries.push({ day: x[1], type: x[2], cat: x[3], desc: x[4], amt: x[5], pay: x[6], scale: false });
      });
      entries.forEach(function (e) {
        if (monthsAgo === 0 && e.day > now.getDate()) return; // nothing in the future
        var amount = e.amt;
        if (e.scale) amount = Math.max(10, Math.round((e.amt * factors[monthsAgo]) / 10) * 10);
        var day = Math.min(e.day, daysInMonth);
        list.push({
          id: uid(),
          type: e.type,
          amount: amount,
          description: e.desc,
          category: e.cat,
          date: toISODate(new Date(first.getFullYear(), first.getMonth(), day)),
          payment: e.pay,
          createdAt: Date.now()
        });
      });
    }

    return {
      transactions: list,
      budgets: { Food: 3000, Transport: 1200, Education: 2000, Shopping: 1500, Entertainment: 1000, Other: 500 },
      goal: { name: 'New laptop fund', target: 30000, saved: 5000 }
    };
  }

  /** Load everything from storage. Seeds sample data on a true first visit only. */
  function loadState(allowSeeding) {
    var tx = readStored(KEYS.transactions);
    var budgets = readStored(KEYS.budgets);
    var goal = readStored(KEYS.goal);
    var settings = readStored(KEYS.settings);
    var seeded = readStored(KEYS.seeded);
    var hadCorruption = [tx, budgets, goal, settings].some(function (r) { return r.status === 'corrupt'; });

    state.settings = normalizeSettings(settings.value);

    var isFirstVisit = allowSeeding && seeded.status === 'missing' && tx.status === 'missing';
    if (isFirstVisit) {
      var seed = buildSeedData();
      state.transactions = seed.transactions;
      state.budgets = seed.budgets;
      state.goal = seed.goal;
      writeStored(KEYS.transactions, state.transactions);
      writeStored(KEYS.budgets, state.budgets);
      writeStored(KEYS.goal, state.goal);
      writeStored(KEYS.seeded, '1');
    } else {
      state.transactions = normalizeTransactions(tx.value);
      state.budgets = normalizeBudgets(budgets.value);
      state.goal = normalizeGoal(goal.value);
    }
    return hadCorruption;
  }

  function saveTransactions() { writeStored(KEYS.transactions, state.transactions); }
  function saveBudgets() { writeStored(KEYS.budgets, state.budgets); }
  function saveGoal() { writeStored(KEYS.goal, state.goal); }
  function saveSettings() { writeStored(KEYS.settings, state.settings); }

  /* ======================================================================
     4. CALCULATIONS (everything is derived from stored transactions)
     ====================================================================== */
  function sumByType(list) {
    var income = 0, expense = 0;
    list.forEach(function (t) { if (t.type === 'income') income += t.amount; else expense += t.amount; });
    return { income: round2(income), expense: round2(expense) };
  }

  function expensesByCategory(list) {
    var totals = {};
    list.forEach(function (t) {
      if (t.type === 'expense') totals[t.category] = round2((totals[t.category] || 0) + t.amount);
    });
    return totals;
  }

  function transactionsInMonth(key) {
    return state.transactions.filter(function (t) { return monthKey(t.date) === key; });
  }

  /**
   * Single source of truth for the balance / savings relationship:
   *   balance   = all income - all expenses
   *   savings   = amount set aside for the goal, capped at the balance
   *   free      = balance - savings
   */
  function getSummary() {
    var totals = sumByType(state.transactions);
    var balance = round2(totals.income - totals.expense);
    var savings = round2(Math.min(state.goal.saved, Math.max(balance, 0)));
    return {
      income: totals.income,
      expense: totals.expense,
      balance: balance,
      savings: savings,
      free: round2(balance - savings),
      capped: state.goal.saved > savings + 0.001
    };
  }

  function budgetStatus(spent, limit) {
    if (!limit) return 'none';
    if (spent > limit) return 'over';
    if (spent === limit) return 'reached';
    if (spent / limit >= 0.8) return 'near';
    return 'ok';
  }
  var STATUS_LABELS = { none: 'No budget', ok: 'On track', near: 'Nearing limit', reached: 'Limit reached', over: 'Over budget' };

  function categoryMeta(cat) { return CATEGORY_META[cat] || CATEGORY_META.Other; }

  /* ---------- Filtering and sorting for the Transactions page ---------- */
  function getFilteredTransactions() {
    var f = state.filters;
    var query = f.search.trim().toLowerCase();
    var list = state.transactions.filter(function (t) {
      if (f.type !== 'all' && t.type !== f.type) return false;
      if (f.category !== 'all' && t.category !== f.category) return false;
      if (query) {
        var haystack = [t.description, t.category, t.payment, t.type, String(t.amount), formatMoney(t.amount), formatDate(t.date)].join(' ').toLowerCase();
        if (haystack.indexOf(query) === -1) return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      var byDate = b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
      switch (f.sort) {
        case 'date-asc': return -byDate;
        case 'amount-desc': return (b.amount - a.amount) || byDate;
        case 'amount-asc': return (a.amount - b.amount) || byDate;
        default: return byDate;
      }
    });
    return list;
  }

  /* ---------- Report period handling ---------- */
  function presetRange(preset) {
    var today = new Date();
    var y = today.getFullYear(), m = today.getMonth();
    var from;
    switch (preset) {
      case 'last-3': from = new Date(y, m - 2, 1); break;
      case 'last-6': from = new Date(y, m - 5, 1); break;
      case 'this-year': from = new Date(y, 0, 1); break;
      case 'all':
        var earliest = state.transactions.reduce(function (min, t) { return t.date < min ? t.date : min; }, toISODate(today));
        return { from: earliest, to: toISODate(today) };
      default: from = new Date(y, m, 1);
    }
    return { from: toISODate(from), to: toISODate(today) };
  }

  /** Returns { from, to, error, transactions } for the current report filters. */
  function getReportData() {
    var r = state.report;
    if (r.preset !== 'custom') {
      var range = presetRange(r.preset);
      r.from = range.from;
      r.to = range.to;
    }
    var error = '';
    if (!parseISODate(r.from) || !parseISODate(r.to)) error = 'Choose both a start and an end date.';
    else if (r.from > r.to) error = 'The start date must be on or before the end date.';
    var list = error ? [] : state.transactions.filter(function (t) { return t.date >= r.from && t.date <= r.to; });
    return { from: r.from, to: r.to, error: error, transactions: list };
  }

  /* ======================================================================
     5. UI HELPERS
     ====================================================================== */
  /* ----- Toasts ----- */
  function showToast(message, type) {
    var kind = type || 'success';
    var container = $('toasts');
    if (!container) return;
    var iconName = kind === 'error' ? 'errorCircle' : kind === 'info' ? 'info' : 'check';
    var toast = h('div', { class: 'toast toast--' + kind },
      svgIcon(iconName),
      h('span', { class: 'toast-msg', text: message }),
      h('button', { type: 'button', class: 'toast-close', 'aria-label': 'Dismiss notification', onClick: function () { toast.remove(); } }, svgIcon('close'))
    );
    container.appendChild(toast);
    while (container.children.length > 4) container.removeChild(container.firstChild);
    setTimeout(function () { if (toast.parentNode) toast.remove(); }, kind === 'error' ? 7000 : 4000);
  }

  /* ----- Dialogs ----- */
  function openDialog(dialog) {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }
  function closeDialog(dialog) {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  /** Promise-based confirmation dialog. Resolves true only if confirmed. */
  function confirmAction(options) {
    return new Promise(function (resolve) {
      var dialog = $('confirmDialog');
      $('confirmTitle').textContent = options.title;
      $('confirmMessage').textContent = options.message;
      $('confirmOk').textContent = options.confirmLabel || 'Confirm';
      dialog.returnValue = '';
      function onClose() {
        dialog.removeEventListener('close', onClose);
        resolve(dialog.returnValue === 'confirm');
      }
      dialog.addEventListener('close', onClose);
      openDialog(dialog);
      $('confirmCancel').focus();
    });
  }

  /* ----- Form error helpers ----- */
  function setFieldError(inputId, errorId, message) {
    var input = $(inputId), error = $(errorId);
    if (message) {
      if (input) input.setAttribute('aria-invalid', 'true');
      error.textContent = message;
      error.hidden = false;
    } else {
      if (input) input.removeAttribute('aria-invalid');
      error.textContent = '';
      error.hidden = true;
    }
  }
  function setFormError(id, message) {
    var el = $(id);
    el.textContent = message || '';
    el.hidden = !message;
  }

  /* ----- Empty state ----- */
  function emptyState(opts) {
    var children = [
      h('span', { class: 'empty-icon', 'data-icon': opts.icon || 'info' }),
      h('h3', { text: opts.title }),
      opts.text ? h('p', { text: opts.text }) : null
    ];
    if (opts.actionLabel) {
      children.push(h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onClick: opts.onAction, text: opts.actionLabel }));
    }
    var el = h.apply(null, ['div', { class: 'empty' }].concat(children));
    setIcons(el);
    return el;
  }

  function catIcon(category) {
    var meta = categoryMeta(category);
    return h('span', { class: 'cat-icon', style: { background: meta.color + '1F', color: meta.color } }, svgIcon(meta.icon));
  }

  function progressBar(pct, status, label) {
    var p = Math.max(0, Math.min(100, pct));
    return h('div', {
      class: 'progress' + (status ? ' is-' + status : ''),
      role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(p), 'aria-label': label
    }, h('span', { style: { width: p + '%' } }));
  }

  function amountEl(tx) {
    var sign = tx.type === 'income' ? '+' : '-';
    return h('span', { class: 'amount ' + tx.type, text: sign + formatMoney(tx.amount) });
  }

  /* ----- Charts ----- */
  var charts = {};

  function destroyChart(key) {
    if (charts[key]) { charts[key].destroy(); delete charts[key]; }
  }

  function chartColors() {
    var cs = getComputedStyle(document.documentElement);
    function v(name) { return cs.getPropertyValue(name).trim(); }
    return { text: v('--text-2'), muted: v('--muted'), grid: v('--border'), income: v('--income'), expense: v('--expense'), surface: v('--surface') };
  }

  /**
   * Draw a chart, or show an empty state / simple fallback in the
   * .chart-extra layer if there is no data or Chart.js did not load.
   */
  function mountChart(opts) {
    var canvas = $(opts.canvasId);
    var extra = canvas.parentElement.querySelector('.chart-extra');
    destroyChart(opts.key);
    if (!opts.hasData) {
      canvas.hidden = true;
      extra.hidden = false;
      extra.replaceChildren(opts.empty());
      return;
    }
    if (!window.Chart) {
      canvas.hidden = true;
      extra.hidden = false;
      extra.replaceChildren(opts.fallback());
      return;
    }
    canvas.hidden = false;
    extra.hidden = true;
    extra.replaceChildren();
    try {
      window.Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
      charts[opts.key] = new window.Chart(canvas, opts.config());
    } catch (err) {
      canvas.hidden = true;
      extra.hidden = false;
      extra.replaceChildren(opts.fallback());
    }
  }

  function barOptions(colors, horizontal) {
    var valueAxis = horizontal ? 'x' : 'y';
    var categoryAxis = horizontal ? 'y' : 'x';
    var scales = {};
    scales[categoryAxis] = { grid: { display: false }, ticks: { color: colors.muted } };
    scales[valueAxis] = {
      beginAtZero: true, grid: { color: colors.grid }, border: { display: false },
      ticks: { color: colors.muted, callback: function (v) { return formatCompact(v); } }
    };
    return {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: horizontal ? { display: false } : { position: 'top', align: 'end', labels: { color: colors.text, usePointStyle: true, boxWidth: 8 } },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              var value = horizontal ? ctx.parsed.x : ctx.parsed.y;
              return (horizontal ? '' : ctx.dataset.label + ': ') + formatMoney(value);
            }
          }
        }
      },
      scales: scales
    };
  }

  function monthlyChartConfig(labels, income, expense) {
    var c = chartColors();
    return {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Income', data: income, backgroundColor: c.income, borderRadius: 6, maxBarThickness: 28 },
          { label: 'Expenses', data: expense, backgroundColor: c.expense, borderRadius: 6, maxBarThickness: 28 }
        ]
      },
      options: barOptions(c, false)
    };
  }

  function fallbackLine(value, max, color) {
    return h('div', { class: 'fb-bar-line' },
      h('span', { class: 'fb-bar', style: { width: (max > 0 ? (value / max) * 70 : 0) + '%', background: color } }),
      h('span', { class: 'fb-val', text: formatMoney(value) }));
  }
  function fallbackNote() {
    return h('p', { class: 'fallback-note', text: 'The chart library could not be loaded, so a simple view is shown instead.' });
  }
  function monthlyFallback(labels, income, expense) {
    var max = Math.max.apply(null, income.concat(expense).concat([1]));
    var wrap = h('div', { class: 'fallback' }, fallbackNote());
    labels.forEach(function (label, i) {
      wrap.appendChild(h('div', { class: 'fb-row' },
        h('span', { class: 'fb-label', text: label }),
        h('div', { class: 'fb-bars' }, fallbackLine(income[i], max, 'var(--income)'), fallbackLine(expense[i], max, 'var(--expense)'))));
    });
    return wrap;
  }
  function categoryFallback(entries) {
    var max = Math.max.apply(null, entries.map(function (e) { return e.amount; }).concat([1]));
    var wrap = h('div', { class: 'fallback' }, fallbackNote());
    entries.forEach(function (e) {
      wrap.appendChild(h('div', { class: 'fb-row' },
        h('span', { class: 'fb-label', text: e.category }),
        h('div', { class: 'fb-bars' }, fallbackLine(e.amount, max, categoryMeta(e.category).color))));
    });
    return wrap;
  }

  /** Sorted [{category, amount}] from a category total map. */
  function categoryEntries(totals) {
    return Object.keys(totals).map(function (c) { return { category: c, amount: totals[c] }; })
      .sort(function (a, b) { return b.amount - a.amount; });
  }

  function monthlySeries(keys, list) {
    var income = keys.map(function () { return 0; });
    var expense = keys.map(function () { return 0; });
    list.forEach(function (t) {
      var i = keys.indexOf(monthKey(t.date));
      if (i === -1) return;
      if (t.type === 'income') income[i] += t.amount; else expense[i] += t.amount;
    });
    return { income: income.map(round2), expense: expense.map(round2) };
  }

  /* ======================================================================
     6. PAGE RENDERERS
     ====================================================================== */
  function renderChrome() {
    $('todayLabel').textContent = formatToday();
    var name = state.settings.name || 'Student';
    $('profileName').textContent = name;
    $('avatar').textContent = (Array.from(name)[0] || 'S').toUpperCase();
    $('profileLink').setAttribute('aria-label', name + ', open settings');
    document.querySelectorAll('[data-currency-symbol]').forEach(function (el) { el.textContent = currencySymbol; });
  }

  function renderCurrentPage() {
    switch (state.page) {
      case 'transactions': renderTransactions(); break;
      case 'budgets': renderBudgets(); break;
      case 'reports': renderReports(); break;
      case 'settings': renderSettings(); break;
      default: renderDashboard();
    }
  }

  function renderAll() {
    renderChrome();
    renderCurrentPage();
  }

  /* ---------------------------- Dashboard ---------------------------- */
  function renderDashboard() {
    var summary = getSummary();
    var monthKeyNow = currentMonthKey();
    var monthList = transactionsInMonth(monthKeyNow);
    var monthTotals = sumByType(monthList);

    $('statBalance').textContent = formatMoney(summary.balance);
    $('statBalance').classList.toggle('is-negative', summary.balance < 0);
    $('statBalanceSub').textContent = 'Free to spend: ' + formatMoney(summary.free);
    $('statIncome').textContent = formatMoney(summary.income);
    $('statIncomeSub').textContent = 'This month: ' + formatMoney(monthTotals.income);
    $('statExpenses').textContent = formatMoney(summary.expense);
    $('statExpensesSub').textContent = 'This month: ' + formatMoney(monthTotals.expense);
    $('statSavings').textContent = formatMoney(summary.savings);
    var goalPct = Math.min(100, Math.floor((summary.savings / state.goal.target) * 100));
    $('statSavingsSub').textContent = goalPct + '% of ' + formatMoney(state.goal.target) + ' goal';

    // Income vs expenses, last 6 months
    var keys = lastMonthKeys(6);
    var series = monthlySeries(keys, state.transactions);
    var labels = keys.map(formatMonthShort);
    var hasMonthly = series.income.some(Boolean) || series.expense.some(Boolean);
    mountChart({
      key: 'monthly', canvasId: 'chartMonthly', hasData: hasMonthly,
      empty: function () { return emptyState({ icon: 'reports', title: 'No data yet', text: 'Add a transaction to see income and expenses by month.', actionLabel: 'Add transaction', onAction: function () { openTxDialog(); } }); },
      fallback: function () { return monthlyFallback(labels, series.income, series.expense); },
      config: function () { return monthlyChartConfig(labels, series.income, series.expense); }
    });

    renderCategoryDoughnut(monthKeyNow, monthList);
    renderRecent();
    renderDashboardBudgets(monthKeyNow);
    renderGoalCard(summary);
  }

  function renderCategoryDoughnut(monthKeyNow, monthList) {
    $('catChartSub').textContent = formatMonthLong(monthKeyNow);
    var entries = categoryEntries(expensesByCategory(monthList));
    var total = round2(entries.reduce(function (s, e) { return s + e.amount; }, 0));
    var legend = $('categoryLegend');
    legend.replaceChildren();

    mountChart({
      key: 'category', canvasId: 'chartCategory', hasData: entries.length > 0,
      empty: function () { return emptyState({ icon: 'budgets', title: 'No spending this month', text: 'Your category breakdown appears here once you log an expense.' }); },
      fallback: function () { return categoryFallback(entries); },
      config: function () {
        var c = chartColors();
        return {
          type: 'doughnut',
          data: {
            labels: entries.map(function (e) { return e.category; }),
            datasets: [{
              data: entries.map(function (e) { return e.amount; }),
              backgroundColor: entries.map(function (e) { return categoryMeta(e.category).color; }),
              borderColor: c.surface, borderWidth: 2
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false, cutout: '68%', animation: { duration: 300 },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function (ctx) {
                    var pct = total ? Math.round((ctx.parsed / total) * 100) : 0;
                    return ctx.label + ': ' + formatMoney(ctx.parsed) + ' (' + pct + '%)';
                  }
                }
              }
            }
          }
        };
      }
    });

    entries.forEach(function (e) {
      legend.appendChild(h('li', null,
        h('span', { class: 'legend-swatch', style: { background: categoryMeta(e.category).color } }),
        h('span', { class: 'legend-name', text: e.category }),
        h('span', { class: 'legend-value', text: formatMoney(e.amount) }),
        h('span', { class: 'legend-pct', text: (total ? Math.round((e.amount / total) * 100) : 0) + '%' })));
    });
  }

  function renderRecent() {
    var host = $('recentList');
    var recent = state.transactions.slice().sort(function (a, b) {
      return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
    }).slice(0, 6);

    if (!recent.length) {
      host.replaceChildren(emptyState({ icon: 'transactions', title: 'No transactions yet', text: 'Add your first income or expense to get started.', actionLabel: 'Add transaction', onAction: function () { openTxDialog(); } }));
      return;
    }
    var table = h('table', { class: 'table' },
      h('caption', { class: 'sr-only', text: 'Most recent transactions' }),
      h('thead', null, h('tr', null,
        h('th', { scope: 'col', text: 'Transaction' }),
        h('th', { scope: 'col', text: 'Date' }),
        h('th', { scope: 'col', class: 'num', text: 'Amount' }))),
      h('tbody', null, recent.map(function (tx) {
        return h('tr', null,
          h('td', null, h('div', { class: 'tx-main' }, catIcon(tx.category),
            h('div', { class: 'tx-text' }, h('span', { class: 'tx-desc', text: tx.description }), h('span', { class: 'tx-meta', text: tx.category })))),
          h('td', { class: 'nowrap muted', text: formatDate(tx.date) }),
          h('td', { class: 'num' }, amountEl(tx)));
      })));
    host.replaceChildren(h('div', { class: 'table-wrap' }, table));
  }

  function renderDashboardBudgets(monthKeyNow) {
    $('dashBudgetMonth').textContent = formatMonthLong(monthKeyNow);
    var host = $('dashBudgets');
    var spentMap = expensesByCategory(transactionsInMonth(monthKeyNow));
    var budgeted = EXPENSE_CATEGORIES.filter(function (c) { return state.budgets[c]; });

    if (!budgeted.length) {
      host.replaceChildren(emptyState({ icon: 'budgets', title: 'No budgets set', text: 'Set monthly limits to keep spending in check.', actionLabel: 'Set budgets', onAction: function () { navigate('budgets'); } }));
      return;
    }
    host.replaceChildren.apply(host, budgeted.map(function (cat) {
      var limit = state.budgets[cat];
      var spent = spentMap[cat] || 0;
      var status = budgetStatus(spent, limit);
      var meta = categoryMeta(cat);
      return h('div', { class: 'mini-budget' },
        h('div', { class: 'mini-budget-top' },
          h('span', { class: 'mini-budget-name' }, catIcon(cat), cat),
          h('span', { class: 'mini-budget-amount', text: formatMoney(spent) + ' / ' + formatMoney(limit) })),
        progressBar((spent / limit) * 100, status, cat + ' budget used'));
    }));
  }

  function renderGoalCard(summary) {
    var host = $('goalCard');
    var goal = state.goal;
    var pct = Math.min(100, (summary.savings / goal.target) * 100);
    var reached = summary.savings >= goal.target;
    var remaining = round2(Math.max(0, goal.target - summary.savings));
    var children = [
      h('p', { class: 'goal-name', text: goal.name }),
      h('div', { class: 'goal-figures' },
        h('span', { class: 'goal-saved', text: formatMoney(summary.savings) }),
        h('span', { class: 'muted small', text: 'of ' + formatMoney(goal.target) }),
        h('span', { class: 'goal-pct', text: Math.floor(pct) + '%' })),
      progressBar(pct, '', goal.name + ' progress'),
      h('p', { class: 'goal-meta', text: reached ? 'Goal reached. Nice work!' : formatMoney(remaining) + ' to go' }),
      h('p', { class: 'goal-explain', text: 'Savings are set aside from your balance: ' + formatMoney(summary.balance) + ' balance - ' + formatMoney(summary.savings) + ' saved = ' + formatMoney(summary.free) + ' free to spend. Updating your goal never adds or removes transactions.' })
    ];
    if (summary.capped) {
      children.push(h('p', { class: 'goal-warning', role: 'status', text: 'Your balance is lower than the ' + formatMoney(goal.saved) + ' you marked as saved, so only ' + formatMoney(summary.savings) + ' is counted. Update your goal to match.' }));
    }
    children.push(h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onClick: openGoalDialog, text: 'Update goal' }));
    host.replaceChildren(h.apply(null, ['div', { class: 'goal-card' }].concat(children)));
  }

  /* -------------------------- Transactions --------------------------- */
  function rowActions(tx) {
    return h('span', { class: 'row-actions' },
      h('button', { type: 'button', class: 'icon-btn', title: 'Edit', 'aria-label': 'Edit ' + tx.description, onClick: function () { openTxDialog(tx.id); } }, svgIcon('edit')),
      h('button', { type: 'button', class: 'icon-btn icon-btn--danger', title: 'Delete', 'aria-label': 'Delete ' + tx.description, onClick: function () { deleteTransaction(tx.id); } }, svgIcon('trash')));
  }

  function buildTxTable(list) {
    return h('div', { class: 'table-wrap tx-table-wrap' },
      h('table', { class: 'table' },
        h('caption', { class: 'sr-only', text: 'Transactions' }),
        h('thead', null, h('tr', null,
          h('th', { scope: 'col', text: 'Transaction' }),
          h('th', { scope: 'col', text: 'Category' }),
          h('th', { scope: 'col', text: 'Date' }),
          h('th', { scope: 'col', text: 'Payment' }),
          h('th', { scope: 'col', class: 'num', text: 'Amount' }),
          h('th', { scope: 'col' }, h('span', { class: 'sr-only', text: 'Actions' })))),
        h('tbody', null, list.map(function (tx) {
          return h('tr', null,
            h('td', null, h('div', { class: 'tx-main' }, catIcon(tx.category), h('div', { class: 'tx-text' }, h('span', { class: 'tx-desc', text: tx.description })))),
            h('td', { text: tx.category }),
            h('td', { class: 'nowrap', text: formatDate(tx.date) }),
            h('td', { class: 'muted', text: tx.payment || '–' }),
            h('td', { class: 'num' }, amountEl(tx)),
            h('td', { class: 'actions-cell' }, rowActions(tx)));
        }))));
  }

  function buildTxCards(list) {
    return h('div', { class: 'tx-cards' }, list.map(function (tx) {
      var meta = tx.category + ' · ' + formatDate(tx.date) + (tx.payment ? ' · ' + tx.payment : '');
      return h('div', { class: 'tx-card' },
        h('div', { class: 'tx-card-main' }, catIcon(tx.category),
          h('div', { class: 'tx-text' }, h('span', { class: 'tx-desc', text: tx.description }), h('span', { class: 'tx-meta', text: meta })),
          amountEl(tx)),
        h('div', { class: 'tx-card-actions' }, rowActions(tx)));
    }));
  }

  function renderTransactions() {
    var f = state.filters;
    // Keep controls in sync with state (without stealing focus while typing)
    if ($('txFilterSearch').value !== f.search) $('txFilterSearch').value = f.search;
    $('txFilterType').value = f.type;
    $('txFilterCategory').value = f.category;
    $('txFilterSort').value = f.sort;

    var list = getFilteredTransactions();
    var total = state.transactions.length;
    $('txCount').textContent = total === 0 ? 'No transactions yet' : 'Showing ' + list.length + ' of ' + total + ' transaction' + (total === 1 ? '' : 's');

    var host = $('txList');
    if (!total) {
      host.replaceChildren(emptyState({ icon: 'transactions', title: 'No transactions yet', text: 'Add your pocket money or an expense to start tracking.', actionLabel: 'Add transaction', onAction: function () { openTxDialog(); } }));
    } else if (!list.length) {
      host.replaceChildren(emptyState({ icon: 'search', title: 'No matching transactions', text: 'Try a different search or clear the filters.', actionLabel: 'Reset filters', onAction: resetFilters }));
    } else {
      host.replaceChildren(buildTxTable(list), buildTxCards(list));
    }
  }

  function resetFilters() {
    state.filters = { search: '', type: 'all', category: 'all', sort: 'date-desc' };
    $('globalSearch').value = '';
    renderTransactions();
  }

  /* ----------------------------- Budgets ----------------------------- */
  function budgetMonthOptions() {
    var set = {};
    lastMonthKeys(12).forEach(function (k) { set[k] = true; });
    state.transactions.forEach(function (t) { set[monthKey(t.date)] = true; });
    return Object.keys(set).sort().reverse();
  }

  function renderBudgets() {
    var months = budgetMonthOptions();
    if (months.indexOf(state.budgetMonth) === -1) state.budgetMonth = months[0];
    var select = $('budgetMonth');
    select.replaceChildren.apply(select, months.map(function (k) { return h('option', { value: k, text: formatMonthLong(k) }); }));
    select.value = state.budgetMonth;

    var spentMap = expensesByCategory(transactionsInMonth(state.budgetMonth));
    var totalLimit = 0, totalSpent = 0;
    EXPENSE_CATEGORIES.forEach(function (cat) {
      if (state.budgets[cat]) { totalLimit += state.budgets[cat]; totalSpent += spentMap[cat] || 0; }
    });
    totalLimit = round2(totalLimit); totalSpent = round2(totalSpent);
    var remaining = round2(totalLimit - totalSpent);
    $('budgetTotal').textContent = formatMoney(totalLimit);
    $('budgetSpent').textContent = formatMoney(totalSpent);
    $('budgetRemaining').textContent = formatMoney(remaining);
    $('budgetRemaining').classList.toggle('is-negative', remaining < 0);

    var grid = $('budgetGrid');
    grid.replaceChildren.apply(grid, EXPENSE_CATEGORIES.map(function (cat) {
      return buildBudgetCard(cat, spentMap[cat] || 0, state.budgets[cat] || 0);
    }));
  }

  function buildBudgetCard(cat, spent, limit) {
    var status = budgetStatus(spent, limit);

    if (!limit) {
      return h('article', { class: 'budget-card' },
        h('div', { class: 'budget-card-head' }, catIcon(cat), h('h3', { text: cat })),
        h('div', { class: 'budget-figures' },
          h('span', { class: 'budget-spent', text: formatMoney(spent) }),
          h('span', { class: 'budget-limit', text: 'spent, no budget set' })),
        h('div', { class: 'budget-foot' },
          h('span', { class: 'chip is-none', text: STATUS_LABELS.none }),
          h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onClick: function () { openBudgetDialog(cat); }, text: 'Set budget' })));
    }

    var pct = Math.round((spent / limit) * 100);
    var left = round2(limit - spent);
    var children = [
      h('div', { class: 'budget-card-head' }, catIcon(cat), h('h3', { text: cat }),
        h('button', { type: 'button', class: 'icon-btn', title: 'Edit budget', 'aria-label': 'Edit ' + cat + ' budget', onClick: function () { openBudgetDialog(cat); } }, svgIcon('edit'))),
      h('div', { class: 'budget-figures' },
        h('span', { class: 'budget-spent', text: formatMoney(spent) }),
        h('span', { class: 'budget-limit', text: 'of ' + formatMoney(limit) + ' (' + pct + '%)' })),
      progressBar((spent / limit) * 100, status, cat + ' budget used'),
      h('div', { class: 'budget-foot' },
        h('span', { text: left >= 0 ? formatMoney(left) + ' remaining' : formatMoney(-left) + ' over' }),
        h('span', { class: 'chip is-' + status, text: STATUS_LABELS[status] }))
    ];
    if (status === 'near' || status === 'reached' || status === 'over') {
      var message = status === 'near' ? 'You have used ' + pct + '% of your ' + cat + ' budget.'
        : status === 'reached' ? 'You have reached your ' + cat + ' budget limit.'
        : 'You are ' + formatMoney(-left) + ' over your ' + cat + ' budget.';
      children.push(h('div', { class: 'budget-alert is-' + status, role: 'status' }, svgIcon('alert'), h('span', { text: message })));
    }
    var tone = status === 'near' ? ' tone-near' : (status === 'over' || status === 'reached') ? ' tone-over' : '';
    return h.apply(null, ['article', { class: 'budget-card' + tone }].concat(children));
  }

  /* ----------------------------- Reports ----------------------------- */
  function simpleTable(caption, columns, rows, footer) {
    function cell(tag, value, col) {
      var attrs = col.num ? { class: 'num' } : null;
      return h(tag, attrs, value);
    }
    return h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
      h('caption', { class: 'sr-only', text: caption }),
      h('thead', null, h('tr', null, columns.map(function (c) { return h('th', { scope: 'col', class: c.num ? 'num' : null, text: c.label }); }))),
      h('tbody', null, rows.map(function (row) { return h('tr', null, row.map(function (v, i) { return cell('td', v, columns[i]); })); })),
      footer ? h('tfoot', null, h('tr', null, footer.map(function (v, i) { return cell('td', v, columns[i]); }))) : null));
  }

  function signedAmount(n) {
    var cls = n > 0 ? 'amount income' : n < 0 ? 'amount expense' : 'amount';
    return h('span', { class: cls, text: (n > 0 ? '+' : n < 0 ? '-' : '') + formatMoney(Math.abs(n)) });
  }

  function renderReports() {
    var data = getReportData();
    var r = state.report;
    $('reportPreset').value = r.preset;
    $('reportFrom').value = r.from;
    $('reportTo').value = r.to;
    var err = $('reportRangeError');
    err.textContent = data.error;
    err.hidden = !data.error;
    $('reportFrom').toggleAttribute('aria-invalid', !!data.error);
    $('reportTo').toggleAttribute('aria-invalid', !!data.error);

    var list = data.transactions;
    var totals = sumByType(list);
    var net = round2(totals.income - totals.expense);
    $('repIncome').textContent = formatMoney(totals.income);
    $('repExpenses').textContent = formatMoney(totals.expense);
    $('repNet').textContent = formatMoney(net);
    $('repNet').classList.toggle('is-negative', net < 0);
    if (totals.income > 0) {
      var rate = Math.round((net / totals.income) * 100);
      $('repRate').textContent = rate + '%';
      $('repRate').classList.toggle('is-negative', rate < 0);
      $('repRateSub').textContent = rate < 0 ? 'Spending was higher than income' : 'Net savings as a share of income';
    } else {
      $('repRate').textContent = '–';
      $('repRate').classList.remove('is-negative');
      $('repRateSub').textContent = 'No income in this period';
    }

    // Monthly comparison
    var keys = data.error ? [] : monthRange(data.from.slice(0, 7), data.to.slice(0, 7));
    var series = monthlySeries(keys, list);
    var labels = keys.map(formatMonthShort);
    mountChart({
      key: 'reportMonthly', canvasId: 'chartReportMonthly', hasData: list.length > 0,
      empty: function () { return emptyState({ icon: 'reports', title: 'No data for this period', text: 'Pick a different date range.' }); },
      fallback: function () { return monthlyFallback(labels, series.income, series.expense); },
      config: function () { return monthlyChartConfig(labels, series.income, series.expense); }
    });

    // Category breakdown
    var entries = categoryEntries(expensesByCategory(list));
    mountChart({
      key: 'reportCategory', canvasId: 'chartReportCategory', hasData: entries.length > 0,
      empty: function () { return emptyState({ icon: 'budgets', title: 'No spending in this period', text: 'Expenses by category will appear here.' }); },
      fallback: function () { return categoryFallback(entries); },
      config: function () {
        var c = chartColors();
        var options = barOptions(c, true);
        return {
          type: 'bar',
          data: {
            labels: entries.map(function (e) { return e.category; }),
            datasets: [{ label: 'Spent', data: entries.map(function (e) { return e.amount; }), backgroundColor: entries.map(function (e) { return categoryMeta(e.category).color; }), borderRadius: 6, maxBarThickness: 26 }]
          },
          options: options
        };
      }
    });

    // Monthly summary table
    var monthHost = $('reportMonthTable');
    if (!keys.length || !list.length) {
      monthHost.replaceChildren(emptyState({ icon: 'reports', title: 'Nothing to summarise', text: 'There are no transactions in this period.' }));
    } else {
      var monthRows = keys.map(function (k, i) {
        var netM = round2(series.income[i] - series.expense[i]);
        return [formatMonthLong(k), formatMoney(series.income[i]), formatMoney(series.expense[i]), signedAmount(netM)];
      });
      monthHost.replaceChildren(simpleTable('Monthly summary',
        [{ label: 'Month' }, { label: 'Income', num: true }, { label: 'Expenses', num: true }, { label: 'Net', num: true }],
        monthRows, ['Total', formatMoney(totals.income), formatMoney(totals.expense), signedAmount(net)]));
    }

    // Category summary table
    var catHost = $('reportCategoryTable');
    if (!entries.length) {
      catHost.replaceChildren(emptyState({ icon: 'budgets', title: 'No expenses', text: 'There is no spending in this period.' }));
    } else {
      var catRows = entries.map(function (e) {
        return [
          h('span', { class: 'tx-main' }, catIcon(e.category), e.category),
          formatMoney(e.amount),
          (totals.expense ? Math.round((e.amount / totals.expense) * 100) : 0) + '%'
        ];
      });
      catHost.replaceChildren(simpleTable('Spending by category',
        [{ label: 'Category' }, { label: 'Spent', num: true }, { label: 'Share', num: true }],
        catRows, ['Total', formatMoney(totals.expense), '100%']));
    }
  }

  /* ----------------------------- Settings ---------------------------- */
  function renderSettings() {
    var nameInput = $('settingsName');
    if (document.activeElement !== nameInput) nameInput.value = state.settings.name;
    var dark = state.settings.theme === 'dark';
    $('themeSwitch').setAttribute('aria-checked', dark ? 'true' : 'false');
    $('themeState').textContent = dark ? 'On' : 'Off';
    $('currencySelect').value = state.settings.currency;
    $('currencyPreview').textContent = formatMoney(123456.78);

    var t = state.transactions.length;
    var b = Object.keys(state.budgets).length;
    $('storageInfo').textContent = t + ' transaction' + (t === 1 ? '' : 's') + ', ' + b + ' budget' + (b === 1 ? '' : 's') + ' and 1 savings goal.' +
      (storageOk ? '' : ' Browser storage is unavailable, so nothing is being saved.');
  }

  /* ======================================================================
     7. FORMS AND ACTIONS
     ====================================================================== */
  /* ------------------------- Transaction dialog ---------------------- */
  function fillCategoryOptions(type, selected) {
    var list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    var select = $('txCategoryInput');
    select.replaceChildren.apply(select, [h('option', { value: '', text: 'Select a category' })].concat(
      list.map(function (c) { return h('option', { value: c, text: c }); })));
    select.value = list.indexOf(selected) !== -1 ? selected : '';
  }

  function currentTxType() {
    var checked = $('txForm').querySelector('input[name="type"]:checked');
    return checked ? checked.value : 'expense';
  }

  function clearTxErrors() {
    setFormError('txFormError', '');
    setFieldError('txAmount', 'txAmountError', '');
    setFieldError('txDescription', 'txDescriptionError', '');
    setFieldError('txCategoryInput', 'txCategoryInputError', '');
    setFieldError('txDate', 'txDateError', '');
  }

  function openTxDialog(id) {
    var tx = id ? state.transactions.filter(function (t) { return t.id === id; })[0] : null;
    state.editingTxId = tx ? tx.id : null;
    clearTxErrors();
    $('txDialogTitle').textContent = tx ? 'Edit transaction' : 'Add transaction';
    $('txSubmit').textContent = tx ? 'Save changes' : 'Save transaction';

    var type = tx ? tx.type : 'expense';
    $('txForm').querySelector('input[name="type"][value="' + type + '"]').checked = true;
    fillCategoryOptions(type, tx ? tx.category : '');
    $('txAmount').value = tx ? String(tx.amount) : '';
    $('txDescription').value = tx ? tx.description : '';
    $('txDate').value = tx ? tx.date : toISODate(new Date());
    $('txDate').max = toISODate(new Date());
    $('txDate').min = MIN_DATE;
    $('txPayment').value = tx ? tx.payment : '';
    openDialog($('txDialog'));
    $('txAmount').focus();
  }

  function validateTransactionForm() {
    var errors = {};
    var type = currentTxType();
    var amountResult = parseAmount($('txAmount').value, false);
    if (amountResult.error) errors.amount = amountResult.error;

    var description = cleanText($('txDescription').value, 60);
    if (!description) errors.description = 'Enter a short description.';

    var category = $('txCategoryInput').value;
    var validCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (validCategories.indexOf(category) === -1) errors.category = 'Choose a category.';

    var date = $('txDate').value;
    if (!date) errors.date = 'Choose a date.';
    else if (!parseISODate(date)) errors.date = 'Enter a valid date.';
    else if (date > toISODate(new Date())) errors.date = 'The date cannot be in the future.';
    else if (date < MIN_DATE) errors.date = 'The date is too far in the past.';

    var payment = $('txPayment').value;
    if (payment && PAYMENT_METHODS.indexOf(payment) === -1) payment = '';

    return {
      errors: errors,
      count: Object.keys(errors).length,
      value: { type: type, amount: amountResult.value, description: description, category: category, date: date, payment: payment }
    };
  }

  function handleTxSubmit(event) {
    event.preventDefault();
    var form = $('txForm');
    if (form.dataset.busy === '1') return; // prevents duplicate submissions

    var result = validateTransactionForm();
    var e = result.errors;
    setFieldError('txAmount', 'txAmountError', e.amount);
    setFieldError('txDescription', 'txDescriptionError', e.description);
    setFieldError('txCategoryInput', 'txCategoryInputError', e.category);
    setFieldError('txDate', 'txDateError', e.date);
    if (result.count) {
      setFormError('txFormError', 'Please fix the highlighted fields and try again.');
      var order = [['amount', 'txAmount'], ['description', 'txDescription'], ['category', 'txCategoryInput'], ['date', 'txDate']];
      for (var i = 0; i < order.length; i++) {
        if (e[order[i][0]]) { $(order[i][1]).focus(); break; }
      }
      return;
    }
    setFormError('txFormError', '');
    form.dataset.busy = '1';
    $('txSubmit').disabled = true;

    var v = result.value;
    if (state.editingTxId) {
      var existing = state.transactions.filter(function (t) { return t.id === state.editingTxId; })[0];
      if (existing) Object.assign(existing, v);
      showToast('Transaction updated.');
    } else {
      state.transactions.push(Object.assign({ id: uid(), createdAt: Date.now() }, v));
      showToast(v.type === 'income' ? 'Income added.' : 'Expense added.');
    }
    saveTransactions();
    state.editingTxId = null;
    closeDialog($('txDialog'));
    renderAll();
  }

  async function deleteTransaction(id) {
    var tx = state.transactions.filter(function (t) { return t.id === id; })[0];
    if (!tx) return;
    var ok = await confirmAction({
      title: 'Delete transaction?',
      message: '"' + tx.description + '" (' + formatMoney(tx.amount) + ') will be permanently removed.',
      confirmLabel: 'Delete'
    });
    if (!ok) return;
    state.transactions = state.transactions.filter(function (t) { return t.id !== id; });
    saveTransactions();
    showToast('Transaction deleted.');
    renderAll();
  }

  /* --------------------------- Budget dialog ------------------------- */
  function openBudgetDialog(category) {
    state.editingBudgetCategory = category;
    $('budgetDialogTitle').textContent = (state.budgets[category] ? 'Edit ' : 'Set ') + category + ' budget';
    $('budgetAmount').value = state.budgets[category] ? String(state.budgets[category]) : '';
    setFieldError('budgetAmount', 'budgetAmountError', '');
    openDialog($('budgetDialog'));
    $('budgetAmount').focus();
  }

  function handleBudgetSubmit(event) {
    event.preventDefault();
    var category = state.editingBudgetCategory;
    if (!category) return;
    var result = parseAmount($('budgetAmount').value, true);
    if (result.error) {
      setFieldError('budgetAmount', 'budgetAmountError', result.error);
      $('budgetAmount').focus();
      return;
    }
    if (result.value === 0) {
      delete state.budgets[category];
      showToast(category + ' budget removed.', 'info');
    } else {
      state.budgets[category] = result.value;
      showToast(category + ' budget saved.');
    }
    saveBudgets();
    state.editingBudgetCategory = null;
    closeDialog($('budgetDialog'));
    renderAll();
  }

  /* ---------------------------- Goal dialog -------------------------- */
  function openGoalDialog() {
    var summary = getSummary();
    var maxSaved = Math.max(summary.balance, 0);
    $('goalName').value = state.goal.name;
    $('goalTarget').value = String(state.goal.target);
    $('goalSaved').value = String(summary.savings);
    $('goalSavedHint').textContent = 'Your balance is ' + formatMoney(summary.balance) + ', so you can set aside up to ' + formatMoney(maxSaved) + '.';
    setFormError('goalFormError', '');
    setFieldError('goalName', 'goalNameError', '');
    setFieldError('goalTarget', 'goalTargetError', '');
    setFieldError('goalSaved', 'goalSavedError', '');
    openDialog($('goalDialog'));
    $('goalName').focus();
  }

  function handleGoalSubmit(event) {
    event.preventDefault();
    var summary = getSummary();
    var maxSaved = Math.max(summary.balance, 0);
    var name = cleanText($('goalName').value, 40);
    var target = parseAmount($('goalTarget').value, false);
    var saved = parseAmount($('goalSaved').value, true);
    var nameError = name ? '' : 'Enter a goal name.';
    var targetError = target.error || '';
    var savedError = saved.error || '';
    if (!savedError && saved.value > maxSaved) {
      savedError = 'Saved amount cannot be more than your balance (' + formatMoney(maxSaved) + ').';
    }
    setFieldError('goalName', 'goalNameError', nameError);
    setFieldError('goalTarget', 'goalTargetError', targetError);
    setFieldError('goalSaved', 'goalSavedError', savedError);
    if (nameError || targetError || savedError) {
      setFormError('goalFormError', 'Please fix the highlighted fields and try again.');
      return;
    }
    state.goal = { name: name, target: target.value, saved: saved.value };
    saveGoal();
    closeDialog($('goalDialog'));
    showToast('Savings goal updated.');
    renderAll();
  }

  /* ---------------------------- CSV export --------------------------- */
  function csvCell(value) {
    var s = String(value === null || value === undefined ? '' : value);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // neutralise spreadsheet formulas
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function exportCSV(list) {
    if (!list.length) { showToast('There are no transactions to export.', 'error'); return; }
    var rows = [['Date', 'Type', 'Category', 'Description', 'Payment method', 'Amount']].concat(
      list.map(function (t) { return [t.date, t.type, t.category, t.description, t.payment, t.amount.toFixed(2)]; }));
    var csv = '\uFEFF' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'spendwise-transactions-' + toISODate(new Date()) + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    showToast('Exported ' + list.length + ' transaction' + (list.length === 1 ? '' : 's') + '.');
  }

  /* ---------------------------- Settings ----------------------------- */
  function applyTheme() {
    var dark = state.settings.theme === 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0B1220' : '#0F766E');
  }

  function toggleTheme() {
    state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
    saveSettings();
    applyTheme();
    renderAll(); // redraw charts with the new colours
    showToast(state.settings.theme === 'dark' ? 'Dark mode on.' : 'Light mode on.', 'info');
  }

  function handleNameSubmit(event) {
    event.preventDefault();
    var name = cleanText($('settingsName').value, 30);
    if (!name) {
      setFieldError('settingsName', 'settingsNameError', 'Enter a name (up to 30 characters).');
      return;
    }
    setFieldError('settingsName', 'settingsNameError', '');
    state.settings.name = name;
    saveSettings();
    renderAll();
    showToast('Name saved.');
  }

  function handleCurrencyChange(event) {
    var code = event.target.value;
    if (!CURRENCIES[code]) return;
    state.settings.currency = code;
    saveSettings();
    rebuildFormatters();
    renderAll();
    showToast('Currency display set to ' + code + '. Amounts are not converted.', 'info');
  }

  async function resetDemoData() {
    var ok = await confirmAction({
      title: 'Reset demo data?',
      message: 'This replaces all your transactions, budgets and savings goal with the sample data. Your name, theme and currency are kept. This cannot be undone.',
      confirmLabel: 'Reset data'
    });
    if (!ok) return;
    var seed = buildSeedData();
    state.transactions = seed.transactions;
    state.budgets = seed.budgets;
    state.goal = seed.goal;
    state.filters = { search: '', type: 'all', category: 'all', sort: 'date-desc' };
    $('globalSearch').value = '';
    saveTransactions(); saveBudgets(); saveGoal();
    writeStored(KEYS.seeded, '1');
    renderAll();
    showToast('Demo data restored.');
  }

  /** Remove ALL transactions, budgets and goal so the user can start from zero. */
  async function clearAllData() {
    var ok = await confirmAction({
      title: 'Clear all data?',
      message: 'This permanently deletes every transaction, budget and your savings goal so you can start fresh with your own expenses. Your name, theme and currency are kept. This cannot be undone.',
      confirmLabel: 'Clear everything'
    });
    if (!ok) return;
    state.transactions = [];
    state.budgets = {};
    state.goal = { name: 'My savings goal', target: 10000, saved: 0 };
    state.filters = { search: '', type: 'all', category: 'all', sort: 'date-desc' };
    $('globalSearch').value = '';
    saveTransactions(); saveBudgets(); saveGoal();
    writeStored(KEYS.seeded, '1'); // stops sample data from coming back on reload
    renderAll();
    showToast('All data cleared. Add your own transactions to begin.');
  }

  /* ======================================================================
     8. NAVIGATION AND INITIALISATION
     ====================================================================== */
  function pageFromHash() {
    var name = window.location.hash.replace('#', '');
    return PAGES[name] ? name : 'dashboard';
  }

  function navigate(page) {
    if (window.location.hash === '#' + page) showPage(page, {});
    else window.location.hash = page;
  }

  function showPage(page, opts) {
    state.page = page;
    document.querySelectorAll('.page[data-page]').forEach(function (section) {
      section.hidden = section.getAttribute('data-page') !== page;
    });
    document.querySelectorAll('.nav-link').forEach(function (link) {
      var active = link.getAttribute('data-page') === page;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    $('pageTitle').textContent = PAGES[page];
    document.title = PAGES[page] + ' \u2013 SpendWise';
    closeSidebar(false);
    renderChrome();
    renderCurrentPage();
    if (!opts || !opts.keepFocus) {
      window.scrollTo(0, 0);
      $('main').focus({ preventScroll: true });
    }
  }

  /* ----- Mobile sidebar ----- */
  function openSidebar() {
    $('sidebar').classList.add('open');
    $('scrim').hidden = false;
    $('menuBtn').setAttribute('aria-expanded', 'true');
    $('menuBtn').setAttribute('aria-label', 'Close navigation menu');
    var first = $('sidebar').querySelector('.nav-link');
    if (first) first.focus();
  }
  function closeSidebar(restoreFocus) {
    var sidebar = $('sidebar');
    var wasOpen = sidebar.classList.contains('open');
    sidebar.classList.remove('open');
    $('scrim').hidden = true;
    $('menuBtn').setAttribute('aria-expanded', 'false');
    $('menuBtn').setAttribute('aria-label', 'Open navigation menu');
    if (wasOpen && restoreFocus) $('menuBtn').focus();
  }

  /* ----- Static select options ----- */
  function populateStaticSelects() {
    var filterCategory = $('txFilterCategory');
    filterCategory.replaceChildren(
      h('option', { value: 'all', text: 'All categories' }),
      h('optgroup', { label: 'Expense' }, EXPENSE_CATEGORIES.map(function (c) { return h('option', { value: c, text: c }); })),
      h('optgroup', { label: 'Income' }, INCOME_CATEGORIES.map(function (c) { return h('option', { value: c, text: c }); })));

    var payment = $('txPayment');
    payment.replaceChildren.apply(payment, [h('option', { value: '', text: 'Not specified' })].concat(
      PAYMENT_METHODS.map(function (m) { return h('option', { value: m, text: m }); })));

    var currency = $('currencySelect');
    currency.replaceChildren.apply(currency, Object.keys(CURRENCIES).map(function (code) {
      return h('option', { value: code, text: code + ' \u2013 ' + CURRENCIES[code].name });
    }));
  }

  /* ----- Event wiring ----- */
  function bindEvents() {
    // Navigation
    window.addEventListener('hashchange', function () {
      showPage(pageFromHash(), { keepFocus: document.activeElement === $('globalSearch') });
    });
    document.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () { closeSidebar(false); });
    });
    $('menuBtn').addEventListener('click', function () {
      if ($('sidebar').classList.contains('open')) closeSidebar(true); else openSidebar();
    });
    $('scrim').addEventListener('click', function () { closeSidebar(true); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && $('sidebar').classList.contains('open')) closeSidebar(true);
    });
    var desktopQuery = window.matchMedia('(min-width: 1024px)');
    var onViewport = function (e) { if (e.matches) closeSidebar(false); };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onViewport);
    else if (desktopQuery.addListener) desktopQuery.addListener(onViewport);

    // Header
    $('headerAddBtn').addEventListener('click', function () { openTxDialog(); });
    $('globalSearch').addEventListener('input', function (e) {
      state.filters.search = e.target.value;
      if (state.page === 'transactions') renderTransactions();
      else if (e.target.value.trim()) navigate('transactions');
    });
    $('globalSearch').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); if (state.page !== 'transactions') navigate('transactions'); }
    });

    // Transactions page controls
    $('txAddBtn').addEventListener('click', function () { openTxDialog(); });
    $('txFilterSearch').addEventListener('input', function (e) {
      state.filters.search = e.target.value;
      $('globalSearch').value = e.target.value;
      renderTransactions();
    });
    $('txFilterType').addEventListener('change', function (e) { state.filters.type = e.target.value; renderTransactions(); });
    $('txFilterCategory').addEventListener('change', function (e) { state.filters.category = e.target.value; renderTransactions(); });
    $('txFilterSort').addEventListener('change', function (e) { state.filters.sort = e.target.value; renderTransactions(); });
    $('txReset').addEventListener('click', resetFilters);
    $('txExport').addEventListener('click', function () { exportCSV(getFilteredTransactions()); });

    // Budgets
    $('budgetMonth').addEventListener('change', function (e) { state.budgetMonth = e.target.value; renderBudgets(); });

    // Reports
    $('reportPreset').addEventListener('change', function (e) {
      state.report.preset = e.target.value;
      renderReports();
    });
    function onCustomDate() {
      state.report.preset = 'custom';
      state.report.from = $('reportFrom').value;
      state.report.to = $('reportTo').value;
      renderReports();
    }
    $('reportFrom').addEventListener('change', onCustomDate);
    $('reportTo').addEventListener('change', onCustomDate);
    $('reportExport').addEventListener('click', function () { exportCSV(getReportData().transactions); });

    // Settings
    $('nameForm').addEventListener('submit', handleNameSubmit);
    $('themeSwitch').addEventListener('click', toggleTheme);
    $('currencySelect').addEventListener('change', handleCurrencyChange);
    $('resetDemoBtn').addEventListener('click', resetDemoData);

    // Transaction dialog
    $('txForm').addEventListener('submit', handleTxSubmit);
    $('txForm').querySelectorAll('input[name="type"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        fillCategoryOptions(currentTxType(), $('txCategoryInput').value);
        setFieldError('txCategoryInput', 'txCategoryInputError', '');
      });
    });
    [['txAmount', 'txAmountError'], ['txDescription', 'txDescriptionError'], ['txCategoryInput', 'txCategoryInputError'], ['txDate', 'txDateError']].forEach(function (pair) {
      var clear = function () { setFieldError(pair[0], pair[1], ''); };
      $(pair[0]).addEventListener('input', clear);
      $(pair[0]).addEventListener('change', clear);
    });
    $('txDialog').addEventListener('close', function () {
      $('txForm').dataset.busy = '0';
      $('txSubmit').disabled = false;
      state.editingTxId = null;
    });

    // Other dialogs
    $('goalForm').addEventListener('submit', handleGoalSubmit);
    $('budgetForm').addEventListener('submit', handleBudgetSubmit);

    // Shared dialog behaviour: close buttons and backdrop click
    document.querySelectorAll('[data-close-dialog]').forEach(function (btn) {
      btn.addEventListener('click', function () { closeDialog(btn.closest('dialog')); });
    });
    document.querySelectorAll('dialog').forEach(function (dialog) {
      var pressedOnBackdrop = false;
      dialog.addEventListener('mousedown', function (e) { pressedOnBackdrop = e.target === dialog; });
      dialog.addEventListener('click', function (e) {
        if (pressedOnBackdrop && e.target === dialog) closeDialog(dialog);
        pressedOnBackdrop = false;
      });
    });

    // Refresh date-dependent views when the tab becomes visible on a new day
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && toISODate(new Date()) !== state.today) {
        state.today = toISODate(new Date());
        renderAll();
      }
    });

    // Keep several open tabs consistent
    window.addEventListener('storage', function (e) {
      if (e.key && e.key.indexOf(APP_PREFIX) !== 0) return;
      loadState(false);
      applyTheme();
      rebuildFormatters();
      renderAll();
    });
  }

  function init() {
    storageOk = testStorage();
    var hadCorruption = loadState(true);
    applyTheme();
    rebuildFormatters();
    populateStaticSelects();
    setIcons(document);
    bindEvents();
    // Add a "Clear all data" button next to "Reset demo data" in Settings
    var resetBtn = $('resetDemoBtn');
    if (resetBtn && !$('clearAllBtn')) {
      var clearBtn = h('button', { type: 'button', class: 'btn btn-danger', id: 'clearAllBtn', onClick: clearAllData }, svgIcon('trash'), 'Clear all data');
      resetBtn.parentNode.insertBefore(clearBtn, resetBtn);
    }
    $('txDate').max = toISODate(new Date());
    showPage(pageFromHash(), { keepFocus: true });

    if (!storageOk) showToast('Browser storage is unavailable, so your data will not be saved after you close this tab.', 'error');
    else if (hadCorruption) showToast('Some saved data could not be read and was skipped.', 'error');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();