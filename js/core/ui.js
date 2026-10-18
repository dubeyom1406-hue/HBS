/*
 * ui.js — shared interface building blocks: icons, HTML templates, toast, modal,
 * the data-action click dispatcher and file export.
 * All templates expect values to be escaped by the caller (use utils.esc).
 */
(function (global) {
  "use strict";

  const BHGS = (global.BHGS = global.BHGS || {});
  const { PAGES, hasOwn, $, $$, esc, colorClass, statusClass, toCSV } = BHGS.utils;

  /** Page-level hooks. A page replaces `refresh` with its own re-render function. */
  BHGS.hooks = { refresh() {}, search: null };

  /* ---------- icons ---------- */
  const P={
    building:'<path d="M4 21V6l8-3 8 3v15"/><path d="M9 21v-5h6v5M9 10h.01M12 10h.01M15 10h.01"/>',
    user:'<circle cx="12" cy="7" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>',
    clipboard:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    alert:'<path d="m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4M12 17h.01"/>',
    msgwarn:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 7v4M12 14h.01"/>',
    sparkles:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M17 5h4"/>',
    arrow:'<path d="M7 17 17 7M7 7h10v10"/>',
    check:'<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
    chart:'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    bell:'<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    heart:'<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.1 3 5.5l7 7Z"/>',
    cross:'<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/>',
    brain:'<path d="M12 5a3 3 0 1 0-6 .1 4 4 0 0 0-2.5 5.7 4 4 0 0 0 .6 6.6A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 6 .1 4 4 0 0 1 2.5 5.7 4 4 0 0 1-.6 6.6A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4M12 18V5"/>',
    baby:'<path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/>',
    bone:'<path d="M17 10c.7-.7 1.7 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .8.7 1.8 0 2.5l-7 7c-.7.7-1.7 0-2.5 0a2.5 2.5 0 0 0 0 5c.3 0 .5.2.5.5a2.5 2.5 0 1 0 5 0c0-.8-.7-1.8 0-2.5Z"/>',
    scan:'<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',
    steth:'<path d="M11 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
    flask:'<path d="M10 2v7.5a2 2 0 0 1-.2.9L4.7 20.5a1 1 0 0 0 .9 1.5h12.8a1 1 0 0 0 .9-1.5l-5.1-10.1a2 2 0 0 1-.2-.9V2M8.5 2h7M7 16h10"/>'
  };
  const svg=n=>`<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
  const GLYPH={"\u25a6":"building","\u2659":"user","\u25a4":"clipboard","\u2691":"flag","!":"alert","\u2022":"msgwarn","\u2726":"sparkles","\u2197":"arrow","\u2713":"check","\u25cc":"clock","\u25c9":"target","\u25a5":"chart","\u2667":"bell","\u2315":"search","\u2661":"heart","\u271a":"cross","\u2301":"bone","\u25a7":"scan","\uff0b":"steth","\u2697":"flask"};
  const DEPT=[[/cardio/i,"heart"],[/emerg|trauma|casualty/i,"cross"],[/neuro/i,"brain"],[/pedia|child|neonat/i,"baby"],[/ortho|bone/i,"bone"],[/radio|imaging|x-?ray/i,"scan"],[/general|medicine|physician/i,"steth"],[/patho|lab/i,"flask"]];
  function ICON(sym){const k=hasOwn(GLYPH,sym)?GLYPH[sym]:null;return k?svg(k):esc(sym);}
  function deptIcon(x){for(const [re,k] of DEPT){if(re.test(x.name||""))return svg(k);}return ICON(x.icon);}

  /* ---------- HTML templates ---------- */
  const btn = (label, action, cls = "btn", extra = "") =>
    `<button type="button" class="${cls}" data-action="${esc(action)}" ${extra}>${label}</button>`;

  const badge = (status) => `<span class="status ${statusClass(status)}">${esc(status)}</span>`;

  const heading = (title, subtitle, actions = "") =>
    `<div class="page-heading"><div><div class="eyebrow">BIHAR HEALTHCARE / GRIEVANCE SYSTEM</div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;

  const card = (title, subtitle, body, action = "") =>
    `<section class="card"><header class="card-header"><div><h2 class="card-title">${title}</h2>${subtitle ? `<div class="card-subtitle">${subtitle}</div>` : ""}</div>${action}</header>${body}</section>`;

  const metric = (label, value, icon, cls, foot, interaction) => {
    const page = typeof interaction === "string" ? interaction : interaction && interaction.page;
    const linked = page && hasOwn(PAGES, page);
    const filters = interaction && typeof interaction === "object" ? interaction.filters : null;
    const clearFilters = interaction && typeof interaction === "object" && interaction.clearFilters;
    const filterable = Boolean(filters || clearFilters);
    const clickable = linked || filterable;
    const tag = clickable ? "a" : "article";
    const destination = clickable
      ? ` href="${esc(linked ? PAGES[page].file : "#tableSearch")}" aria-label="${esc(`${label}: ${value}. ${linked ? `Open ${PAGES[page].title}` : "Filter records"}`)}"`
      : "";
    const action = filterable
      ? ` data-action="metric-filter"${clearFilters ? ' data-clear-filters="true"' : ""}${Object.entries(filters || {})
          .map(([key, filter]) => ` data-filter-${esc(key)}="${esc(filter)}"`)
          .join("")}`
      : "";
    return `<${tag} class="card stat-card${clickable ? " stat-card-link" : ""}"${destination}${action}><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-icon ${cls}">${ICON(icon)}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></${tag}>`;
  };

  const metricStrip = (items) =>
    `<div class="stats-grid" style="margin-bottom:18px">${items
      .map((x, i) => metric(x[0], x[1], ["◉", "✓", "◌", "▦"][i], ["icon-purple", "icon-teal", "icon-orange", "icon-purple"][i], '<span class="muted">Current workspace</span>', x[2]))
      .join("")}</div>`;

  const activityRow = (symbol, cls, title, detail, time) =>
    `<div class="activity-row"><div class="activity-symbol ${cls}">${ICON(symbol)}</div><div class="activity-copy"><strong>${title}</strong><p>${detail}</p></div><span class="activity-time">${time}</span></div>`;

  const emptyState = (title, text, icon = "") =>
    `<div class="empty-state">${icon ? `<div class="empty-icon">${ICON(icon)}</div>` : ""}<strong>${title}</strong><p>${text}</p></div>`;

  const tableShell = (toolbar, headers, rows, footer) =>
    `<section class="card"><div class="toolbar">${toolbar}</div><div class="table-wrap"><table class="data-table"><thead><tr>${headers
      .map((h) => `<th>${h}</th>`)
      .join("")}</tr></thead><tbody>${
      rows ||
      `<tr><td colspan="${headers.length}">${emptyState("No records found", "Try changing your search or filters, or create a new record.", "⌕")}</td></tr>`
    }</tbody></table></div>${footer || ""}</section>`;

  const searchToolbar = (search, placeholder, filters = "", action = "") =>
    `<div class="toolbar-left"><label class="searchbox"><span>⌕</span><input class="field" id="tableSearch" placeholder="${esc(placeholder)}" value="${esc(search)}" maxlength="100" autocomplete="off"></label>${filters}</div><div class="toolbar-right">${btn("↻ Reset", "reset-table", "btn btn-ghost btn-sm")}${action}</div>`;

  const tableFooter = (count, mode) =>
    `<div class="table-footer"><span>Showing <strong>${count}</strong> record${count === 1 ? "" : "s"}</span><span>${mode === "local" ? "Browser storage" : "Backend API"}</span></div>`;

  /* ---------- toast ---------- */
  function toast(message, type = "success") {
    const region = $("#toastRegion");
    if (!region) return;
    const node = document.createElement("div");
    node.className = "toast" + (type === "error" ? " error" : "");
    const mark = document.createElement("span");
    mark.className = "toast-mark";
    mark.textContent = type === "error" ? "!" : "✓";
    const label = document.createElement("span");
    label.textContent = message;
    node.append(mark, label);
    region.append(node);
    setTimeout(() => node.remove(), 3400);
  }

  /* ---------- modal ---------- */
  let lastFocus = null;

  function openModal(title, eyebrow, bodyHtml, footerHtml) {
    $("#modalTitle").textContent = title;
    $("#modalEyebrow").textContent = eyebrow;
    $("#modalBody").innerHTML = bodyHtml;
    $("#modalFooter").innerHTML = footerHtml;
    lastFocus = document.activeElement;
    $("#modalBackdrop").hidden = false;
    document.body.style.overflow = "hidden";
    const first = $("input,select,textarea,button", $("#modalBody"));
    if (first) setTimeout(() => first.focus(), 50);
  }

  function closeModal() {
    $("#modalBackdrop").hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && typeof lastFocus.focus === "function" && document.contains(lastFocus)) lastFocus.focus();
    lastFocus = null;
  }

  const isModalOpen = () => !$("#modalBackdrop").hidden;

  /** `message` may contain markup; callers must escape any user data inside it. */
  function confirmModal(title, message, onConfirm, danger = false) {
    openModal(
      title,
      "PLEASE CONFIRM",
      `<p style="font-size:12px;color:var(--muted);line-height:1.7;margin:0">${message}</p>`,
      `<button type="button" class="btn" data-action="close-modal">Cancel</button><button type="button" class="btn ${danger ? "btn-danger" : "btn-primary"}" id="confirmAction">Confirm</button>`
    );
    $("#confirmAction").addEventListener("click", () => {
      closeModal();
      onConfirm();
    });
  }

  /* ---------- actions ---------- */
  const handlers = Object.create(null);
  const actions = {
    /** Registers a handler for buttons that carry data-action="name". */
    on(name, fn) {
      handlers[name] = fn;
    },
  };

  /** Downloads text content as a file. */
  function exportFile(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`${filename} exported`);
  }

  function exportCSV(filename, rows) {
    exportFile(filename, toCSV(rows), "text/csv;charset=utf-8");
  }

  function exportSVG(filename, title, entries) {
    const width = 960;
    let y = 104;
    const rows = entries
      .map((entry, index) => {
        const words = String(entry[1] || "Not provided").split(/\s+/);
        const lines = [];
        let line = "";
        words.forEach((word) => {
          if (word.length > 68) {
            if (line) lines.push(line);
            line = "";
            for (let offset = 0; offset < word.length; offset += 68) lines.push(word.slice(offset, offset + 68));
          } else if (!line) {
            line = word;
          } else if (`${line} ${word}`.length <= 68) {
            line += ` ${word}`;
          } else {
            lines.push(line);
            line = word;
          }
        });
        if (line) lines.push(line);
        const rowHeight = Math.max(54, 30 + lines.length * 20);
        const top = y - 26;
        const label = `<text x="52" y="${y - 3}" fill="#778399" font-size="14">${esc(entry[0])}</text>`;
        const value = lines
          .map((text, lineIndex) => `<text x="330" y="${y - 3 + lineIndex * 19}" fill="#17243b" font-size="15" font-weight="600">${esc(text)}</text>`)
          .join("");
        const row = `<rect x="32" y="${top}" width="896" height="${rowHeight}" rx="10" fill="${index % 2 ? "#f7f8fc" : "#ffffff"}"/>${label}${value}`;
        y += rowHeight + 10;
        return row;
      })
      .join("");
    const height = y + 20;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f6f8fc"/><text x="40" y="48" fill="#17243b" font-family="Arial,sans-serif" font-size="25" font-weight="700">${esc(title)}</text><text x="40" y="76" fill="#778399" font-family="Arial,sans-serif" font-size="13">Bihar Healthcare Grievance System</text>${rows}</svg>`;
    exportFile(filename, svg, "image/svg+xml;charset=utf-8");
  }

  function closeExportMenus() {
    $$(".export-menu-options:not([hidden])").forEach((menu) => {
      menu.hidden = true;
      const trigger = $(".export-menu-trigger", menu.parentElement);
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  }

  const exportMenu = (entity, id) =>
    `<div class="export-menu"><button type="button" class="btn export-menu-trigger" data-action="toggle-export-menu" aria-haspopup="menu" aria-expanded="false">Export <span aria-hidden="true">▾</span></button><div class="export-menu-options" role="menu" hidden>${[
      ["pdf", "Print / Save as PDF"],
      ["csv", "Export CSV"],
      ["image", "Export image (SVG)"],
      ["json", "Export JSON"],
    ]
      .map(([format, label]) => `<button type="button" role="menuitem" class="export-menu-option" data-action="export-${entity}-${format}" data-id="${esc(id)}">${label}</button>`)
      .join("")}</div></div>`;

  function init() {
    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-action]");
      if (!el) return;
      const fn = handlers[el.dataset.action];
      if (fn) fn(el, e);
    });
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest(".export-menu-trigger");
      if (trigger) {
        e.preventDefault();
        const menu = $(".export-menu-options", trigger.parentElement);
        const shouldOpen = menu.hidden;
        closeExportMenus();
        if (shouldOpen) {
          menu.hidden = false;
          trigger.setAttribute("aria-expanded", "true");
        }
      } else if (!e.target.closest(".export-menu") || e.target.closest(".export-menu-option")) {
        closeExportMenus();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeExportMenus();
    });

    actions.on("close-modal", closeModal);
    actions.on("navigate", (el) => {
      if (hasOwn(PAGES, el.dataset.page)) location.href = PAGES[el.dataset.page].file;
    });
    actions.on("metric-filter", (el, e) => {
      e.preventDefault();
      BHGS.hooks.metricFilter(el);
    });

    $("#modalClose").addEventListener("click", closeModal);
    $("#modalBackdrop").addEventListener("click", (e) => {
      if (e.target === $("#modalBackdrop")) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (!isModalOpen()) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "Tab") {
        const items = $$("button,input,select,textarea,[href]", $(".modal")).filter((x) => !x.disabled && !x.hidden);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    document.addEventListener("bhgs:api-error", (event) => toast(event.detail && event.detail.message ? event.detail.message : "The API request failed.", "error"));
    document.addEventListener("bhgs:storage-error", (event) => toast(event.detail && event.detail.message ? event.detail.message : "Could not save changes to this browser. Your previous data was restored.", "error"));
    document.addEventListener("bhgs:data-changed", () => BHGS.hooks.refresh());
  }

  BHGS.ui = {
    ICON, svg, deptIcon, btn, badge, heading, card, metric, metricStrip, activityRow, emptyState,
    tableShell, searchToolbar, tableFooter, toast, openModal, closeModal, confirmModal, isModalOpen,
    actions, exportFile, exportCSV, exportSVG, exportMenu, init, colorClass,
  };
})(window);
