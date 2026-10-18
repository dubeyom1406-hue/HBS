/* Reports & analytics page. */
(function () {
  "use strict";

  const BHGS = window.BHGS;
  const { $, esc } = BHGS.utils;
  const { store } = BHGS;
  const ui = BHGS.ui;

  const STATUSES = ["Open", "In progress", "Resolved"];
  const PRIORITIES = ["Critical", "High", "Medium", "Low"];

  function workloadRows(complaints) {
    return store.data.departments
      .map((dep) => {
        const cases = complaints.filter((c) => c.department === dep.name);
        const open = cases.filter((c) => c.status !== "Resolved").length;
        const pct = complaints.length ? Math.round((cases.length / complaints.length) * 100) : 0;
        return `<tr><td><strong class="workload-name">${esc(dep.name)}</strong></td><td>${cases.length}</td><td>${open}</td><td><div class="workload-cell"><div class="priority-bar workload-bar"><span style="width:${pct}%"></span></div><span>${pct}%</span></div></td></tr>`;
      })
      .join("");
  }

  function view() {
    const complaints = store.data.complaints;
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    const rate = complaints.length ? Math.round((resolved / complaints.length) * 100) : 0;
    const high = complaints.filter((c) => ["Critical", "High"].includes(c.priority) && c.status !== "Resolved").length;

    return `${ui.heading("Reports & analytics", "Explore current workspace trends and export the loaded records.", ui.btn("↓ Export CSV", "export-csv", "btn") + ui.btn("↓ Export JSON", "export-json", "btn btn-primary"))}<div class="stats-grid">${ui.metric("Total complaints", complaints.length, "▤", "icon-purple", '<span class="muted">All recorded cases</span>', "complaints")}${ui.metric("Resolution rate", rate + "%", "✓", "icon-teal", '<span class="trend-up">Resolved / total</span>', "complaints")}${ui.metric("High priority open", high, "⚑", "icon-red", '<span class="trend-warn">Needs follow-up</span>', "complaints")}${ui.metric("Departments", store.data.departments.length, "▦", "icon-orange", '<span class="muted">Configured units</span>', "departments")}</div><div class="dashboard-grid">${ui.card("Cases by status", "Distribution of complaint workflow", `<div class="card-body"><div class="chart-wrap"><canvas id="statusChart"></canvas></div></div>`)}${ui.card("Priority distribution", "Current complaint priorities", `<div class="card-body"><div class="chart-wrap"><canvas id="priorityChart"></canvas></div></div>`)}</div>${ui.card("Department workload", "Complaints currently assigned to each department", `<div class="table-wrap"><table class="data-table"><thead><tr><th>Department</th><th>Total cases</th><th>Open cases</th><th>Workload</th></tr></thead><tbody>${workloadRows(complaints)}</tbody></table></div>`)}`;
  }

  function drawCharts(page) {
    const statusCanvas = $("#statusChart");
    const priorityCanvas = $("#priorityChart");
    if (!BHGS.charts.hasCharts()) {
      const canvases = [statusCanvas, priorityCanvas].filter(Boolean);
      BHGS.charts.loadCharts()
        .then(() => { if (canvases.some((canvas) => canvas.isConnected)) page.paint(); })
        .catch(() => canvases.forEach(BHGS.charts.chartFallback));
      return;
    }
    const complaints = store.data.complaints;
    const count = (key, value) => complaints.filter((c) => c[key] === value).length;

    if (statusCanvas) {
      page.charts.push(
        new Chart(statusCanvas, {
          type: "doughnut",
          data: { labels: STATUSES, datasets: [{ data: STATUSES.map((s) => count("status", s)), backgroundColor: ["#e9a23b", "#5d6cdd", "#31b5a4"], borderWidth: 0, hoverOffset: 5 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: "68%", plugins: { legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 7, padding: 17, font: { size: 12 } } } } },
        })
      );
    }
    if (priorityCanvas) {
      page.charts.push(
        new Chart(priorityCanvas, {
          type: "bar",
          data: { labels: PRIORITIES, datasets: [{ data: PRIORITIES.map((p) => count("priority", p)), backgroundColor: ["#e36a78", "#eaa044", "#6877df", "#39b8a6"], borderRadius: 6, maxBarThickness: 32 }] },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 12 }, color: "#929db0" } },
              y: { beginAtZero: true, grid: { color: "#eef1f6" }, ticks: { stepSize: 1, font: { size: 12 }, color: "#929db0" } },
            },
          },
        })
      );
    }
  }

  const page = BHGS.createPage({ render: view, afterRender: drawCharts });

  ui.actions.on("export-csv", () => ui.exportCSV("caregrid-complaints.csv", store.data.complaints));
  ui.actions.on("export-json", () => ui.exportFile("caregrid-backup.json", store.export(), "application/json"));

  BHGS.layout.init();
  page.paint();
})();
