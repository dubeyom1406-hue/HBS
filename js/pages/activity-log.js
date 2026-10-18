/* Activity log page (workspace audit trail). */
(function () {
  "use strict";

  const BHGS = window.BHGS;
  const { esc, fmtTime } = BHGS.utils;
  const { store } = BHGS;
  const ui = BHGS.ui;

  function view(state) {
    const q = state.search.toLowerCase();
    const filtered = store.data.audit.filter((a) => [a.action, a.detail, a.user, a.id].join(" ").toLowerCase().includes(q));
    const rows = filtered
      .map(
        (a) =>
          `<tr><td><strong class="audit-action">${esc(a.action)}</strong><div class="audit-detail">${esc(a.detail)}</div></td><td>${esc(a.user)}</td><td>${fmtTime(a.time)}</td><td><span class="status status-progress">${esc(a.type || "activity")}</span></td><td><span class="audit-id">${esc(a.id)}</span></td></tr>`
      )
      .join("");

    return `${ui.heading("Activity log", "Recorded activity for the current workspace.", ui.btn("↓ Export CSV", "export-audit", "btn btn-primary"))}${ui.tableShell(
      ui.searchToolbar(state.search, "Search action, details, user…"),
      ["Activity", "User", "Date & time", "Type", "Event ID"],
      rows,
      ui.tableFooter(filtered.length, store.mode)
    )}`;
  }

  const page = BHGS.createPage({ render: view });

  ui.actions.on("export-audit", () => ui.exportCSV("caregrid-audit-log.csv", store.data.audit));

  BHGS.layout.init();
  page.paint();
})();
