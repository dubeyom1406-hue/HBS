/* Settings page: hospital profile, preferences, data & privacy. */
(function () {
  "use strict";

  const BHGS = window.BHGS;
  const { $, $$, esc } = BHGS.utils;
  const { store } = BHGS;
  const ui = BHGS.ui;

  const TABS = { general: "Hospital profile", preferences: "Preferences", data: "Data & privacy" };
  let activeTab = "general";

  const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

  const settingRow = (title, desc, key, checked) =>
    `<div class="setting-row"><div><strong>${title}</strong><p>${desc}</p></div><input class="switch" type="checkbox" data-pref="${key}" ${checked ? "checked" : ""} aria-label="${title}"></div>`;

  const formGroup = (label, name, input) => {
    const id = `hospital-${name}`;
    return `<div class="form-group"><label class="form-label" for="${id}">${label}</label>${input.replace("<input ", `<input id="${id}" `)}</div>`;
  };

  function generalTab(h, s) {
    const description = store.mode === "local"
      ? "Edit sample hospital details. Changes are saved in this browser."
      : "These details are managed by the connected hospital API.";
    return `<h3>Hospital profile</h3><p>${description}</p><form id="hospitalSettings"><div class="settings-form-grid">${formGroup("Hospital name", "name", `<input class="field" name="name" required maxlength="120" value="${esc(h.name)}">`)}${formGroup("District / city", "district", `<input class="field" name="district" maxlength="80" value="${esc(h.district)}">`)}${formGroup("State", "state", `<input class="field" name="state" maxlength="80" value="${esc(h.state)}">`)}${formGroup("Contact email", "email", `<input class="field" type="email" name="email" maxlength="120" value="${esc(h.email)}">`)}${formGroup("Contact phone", "phone", `<input class="field" name="phone" maxlength="30" value="${esc(h.phone)}">`)}${formGroup("Complaint SLA (hours)", "slaHours", `<input class="field" type="number" min="1" max="720" name="slaHours" value="${Number(s.slaHours) || 24}">`)}</div><button class="btn btn-primary" type="submit">Save profile</button></form>`;
  }

  function preferencesTab(s) {
    const description = store.mode === "local"
      ? "Choose how the sample workspace behaves in this browser."
      : "Choose how the connected workspace behaves.";
    return `<h3>Workspace preferences</h3><p>${description}</p>${settingRow("In-app notifications", "Create a notification when a workspace action occurs.", "notifications", s.notifications)}${settingRow("Critical case alerts", "Show critical complaint notices in the inbox.", "criticalAlerts", s.criticalAlerts)}${settingRow("Compact table rows", "Use a denser table layout for data-heavy views.", "compactTables", s.compactTables)}${ui.btn("Save preferences", "save-preferences", "btn btn-primary")}`;
  }

  function dataTab() {
    const d = store.data;
    const row = (label, value) => `<div class="result-row"><span>${label}</span><strong>${value}</strong></div>`;
    const connected = store.mode === "api";
    const storage = connected ? "Connected backend API" : "This browser (localStorage)";
    const endpoint = connected ? esc(BHGS.api.baseUrl) : "Not connected";
    const authentication = connected ? "Backend session cookie or bearer token" : "Demo mode; no sign-in";
    const description = connected
      ? "Workspace data is loaded from and saved to the configured backend API."
      : "Sample workspace data is saved only in this browser. No backend is connected.";
    const clearLabel = connected ? "Clear all workspace records" : "Clear all local demo data";
    return `<h3>Data &amp; privacy</h3><p>${description}</p><div class="result-box">${row("Storage", storage)}${row("Records", `${d.departments.length + d.staff.length + d.complaints.length} core records`)}${row(connected ? "API base path" : "API connection", endpoint)}${row("Authentication", authentication)}</div><hr class="settings-divider"><p>Import replaces the current workspace. Export a backup before replacing data.</p><div class="data-actions">${ui.btn("Export JSON backup", "export-json", "btn btn-primary")}${ui.btn("Import JSON backup", "import-json", "btn")}${ui.btn(clearLabel, "clear-data", "btn btn-danger")}</div><input type="file" id="importFile" accept=".json,application/json" hidden>`;
  }

  function view() {
    const h = store.data.hospital;
    const s = store.data.settings;
    const tabs = Object.entries(TABS)
      .map(([key, label]) => `<button type="button" class="settings-tab ${activeTab === key ? "active" : ""}" data-action="settings-tab" data-tab="${key}">${label}</button>`)
      .join("");
    const panel = activeTab === "general" ? generalTab(h, s) : activeTab === "preferences" ? preferencesTab(s) : dataTab();
    return `${ui.heading("Settings", "Manage hospital details, preferences and workspace data.")}<div class="settings-layout"><nav class="card settings-nav">${tabs}</nav><section class="card settings-panel">${panel}</section></div>`;
  }

  const page = BHGS.createPage({ render: view });

  async function saveProfile(form) {
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim().slice(0, 120);
    const email = String(fd.get("email") || "").trim().slice(0, 120);
    if (!name) return ui.toast("Hospital name is required.", "error");
    if (email && !EMAIL.test(email)) return ui.toast("Please enter a valid contact email.", "error");

    const sla = Math.min(720, Math.max(1, Math.round(Number(fd.get("slaHours"))) || 24));
    store.data.hospital = {
      ...store.data.hospital,
      name,
      email,
      district: String(fd.get("district") || "").trim().slice(0, 80),
      state: String(fd.get("state") || "").trim().slice(0, 80),
      phone: String(fd.get("phone") || "").trim().slice(0, 30),
      slaHours: sla,
    };
    store.data.settings.slaHours = sla;
    BHGS.records.log("Hospital settings updated", "Hospital profile settings saved");
    if (!(await store.save())) {
      page.paint();
      return;
    }
    ui.toast("Hospital profile saved");
    page.paint();
  }

  function importBackup() {
    const input = $("#importFile");
    input.onchange = async () => {
      const file = input.files && input.files[0];
      input.value = "";
      if (!file) return;
      try {
        if (file.size > store.maxImportBytes) throw new Error("Backup file is too large (limit 2 MB).");
        // Validate first, so a wrong file is rejected before the user is asked to confirm.
        const clean = store.validate(JSON.parse(await file.text()));
        ui.confirmModal("Import workspace backup?", "Importing replaces the current workspace data on the backend.", async () => {
          store.data = clean;
          if (!(await store.save())) return;
          BHGS.layout.updateCounts();
          page.paint();
          ui.toast("Backup imported");
        });
      } catch (err) {
        ui.toast(err instanceof SyntaxError ? "This file is not valid JSON." : err.message || "Could not read backup file", "error");
      }
    };
    input.click();
  }

  const on = ui.actions.on;
  on("settings-tab", (el) => {
    if (Object.prototype.hasOwnProperty.call(TABS, el.dataset.tab)) activeTab = el.dataset.tab;
    page.paint();
  });
  on("save-preferences", async () => {
    $$("[data-pref]").forEach((x) => (store.data.settings[x.dataset.pref] = x.checked));
    BHGS.records.log("Preferences updated", "Workspace preferences saved");
    if (!(await store.save())) {
      page.paint();
      return;
    }
    ui.toast("Preferences saved");
    page.paint();
  });
  on("export-json", () => ui.exportFile("caregrid-backup.json", store.export(), "application/json"));
  on("import-json", importBackup);
  on("clear-data", () =>
    ui.confirmModal("Clear workspace records?", store.mode === "local"
      ? "This permanently removes the sample departments, staff, complaints, notifications and audit events saved in this browser. Export a backup first if needed."
      : "This permanently removes all departments, staff, complaints, notifications and audit events from the backend. Export a backup first if needed.", async () => {
      Object.assign(store.data, { departments: [], staff: [], complaints: [], notifications: [], audit: [] });
      if (!(await store.save())) return;
      BHGS.layout.updateCounts();
      page.paint();
      ui.toast("Workspace records cleared");
    }, true)
  );

  document.addEventListener("submit", async (e) => {
    if (e.target.id !== "hospitalSettings") return;
    e.preventDefault();
    await saveProfile(e.target);
  });

  /* Preference switches save immediately. */
  document.addEventListener("change", (e) => {
    const key = e.target.dataset && e.target.dataset.pref;
    if (key && Object.prototype.hasOwnProperty.call(store.data.settings, key)) {
      store.data.settings[key] = e.target.checked;
      store.save().then((saved) => {
        if (!saved) page.paint();
      });
    }
  });

  BHGS.layout.init();
  page.paint();
})();
