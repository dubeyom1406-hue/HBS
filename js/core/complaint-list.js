/*
 * complaint-list.js — the complaints table. Used by both the Complaints page and
 * the Critical cases page (which shows only open Critical items).
 */
(function (global) {
  "use strict";

  const BHGS = (global.BHGS = global.BHGS || {});
  const { esc, initials, fmtDate, fmtTime } = BHGS.utils;
  const { store } = BHGS;
  const ui = BHGS.ui;

  const matchesFilter = (filter, value) => !filter || filter === "all" || filter === value;

  const caseUrl = (id, criticalOnly) =>
    `${criticalOnly ? "critical-cases.html" : "complaints.html"}?id=${encodeURIComponent(id)}`;

  function detail(c, criticalOnly) {
    const department = store.data.departments.find((item) => item.name === c.department);
    const backUrl = criticalOnly ? "critical-cases.html" : "complaints.html";
    const actions = `<a class="btn" href="${backUrl}">← ${criticalOnly ? "Critical cases" : "All complaints"}</a>${ui.exportMenu("case", c.id)}${ui.btn("Edit case", "edit-complaint", "btn btn-primary", `data-id="${esc(c.id)}"`)}`;
    const description = c.description
      ? `<p class="case-description">${esc(c.description)}</p>`
      : `<p class="case-description case-description-empty">No additional description was provided for this case.</p>`;
    const timeline = `<div class="case-timeline"><span class="case-timeline-dot"></span><div><strong>Case received</strong><p>${fmtTime(c.created)}</p></div><span class="case-timeline-current">${esc(c.status)}</span></div>`;

    return `${ui.heading(`Case ${esc(c.id)}`, "Full complaint details and current handling information.", actions)}
      <section class="card case-detail-hero" data-case-id="${esc(c.id)}">
        <div class="case-detail-heading"><div><div class="eyebrow">COMPLAINT CASE · ${esc(c.id)}</div><h2>${esc(c.subject || "Complaint")}</h2></div><div class="case-detail-badges">${ui.badge(c.priority)}${ui.badge(c.status)}</div></div>
        <p class="case-detail-intro">Review the complaint information and its current handling status below.</p>
      </section>
      <div class="case-detail-grid">
        ${ui.card("Case information", "Patient and complaint record", `<div class="card-body"><dl class="case-detail-fields"><div><dt>Patient</dt><dd>${esc(c.patient || "Not provided")}</dd></div><div><dt>Case ID</dt><dd>${esc(c.id)}</dd></div><div><dt>Received</dt><dd>${fmtTime(c.created)}</dd></div><div><dt>Priority</dt><dd>${ui.badge(c.priority)}</dd></div><div><dt>Status</dt><dd>${ui.badge(c.status)}</dd></div><div><dt>Assigned to</dt><dd>${esc(c.assigned || "Unassigned")}</dd></div></dl></div>`)}
        ${ui.card("Department", "Team responsible for this complaint", `<div class="card-body"><div class="case-related-record"><div><strong>${esc(c.department || "Not assigned")}</strong><span>${department ? `${Number(department.beds) || 0} beds · ${Number(department.staff) || 0} staff on department record` : "No matching department record is currently available."}</span></div>${department ? `<a class="case-related-link" href="departments.html?id=${encodeURIComponent(department.id)}">View department →</a>` : ""}</div></div>`)}
        ${ui.card("Complaint description", "Details provided with the report", `<div class="card-body">${description}</div>`)}
        ${ui.card("Case activity", "Available status information", `<div class="card-body">${timeline}<p class="case-demo-note">This frontend demo stores the current case record in this browser. It does not provide a server-side audit trail or emergency monitoring.</p></div>`)}
      </div>`;
  }

  function exportCase(id, format) {
    const complaint = store.data.complaints.find((item) => item.id === id);
    if (!complaint) {
      ui.toast("This case is no longer available to export.", "error");
      return;
    }
    const filenameId = complaint.id.replace(/[^A-Za-z0-9_-]/g, "-");
    if (format === "csv") {
      ui.exportCSV(`case-${filenameId}.csv`, [complaint]);
    } else if (format === "json") {
      ui.exportFile(`case-${filenameId}.json`, JSON.stringify(complaint, null, 2), "application/json");
    } else {
      ui.exportSVG(`case-${filenameId}.svg`, `Case ${complaint.id}`, [
        ["Patient", complaint.patient],
        ["Subject", complaint.subject],
        ["Department", complaint.department],
        ["Priority", complaint.priority],
        ["Status", complaint.status],
        ["Assigned to", complaint.assigned || "Unassigned"],
        ["Received", fmtTime(complaint.created)],
        ["Description", complaint.description || "No description provided"],
      ]);
    }
  }

  function notFound() {
    return `${ui.heading("Case not found", "This complaint may have been removed or the case link may be incorrect.", `<a class="btn" href="complaints.html">← All complaints</a>`)}<div class="card empty-state"><strong>No case details available</strong><p>Return to the complaints list to open an available case.</p></div>`;
  }

  function render(state, criticalOnly = false) {
    const caseId = new URLSearchParams(location.search).get("id");
    if (caseId) {
      const complaint = store.data.complaints.find((item) => item.id === caseId);
      return complaint ? detail(complaint, criticalOnly) : notFound();
    }

    let list = store.data.complaints;
    if (criticalOnly) list = list.filter((c) => c.priority === "Critical" && c.status !== "Resolved");

    const q = state.search.toLowerCase();
    const filtered = list.filter(
      (c) =>
        [c.id, c.patient, c.subject, c.department, c.assigned].join(" ").toLowerCase().includes(q) &&
        matchesFilter(state.filters.status, c.status) &&
        matchesFilter(state.filters.priority, c.priority)
    );

    const rows = filtered
      .map(
        (c) =>
          `<tr class="complaint-row" data-case-href="${esc(caseUrl(c.id, criticalOnly))}"><td><a class="case-id case-record-link" href="${esc(caseUrl(c.id, criticalOnly))}"><strong>${esc(c.id)}</strong></a><div class="case-date">${fmtDate(c.created)}</div></td><td><div class="primary-cell"><div class="cell-avatar avatar-teal">${initials(c.patient)}</div><div><a class="case-record-link case-person-link" href="${esc(caseUrl(c.id, criticalOnly))}"><strong>${esc(c.patient)}</strong><small>${esc(c.subject)}</small></a></div></div></td><td>${esc(c.department)}</td><td>${ui.badge(c.priority)}</td><td>${ui.badge(c.status)}</td><td>${esc(c.assigned || "Unassigned")}</td><td><div class="table-actions"><a class="table-action" href="${esc(caseUrl(c.id, criticalOnly))}">View case</a><button type="button" class="table-action" data-action="edit-complaint" data-id="${esc(c.id)}">Edit</button></div></td></tr>`
      )
      .join("");

    const filters = `<select class="select-field" id="filterPriority"><option value="all">All priorities</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select><select class="select-field" id="filterStatus"><option value="all">All status</option><option>Open</option><option>In progress</option><option>Resolved</option></select>`;

    const notice = criticalOnly
      ? `<div class="card priority-notice"><strong>Priority review</strong><p>This list shows critical complaints recorded in the workspace. It does not monitor patients or emergency systems in real time.</p></div>`
      : "";

    return `${ui.heading(
      criticalOnly ? "Critical cases" : "Complaints",
      criticalOnly ? "Review high-risk and urgent cases that still need attention." : "Track patient feedback, assign ownership and resolve issues.",
      ui.btn('<span class="plus">+</span> New complaint', "new-complaint", "btn btn-primary")
    )}${notice}${ui.metricStrip([
      ["Total cases", list.length, { clearFilters: true }],
      ["Open", list.filter((c) => c.status === "Open").length, { filters: { status: "Open" } }],
      ["In progress", list.filter((c) => c.status === "In progress").length, { filters: { status: "In progress" } }],
      ["Resolved", list.filter((c) => c.status === "Resolved").length, { filters: { status: "Resolved" } }],
    ])}${ui.tableShell(
      ui.searchToolbar(state.search, "Search case, patient, department…", filters),
      ["Case ID", "Patient / complaint", "Department", "Priority", "Status", "Assigned to", "Actions"],
      rows,
      ui.tableFooter(filtered.length, store.mode)
    )}`;
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const row = target.closest(".complaint-row");
    if (!row || target.closest("a,button,input,select,textarea")) return;
    location.href = row.dataset.caseHref;
  });

  ui.actions.on("export-case-csv", (el) => exportCase(el.dataset.id, "csv"));
  ui.actions.on("export-case-image", (el) => exportCase(el.dataset.id, "image"));
  ui.actions.on("export-case-json", (el) => exportCase(el.dataset.id, "json"));
  ui.actions.on("export-case-pdf", () => global.print());

  BHGS.complaintList = { render };
})(window);
