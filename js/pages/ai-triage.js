/* AI triage demo page — a rule-based keyword classifier (no real AI model). */
(function () {
  "use strict";

  const BHGS = window.BHGS;
  const { $, esc } = BHGS.utils;
  const { store } = BHGS;
  const ui = BHGS.ui;

  let triage = null;

  const CRITICAL_WORDS = ["unconscious", "not breathing", "breathing difficulty", "severe bleeding", "chest pain", "emergency", "suicide", "seizure"];
  const HIGH_WORDS = ["urgent", "severe", "delay", "medicine", "medication", "fever", "pain", "infection", "worsening"];
  const DEPARTMENT_HINTS = [
    [/heart|chest|cardiac/, "Cardiology"],
    [/child|baby|infant/, "Pediatrics"],
    [/brain|headache|seizure/, "Neurology"],
    [/blood|test|lab|report/, "Pathology"],
    [/bone|fracture|joint/, "Orthopedics"],
    [/emergency|breathing|unconscious/, "Emergency"],
  ];

  function view() {
    const options = store.data.departments.map((d) => `<option>${esc(d.name)}</option>`).join("");
    return `${ui.heading("AI triage demo", "A rule-based text classifier that demonstrates a possible triage workflow.", `<span class="status status-progress">Demo only</span>`)}<div class="split-panel"><section class="card info-panel"><h3>Analyze a complaint</h3><p>Enter a complaint description. The local demo checks for keywords and suggests a priority and department. This is not a medical AI model and must not be used for real clinical decisions.</p><form id="triageForm"><div class="form-group"><label class="form-label" for="triageSubject">Complaint title</label><input class="field" id="triageSubject" placeholder="e.g. Delay in emergency assistance" required maxlength="120"></div><div class="form-group"><label class="form-label" for="triageText">Description</label><textarea class="textarea-field" id="triageText" placeholder="Describe the issue in plain language…" required maxlength="2000"></textarea></div><div class="form-group"><label class="form-label" for="triageDepartment">Known department (optional)</label><select class="select-field" id="triageDepartment" style="width:100%"><option value="">Let the demo suggest one</option>${options}</select></div><button class="btn btn-primary" type="submit">✳ Analyze text</button></form><div id="triageResult"></div></section><aside class="card info-panel"><h3>How the demo works</h3><p>These simple rules are included so the frontend works without a server or paid API.</p><div class="activity-list">${ui.activityRow("1", "icon-red", "Critical keywords", "emergency, unconscious, breathing, severe pain", "Highest")}${ui.activityRow("2", "icon-orange", "High priority keywords", "urgent, delay, medication, serious", "High")}${ui.activityRow("3", "icon-purple", "Department hints", "heart → Cardiology, child → Pediatrics", "Suggested")}${ui.activityRow("4", "icon-teal", "Local processing", "Text stays in this browser session", "Private demo")}</div><div class="result-box"><h4>Important limitation</h4><p class="limitation-note">Keyword rules can miss serious situations or incorrectly classify text. For any real emergency, contact local emergency services and qualified clinicians.</p></div></aside></div>`;
  }

  function classify(subject, text, chosenDepartment) {
    const all = `${subject} ${text}`.toLowerCase();
    const priority = CRITICAL_WORDS.some((k) => all.includes(k))
      ? "Critical"
      : HIGH_WORDS.some((k) => all.includes(k))
      ? "High"
      : all.includes("wait") || all.includes("billing")
      ? "Medium"
      : "Low";

    let department = chosenDepartment;
    if (!department) {
      const hit = DEPARTMENT_HINTS.find(([re]) => re.test(all));
      department = hit ? hit[1] : "General Medicine";
    }
    const reason =
      priority === "Critical" ? "Critical keywords found in the text."
      : priority === "High" ? "Potentially urgent terms detected."
      : priority === "Medium" ? "A service delay or waiting-related term was detected."
      : "No high-priority keyword was detected by this simple rule set.";
    return { subject, text, priority, department, reason };
  }

  function runTriage() {
    const subject = $("#triageSubject").value.trim();
    const text = $("#triageText").value.trim();
    if (!subject || !text) return ui.toast("Please enter a title and a description.", "error");

    const chosen = $("#triageDepartment").value;
    const known = store.data.departments.some((d) => d.name === chosen);
    triage = classify(subject, text, known ? chosen : "");
    const tone = triage.priority === "Critical" ? "status-critical" : triage.priority === "High" ? "status-open" : "status-progress";

    $("#triageResult").innerHTML = `<div class="result-box"><h4>Demo result <span class="status ${tone}">${esc(triage.priority)} priority</span></h4><div class="result-row"><span>Suggested department</span><strong>${esc(triage.department)}</strong></div><div class="result-row"><span>Rule explanation</span><strong>${esc(triage.reason)}</strong></div><p class="result-disclaimer">Not a diagnosis or validated triage tool. Do not rely on this output for real care.</p><div class="result-action">${ui.btn("Create complaint from result", "triage-create", "btn btn-primary")}</div></div>`;
  }

  const page = BHGS.createPage({ render: view });

  ui.actions.on("triage-create", () => {
    if (!triage) return;
    BHGS.records.formModal("complaint", {
      patient: "Demo patient", subject: triage.subject, department: triage.department,
      priority: triage.priority, status: "Open", assigned: "Unassigned", description: triage.text,
    });
  });

  document.addEventListener("submit", (e) => {
    if (e.target.id !== "triageForm") return;
    e.preventDefault();
    runTriage();
  });

  BHGS.layout.init();
  page.paint();
})();
