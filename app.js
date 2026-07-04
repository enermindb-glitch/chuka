/* ==========================================================================
   Shared config + helpers for Chuka Eng Hub
   -----------------------------------------------------------------------
   1. Deploy the Apps Script project (see /apps-script) as a Web App.
   2. Paste the resulting /exec URL below.
   3. Every page includes this file before its own inline script.
   ========================================================================== */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxwyVk7nxpfo5jKKdaSE_9jtpXsK8i6dhT59krCd2tNS-bc7drhvmcZg89RJFDfWZe/exec";

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

/* ==========================================================================
   Classes: shared across timetable, groups, personnel, events, and admin.
   ========================================================================== */

async function fetchClasses() {
  try {
    const result = await callBackend("getClasses", {}, "GET");
    return (result.success && result.classes) ? result.classes : [];
  } catch (err) {
    return [];
  }
}

/**
 * Fills a <select> with class options.
 * mode "require"  -> entry must belong to exactly one class (e.g. weekly timetable)
 * mode "optional" -> entry may apply to everyone if left blank (admin add-forms)
 * mode "filter"   -> viewer picking which class to view, defaults to "All classes"
 */
function populateClassSelect(selectEl, classes, mode = "filter") {
  let html = "";
  if (mode === "require") {
    html += `<option value="" disabled selected>Select class</option>`;
  } else if (mode === "optional") {
    html += `<option value="">Not class-specific (applies to everyone)</option>`;
  } else {
    html += `<option value="">All classes</option>`;
  }
  html += classes.map(c => `<option value="${c}">${c}</option>`).join("");
  selectEl.innerHTML = html;
}

/** Groups an array of rows by row.className into ordered {label, rows} buckets. */
function groupByClass(rows, unassignedLabel = "General / all classes") {
  const buckets = {};
  rows.forEach(r => {
    const key = r.className || unassignedLabel;
    (buckets[key] = buckets[key] || []).push(r);
  });
  return Object.keys(buckets)
    .sort((a, b) => {
      if (a === unassignedLabel) return 1;
      if (b === unassignedLabel) return -1;
      return a.localeCompare(b);
    })
    .map(label => ({ label, rows: buckets[label] }));
}

/* ==========================================================================
   PWA: service worker registration + "Install app" prompt
   Runs on every page since every page includes app.js.
   ========================================================================== */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  });
}

let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  showInstallButton();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  hideInstallButton();
});

function showInstallButton() {
  // Don't show if already installed/standalone, or already added.
  if (window.matchMedia("(display-mode: standalone)").matches) return;
  if (document.getElementById("pwa-install-btn")) return;

  const btn = document.createElement("button");
  btn.id = "pwa-install-btn";
  btn.type = "button";
  btn.textContent = "⬇ Install app";
  btn.setAttribute("aria-label", "Install Chuka Eng Hub app");
  Object.assign(btn.style, {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    zIndex: "9999",
    padding: "10px 16px",
    borderRadius: "999px",
    border: "1px solid #FFB800",
    background: "#0B2545",
    color: "#FFB800",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: "600",
    fontSize: "14px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
    cursor: "pointer"
  });

  btn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    btn.disabled = true;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    hideInstallButton();
  });

  document.body.appendChild(btn);
}

function hideInstallButton() {
  const btn = document.getElementById("pwa-install-btn");
  if (btn) btn.remove();
}
