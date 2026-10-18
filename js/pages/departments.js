/* Departments page. */
(function () {
  "use strict";

  const BHGS = window.BHGS;
  const { esc, colorClass } = BHGS.utils;
  const { store } = BHGS;
  const ui = BHGS.ui;

  const responsibilities = {
    Cardiology: ["Assess heart and circulation concerns.", "Coordinate cardiac investigations and treatment plans.", "Support follow-up for ongoing cardiovascular care.", "Coordinate referrals and information sharing with other clinical teams.", "Keep relevant case notes and patient-care follow-up information organised."],
    Emergency: ["Triage urgent cases and assess immediate risk.", "Coordinate prompt stabilisation and emergency treatment.", "Escalate cases to the appropriate specialist team.", "Coordinate handover information when care moves between teams.", "Track urgent complaints and route them to the appropriate owner."],
    Neurology: ["Assess conditions affecting the brain, spine and nervous system.", "Coordinate neurological investigations and care plans.", "Support follow-up and rehabilitation referrals.", "Coordinate care plans with relevant specialist and support teams.", "Maintain clear case notes and route patient concerns for review."],
    Pediatrics: ["Provide care for infants, children and adolescents.", "Support growth, prevention and routine child-health needs.", "Guide families through treatment and follow-up plans.", "Coordinate age-appropriate referrals and continuity of care.", "Communicate care-plan and follow-up information with families."],
    Orthopedics: ["Assess bone, joint and musculoskeletal concerns.", "Coordinate care for injuries and mobility conditions.", "Support recovery planning and rehabilitation referrals.", "Coordinate follow-up with relevant clinical and rehabilitation teams.", "Track patient concerns related to mobility and continuity of care."],
    Radiology: ["Coordinate diagnostic imaging requests and patient preparation.", "Review imaging findings with the requesting clinical teams.", "Support timely reporting and follow-up of imaging results.", "Coordinate imaging workflow and route reports to the responsible team.", "Help track delays or service concerns related to diagnostic imaging."],
    "General Medicine": ["Assess common and complex adult health concerns.", "Coordinate diagnosis, treatment and ongoing-care plans.", "Refer patients to specialist teams when needed.", "Coordinate follow-up for ongoing care and common health concerns.", "Keep patient concerns and referrals organised across the care team."],
    Pathology: ["Coordinate laboratory specimen handling and testing.", "Record and route diagnostic results to the care team.", "Escalate time-sensitive findings for clinical follow-up.", "Track laboratory workflow and diagnostic-report delays.", "Coordinate result-related follow-up with the requesting team."],
  };

  const departmentUrl = (id) => `departments.html?id=${encodeURIComponent(id)}`;

  function departmentCard(x) {
    return `<article class="card department-card"><a class="department-card-content" href="${esc(departmentUrl(x.id))}" aria-label="View ${esc(x.name)} department details"><div class="department-card-top"><div class="dept-tile-icon ${colorClass(x.color)}">${ui.deptIcon(x)}</div>${ui.badge(x.status)}</div><h3>${esc(x.name)}</h3><p>${esc(x.description || "Department operations and patient services.")}</p><div class="department-head">Department head <strong>${esc(x.head || "Not assigned")}</strong></div><div class="department-meta"><span><strong>${Number(x.beds) || 0}</strong> beds</span><span><strong>${Number(x.staff) || 0}</strong> staff</span><span>${esc(x.id)}</span></div><span class="department-view-link">View department details <span aria-hidden="true">→</span></span></a><div class="department-actions">${ui.btn("Edit", "edit-department", "btn btn-sm", `data-id="${esc(x.id)}"`)}${ui.btn("Delete", "delete-department", "btn btn-sm btn-ghost", `data-id="${esc(x.id)}"`)}</div></article>`;
  }

  function departmentDetails(x) {
    const team = store.data.staff.filter((member) => member.department === x.name);
    const activeTeam = team.filter((member) => member.status === "Active").length;
    const inactiveTeam = team.length - activeTeam;
    const cases = store.data.complaints.filter((complaint) => complaint.department === x.name);
    const openCases = cases.filter((complaint) => complaint.status !== "Resolved").length;
    const inProgressCases = cases.filter((complaint) => complaint.status === "In progress").length;
    const resolvedCases = cases.filter((complaint) => complaint.status === "Resolved").length;
    const criticalCases = cases.filter((complaint) => complaint.priority === "Critical" && complaint.status !== "Resolved").length;
    const duties = responsibilities[x.name] || [
      x.description || "Coordinate department services and patient care.",
      "Work with the care team to plan treatment and follow-up.",
      "Escalate urgent concerns through the appropriate clinical workflow.",
    ];
    const teamContent = team.length
      ? `<div class="department-detail-list">${team
          .map((member) => `<a class="department-detail-row department-staff-link" href="staff.html?id=${encodeURIComponent(member.id)}"><div><strong>${esc(member.name)}</strong><span>${esc(member.role)} · ${esc(member.shift)} shift</span></div>${ui.badge(member.status)}</a>`)
          .join("")}</div>`
      : `<div class="empty-state"><strong>No staff records listed</strong><p>Add a staff member and assign them to this department to see them here.</p></div>`;
    const caseContent = cases.length
      ? `<div class="department-detail-list">${cases
          .map((complaint) => `<a class="department-detail-row department-case-link" href="complaints.html?id=${encodeURIComponent(complaint.id)}"><div><strong>${esc(complaint.subject)}</strong><span>${esc(complaint.id)} · ${esc(complaint.patient)}</span></div><div class="department-case-status">${ui.badge(complaint.priority)}${ui.badge(complaint.status)}</div></a>`)
          .join("")}</div>`
      : `<div class="empty-state"><strong>No complaints for this department</strong><p>New complaints assigned to ${esc(x.name)} will appear here.</p></div>`;
    const actions = `<a class="btn" href="departments.html">← All departments</a>${ui.btn("Edit department", "edit-department", "btn btn-primary", `data-id="${esc(x.id)}"`)}`;

    return `${ui.heading(esc(x.name), esc(x.description || "Department operations and patient services."), actions)}
      <div class="department-detail-summary card">
        <div class="department-detail-heading"><div class="dept-tile-icon ${colorClass(x.color)}">${ui.deptIcon(x)}</div><div><span class="eyebrow">DEPARTMENT PROFILE · ${esc(x.id)}</span><h2>${esc(x.name)}</h2><p>${esc(x.description || "Department operations and patient services.")}</p></div>${ui.badge(x.status)}</div>
        <div class="department-detail-metrics"><div><strong>${Number(x.beds) || 0}</strong><span>Beds on department record</span></div><div><strong>${Number(x.staff) || 0}</strong><span>Staff on department record</span></div><div><strong>${activeTeam}</strong><span>Active staff profiles listed</span></div><div><strong>${openCases}</strong><span>Open department complaints</span></div></div>
        <div class="department-detail-head">Department head <strong>${esc(x.head || "Not assigned")}</strong></div>
      </div>
      <div class="department-detail-grid">
        ${ui.card("Services & responsibilities", "Typical service scope and coordination work", `<div class="card-body"><p class="department-detail-description">${esc(x.description || "Department operations and patient services.")}</p><ul class="department-duty-list">${duties.map((duty) => `<li>${esc(duty)}</li>`).join("")}</ul><p class="department-demo-note">Illustrative demo guidance only. This is not an official service catalogue or clinical protocol; actual services depend on the facility and qualified care team.</p></div>`)}
        ${ui.card("Department team", `${team.length} staff profile${team.length === 1 ? "" : "s"} linked in this browser`, `<div class="card-body"><div class="department-team-summary"><span><strong>${activeTeam}</strong> active profile${activeTeam === 1 ? "" : "s"}</span><span><strong>${inactiveTeam}</strong> inactive profile${inactiveTeam === 1 ? "" : "s"}</span><span><strong>${Number(x.staff) || 0}</strong> staff on department record</span></div>${teamContent}<a class="department-section-link" href="staff.html">Open staff directory →</a></div>`)}
        ${ui.card("Complaint activity", `${cases.length} total complaint${cases.length === 1 ? "" : "s"} linked to this department`, `<div class="card-body"><div class="department-case-summary"><span><strong>${openCases}</strong> open</span><span><strong>${inProgressCases}</strong> in progress</span><span><strong>${resolvedCases}</strong> resolved</span><span><strong>${criticalCases}</strong> critical and unresolved</span></div>${caseContent}<a class="department-section-link" href="complaints.html">Open complaint list →</a></div>`)}
      </div>`;
  }

  function notFound() {
    return `${ui.heading("Department not found", "This department may have been removed or the link may be incorrect.", `<a class="btn" href="departments.html">← All departments</a>`)}<div class="card empty-state"><strong>No department details available</strong><p>Return to the departments list to choose an available department.</p></div>`;
  }

  function view(state) {
    const selectedId = new URLSearchParams(location.search).get("id");
    if (selectedId) {
      const selected = store.data.departments.find((department) => department.id === selectedId);
      return selected ? departmentDetails(selected) : notFound();
    }

    const q = state.search.toLowerCase();
    const filtered = store.data.departments.filter((x) => [x.name, x.head, x.id, x.description].join(" ").toLowerCase().includes(q));

    return `${ui.heading("Departments", "Organize clinical departments, department heads and available capacity.", ui.btn('<span class="plus">+</span> Add department', "add-department", "btn btn-primary"))}<div class="toolbar departments-toolbar"><div class="toolbar-left"><label class="searchbox"><span>⌕</span><input class="field" id="tableSearch" placeholder="Search departments…" value="${esc(state.search)}" maxlength="100" autocomplete="off"></label><span class="muted departments-count">${filtered.length} departments</span></div><div class="toolbar-right">${ui.btn("↻ Reset", "reset-table", "btn btn-ghost btn-sm")}</div></div><div class="department-grid">${
      filtered.map(departmentCard).join("") || `<div class="card empty-state"><strong>No departments found</strong><p>Try a different search term.</p></div>`
    }</div>`;
  }

  function updatePageTitle() {
    const selectedId = new URLSearchParams(location.search).get("id");
    const selected = store.data.departments.find((department) => department.id === selectedId);
    document.title = selected
      ? `${selected.name} · Department details · Bihar Healthcare Grievance System`
      : "Departments · Bihar Healthcare Grievance System";
  }

  const page = BHGS.createPage({ render: view, afterRender: updatePageTitle });
  BHGS.layout.init();
  page.paint();
})();
