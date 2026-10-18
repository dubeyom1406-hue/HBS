/*
 * store.js — validated local demo workspace, ready to switch to the REST API.
 */
(function (global) {
  "use strict";

  const BHGS = (global.BHGS = global.BHGS || {});
  const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
  const STORAGE_KEY = "caregrid_frontend_v1";
  const dataMode = global.BHGS_CONFIG && global.BHGS_CONFIG.dataMode === "api" ? "api" : "local";

  const ENUM = {
    activeStatus: ["Active", "Inactive"],
    shift: ["Morning", "Evening", "Night"],
    priority: ["Low", "Medium", "High", "Critical"],
    complaintStatus: ["Open", "In progress", "Resolved"],
    color: ["purple", "teal", "orange", "red"],
    notificationType: ["critical", "staff", "report", "info"],
  };

  const daysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };
  const seed = {
    hospital: { id: "H-001", name: "Bihar Healthcare Grievance System", district: "Patna", state: "Bihar", email: "admin@caregrid.demo", phone: "+91 98765 43210", slaHours: 24 },
    departments: [
      { id: "D-001", name: "Cardiology", head: "Dr. Ananya Singh", beds: 32, staff: 14, status: "Active", color: "purple", icon: "♡", description: "Heart and cardiovascular care" },
      { id: "D-002", name: "Emergency", head: "Dr. Rohan Verma", beds: 24, staff: 21, status: "Active", color: "red", icon: "✚", description: "Urgent and emergency treatment" },
      { id: "D-003", name: "Neurology", head: "Dr. Meera Rao", beds: 18, staff: 10, status: "Active", color: "teal", icon: "◉", description: "Brain and nervous system" },
      { id: "D-004", name: "Pediatrics", head: "Dr. Karan Sinha", beds: 26, staff: 12, status: "Active", color: "orange", icon: "♧", description: "Healthcare for infants and children" },
      { id: "D-005", name: "Orthopedics", head: "Dr. Neha Gupta", beds: 28, staff: 11, status: "Active", color: "purple", icon: "⌁", description: "Bones, joints and mobility" },
      { id: "D-006", name: "Radiology", head: "Dr. Vikram Das", beds: 12, staff: 8, status: "Active", color: "teal", icon: "▧", description: "Medical imaging and diagnostics" },
      { id: "D-007", name: "General Medicine", head: "Dr. Priya Kumar", beds: 35, staff: 16, status: "Active", color: "orange", icon: "＋", description: "General health and diagnosis" },
      { id: "D-008", name: "Pathology", head: "Dr. Arjun Roy", beds: 10, staff: 9, status: "Active", color: "red", icon: "⚗", description: "Laboratory testing and analysis" },
    ],
    staff: [
      { id: "ST-1001", name: "Dr. Ananya Singh", role: "Senior Consultant", department: "Cardiology", email: "ananya.singh@caregrid.demo", phone: "+91 98100 11223", shift: "Morning", status: "Active" },
      { id: "ST-1002", name: "Dr. Rohan Verma", role: "Emergency Physician", department: "Emergency", email: "rohan.verma@caregrid.demo", phone: "+91 98100 11224", shift: "Night", status: "Active" },
      { id: "ST-1003", name: "Dr. Meera Rao", role: "Consultant Neurologist", department: "Neurology", email: "meera.rao@caregrid.demo", phone: "+91 98100 11225", shift: "Morning", status: "Active" },
      { id: "ST-1004", name: "Dr. Karan Sinha", role: "Pediatrician", department: "Pediatrics", email: "karan.sinha@caregrid.demo", phone: "+91 98100 11226", shift: "Evening", status: "Active" },
      { id: "ST-1005", name: "Dr. Neha Gupta", role: "Orthopedic Surgeon", department: "Orthopedics", email: "neha.gupta@caregrid.demo", phone: "+91 98100 11227", shift: "Morning", status: "Active" },
      { id: "ST-1006", name: "Amit Kumar", role: "Staff Nurse", department: "Emergency", email: "amit.kumar@caregrid.demo", phone: "+91 98100 11228", shift: "Night", status: "Active" },
      { id: "ST-1007", name: "Dr. Priya Kumar", role: "General Physician", department: "General Medicine", email: "priya.kumar@caregrid.demo", phone: "+91 98100 11229", shift: "Evening", status: "Inactive" },
      { id: "ST-1008", name: "Sneha Das", role: "Lab Technician", department: "Pathology", email: "sneha.das@caregrid.demo", phone: "+91 98100 11230", shift: "Morning", status: "Active" },
    ],
    complaints: [
      { id: "CG-2401", patient: "Rahul Kumar", subject: "Delayed diagnostic report", department: "Pathology", priority: "High", status: "In progress", assigned: "Sneha Das", created: daysAgo(0), description: "Diagnostic report is taking longer than expected." },
      { id: "CG-2402", patient: "Pooja Sharma", subject: "Billing counter wait time", department: "General Medicine", priority: "Medium", status: "Open", assigned: "Unassigned", created: daysAgo(1), description: "Long queue at billing counter during peak hours." },
      { id: "CG-2403", patient: "Mohammed Ali", subject: "Wheelchair assistance needed", department: "Emergency", priority: "Critical", status: "Open", assigned: "Dr. Rohan Verma", created: daysAgo(0), description: "Patient family reported delay in wheelchair assistance." },
      { id: "CG-2404", patient: "Sita Devi", subject: "Appointment rescheduling issue", department: "Cardiology", priority: "Low", status: "Resolved", assigned: "Dr. Ananya Singh", created: daysAgo(3), resolvedAt: daysAgo(2), description: "Appointment was rescheduled without confirmation." },
      { id: "CG-2405", patient: "Aarav Singh", subject: "Waiting area cleanliness", department: "Pediatrics", priority: "Medium", status: "In progress", assigned: "Unassigned", created: daysAgo(2), description: "Waiting area needs cleaning and restocking." },
      { id: "CG-2406", patient: "Nisha Kumari", subject: "Medicine availability query", department: "General Medicine", priority: "High", status: "Open", assigned: "Unassigned", created: daysAgo(1), description: "Patient requested an update on prescribed medicine availability." },
    ],
    notifications: [
      { id: "N-001", title: "Critical complaint requires review", message: "CG-2403 — Wheelchair assistance needed has been marked Critical.", type: "critical", time: "Just now", read: false },
      { id: "N-002", title: "Staff roster updated", message: "A staff record was recently updated in the demo workspace.", type: "staff", time: "25 min ago", read: false },
      { id: "N-003", title: "Weekly report is ready", message: "The demo analytics view is ready to review.", type: "report", time: "1 hour ago", read: false },
    ],
    audit: [
      { id: "A-1001", action: "Workspace initialized", detail: "Bihar Healthcare Grievance System sample data loaded in this browser", user: "Operations Admin", time: new Date().toISOString(), type: "system" },
    ],
    settings: { notifications: true, criticalAlerts: true, compactTables: false, slaHours: 24 },
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const text = (value, max = 200, fallback = "") =>
    typeof value === "string" ? value.trim().slice(0, max) : typeof value === "number" && Number.isFinite(value) ? String(value).slice(0, max) : fallback;
  const int = (value, min = 0, max = 100000) => {
    const number = Math.round(Number(value));
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : min;
  };
  const oneOf = (value, list, fallback) => (list.includes(value) ? value : fallback);
  const isoDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  };
  const optionalIsoDate = (value) => {
    if (typeof value !== "string" || !value.trim()) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  };
  const idOr = (value) => (typeof value === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(value) ? value : "");

  function uniqueIds(list, prefix) {
    const seen = new Set();
    return list.map((item, index) => {
      let id = idOr(item.id);
      if (!id || seen.has(id)) id = `${prefix}${Date.now().toString(36)}${index}`;
      seen.add(id);
      return { ...item, id };
    });
  }

  const objects = (value, max) =>
    (Array.isArray(value) ? value.filter((item) => item && typeof item === "object" && !Array.isArray(item)).slice(0, max) : []);

  function normalize(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("The API returned an invalid workspace.");
    const required = ["hospital", "departments", "staff", "complaints", "notifications", "audit", "settings"];
    if (!required.every((key) => Object.prototype.hasOwnProperty.call(raw, key))) {
      throw new Error("The API response is missing workspace data. Check GET /api/v1/backup against api-contract.yaml.");
    }
    if (!["departments", "staff", "complaints", "notifications", "audit"].every((key) => Array.isArray(raw[key]))) {
      throw new Error("The API returned malformed workspace lists.");
    }

    const hospital = raw.hospital && typeof raw.hospital === "object" ? raw.hospital : {};
    const settings = raw.settings && typeof raw.settings === "object" ? raw.settings : {};
    const keep = (list, clean, prefix, max) => uniqueIds(objects(list, max).map(clean), prefix).filter((item) => item.id);

    return {
      hospital: {
        id: idOr(hospital.id),
        name: text(hospital.name, 120),
        district: text(hospital.district, 80),
        state: text(hospital.state, 80),
        email: text(hospital.email, 120),
        phone: text(hospital.phone, 30),
        slaHours: int(hospital.slaHours, 1, 720) || 24,
      },
      departments: keep(raw.departments, (item) => ({
        id: idOr(item.id),
        name: text(item.name, 80),
        head: text(item.head, 80),
        beds: int(item.beds, 0, 5000),
        staff: int(item.staff, 0, 5000),
        status: oneOf(item.status, ENUM.activeStatus, "Active"),
        color: oneOf(item.color, ENUM.color, "purple"),
        icon: text(item.icon, 4, "✚"),
        description: text(item.description, 300),
      }), "D-", 500).filter((item) => item.name),
      staff: keep(raw.staff, (item) => ({
        id: idOr(item.id),
        name: text(item.name, 80),
        role: text(item.role, 80),
        department: text(item.department, 80),
        email: text(item.email, 120),
        phone: text(item.phone, 30),
        shift: oneOf(item.shift, ENUM.shift, "Morning"),
        status: oneOf(item.status, ENUM.activeStatus, "Active"),
      }), "ST-", 5000).filter((item) => item.name),
      complaints: keep(raw.complaints, (item) => ({
        id: idOr(item.id),
        patient: text(item.patient, 80),
        subject: text(item.subject, 120),
        department: text(item.department, 80),
        priority: oneOf(item.priority, ENUM.priority, "Medium"),
        status: oneOf(item.status, ENUM.complaintStatus, "Open"),
        assigned: text(item.assigned, 80, "Unassigned") || "Unassigned",
        created: isoDate(item.created),
        resolvedAt: optionalIsoDate(item.resolvedAt),
        description: text(item.description, 2000),
      }), "CG-", 20000).filter((item) => item.subject || item.patient),
      notifications: keep(raw.notifications, (item) => ({
        id: idOr(item.id),
        title: text(item.title, 120),
        message: text(item.message, 300),
        type: oneOf(item.type, ENUM.notificationType, "info"),
        time: text(item.time, 40, "Just now"),
        read: item.read === true,
      }), "N-", 500),
      audit: keep(raw.audit, (item) => ({
        id: idOr(item.id),
        action: text(item.action, 120),
        detail: text(item.detail, 300),
        user: text(item.user, 80, "Operations Admin"),
        time: isoDate(item.time),
        type: text(item.type, 30, "activity"),
      }), "A-", 250),
      settings: {
        notifications: typeof settings.notifications === "boolean" ? settings.notifications : true,
        criticalAlerts: typeof settings.criticalAlerts === "boolean" ? settings.criticalAlerts : true,
        compactTables: typeof settings.compactTables === "boolean" ? settings.compactTables : false,
        slaHours: int(settings.slaHours, 1, 720) || 24,
      },
    };
  }

  const loadLocal = () => {
    try {
      const saved = global.localStorage.getItem(STORAGE_KEY);
      return saved ? normalize(JSON.parse(saved)) : normalize(seed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        global.localStorage.removeItem(STORAGE_KEY);
        return normalize(seed);
      }
      return normalize(seed);
    }
  };

  const initialData = dataMode === "local" ? loadLocal() : clone(blank);
  const store = {
    maxImportBytes: MAX_IMPORT_BYTES,
    enums: ENUM,
    data: initialData,
    mode: dataMode,
    status: dataMode === "local" ? "ready" : "loading",
    error: "",
    ready: null,
    saveQueue: Promise.resolve(),
    committed: clone(initialData),

    async load() {
      if (this.mode === "local") {
        try {
          this.data = loadLocal();
          this.committed = clone(this.data);
          this.status = "ready";
          this.error = "";
        } catch (error) {
          this.status = "error";
          this.error = error.message || "Could not load saved demo workspace.";
        }
        document.dispatchEvent(new CustomEvent("bhgs:data-changed"));
        return this.status === "ready";
      }
      this.status = "loading";
      this.error = "";
      document.dispatchEvent(new CustomEvent("bhgs:data-changed"));
      try {
        this.data = normalize(await global.BHGS_API.get("/backup"));
        this.committed = clone(this.data);
        this.status = "ready";
        document.dispatchEvent(new CustomEvent("bhgs:data-changed"));
        return true;
      } catch (error) {
        this.data = clone(blank);
        this.status = "error";
        this.error = error.message || "Could not load workspace data from the API.";
        document.dispatchEvent(new CustomEvent("bhgs:data-changed"));
        return false;
      }
    },

    save() {
      const snapshot = clone(this.data);
      if (this.mode === "local") {
        try {
          global.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
          this.committed = clone(snapshot);
          this.status = "ready";
          this.error = "";
          return Promise.resolve(true);
        } catch (error) {
          this.data = clone(this.committed);
          const message = error && error.name === "QuotaExceededError"
            ? "Browser storage is full. Your previous data was restored; free storage and try again."
            : "Could not save changes to this browser. Your previous data was restored; check browser storage permissions and try again.";
          document.dispatchEvent(new CustomEvent("bhgs:storage-error", { detail: { message } }));
          document.dispatchEvent(new CustomEvent("bhgs:data-changed"));
          return Promise.resolve(false);
        }
      }
      const save = async () => {
        if (this.status !== "ready") {
          this.data = clone(this.committed);
          return false;
        }
        try {
          const result = await global.BHGS_API.put("/backup", snapshot);
          this.data = normalize(result || snapshot);
          this.committed = clone(this.data);
          document.dispatchEvent(new CustomEvent("bhgs:data-changed"));
          return true;
        } catch (error) {
          this.data = clone(this.committed);
          document.dispatchEvent(new CustomEvent("bhgs:api-error", { detail: { message: error.message } }));
          document.dispatchEvent(new CustomEvent("bhgs:data-changed"));
          return false;
        }
      };
      this.saveQueue = this.saveQueue.then(save, save);
      return this.saveQueue;
    },

    reset() {
      this.data = normalize(seed);
      return this.save();
    },
    validate(raw) {
      return normalize(raw);
    },
    async replace(raw) {
      this.data = normalize(raw);
      return this.save();
    },
    export() {
      return JSON.stringify(this.data, null, 2);
    },
    nextId(list, prefix, start, pad = 0) {
      const max = list.reduce((current, item) => {
        const hit = typeof item.id === "string" && item.id.startsWith(prefix) ? parseInt(item.id.slice(prefix.length), 10) : NaN;
        return Number.isFinite(hit) ? Math.max(current, hit) : current;
      }, start - 1);
      return prefix + String(max + 1).padStart(pad, "0");
    },
  };

  store.ready = dataMode === "local" ? Promise.resolve(true) : store.load();
  BHGS.store = store;
})(window);
