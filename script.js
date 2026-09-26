"use strict";

/* This placeholder is replaced with your Apps Script URL by the GitHub
   Actions workflow at deploy time (see .github/workflows/deploy.yml). */
const API_URL = "__APPS_SCRIPT_URL__";

const MAX_BYTES = 10 * 1024 * 1024;
const EXCEL_EXT = /\.(xlsx|xls|xlsm|xlsb)$/i;
const SESSION_KEY = "sheetbox.session";

/* ---------- Small helpers ---------- */

const $ = (id) => document.getElementById(id);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function setMsg(id, text, type) {
  const node = $(id);
  node.textContent = text || "";
  node.className = "msg" + (id === "auth-msg" ? " pad-x" : "") + (type ? " " + type : "");
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

async function withBusy(button, label, task) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = label;
  try {
    return await task();
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

/* Tabs: pairs of [tabButton, panel]. Returns a function to select a tab by index. */
function setupTabs(pairs, onChange) {
  function select(index) {
    pairs.forEach(([tab, panel], i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panel.hidden = i !== index;
    });
    if (onChange) onChange(index);
  }
  pairs.forEach(([tab], i) => {
    tab.addEventListener("click", () => select(i));
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = (i + (e.key === "ArrowRight" ? 1 : -1) + pairs.length) % pairs.length;
      select(next);
      pairs[next][0].focus();
    });
  });
  return select;
}

/* ---------- Session ---------- */
//
// sessionStorage (not localStorage) is used on purpose: it's cleared
// automatically when this tab or the browser closes, which is what gives
// us "auto logout on tab/browser close or PC shutdown" for free, with no
// extra events or server calls needed.

let session = null;

function loadSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    // token looks like userId.expiryMs.signature
    if (saved && saved.token && Number(saved.token.split(".")[1]) > Date.now()) return saved;
  } catch (_) { /* storage unavailable or corrupted */ }
  return null;
}

function saveSession(data) {
  session = data;
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch (_) { /* ignore */ }
}

function clearSession() {
  session = null;
  try { sessionStorage.removeItem(SESSION_KEY); } catch (_) { /* ignore */ }
}

/* ---------- API (Google Apps Script) ---------- */

async function api(action, data) {
  if (!API_URL.startsWith("https://")) {
    throw new Error("The server address is not set up yet. Deploy through GitHub Actions.");
  }

  // No custom headers on purpose: this keeps the request "simple" so the
  // browser skips the CORS preflight that Apps Script cannot answer.
  const body = JSON.stringify({ action, token: session ? session.token : undefined, ...data });

  let out;
  try {
    const res = await fetch(API_URL, { method: "POST", body });
    out = await res.json();
  } catch (_) {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }

  if (!out.ok) {
    if (out.code === "AUTH") endSession("Your session has expired. Log in again.");
    throw new Error(out.error || "Something went wrong. Try again.");
  }
  return out;
}

/* ---------- Views ---------- */

const selectAuthTab = setupTabs(
  [[$("tab-login"), $("login-form")], [$("tab-register"), $("register-form")]],
  () => setMsg("auth-msg", "")
);

const selectAppTab = setupTabs(
  [[$("tab-upload"), $("panel-upload")], [$("tab-download"), $("panel-download")]],
  (index) => { if (index === 1) loadFiles(); }
);

function showAuth(message) {
  $("auth-view").hidden = false;
  $("app-view").hidden = true;
  $("user-bar").hidden = true;
  setMsg("auth-msg", message || "", message ? "error" : "");
}

function showApp() {
  $("auth-view").hidden = true;
  $("app-view").hidden = false;
  $("user-bar").hidden = false;
  $("user-name").textContent = session.name;
  resetUpload();
  $("file-list").replaceChildren();
  setMsg("download-msg", "");
  selectAppTab(0);
}

function endSession(message) {
  clearSession();
  showAuth(message);
}

$("logout").addEventListener("click", () => {
  endSession("");
  selectAuthTab(0);
});

/* ---------- Log in and create account ---------- */

function wireAuthForm(form, action, busyLabel, collect) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = form.querySelector("button[type=submit]");
    const data = collect();
    const problem = data.problem;
    if (problem) { setMsg("auth-msg", problem, "error"); return; }
    delete data.problem;

    setMsg("auth-msg", "");
    await withBusy(button, busyLabel, async () => {
      try {
        const out = await api(action, data);
        saveSession({ token: out.token, name: out.name });
        form.reset();
        showApp();
      } catch (err) {
        setMsg("auth-msg", err.message, "error");
      }
    });
  });
}

function phoneProblem(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? "" : "Enter a valid phone number, including the country code if you have one.";
}

wireAuthForm($("login-form"), "login", "Logging in…", () => {
  const phone = $("login-phone").value;
  return { phone, password: $("login-password").value, problem: phoneProblem(phone) };
});

wireAuthForm($("register-form"), "register", "Creating account…", () => {
  const phone = $("reg-phone").value;
  const password = $("reg-password").value;
  let problem = phoneProblem(phone);
  if (!problem && password.length < 8) problem = "Use a password with at least 8 characters.";
  return { name: $("reg-name").value, phone, email: $("reg-email").value, password, problem };
});

/* ---------- Upload ---------- */

const fileInput = $("file-input");
const drop = $("drop");
let queue = [];

function resetUpload() {
  queue = [];
  fileInput.value = "";
  $("picked").replaceChildren();
  $("upload-btn").disabled = true;
  setMsg("upload-msg", "");
}

