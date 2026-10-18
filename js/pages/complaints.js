/* Complaints page. */
(function () {
  "use strict";

  const BHGS = window.BHGS;

  const page = BHGS.createPage({
    render: (state) => BHGS.complaintList.render(state, false),
    afterRender: () => {
      const id = new URLSearchParams(location.search).get("id");
      const complaint = BHGS.store.data.complaints.find((item) => item.id === id);
      document.title = complaint
        ? `Case ${complaint.id} · Bihar Healthcare Grievance System`
        : "Complaints · Bihar Healthcare Grievance System";
    },
  });

  /* Global search (top bar) and ?q= links from other pages filter this table. */
  BHGS.hooks.search = (q) => page.setSearch(q);

  BHGS.layout.init();
  const q = new URLSearchParams(location.search).get("q");
  if (q) page.state.search = q.slice(0, 100);
  page.paint();
})();
