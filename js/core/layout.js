/*
 * layout.js — behaviour of the shared shell: sidebar (collapse / mobile drawer),
 * top bar (global search, notifications, profile), live counters and the quick guide.
 */
(function (global) {
  "use strict";

  const BHGS = (global.BHGS = global.BHGS || {});
  const { PAGES, $ } = BHGS.utils;
  const { store } = BHGS;
  const ui = BHGS.ui;

  const MOBILE_QUERY = "(max-width:950px)";

  function updateCounts() {
    const d = store.data;
    const set = (id, value) => {
      const el = $(id);
      if (el) el.textContent = value;
    };
    set("#complaintNavCount", d.complaints.filter((c) => c.status !== "Resolved").length);
    set("#notificationNavCount", d.notifications.filter((n) => !n.read).length);
    set("#departmentNavCount", d.departments.length);
  }

  function showGuide() {
    const item = (n, title, text) =>
      `<div class="guide-item"><span class="guide-num">${n}</span><div><strong>${title}</strong><p>${text}</p></div></div>`;
    const storageGuide = store.mode === "local"
      ? item("02", "Manage sample records", "Add, edit, search and filter records. Changes are saved in this browser.")
      : item("02", "Manage workspace records", "Add, edit, search, filter and delete records. Changes are saved through the configured backend API.");
    const connectionGuide = store.mode === "local"
      ? item("04", "Demo data", "This workspace uses sample records stored in this browser. Do not enter real patient data.")
      : item("04", "API connection", "Workspace data requires the backend API and an authorized session. Contact your administrator if the API is unavailable.");
    ui.openModal(
      "Welcome to Bihar Healthcare Grievance System",
      "QUICK GUIDE",
      `<div class="guide-list">${item("01", "Navigate your workspace", "Use the left sidebar to switch between departments, staff, complaints and reports.")}${storageGuide}${item("03", "Export a backup", "Open Settings → Data &amp; privacy to export or import a JSON backup file.")}${connectionGuide}</div>`,
      `<button type="button" class="btn btn-primary" data-action="close-modal">Got it</button>`
    );
  }

  function closeDrawer() {
    $("#sidebar").classList.remove("open");
    $("#sidebarScrim").hidden = true;
  }

  function bindSidebar() {
    $("#mobileMenu").addEventListener("click", () => {
      if (global.matchMedia(MOBILE_QUERY).matches) {
        const side = $("#sidebar");
        side.classList.toggle("open");
        $("#sidebarScrim").hidden = !side.classList.contains("open");
      } else {
        const collapsed = document.body.classList.toggle("nav-collapsed");
        setTimeout(() => global.dispatchEvent(new Event("resize")), 260);
      }
    });
    $("#sidebarScrim").addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
  }

  function bindTopbar() {
    const search = $("#globalSearch");
    if (search) {
      search.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        const q = search.value.trim().slice(0, 100);
        if (BHGS.hooks.search) BHGS.hooks.search(q);
        else location.href = `${PAGES.complaints.file}?q=${encodeURIComponent(q)}`;
      });
    }
    const notifications = $("#topNotifications");
    if (notifications) notifications.addEventListener("click", () => (location.href = PAGES.notifications.file));
    const profileMenu = $("#profileMenu");
    if (profileMenu) profileMenu.addEventListener("click", () => (location.href = PAGES.profile.file));
    const guide = $("#openGuide");
    if (guide) guide.addEventListener("click", showGuide);
  }

  function bindClock() {
    const clock = $("#liveClock");
    const shortClock = $("#liveClockTime");
    if (!clock || !shortClock) return;

    const fullFormatter = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZoneName: "short"
    });
    const timeFormatter = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
    const update = () => {
      const now = new Date();
      clock.dateTime = now.toISOString();
      clock.textContent = fullFormatter.format(now);
      shortClock.textContent = timeFormatter.format(now);
    };
    update();
    global.setInterval(update, 1000);
  }

  function init() {
    ui.init();
    BHGS.records.init();
    bindSidebar();
    bindTopbar();
    bindClock();
    updateCounts();
  }

  BHGS.layout = { init, updateCounts, showGuide };
})(window);
