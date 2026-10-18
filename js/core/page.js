/*
 * page.js — tiny page controller. Each page gives it a render() function that returns
 * HTML; the controller paints it, keeps search/filter state, and cleans up charts.
 */
(function (global) {
  "use strict";

  const BHGS = (global.BHGS = global.BHGS || {});
  const { $, esc } = BHGS.utils;
  const ui = BHGS.ui;
  const store = BHGS.store;

  const FILTER_IDS = { filterStatus: "status", filterPriority: "priority", filterDepartment: "department" };

  /**
   * @param {{render: Function, afterRender?: Function}} options
   * render(state) -> HTML string for #pageContent
   * afterRender(page) runs after every paint (draw charts, restore widgets...)
   */
  function createPage({ render, afterRender }) {
    const root = $("#pageContent");
    const page = {
      state: { search: "", filters: {} },
      charts: [],

      destroyCharts() {
        this.charts.forEach((chart) => {
          try { chart.destroy(); } catch (e) { /* already gone */ }
        });
        this.charts = [];
      },

      paint() {
        this.destroyCharts();
        if (store.status === "loading") {
          root.innerHTML = '<section class="card empty-state" role="status"><strong>Connecting to the workspace…</strong><p>Loading records from the configured backend API.</p></section>';
          return;
        }
        if (store.status === "error") {
          root.innerHTML = `<section class="card empty-state" role="alert"><strong>Could not load workspace data</strong><p>${esc(store.error)}</p><button type="button" class="btn btn-primary" data-action="retry-api">Retry connection</button></section>`;
          return;
        }
        root.innerHTML = render(this.state);
        Object.entries(FILTER_IDS).forEach(([id, key]) => {
          const select = $("#" + id);
          if (select) select.value = this.state.filters[key] || "all";
        });
        BHGS.layout.updateCounts();
        if (afterRender) afterRender(this);
      },

      setSearch(value) {
        this.state.search = value;
        this.paint();
        const input = $("#tableSearch");
        if (input) {
          input.focus();
          input.setSelectionRange(value.length, value.length);
        }
      },
    };

    BHGS.hooks.refresh = () => page.paint();
    BHGS.hooks.metricFilter = (el) => {
      page.state.search = "";
      page.state.filters = {};
      if (el.dataset.clearFilters !== "true") {
        ["status", "priority", "department"].forEach((key) => {
          const value = el.dataset[`filter${key[0].toUpperCase()}${key.slice(1)}`];
          if (value) page.state.filters[key] = value;
        });
      }
      page.paint();
      const table = $("#tableSearch");
      if (table) table.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    document.addEventListener("input", (e) => {
      if (e.target.id !== "tableSearch") return;
      const caret = e.target.selectionStart;
      page.state.search = e.target.value;
      page.paint();
      const input = $("#tableSearch");
      if (input) {
        input.focus();
        input.setSelectionRange(caret, caret);
      }
    });

    document.addEventListener("change", (e) => {
      if (Object.prototype.hasOwnProperty.call(FILTER_IDS, e.target.id)) {
        page.state.filters[FILTER_IDS[e.target.id]] = e.target.value;
        page.paint();
      }
    });

    ui.actions.on("reset-table", () => {
      page.state.search = "";
      page.state.filters = {};
      page.paint();
    });

    return page;
  }

  ui.actions.on("retry-api", async () => {
    if (await store.load()) BHGS.hooks.refresh();
  });

  /** True when the Chart.js library finished loading (it comes from a CDN). */
  const hasCharts = () => typeof global.Chart === "function";

  let chartsPromise;
  function loadCharts() {
    if (hasCharts()) return Promise.resolve();
    if (!chartsPromise) {
      chartsPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js";
        script.crossOrigin = "anonymous";
        script.referrerPolicy = "no-referrer";
        script.onload = () => {
          if (hasCharts()) {
            resolve();
            return;
          }
          chartsPromise = null;
          script.remove();
          reject(new Error("Chart.js loaded without its chart library."));
        };
        script.onerror = () => {
          chartsPromise = null;
          script.remove();
          reject(new Error("Chart.js could not be loaded."));
        };
        document.head.append(script);
      });
    }
    return chartsPromise;
  }

  /** Shown inside a chart box when Chart.js could not be loaded (for example when offline). */
  function chartFallback(canvas) {
    if (!canvas || canvas.parentNode.querySelector(".chart-fallback")) return;
    const note = document.createElement("p");
    note.className = "chart-fallback muted";
    note.textContent = "Chart unavailable. Connect to the internet to load the chart library.";
    canvas.parentNode.append(note);
  }

  BHGS.createPage = createPage;
  BHGS.charts = { hasCharts, loadCharts, chartFallback };
})(window);
