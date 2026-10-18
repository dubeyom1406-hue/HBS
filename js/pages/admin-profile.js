/* Operations Admin profile and hospital oversight summary. */
(function () {
  "use strict";

  const BHGS = window.BHGS;
  const { esc, relative } = BHGS.utils;
  const { store } = BHGS;
  const ui = BHGS.ui;

  function view() {
    const data = store.data;
    const localMode = store.mode === "local";
    const hospital = data.hospital;
    const openCases = data.complaints.filter((caseRecord) => caseRecord.status !== "Resolved");
    const criticalCases = openCases.filter((caseRecord) => caseRecord.priority === "Critical");
    const activeStaff = data.staff.filter((member) => member.status === "Active");
    const unread = data.notifications.filter((notice) => !notice.read);
    const recentAudit = data.audit.slice(0, 5);
    const departments = data.departments
      .map((department) => {
        const deptCases = data.complaints.filter((caseRecord) => caseRecord.department === department.name);
        const unresolved = deptCases.filter((caseRecord) => caseRecord.status !== "Resolved").length;
        const deptStaff = data.staff.filter((member) => member.department === department.name && member.status === "Active").length;
        return `<a class="admin-department-row" href="departments.html?id=${encodeURIComponent(department.id)}"><span><strong>${esc(department.name)}</strong><small>${esc(department.head || "Department head not assigned")}</small></span><span>${deptStaff} active profile${deptStaff === 1 ? "" : "s"}</span><span>${unresolved} open case${unresolved === 1 ? "" : "s"}</span></a>`;
      })
      .join("");
    const caseRows = openCases
      .slice()
      .sort((a, b) => BHGS.utils.priorityScore(b.priority) - BHGS.utils.priorityScore(a.priority))
      .slice(0, 5)
      .map((caseRecord) => `<a class="admin-case-row" href="complaints.html?id=${encodeURIComponent(caseRecord.id)}"><span><strong>${esc(caseRecord.subject)}</strong><small>${esc(caseRecord.id)} · ${esc(caseRecord.department)} · ${esc(caseRecord.patient)}</small></span><span class="admin-case-status">${ui.badge(caseRecord.priority)}${ui.badge(caseRecord.status)}</span></a>`)
      .join("");
    const activity = recentAudit.length
      ? recentAudit
          .map((entry) => ui.activityRow("↗", "icon-purple", esc(entry.action), esc(entry.detail), relative(entry.time)))
          .join("")
      : '<div class="empty-state"><strong>No activity recorded</strong><p>Workspace activity will appear here.</p></div>';
    const departmentRows = departments || '<div class="empty-state"><strong>No departments configured</strong><p>Add departments from the Departments page.</p></div>';
    const caseContent = caseRows || '<div class="empty-state"><strong>No open cases</strong><p>There are no unresolved complaints in the current workspace.</p></div>';

    return `${ui.heading("Operations Admin", "Profile and live overview of the hospital workspace you oversee.", ui.btn("Edit hospital details", "navigate", "btn btn-primary", 'data-page="settings"'))}
      <section class="card admin-profile-hero">
        <div class="admin-profile-identity"><div class="avatar avatar-indigo admin-profile-avatar">OD</div><div><span class="eyebrow">WORKSPACE ADMINISTRATOR</span><h2>Operations Admin</h2><p>Hospital workspace oversight across departments, staff, complaints and reports.</p></div><span class="status status-progress">Workspace profile</span></div>
        <div class="admin-hospital-details"><div><span>Hospital / workspace</span><strong>${esc(hospital.name)}</strong></div><div><span>Location</span><strong>${esc([hospital.district, hospital.state].filter(Boolean).join(", ") || "Not configured")}</strong></div><div><span>Workspace contact email</span><strong>${hospital.email ? `<a href="mailto:${esc(hospital.email)}">${esc(hospital.email)}</a>` : "Not configured"}</strong></div><div><span>Workspace contact phone</span><strong>${hospital.phone ? `<a href="tel:${esc(hospital.phone)}">${esc(hospital.phone)}</a>` : "Not configured"}</strong></div><div><span>Complaint SLA setting</span><strong>${Number(data.settings.slaHours || hospital.slaHours) || 24} hours</strong></div><div><span>Data storage</span><strong>${localMode ? "This browser (demo)" : "Connected backend API"}</strong></div></div>
        <p class="admin-profile-note">Administrator identity is a frontend placeholder; this page does not yet load a signed-in user's profile. Update hospital contact and SLA details in Settings.</p>
      </section>
      <div class="admin-oversight-stats">
        <a href="departments.html"><strong>${data.departments.length}</strong><span>Departments managed</span></a>
        <a href="staff.html"><strong>${activeStaff.length} / ${data.staff.length}</strong><span>Active / total staff profiles</span></a>
        <a href="complaints.html"><strong>${openCases.length}</strong><span>Unresolved complaints</span></a>
        <a href="critical-cases.html"><strong>${criticalCases.length}</strong><span>Critical cases to review</span></a>
      </div>
      <div class="admin-profile-grid">
        ${ui.card("Departments under oversight", "Department heads, active profiles and open case counts", `<div class="card-body"><div class="admin-department-list">${departmentRows}</div><a class="admin-section-link" href="departments.html">Manage departments →</a></div>`)}
        ${ui.card("Open cases needing oversight", `${openCases.length} unresolved · ${criticalCases.length} critical`, `<div class="card-body"><div class="admin-case-list">${caseContent}</div><a class="admin-section-link" href="complaints.html">Review all complaints →</a></div>`)}
        ${ui.card("Recent workspace activity", localMode ? "Latest activity recorded in this browser" : "Latest activity recorded in the connected workspace", `<div class="card-body"><div class="activity-list">${activity}</div><a class="admin-section-link" href="activity-log.html">Open activity log →</a></div>`)}
        ${ui.card("Workspace responsibilities", "Common hospital workspace administration tasks", `<div class="card-body"><ul class="admin-responsibilities"><li>Monitor complaint queues and follow up on unresolved cases.</li><li>Review critical cases and coordinate the appropriate department handoff.</li><li>Keep staff assignments and department records organised.</li><li>Review activity and export a workspace backup when needed.</li></ul><div class="admin-quick-links"><a href="notifications.html">Notifications (${unread.length} unread)</a><a href="reports.html">Reports &amp; analytics</a><a href="settings.html">Hospital settings &amp; data</a></div><p class="admin-profile-note">Operational access, emergency response and patient-care oversight depend on the backend, authorized staff and hospital procedures.</p></div>`)}
      </div>`;
  }

  const page = BHGS.createPage({ render: view });
  BHGS.layout.init();
  page.paint();
})();
