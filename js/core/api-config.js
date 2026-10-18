/*
 * API deployment settings. Keep tokens out of this file; configure them at
 * runtime with BHGS_API.setAccessToken after authentication.
 */
(function (global) {
  "use strict";

  global.BHGS_CONFIG = global.BHGS_CONFIG || {};
  global.BHGS_CONFIG.dataMode = global.BHGS_CONFIG.dataMode || "local";
  global.BHGS_CONFIG.apiBaseUrl = global.BHGS_CONFIG.apiBaseUrl || "/api/v1";
  global.BHGS_CONFIG.getAccessToken = global.BHGS_CONFIG.getAccessToken || (() => "");
  global.BHGS_CONFIG.getCsrfToken = global.BHGS_CONFIG.getCsrfToken || (() => "");
})(window);
