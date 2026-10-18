/*
 * api.js — same-origin REST client for the backend contract in api-contract.yaml.
 * Set window.BHGS_CONFIG.apiBaseUrl before this script to use another API origin.
 */
(function (global) {
  "use strict";

  const config = global.BHGS_CONFIG || {};
  const baseUrl = String(config.apiBaseUrl || "/api/v1").replace(/\/+$/, "");
  let accessToken = "";

  class ApiError extends Error {
    constructor(message, status, code) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.code = code || "API_ERROR";
    }
  }

  async function request(method, path, body) {
    const controller = new AbortController();
    const timeout = global.setTimeout(() => controller.abort(), 15000);
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const configuredToken = typeof config.getAccessToken === "function" ? config.getAccessToken() : "";
    const token = accessToken || configuredToken;
    if (token) headers.Authorization = `Bearer ${token}`;
    const csrfToken = typeof config.getCsrfToken === "function" ? config.getCsrfToken() : "";
    if (csrfToken && method !== "GET") headers["X-CSRF-Token"] = csrfToken;

    try {
      const response = await global.fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: "include",
        signal: controller.signal,
      });
      if (response.status === 204) return null;

      const text = await response.text();
      let payload = null;
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch (error) {
          throw new ApiError("The API returned a response that was not valid JSON.", response.status, "INVALID_RESPONSE");
        }
      }
      if (!response.ok) {
        const apiError = payload && payload.error;
        throw new ApiError(
          apiError && apiError.message ? apiError.message : `The API request failed (${response.status}).`,
          response.status,
          apiError && apiError.code
        );
      }
      return payload;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error.name === "AbortError") throw new ApiError("The API request timed out. Check the backend and try again.", 0, "TIMEOUT");
      if (error instanceof TypeError) throw new ApiError("Cannot reach the API. Check the backend URL, server status, and CORS settings.", 0, "NETWORK_ERROR");
      throw error;
    } finally {
      global.clearTimeout(timeout);
    }
  }

  global.BHGS_API = {
    baseUrl,
    request,
    get(path) {
      return request("GET", path);
    },
    post(path, body) {
      return request("POST", path, body);
    },
    put(path, body) {
      return request("PUT", path, body);
    },
    patch(path, body) {
      return request("PATCH", path, body);
    },
    delete(path) {
      return request("DELETE", path);
    },
    setAccessToken(token) {
      accessToken = String(token || "");
    },
    clearAccessToken() {
      accessToken = "";
    },
    ApiError,
  };
  global.BHGS = global.BHGS || {};
  global.BHGS.api = global.BHGS_API;
})(window);
