/* Notifications page. */
(function () {
  "use strict";

  const BHGS = window.BHGS;
  const { esc } = BHGS.utils;
  const { store } = BHGS;
  const ui = BHGS.ui;

  const TONE = { critical: "icon-red", report: "icon-teal" };
  const SYMBOL = { critical: "!", report: "▥" };

  function row(n) {
    const tone = TONE[n.type] || "icon-purple";
    const symbol = SYMBOL[n.type] || "↗";
    const action = n.read ? `<span class="muted read-label">Read</span>` : ui.btn("Mark read", "read-notification", "btn btn-sm", `data-id="${esc(n.id)}"`);
    return `<div class="notification-row ${n.read ? "" : "unread"}"><div class="activity-symbol ${tone}">${ui.ICON(symbol)}</div><div class="notification-copy"><strong>${esc(n.title)}</strong><p>${esc(n.message)}</p><small>${esc(n.time)}</small></div>${action}</div>`;
  }

  function view() {
    const list = store.data.notifications;
    const unread = list.filter((n) => !n.read).length;
    const body = list.map(row).join("") || ui.emptyState("You're all caught up", "New notifications will appear here.", "♧");
    const subtitle = store.mode === "local"
      ? "Keep track of sample updates and actions saved in this browser."
      : "Keep track of updates and actions from your connected workspace.";
    return `${ui.heading("Notifications", subtitle, ui.btn("✓ Mark all as read", "read-all", "btn") + ui.btn("Clear read notifications", "clear-read", "btn btn-ghost"))}${ui.card("Inbox", `${unread} unread notification(s)`, `<div class="notification-list">${body}</div>`)}`;
  }

  const page = BHGS.createPage({ render: view });

  const commit = async (message) => {
    if (!(await store.save())) {
      page.paint();
      return;
    }
    page.paint();
    ui.toast(message);
  };

  ui.actions.on("read-all", async () => {
    store.data.notifications.forEach((n) => (n.read = true));
    await commit("All notifications marked as read");
  });
  ui.actions.on("read-notification", async (el) => {
    const n = store.data.notifications.find((x) => x.id === el.dataset.id);
    if (n) n.read = true;
    await commit("Notification marked as read");
  });
  ui.actions.on("clear-read", async () => {
    store.data.notifications = store.data.notifications.filter((n) => !n.read);
    await commit("Read notifications cleared");
  });

  BHGS.layout.init();
  page.paint();
})();
