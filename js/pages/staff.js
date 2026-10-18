/* Doctors & Staff page. */
(function () {
  "use strict";

  const BHGS = window.BHGS;
  const { esc, initials, avatarFor } = BHGS.utils;
  const { store } = BHGS;
  const ui = BHGS.ui;

  const matches = (filter, value) => !filter || filter === "all" || filter === value;

  const staffUrl = (id) => `staff.html?id=${encodeURIComponent(id)}`;

  function roleGuidance(member) {
    const role = `${member.role} ${member.department}`.toLowerCase();
    if (/nurs/.test(role)) return ["Support day-to-day patient care in coordination with the clinical team.", "Help communicate care instructions and route patient concerns to the responsible clinician.", "Keep assigned shift handover and case information organised."];
    if (/lab|technician|pathology/.test(role)) return ["Support specimen and diagnostic-testing workflows within the assigned role.", "Route reports and result-related concerns to the responsible clinical team.", "Help track laboratory service requests and report delays."];
    if (/radiolog|imaging/.test(role)) return ["Coordinate imaging workflow and patient preparation within the assigned role.", "Route imaging reports to the requesting care team.", "Help track diagnostic-imaging requests and related service concerns."];
    if (/emergency|trauma/.test(role)) return ["Coordinate urgent case routing with the emergency care team.", "Support timely handovers and escalation of unresolved concerns.", "Keep case assignment and follow-up information up to date."];
    if (/cardio/.test(role)) return ["Support cardiovascular-care coordination within the assigned clinical role.", "Coordinate investigation and follow-up information with the care team.", "Route patient concerns and related cases to the appropriate owner."];
    if (/neuro/.test(role)) return ["Support neurology-care coordination within the assigned clinical role.", "Coordinate case information and follow-up with relevant teams.", "Route unresolved patient concerns to the appropriate owner."];
    if (/pediat|child/.test(role)) return ["Support child-health service coordination within the assigned clinical role.", "Help organise family communication and follow-up information.", "Coordinate referrals and unresolved concerns with the care team."];
    if (/ortho|surgeon/.test(role)) return ["Support specialty-care coordination within the assigned clinical role.", "Coordinate case handover and follow-up information with the care team.", "Route patient concerns to the appropriate clinical owner."];
    if (/physician|consultant|doctor|medical/.test(role)) return ["Coordinate patient-care information within the assigned professional role.", "Review assigned case concerns and coordinate appropriate follow-up.", "Communicate referrals and handovers with the relevant care team."];
    return ["Carry out responsibilities associated with the listed role and department.", "Coordinate case information and follow-up with the relevant team.", "Route patient or service concerns to the appropriate owner."];
  }

  function staffProfile(member) {
    const department = store.data.departments.find((item) => item.name === member.department);
    const cases = store.data.complaints.filter(
      (complaint) => complaint.assigned === member.name || complaint.department === member.department
    );
    const assignedCases = cases.filter((complaint) => complaint.assigned === member.name);
    const openCases = cases.filter((complaint) => complaint.status !== "Resolved");
    const resolvedCases = assignedCases.filter((complaint) => complaint.status === "Resolved").length;
    const pendingAssignedCases = assignedCases.filter((complaint) => complaint.status !== "Resolved");
    const departmentTeam = store.data.staff.filter((item) => item.department === member.department && item.id !== member.id);
    const duties = roleGuidance(member);
    const actions = `<a class="btn" href="staff.html">← All staff</a>${ui.exportMenu("staff", member.id)}${ui.btn("Edit profile", "edit-staff", "btn btn-primary", `data-id="${esc(member.id)}"`)}`;
    const contact = [
      `<div><dt>Email</dt><dd>${member.email ? `<a href="mailto:${esc(member.email)}">${esc(member.email)}</a>` : "Not provided"}</dd></div>`,
      `<div><dt>Phone</dt><dd>${member.phone ? `<a href="tel:${esc(member.phone)}">${esc(member.phone)}</a>` : "Not provided"}</dd></div>`,
    ].join("");
    const caseList = cases.length
      ? `<div class="staff-profile-cases">${cases
          .map((complaint) => `<a class="staff-profile-case" href="complaints.html?id=${encodeURIComponent(complaint.id)}"><span><strong>${esc(complaint.subject)}</strong><small>${esc(complaint.id)} · ${esc(complaint.patient)} · ${esc(complaint.assigned === member.name ? "Assigned to this staff member" : "Department case")}</small></span><span class="staff-case-badges">${ui.badge(complaint.priority)}${ui.badge(complaint.status)}</span></a>`)
          .join("")}</div>`
      : `<div class="empty-state"><strong>No complaint records found</strong><p>Cases assigned to this staff member or department will appear here.</p></div>`;
    const departmentCard = department
      ? `<div class="staff-profile-department"><div><strong>${esc(department.name)}</strong><span>${esc(department.description || "Department operations and patient services.")}</span><small>Head: ${esc(department.head || "Not assigned")} · ${Number(department.beds) || 0} beds · ${Number(department.staff) || 0} staff on department record</small><small>Department status: ${esc(department.status)} · ${departmentTeam.length} other staff profile${departmentTeam.length === 1 ? "" : "s"} linked</small></div><a href="departments.html?id=${encodeURIComponent(department.id)}">View department →</a></div>`
      : `<div class="empty-state"><strong>Department record unavailable</strong><p>No department currently matches ${esc(member.department || "this staff member's assignment")}.</p></div>`;
    const colleagues = departmentTeam.length
      ? `<div class="staff-profile-colleagues">${departmentTeam.map((person) => `<a href="${staffUrl(person.id)}"><span><strong>${esc(person.name)}</strong><small>${esc(person.role)} · ${esc(person.shift)} shift</small></span>${ui.badge(person.status)}</a>`).join("")}</div>`
      : `<div class="staff-profile-note">No other staff profiles are linked to this department in the current workspace data.</div>`;
    const workload = `<div class="staff-profile-workload"><div><span>Assigned cases</span><strong>${assignedCases.length}</strong></div><div><span>Assigned and unresolved</span><strong>${pendingAssignedCases.length}</strong></div><div><span>Assigned and resolved</span><strong>${resolvedCases}</strong></div><div><span>Open cases in department</span><strong>${openCases}</strong></div></div>`;

    return `${ui.heading(esc(member.name), "Full staff profile and assignment information.", actions)}
      <section class="card staff-profile-hero">
        <div class="staff-profile-heading"><div class="cell-avatar ${avatarFor(member.id)}">${initials(member.name)}</div><div><span class="eyebrow">STAFF PROFILE · ${esc(member.id)}</span><h2>${esc(member.name)}</h2><p>${esc(member.role || "Role not specified")} · ${esc(member.department || "No department assigned")}</p></div>${ui.badge(member.status)}</div>
        <div class="staff-profile-summary"><div><strong>${esc(member.shift || "Not specified")}</strong><span>Recorded shift · hours not specified</span></div><div><strong>${assignedCases.length}</strong><span>Cases assigned by name</span></div><div><strong>${pendingAssignedCases.length}</strong><span>Assigned cases unresolved</span></div><div><strong>${cases.length}</strong><span>Related department cases</span></div></div>
      </section>
      <div class="staff-profile-grid">
        ${ui.card("Professional profile", "Role and contact details recorded in this demo", `<div class="card-body"><dl class="staff-profile-fields"><div><dt>Staff ID</dt><dd>${esc(member.id)}</dd></div><div><dt>Full name</dt><dd>${esc(member.name || "Not provided")}</dd></div><div><dt>Role / designation</dt><dd>${esc(member.role || "Not provided")}</dd></div><div><dt>Department</dt><dd>${esc(member.department || "Not assigned")}</dd></div><div><dt>Shift</dt><dd>${esc(member.shift || "Not specified")} · hours not recorded</dd></div><div><dt>Employment status</dt><dd>${ui.badge(member.status)}</dd></div>${contact}<div><dt>Qualifications / licence</dt><dd>Not included in this demo record</dd></div></dl><p class="staff-profile-note">Only fields recorded for this demo profile are shown. Qualifications, licence details and employment history have not been provided.</p></div>`)}
        ${ui.card("Role responsibilities", "Illustrative work areas based on the listed role", `<div class="card-body"><ul class="staff-role-duties">${duties.map((duty) => `<li>${esc(duty)}</li>`).join("")}</ul><p class="staff-profile-note">Demo guidance only; responsibilities vary by facility, credentials and assigned scope of practice. This is not clinical advice or a verified job description.</p></div>`)}
        ${ui.card("Department assignment", "Current department and capacity", `<div class="card-body">${departmentCard}</div>`)}
        ${ui.card("Department colleagues", `${departmentTeam.length} other staff profile${departmentTeam.length === 1 ? "" : "s"} linked to this department`, `<div class="card-body">${colleagues}<a class="staff-profile-link" href="staff.html">Open full staff directory →</a></div>`)}
        ${ui.card("Assigned case workload", "Counts use the case assignee name recorded in the demo", `<div class="card-body">${workload}<p class="staff-profile-note">Department cases not assigned to this person are listed separately under related complaints; they are not counted as personally assigned.</p></div>`)}
        ${ui.card("Related complaints", `${cases.length} department case${cases.length === 1 ? "" : "s"} · ${assignedCases.length} assigned to this staff member`, `<div class="card-body">${caseList}<a class="staff-profile-link" href="complaints.html">Open complaints →</a></div>`)}
      </div>`;
  }

  function notFound() {
    return `${ui.heading("Staff member not found", "This profile may have been removed or the link may be incorrect.", `<a class="btn" href="staff.html">← All staff</a>`)}<div class="card empty-state"><strong>No staff profile available</strong><p>Return to the staff directory to choose an available profile.</p></div>`;
  }

  function view(state) {
    const staffId = new URLSearchParams(location.search).get("id");
    if (staffId) {
      const member = store.data.staff.find((item) => item.id === staffId);
      return member ? staffProfile(member) : notFound();
    }

    const staff = store.data.staff;
    const q = state.search.toLowerCase();
    const filtered = staff.filter(
      (s) =>
        [s.name, s.role, s.department, s.email, s.id].join(" ").toLowerCase().includes(q) &&
        matches(state.filters.status, s.status) &&
        matches(state.filters.department, s.department)
    );

    const rows = filtered
      .map(
        (s) =>
          `<tr class="staff-row" data-staff-href="${esc(staffUrl(s.id))}"><td><div class="primary-cell"><div class="cell-avatar ${avatarFor(s.id)}">${initials(s.name)}</div><div><a class="staff-profile-name" href="${esc(staffUrl(s.id))}"><strong>${esc(s.name)}</strong><small>${esc(s.id)}</small></a></div></div></td><td>${esc(s.role)}</td><td>${esc(s.department)}</td><td>${esc(s.email)}</td><td>${esc(s.shift)}</td><td>${ui.badge(s.status)}</td><td><div class="table-actions"><a class="table-action" href="${esc(staffUrl(s.id))}">View profile</a><button type="button" class="table-action" data-action="edit-staff" data-id="${esc(s.id)}">Edit</button><button type="button" class="table-action" data-action="delete-staff" data-id="${esc(s.id)}" aria-label="Delete staff">⋯</button></div></td></tr>`
      )
      .join("");

    const deptOptions = store.data.departments.map((x) => `<option>${esc(x.name)}</option>`).join("");
    const filters = `<select class="select-field" id="filterDepartment"><option value="all">All departments</option>${deptOptions}</select><select class="select-field" id="filterStatus"><option value="all">All status</option><option>Active</option><option>Inactive</option></select>`;

    return `${ui.heading("Doctors & Staff", "Manage staff profiles, roles, departments and shift assignments.", ui.btn('<span class="plus">+</span> Add staff member', "add-staff", "btn btn-primary"))}${ui.metricStrip([
      ["Total staff", staff.length, { clearFilters: true }],
      ["Active", staff.filter((s) => s.status === "Active").length, { filters: { status: "Active" } }],
      ["Inactive", staff.filter((s) => s.status === "Inactive").length, { filters: { status: "Inactive" } }],
      ["Departments covered", new Set(staff.map((s) => s.department)).size, { page: "departments" }],
    ])}${ui.tableShell(
      ui.searchToolbar(state.search, "Search name, role, email…", filters),
      ["Staff member", "Role", "Department", "Email", "Shift", "Status", "Actions"],
      rows,
      ui.tableFooter(filtered.length, store.mode)
    )}`;
  }

  const page = BHGS.createPage({
    render: view,
    afterRender: () => {
      const id = new URLSearchParams(location.search).get("id");
      const member = store.data.staff.find((item) => item.id === id);
      document.title = member
        ? `${member.name} · Staff profile · Bihar Healthcare Grievance System`
        : "Doctors & Staff · Bihar Healthcare Grievance System";
    },
  });

  function exportStaff(el, format) {
    const member = store.data.staff.find((item) => item.id === el.dataset.id);
    if (!member) {
      ui.toast("This staff profile is no longer available to export.", "error");
      return;
    }
    const filenameId = member.id.replace(/[^A-Za-z0-9_-]/g, "-");
    if (format === "csv") {
      ui.exportCSV(`staff-${filenameId}.csv`, [member]);
    } else if (format === "json") {
      ui.exportFile(`staff-${filenameId}.json`, JSON.stringify(member, null, 2), "application/json");
    } else {
      ui.exportSVG(`staff-${filenameId}.svg`, member.name, [
        ["Staff ID", member.id],
        ["Name", member.name],
        ["Role / designation", member.role],
        ["Department", member.department],
        ["Email", member.email],
        ["Phone", member.phone || "Not provided"],
        ["Shift", member.shift],
        ["Status", member.status],
        ["Department head", (store.data.departments.find((item) => item.name === member.department) || {}).head || "Not available"],
        ["Assigned cases", store.data.complaints.filter((complaint) => complaint.assigned === member.name).length],
      ]);
    }
  }

  ui.actions.on("export-staff-pdf", () => window.print());
  ui.actions.on("export-staff-csv", (el) => exportStaff(el, "csv"));
  ui.actions.on("export-staff-image", (el) => exportStaff(el, "image"));
  ui.actions.on("export-staff-json", (el) => exportStaff(el, "json"));

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const row = target.closest(".staff-row");
    if (!row || target.closest("a,button,input,select,textarea")) return;
    location.href = row.dataset.staffHref;
  });

  BHGS.layout.init();
  page.paint();
})();
