/* ==========================================================================
   Shared config + helpers for Chuka Eng Hub
   -----------------------------------------------------------------------
   1. Deploy the Apps Script project (see /apps-script) as a Web App.
   2. Paste the resulting /exec URL below.
   3. Every page includes this file before its own inline script.
   ========================================================================== */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxnFk1WskpvKwmPGyzu28W2cbZfngTTRxBq_NanI8oo3IyhncHIXo-uffaRnwMjyae/exec";

/**
 * Calls the Apps Script backend.
 * action  -> which doPost/doGet branch to run (see Code.gs)
 * payload -> plain object of form data
 * method  -> "GET" or "POST"
 */
async function callBackend(action, payload = {}, method = "POST") {
  if (method === "GET") {
    const params = new URLSearchParams({ action, ...payload });
    const res = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`);
    return res.json();
  }

  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    // text/plain avoids a CORS preflight against Apps Script Web Apps
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload })
  });
  return res.json();
}

function showMsg(el, text, ok = true) {
  el.textContent = text;
  el.classList.remove("msg-ok", "msg-err");
  el.classList.add("show", ok ? "msg-ok" : "msg-err");
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
