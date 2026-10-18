/* Overview (dashboard) page. */
(function () {
  "use strict";

  const BHGS = window.BHGS;
  const { $, esc, relative, colorClass, priorityScore } = BHGS.utils;
  const { store } = BHGS;
  const ui = BHGS.ui;

  const legend = (color, label) => `<span><i class="legend-dot" style="background:${color}"></i>${label}</span>`;

  function view() {
    const d = store.data;
    const open = d.complaints.filter((c) => c.status !== "Resolved").length;
    const critical = d.complaints.filter((c) => c.priority === "Critical" && c.status !== "Resolved").length;
    const activeStaff = d.staff.filter((s) => s.status === "Active").length;
    const activities = d.audit.slice(0, 4);

    const activityList = activities.length
      ? activities.map((a) => ui.activityRow(a.type === "system" ? "✦" : "↗", a.type === "system" ? "icon-purple" : "icon-teal", esc(a.action), esc(a.detail), relative(a.time))).join("")
      : '<div class="empty-state">No recent activity yet.</div>';

    const attention = d.complaints
      .filter((c) => c.status !== "Resolved")
      .sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority))
      .slice(0, 4)
      .map((c) =>
        `<a class="case-attention-link" href="complaints.html?id=${encodeURIComponent(c.id)}">${ui.activityRow(
          c.priority === "Critical" ? "!" : "•",
          c.priority === "Critical" ? "icon-red" : c.priority === "High" ? "icon-orange" : "icon-purple",
          esc(c.subject),
          `${esc(c.id)} · ${esc(c.department)}`,
          ui.badge(c.priority)
        )}</a>`
      )
      .join("");

    const deptTiles = d.departments
      .slice(0, 6)
      .map(
        (x) =>
          `<div class="dept-tile"><div class="dept-tile-icon ${colorClass(x.color)}">${ui.deptIcon(x)}</div><div class="dept-tile-copy"><strong>${esc(x.name)}</strong><small>${Number(x.staff) || 0} staff · ${Number(x.beds) || 0} beds</small></div><span class="dept-number">${d.staff.filter((s) => s.department === x.name && s.status === "Active").length}</span></div>`
      )
      .join("");

    const link = (label, page, large = false) => `<div class="card-link${large ? " card-link-lg" : ""}">${ui.btn(label, "navigate", "text-button", `data-page="${page}"`)}</div>`;

    return `${ui.heading("Good morning, Admin 👋", "Here’s what’s happening across your hospital workspace today.", ui.btn("↻ Refresh overview", "refresh", "btn") + ui.btn('<span class="plus">+</span> New complaint', "new-complaint", "btn btn-primary"))}
      <div class="stats-grid">${ui.metric("Total departments", d.departments.length, "▦", "icon-purple", '<span class="trend-up">●</span> Configured departments', "departments")}${ui.metric("Doctors & staff", d.staff.length, "♙", "icon-teal", `<span class="trend-up">${activeStaff} active</span> team members`, "staff")}${ui.metric("Open complaints", open, "▤", "icon-orange", '<span class="trend-warn">Needs attention</span> pending resolution', "complaints")}${ui.metric("Critical cases", critical, "⚑", "icon-red", '<span class="trend-warn">Priority review</span> required', "critical")}</div>
      <div class="dashboard-grid">
        ${ui.card("Complaint activity", "Daily reports and recorded resolutions · resolution dates are tracked when cases are closed", `<div class="card-body"><div class="chart-legend">${legend("#0d0e12", "Received")}${legend("#31b5a4", "Resolved")}</div><div class="chart-wrap"><canvas id="activityChart" aria-label="Daily complaints received and resolved during the past seven days"></canvas></div></div>`)}
        ${ui.card("Recent activity", "Latest changes in this workspace", `<div class="card-body"><div class="activity-list">${activityList}</div>${link("View activity log →", "audit")}</div>`)}
      </div>
      <div class="bottom-grid">
        ${ui.card("Department overview", "A quick look at departments and assigned staff", `<div class="card-body"><div class="dept-list">${deptTiles}</div>${link("View all departments →", "departments", true)}</div>`)}
        ${ui.card("Complaints needing attention", "Open cases with priority", `<div class="card-body"><div class="activity-list">${attention || '<div class="empty-state"><strong>All caught up</strong><p>No open complaints need attention.</p></div>'}</div>${link("Manage complaints →", "complaints")}</div>`)}
      </div>`;
  }

  function drawCharts(page) {
    const canvas = $("#activityChart");
    if (!canvas) return;
    if (!BHGS.charts.hasCharts()) {
      BHGS.charts.loadCharts()
        .then(() => { if (canvas.isConnected) page.paint(); })
        .catch(() => BHGS.charts.chartFallback(canvas));
      return;
    }

    const labels = [];
    const received = [];
    const resolved = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const key = day.toDateString();
      labels.push(day.toLocaleDateString("en-IN", { weekday: "short" }));
      received.push(store.data.complaints.filter((c) => new Date(c.created).toDateString() === key).length);
      resolved.push(store.data.complaints.filter((c) => c.resolvedAt && new Date(c.resolvedAt).toDateString() === key).length);
    }

    const line = (label, data, color, fill) => ({
      label, data, borderColor: color, backgroundColor: fill, fill: fill !== "transparent", tension: 0.38,
      pointRadius: 4, pointHoverRadius: 6, pointBorderColor: "#fff", pointBorderWidth: 2, borderWidth: 3, pointBackgroundColor: color,
    });

    page.charts.push(
      new Chart(canvas, {
        type: "line",
        data: { labels, datasets: [line("Received", received, "#0d0e12", "#dedcf88c"), line("Resolved", resolved, "#31b5a4", "transparent")] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1e2b44", padding: 10, cornerRadius: 8 } },
          scales: {
            x: { grid: { display: false }, ticks: { color: "#9aa5b8", font: { size: 12 } } },
            y: { beginAtZero: true, grid: { color: "#eceef6", borderDash: [4, 4] }, border: { display: false }, ticks: { color: "#9aa5b8", stepSize: 1, font: { size: 12 } } },
          },
        },
      })
    );
  }

  const page = BHGS.createPage({ render: view, afterRender: drawCharts });

  ui.actions.on("refresh", () => {
    page.paint();
    ui.toast("Overview refreshed");
  });

  BHGS.layout.init();
  page.paint();
})();