function pickFiles(fileList) {
  // fileList is often a *live* FileList tied to the <input>. resetUpload()
  // below clears that input, which would empty a live list mid-loop — so
  // copy the files out to a plain array first.
  const files = Array.from(fileList);
  resetUpload();
  for (const file of files) {
    const item = el("li", "picked-item");
    const status = el("span", "picked-status");

    let problem = "";
    if (!EXCEL_EXT.test(file.name)) problem = "Not an Excel file";
    else if (file.size === 0) problem = "This file is empty";
    else if (file.size > MAX_BYTES) problem = "Larger than 10 MB";

    status.textContent = problem || "Ready to upload";
    if (problem) item.classList.add("bad");
    else queue.push({ file, item, status });

    item.append(el("span", "picked-name", file.name), el("span", "picked-size", formatSize(file.size)), status);
    $("picked").append(item);
  }
  $("upload-btn").disabled = queue.length === 0;
}

function readBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Could not read this file."));
    reader.readAsDataURL(file);
  });
}

fileInput.addEventListener("change", () => pickFiles(fileInput.files));

["dragenter", "dragover"].forEach((type) =>
  drop.addEventListener(type, (e) => { e.preventDefault(); drop.classList.add("over"); })
);
["dragleave", "drop"].forEach((type) =>
  drop.addEventListener(type, (e) => { e.preventDefault(); drop.classList.remove("over"); })
);
drop.addEventListener("drop", (e) => pickFiles(e.dataTransfer.files));

$("upload-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!queue.length) return;

  const batch = queue;
  queue = [];
  fileInput.value = "";
  $("upload-btn").disabled = true;
  setMsg("upload-msg", "");

  let uploaded = 0;
  for (const { file, item, status } of batch) {
    status.textContent = "Uploading…";
    try {
      const data = await readBase64(file);
      await api("upload", { filename: file.name, data });
      status.textContent = "Uploaded";
      item.classList.add("done");
      uploaded++;
    } catch (err) {
      status.textContent = err.message;
      item.classList.add("bad");
      if (!session) return; // session ended, the log in screen is showing
    }
  }

  const noun = batch.length === 1 ? "file" : "files";
  if (uploaded === batch.length) setMsg("upload-msg", `${uploaded} ${noun} uploaded.`, "success");
  else setMsg("upload-msg", `${uploaded} of ${batch.length} ${noun} uploaded. Check the ones marked in red.`, "error");
});

/* ---------- Download ---------- */

async function loadFiles() {
  const list = $("file-list");
  list.replaceChildren();
  setMsg("download-msg", "Loading your files…");
  try {
    const out = await api("list");
    setMsg("download-msg", "");
    renderFiles(out.files || []);
  } catch (err) {
    setMsg("download-msg", err.message, "error");
  }
}

function renderFiles(files) {
  const list = $("file-list");
  list.replaceChildren();

  if (!files.length) {
    const empty = el("div", "empty");
    const goUpload = el("button", "btn quiet", "Upload a file");
    goUpload.type = "button";
    goUpload.addEventListener("click", () => selectAppTab(0));
    empty.append(el("p", "", "You have no files yet."), goUpload);
    list.append(empty);
    return;
  }

  const byDate = new Map();
  for (const f of files) {
    if (!byDate.has(f.date)) byDate.set(f.date, []);
    byDate.get(f.date).push(f);
  }

  for (const date of [...byDate.keys()].sort().reverse()) {
    const group = byDate.get(date).sort((a, b) => a.name.localeCompare(b.name));
    const day = el("section", "day");

    const head = el("h2", "day-head");
    const when = el("time", "", formatDay(date));
    when.dateTime = date;
    head.append(when, el("small", "", `${group.length} ${group.length === 1 ? "file" : "files"}`));

    const ul = el("ul", "files");
    for (const f of group) {
      const li = el("li");
      const actions = el("div", "file-actions");

      const dlButton = el("button", "btn quiet small", "Download");
      dlButton.type = "button";
      dlButton.setAttribute("aria-label", `Download ${f.name}`);
      dlButton.addEventListener("click", () => downloadFile(f, dlButton));

      const delButton = el("button", "btn quiet small danger", "Delete");
      delButton.type = "button";
      delButton.setAttribute("aria-label", `Delete ${f.name}`);
      delButton.addEventListener("click", () => deleteFileClient(f, delButton, li, day, head));

      actions.append(dlButton, delButton);
      li.append(el("span", "file-name", f.name), el("span", "file-size", formatSize(f.size)), actions);
      ul.append(li);
    }

    day.append(head, ul);
    list.append(day);
  }
}

function base64ToBlob(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "application/octet-stream" });
}

async function downloadFile(file, button) {
  setMsg("download-msg", "");
  await withBusy(button, "Preparing…", async () => {
    try {
      const out = await api("download", { date: file.date, name: file.name });
      const url = URL.createObjectURL(base64ToBlob(out.data));
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      setMsg("download-msg", err.message, "error");
    }
  });
}

async function deleteFileClient(file, button, row, daySection, dayHead) {
  if (!window.confirm(`Delete "${file.name}"? This can't be undone.`)) return;

  setMsg("download-msg", "");
  await withBusy(button, "Deleting…", async () => {
    try {
      await api("delete", { date: file.date, name: file.name });
      row.remove();

      const remaining = daySection.querySelectorAll("li").length;
      if (remaining === 0) {
        daySection.remove();
        if (!$("file-list").querySelector(".day")) renderFiles([]); // show the empty state again
      } else {
        dayHead.querySelector("small").textContent = `${remaining} ${remaining === 1 ? "file" : "files"}`;
      }
    } catch (err) {
      setMsg("download-msg", err.message, "error");
    }
  });
}

/* ---------- Start ---------- */

session = loadSession();
if (session) showApp();
else { clearSession(); showAuth(""); }
