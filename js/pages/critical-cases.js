/* Critical cases page: open complaints with Critical priority. */
(function () {
  "use strict";

  const BHGS = window.BHGS;

  const page = BHGS.createPage({
    render: (state) => BHGS.complaintList.render(state, true),
    afterRender: () => {
      const id = new URLSearchParams(location.search).get("id");
      const complaint = BHGS.store.data.complaints.find((item) => item.id === id);
      document.title = complaint
        ? `Case ${complaint.id} · Bihar Healthcare Grievance System`
        : "Critical cases · Bihar Healthcare Grievance System";
    },
  });

  BHGS.layout.init();
  page.paint();
})();
