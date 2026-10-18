/*
 * records.js — create / edit / delete for departments, staff and complaints,
 * plus the audit log and in-app notifications. Shared because the
 * "New complaint" button lives in the top bar of every page.
 */
(function (global) {
  "use strict";

  const BHGS = (global.BHGS = global.BHGS || {});
  const { $, esc, fmtDate } = BHGS.utils;
  const { store } = BHGS;
  const ui = BHGS.ui;

  const KINDS = {
    staff: { list: "staff", prefix: "ST-", start: 1001, pad: 0, label: "Staff member" },
    department: { list: "departments", prefix: "D-", start: 1, pad: 3, label: "Department" },
    complaint: { list: "complaints", prefix: "CG-", start: 2401, pad: 0, label: "Complaint" },
  };

  const recordName = (r, fallback = "A record") => r.name || r.subject || r.patient || fallback;
  const listOf = (kind) => store.data[KINDS[kind].list];
  const getRecord = (kind, id) => listOf(kind).find((x) => x.id === id);

  /* ---------- audit log + notifications ---------- */
  function log(action, detail, type = "activity") {
    store.data.audit.unshift({
      id: store.nextId(store.data.audit, "A-", 1001),
      action, detail, user: "Operations Admin", time: new Date().toISOString(), type,
    });
    store.data.audit = store.data.audit.slice(0, 250);
  }

  function notify(title, message, type = "info") {
    if (!store.data.settings.notifications) return;
    store.data.notifications.unshift({
      id: store.nextId(store.data.notifications, "N-", 1, 3),
      title, message, type, time: "Just now", read: false,
    });
    store.data.notifications = store.data.notifications.slice(0, 500);
  }

  /* ---------- form building ---------- */
  function field(label, name, value = "", type = "text", required = false, options = null, full = false) {
    const id = `record-${name}`;
    let control;
    if (options) {
      control = `<select class="select-field" id="${esc(id)}" name="${esc(name)}" ${required ? "required" : ""} style="width:100%">${options
        .map((o) => {
          const v = o.value ?? o;
          return `<option ${String(v) === String(value) ? "selected" : ""} value="${esc(v)}">${esc(o.label ?? o)}</option>`;
        })
        .join("")}</select>`;
    } else if (type === "textarea") {
      control = `<textarea class="textarea-field" id="${esc(id)}" name="${esc(name)}" ${required ? "required" : ""} maxlength="2000">${esc(value)}</textarea>`;
    } else {
      const limits = type === "number" ? 'min="0" max="5000"' : `maxlength="${name === "email" ? 120 : name === "description" ? 300 : 80}"`;
      control = `<input class="field" id="${esc(id)}" name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" ${required ? "required" : ""} ${limits}>`;
    }
    return `<div class="form-group ${full ? "full-span" : ""}"><label class="form-label" for="${esc(id)}">${label}</label>${control}</div>`;
  }

  function formModal(kind, record = {}) {
    const editing = Boolean(record.id);
    const d = store.data;
    const deptNames = d.departments.map((x) => x.name);
    const E = store.enums;
    let body = "";
    let title = "";
    let submit = "";

    if (kind === "staff") {
      title = editing ? "Edit staff member" : "Add staff member";
      submit = "save-staff";
      body = [
        field("Full name", "name", record.name || "", "text", true),
        field("Role / designation", "role", record.role || "", "text", true),
        field("Department", "department", record.department || deptNames[0] || "", "text", true, deptNames),
        field("Shift", "shift", record.shift || "Morning", "text", true, E.shift),
        field("Email", "email", record.email || "", "email", true),
        field("Phone", "phone", record.phone || "", "tel", false),
        field("Status", "status", record.status || "Active", "text", true, E.activeStatus),
      ].join("");
    } else if (kind === "department") {
      title = editing ? "Edit department" : "Add department";
      submit = "save-department";
      body = [
        field("Department name", "name", record.name || "", "text", true),
        field("Department head", "head", record.head || "", "text", true),
        field("Available beds", "beds", record.beds ?? 0, "number", true),
        field("Staff count", "staff", record.staff ?? 0, "number", true),
        field("Status", "status", record.status || "Active", "text", true, E.activeStatus),
        field("Icon (one symbol)", "icon", record.icon || "✚", "text", false),
        field("Description", "description", record.description || "", "text", false, null, true),
      ].join("");
    } else {
      title = editing ? "Update complaint" : "Create new complaint";
      submit = "save-complaint";
      const people = [{ value: "Unassigned", label: "Unassigned" }, ...d.staff.map((s) => ({ value: s.name, label: s.name }))];
      body = [
        field("Patient name", "patient", record.patient || "", "text", true),
        field("Complaint subject", "subject", record.subject || "", "text", true),
        field("Department", "department", record.department || deptNames[0] || "", "text", true, deptNames),
        field("Priority", "priority", record.priority || "Medium", "text", true, E.priority),
        field("Status", "status", record.status || "Open", "text", true, E.complaintStatus),
        field("Assigned to", "assigned", record.assigned || "Unassigned", "text", false, people),
        field("Description", "description", record.description || "", "textarea", false, null, true),
      ].join("");
    }

    ui.openModal(
      title,
      kind.toUpperCase(),
      `<form id="recordForm" data-kind="${esc(kind)}" data-id="${esc(record.id || "")}" novalidate><div class="modal-form-grid">${body}</div></form>`,
      `<button type="button" class="btn" data-action="close-modal">Cancel</button><button type="button" class="btn btn-primary" data-action="${submit}">${editing ? "Save changes" : "Create record"}</button>`
    );
  }

  /* ---------- validation ---------- */
  const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  const PHONE = /^[0-9+()\-\s]{0,30}$/;
  const clip = (v, max) => String(v ?? "").trim().slice(0, max);
  const whole = (v, max) => Math.min(max, Math.max(0, Math.round(Number(v)) || 0));

  /** Returns { value } with a clean record, or { error } with a message for the user. */
  function validate(kind, raw) {
    const d = store.data;
    const E = store.enums;
    const inList = (v, list) => list.includes(v);
    if (kind === "staff") {
      const v = {
        name: clip(raw.name, 80), role: clip(raw.role, 80), department: clip(raw.department, 80),
        shift: clip(raw.shift, 20), email: clip(raw.email, 120), phone: clip(raw.phone, 30), status: clip(raw.status, 20),
      };
      if (!v.name || !v.role) return { error: "Name and role are required." };
      if (!EMAIL.test(v.email)) return { error: "Please enter a valid email address." };
      if (!PHONE.test(v.phone)) return { error: "Phone may contain only digits, spaces, + ( ) and -." };
      if (!d.departments.some((x) => x.name === v.department)) return { error: "Please choose an existing department." };
      if (!inList(v.shift, E.shift) || !inList(v.status, E.activeStatus)) return { error: "Invalid shift or status." };
      return { value: v };
    }
    if (kind === "department") {
      const v = {
        name: clip(raw.name, 80), head: clip(raw.head, 80), beds: whole(raw.beds, 5000), staff: whole(raw.staff, 5000),
        status: clip(raw.status, 20), icon: clip(raw.icon, 4) || "✚", description: clip(raw.description, 300),
      };
      if (!v.name || !v.head) return { error: "Department name and head are required." };
      if (!inList(v.status, E.activeStatus)) return { error: "Invalid status." };
      const clash = d.departments.some((x) => x.name.toLowerCase() === v.name.toLowerCase() && x.id !== raw.__id);
      if (clash) return { error: "A department with this name already exists." };
      return { value: v };
    }
    const v = {
      patient: clip(raw.patient, 80), subject: clip(raw.subject, 120), department: clip(raw.department, 80),
      priority: clip(raw.priority, 20), status: clip(raw.status, 20), assigned: clip(raw.assigned, 80) || "Unassigned",
      description: clip(raw.description, 2000),
    };
    if (!v.patient || !v.subject) return { error: "Patient name and subject are required." };
    if (!d.departments.some((x) => x.name === v.department)) return { error: "Please choose an existing department." };
    if (!inList(v.priority, E.priority) || !inList(v.status, E.complaintStatus)) return { error: "Invalid priority or status." };
    if (v.assigned !== "Unassigned" && !d.staff.some((s) => s.name === v.assigned)) return { error: "Please choose an existing staff member." };
    return { value: v };
  }

  /* ---------- save / delete ---------- */
  async function saveRecord(kind) {
    const form = $("#recordForm");
    if (!form || !form.reportValidity()) return;
    const raw = Object.fromEntries(new FormData(form).entries());
    const id = form.dataset.id;
    raw.__id = id;
    const { value, error } = validate(kind, raw);
    if (error) return ui.toast(error, "error");

    const cfg = KINDS[kind];
    const list = store.data[cfg.list];

    if (id) {
      const index = list.findIndex((x) => x.id === id);
      if (index < 0) return;
      const before = list[index];
      list[index] = { ...before, ...value };
      if (kind === "complaint") {
        list[index].resolvedAt = value.status === "Resolved"
          ? before.status === "Resolved" ? before.resolvedAt || "" : new Date().toISOString()
          : "";
      }
      cascadeRename(kind, before, list[index]);
      log(`${kind} updated`, `${recordName(list[index], id)} updated`);
    } else {
      const record = { id: store.nextId(list, cfg.prefix, cfg.start, cfg.pad), ...value };
      if (kind === "complaint") {
        record.created = new Date().toISOString();
        record.resolvedAt = record.status === "Resolved" ? record.created : "";
      }
      if (kind === "department") record.color = store.enums.color[list.length % 4];
      list.unshift(record);
      log(`${kind} created`, `${recordName(record, record.id)} created`);
      notify("New record created", `${recordName(record)} was added to the workspace.`, "info");
      if (kind === "complaint" && record.priority === "Critical" && store.data.settings.criticalAlerts) {
        notify("Critical complaint requires review", `${record.id} — ${record.subject} has been marked Critical.`, "critical");
      }
    }

    if (!(await store.save())) {
      BHGS.hooks.refresh();
      return;
    }
    ui.closeModal();
    BHGS.layout.updateCounts();
    BHGS.hooks.refresh();
    ui.toast(id ? "Changes saved" : "Record created successfully");
  }

  /** Keeps references consistent when a department or staff member is renamed. */
  function cascadeRename(kind, before, after) {
    if (before.name === after.name) return;
    if (kind === "department") {
      store.data.staff.forEach((s) => { if (s.department === before.name) s.department = after.name; });
      store.data.complaints.forEach((c) => { if (c.department === before.name) c.department = after.name; });
    }
    if (kind === "staff") {
      store.data.complaints.forEach((c) => { if (c.assigned === before.name) c.assigned = after.name; });
    }
  }

  function removeRecord(kind, id) {
    const record = getRecord(kind, id);
    if (!record) return;
    if (kind === "department" && store.data.staff.some((s) => s.department === record.name)) {
      return ui.toast("Reassign staff from this department before deleting it", "error");
    }
    if (kind === "department" && store.data.complaints.some((c) => c.department === record.name)) {
      return ui.toast("Reassign or remove complaints from this department before deleting it", "error");
    }
    ui.confirmModal(
      "Delete this record?",
      `This will permanently remove <strong>${esc(recordName(record, id))}</strong> from the workspace.`,
      async () => {
        const key = KINDS[kind].list;
        store.data[key] = store.data[key].filter((x) => x.id !== id);
        if (kind === "staff") store.data.complaints.forEach((c) => { if (c.assigned === record.name) c.assigned = "Unassigned"; });
        log(`${kind} deleted`, `${recordName(record, id)} deleted`);
        if (!(await store.save())) {
          BHGS.hooks.refresh();
          return;
        }
        BHGS.layout.updateCounts();
        BHGS.hooks.refresh();
        ui.toast("Record deleted");
      },
      true
    );
  }

  function viewComplaint(id) {
    const c = getRecord("complaint", id);
    if (!c) return;
    const row = (label, value) => `<div class="result-row"><span>${label}</span><strong>${value}</strong></div>`;
    ui.openModal(
      `Case ${c.id}`,
      "COMPLAINT DETAILS",
      `<div class="result-box" style="margin-top:0">${row("Patient", esc(c.patient))}${row("Subject", esc(c.subject))}${row("Department", esc(c.department))}${row("Priority", ui.badge(c.priority))}${row("Status", ui.badge(c.status))}${row("Assigned to", esc(c.assigned || "Unassigned"))}${row("Created", fmtDate(c.created))}</div><p style="font-size:11px;line-height:1.7;color:var(--muted);margin:15px 0 0">${esc(c.description || "No description provided.")}</p>`,
      `<button type="button" class="btn" data-action="close-modal">Close</button><button type="button" class="btn btn-primary" data-action="edit-complaint" data-id="${esc(c.id)}">Edit case</button>`
    );
  }

  /* ---------- action wiring ---------- */
  function init() {
    const on = ui.actions.on;
    on("new-complaint", () => formModal("complaint"));
    on("add-staff", () => formModal("staff"));
    on("add-department", () => formModal("department"));
    on("edit-staff", (el) => formModal("staff", getRecord("staff", el.dataset.id) || {}));
    on("edit-department", (el) => formModal("department", getRecord("department", el.dataset.id) || {}));
    on("edit-complaint", (el) => formModal("complaint", getRecord("complaint", el.dataset.id) || {}));
    on("delete-staff", (el) => removeRecord("staff", el.dataset.id));
    on("delete-department", (el) => removeRecord("department", el.dataset.id));
    on("view-complaint", (el) => viewComplaint(el.dataset.id));
    on("save-staff", () => saveRecord("staff"));
    on("save-department", () => saveRecord("department"));
    on("save-complaint", () => saveRecord("complaint"));
    document.addEventListener("submit", (e) => {
      if (e.target.id !== "recordForm") return;
      e.preventDefault();
      saveRecord(e.target.dataset.kind);
    });
  }

  BHGS.records = { log, notify, formModal, getRecord, init };
})(window);
