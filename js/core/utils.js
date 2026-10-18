/*
 * utils.js — small pure helpers shared by every page.
 * Nothing here touches the DOM except the query shortcuts.
 */
(function (global) {
  "use strict";

  const BHGS = (global.BHGS = global.BHGS || {});
  const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

  /** Every page of the app. Used to validate navigation targets. */
  const PAGES = {
    dashboard: { file: "index.html", title: "Overview" },
    profile: { file: "admin-profile.html", title: "Operations Admin profile" },
    departments: { file: "departments.html", title: "Departments" },
    staff: { file: "staff.html", title: "Doctors & Staff" },
    complaints: { file: "complaints.html", title: "Complaints" },
    critical: { file: "critical-cases.html", title: "Critical cases" },
    ai: { file: "ai-triage.html", title: "AI triage demo" },
    reports: { file: "reports.html", title: "Reports & analytics" },
    notifications: { file: "notifications.html", title: "Notifications" },
    audit: { file: "activity-log.html", title: "Activity log" },
    settings: { file: "settings.html", title: "Settings" },
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /** HTML-escapes any value. Every piece of user data must pass through this before innerHTML. */
  const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESC_MAP[c]);

  const initials = (name) =>
    String(name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  const AVATAR_PALETTE = ["avatar-indigo", "avatar-teal", "avatar-orange", "avatar-rose"];
  const COLOR_CLASS = { purple: "icon-purple", teal: "icon-teal", orange: "icon-orange", red: "icon-red" };
  const STATUS_CLASS = {
    Open: "status-open",
    "In progress": "status-progress",
    Resolved: "status-resolved",
    Critical: "status-critical",
    Active: "status-active",
    Inactive: "status-inactive",
  };
  const PRIORITY_SCORE = { Critical: 4, High: 3, Medium: 2, Low: 1 };

  const colorClass = (key) => (hasOwn(COLOR_CLASS, key) ? COLOR_CLASS[key] : "icon-purple");
  const statusClass = (key) => (hasOwn(STATUS_CLASS, key) ? STATUS_CLASS[key] : "status-inactive");
  const priorityScore = (p) => (hasOwn(PRIORITY_SCORE, p) ? PRIORITY_SCORE[p] : 0);

  /** Stable avatar colour from an id such as "ST-1004". */
  const avatarFor = (id) => AVATAR_PALETTE[(parseInt(String(id).slice(-1), 10) || 0) % AVATAR_PALETTE.length];

  const fmtDate = (value) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const fmtTime = (value) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? "Just now"
      : d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const relative = (value) => {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
    if (Number.isNaN(minutes) || minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
    return `${Math.floor(minutes / 1440)} days ago`;
  };

  /**
   * Converts rows to CSV. Cells that start with = + - @ are prefixed with a quote
   * so spreadsheet software cannot run them as formulas (CSV injection).
   */
  const toCSV = (rows) => {
    if (!rows.length) return "";
    const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const cell = (value) => {
      let s = String(value ?? "");
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return `"${s.replace(/"/g, '""')}"`;
    };
    return [keys.map(cell).join(","), ...rows.map((row) => keys.map((k) => cell(row[k])).join(","))].join("\r\n");
  };

  BHGS.utils = {
    PAGES, hasOwn, $, $$, esc, initials, colorClass, statusClass, priorityScore,
    avatarFor, fmtDate, fmtTime, relative, toCSV,
  };
})(window);
