import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { ARUX_EVIDENCE_PATH, ARUX_IDS, validateAruxEvidence } from "./arux-evidence-validate.mjs";

const QA_EMAIL = "smartflow-local-qa@example.com";
const APP_URL = process.env.SMARTFLOW_ARUX_APP_URL ?? "http://127.0.0.1:8080";
const DEBUG_PORT = Number(process.env.SMARTFLOW_ARUX_CDP_PORT ?? "9223");
const LOCAL_WORKER_URL = process.env.VITE_AGENT_WORKER_URL ?? "http://127.0.0.1:8787";
const AUTH_SMOKE_PATH = path.join("docs", "testing", "evidence", "auth-smoke-latest.json");
const RTL_SCREENSHOT_DIR = path.join("docs", "testing", "evidence", "screenshots");
const PROPOSAL_SOURCE = "deterministic-browser-stub";
const NETWORK_TRANSPORT = "intercepted-browser-fetch";
const LAYERS_EXCLUDED = [
  "real LLM intent recognition",
  "real agent worker transport",
  "real multilingual reasoning behavior through the worker path",
];
const REAL_PROPOSAL_PATH = {
  status: "BLOCKED",
  reason: "No local model credential is available, and the deployed worker is production-connected.",
  networkTransportExercised: false,
  layersNotValidated: [...LAYERS_EXCLUDED],
};
const BROWSER_PATHS = [
  process.env.SMARTFLOW_ARUX_BROWSER,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean);

const ROWS = [
  {
    id: "ARUX-01",
    scenario: "empty",
    tool: "tasks.list",
    prompt: "Show my open tasks.",
    languageMode: "en",
    expected: "No active tasks are reported.",
    mustContain: [/no active tasks/i, /0 active tasks/i],
    forbidden: [/taskId/i, /requestId/i, /schemaVersion/i],
  },
  {
    id: "ARUX-02",
    scenario: "arux-one-task",
    tool: "tasks.list",
    prompt: "Show my open tasks.",
    languageMode: "en",
    expected: "One active task is reported with bounded details.",
    mustContain: [/1 active task/i, /Review active task list/i],
    forbidden: [/taskId/i, /requestId/i, /schemaVersion/i],
  },
  {
    id: "ARUX-03",
    scenario: "arux-six-tasks",
    tool: "tasks.list",
    prompt: "What tasks do I have today?",
    languageMode: "en",
    expected: "Six active tasks are reported with bounded preview details.",
    mustContain: [/6 active tasks/i, /Review active task list/i],
    forbidden: [/taskId/i, /requestId/i, /private notes/i],
  },
  {
    id: "ARUX-04",
    scenario: "arux-workspace-rich",
    tool: "tasks.list",
    prompt: "What tasks need attention?",
    languageMode: "en",
    expected: "Task response preserves active task and workspace signal facts without personality claims.",
    mustContain: [/6 active tasks/i, /due today|due/i],
    forbidden: [/productive/i, /lazy/i, /disciplined/i, /taskId/i],
  },
  {
    id: "ARUX-05",
    scenario: "arux-one-task",
    tool: "calendar.list_today",
    prompt: "What is on my calendar today?",
    languageMode: "en",
    expected: "Calendar response reports no events without claiming a created focus block.",
    mustContain: [/no events/i, /calendar/i],
    forbidden: [/reserved/i, /created/i, /requestId/i],
  },
  {
    id: "ARUX-06",
    scenario: "arux-calendar-two",
    tool: "calendar.list_today",
    prompt: "Show today's calendar.",
    languageMode: "en",
    expected: "Calendar response reports two events.",
    mustContain: [/2 events/i, /planning block/i],
    forbidden: [/requestId/i, /schemaVersion/i],
  },
  {
    id: "ARUX-07",
    scenario: "empty",
    tool: "learning.get_progress",
    prompt: "Show my learning progress.",
    languageMode: "en",
    expected: "Learning response reports no visible progress without inventing a lesson.",
    mustContain: [/no learning progress/i, /no .*learning/i],
    forbidden: [/continue Sorting/i, /mastery/i, /requestId/i],
  },
  {
    id: "ARUX-08",
    scenario: "arux-learning-two",
    tool: "learning.get_progress",
    prompt: "Continue my learning.",
    languageMode: "en",
    expected: "Learning response reports two learning items.",
    mustContain: [/2 learning items/i, /Sorting Algorithms|OOP Fundamentals/i],
    forbidden: [/completed a lesson/i, /requestId/i],
  },
  {
    id: "ARUX-09",
    scenario: "arux-workspace-rich",
    tool: "workspace.get_context",
    prompt: "Summarize my workspace.",
    languageMode: "en",
    expected: "Workspace response stays bounded and hides engine internals.",
    mustContain: [/workspace/i, /goal|focus|context/i],
    forbidden: [/Decision Intelligence/i, /Priority Engine/i, /WorkspaceMemory/i, /score/i],
  },
  {
    id: "ARUX-10",
    scenario: "arux-complete-target",
    tool: "tasks.complete",
    prompt: "Mark the selected task done.",
    languageMode: "en",
    expected: "Explicit review, approval, and run completes the selected task.",
    mustContain: [/marked complete/i, /complete/i],
    forbidden: [/taskId/i, /requestId/i, /before verification/i],
  },
  {
    id: "ARUX-11",
    scenario: "arux-completed-target",
    tool: "tasks.complete",
    prompt: "Mark the selected task done again.",
    languageMode: "en",
    expected: "Already-complete task reports no new state change.",
    mustContain: [/already complete/i, /no new change/i],
    forbidden: [/marked complete now/i, /taskId/i, /requestId/i],
  },
  {
    id: "ARUX-12",
    scenario: "empty",
    tool: "tasks.list",
    prompt: "Show my open tasks.",
    languageMode: "en",
    expected: "Runtime zero-task result is preserved and stale six-task context is not shown.",
    mustContain: [/no active tasks/i, /0 active tasks/i],
    forbidden: [/6 active tasks/i, /Review active task list/i, /requestId/i],
  },
  {
    id: "ARUX-13",
    scenario: "arux-two-tasks",
    tool: "tasks.list",
    prompt: "کارهای باز من را نشان بده.",
    languageMode: "fa",
    expected: "Persian RTL response preserves two active tasks.",
    mustContain: [/2|۲|دو/, /کار|وظیفه|فعال/],
    forbidden: [/requestId/i, /schemaVersion/i],
    rtl: true,
  },
  {
    id: "ARUX-14",
    scenario: "empty",
    tool: "calendar.list_today",
    prompt: "Zeig mir die heutigen Termine.",
    languageMode: "de",
    expected: "German response reports no events today.",
    mustContain: [/keine|0|frei/i, /termin|kalender|ereignis/i],
    forbidden: [/No events today/i, /requestId/i],
  },
  {
    id: "ARUX-15",
    scenario: "arux-learning-two",
    tool: "learning.get_progress",
    prompt: "ادامه درس من را نشان بده.",
    languageMode: "auto",
    expected: "Auto language resolves to Persian and preserves two learning items.",
    mustContain: [/2|۲|دو/, /یادگیری|درس/],
    forbidden: [/requestId/i, /schemaVersion/i],
    rtl: true,
  },
];

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function browserPath() {
  const found = BROWSER_PATHS.find((candidate) => candidate && fs.existsSync(candidate));
  if (!found) throw new Error("No Edge or Chrome executable found for ARUX browser QA.");
  return found;
}

function sanitizeText(text) {
  return String(text)
    .replace(/\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[email]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[jwt]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .slice(-1800);
}

function atomicWriteJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, filePath);
}

function readEvidence() {
  if (!fs.existsSync(ARUX_EVIDENCE_PATH)) {
    return {
      schemaVersion: "agent-response-ux-validation-v1",
      canonical: true,
      generatedAt: new Date().toISOString(),
      environment: {
        app: APP_URL,
        data: "local-supabase",
        worker: PROPOSAL_SOURCE,
        networkTransport: NETWORK_TRANSPORT,
      },
      realProposalPath: REAL_PROPOSAL_PATH,
      rows: [],
    };
  }
  return JSON.parse(fs.readFileSync(ARUX_EVIDENCE_PATH, "utf8"));
}

function proposalCoverage(row, completed) {
  const layersExercised = completed
    ? [
        "visible Chat UI",
        "deterministic intent validator",
        "tool resolver",
        row.tool === "tasks.complete" ? "explicit approval and run separation" : "explicit read-only run action",
        "runtime and policy boundary",
        "response composer",
        ...(row.tool === "tasks.complete" ? ["local Supabase task persistence verification"] : []),
        ...(row.rtl ? ["RTL rendering"] : []),
      ]
    : [];
  return {
    proposalSource: PROPOSAL_SOURCE,
    networkTransport: NETWORK_TRANSPORT,
    proposalStrategy: "deterministic domain-keyword stub; not natural-language understanding",
    layersExercised,
    layersExcluded: completed
      ? LAYERS_EXCLUDED
      : [...LAYERS_EXCLUDED, "controlled browser integration layers were not completed"],
    realReasoningCoverage: "blocked-not-exercised",
  };
}

function writeRow(row) {
  const evidence = readEvidence();
  evidence.generatedAt = new Date().toISOString();
  evidence.environment = {
    app: APP_URL,
    data: "local-supabase",
    worker: PROPOSAL_SOURCE,
    networkTransport: NETWORK_TRANSPORT,
    status: "controlled-browser-integration-complete-real-worker-blocked",
  };
  evidence.realProposalPath = REAL_PROPOSAL_PATH;
  evidence.rows = [...evidence.rows.filter((item) => item.id !== row.id), row]
    .sort((a, b) => ARUX_IDS.indexOf(a.id) - ARUX_IDS.indexOf(b.id));
  atomicWriteJson(ARUX_EVIDENCE_PATH, evidence);
}

function runSeed(scenario) {
  const result = spawnSync(process.execPath, ["scripts/local-qa-seed.mjs", "--scenario", scenario], {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`Seed failed for ${scenario}: ${sanitizeText(result.stderr || result.stdout)}`);
  }
}

async function waitForHttpJson(url, timeoutMs = 15000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      return await httpJsonWithTimeout(url, {}, 1000);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

async function httpJsonWithTimeout(url, options = {}, timeoutMs = 5000) {
  return await new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: `${parsed.pathname}${parsed.search}`,
        method: options.method ?? "GET",
        timeout: timeoutMs,
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode ?? "unknown"} for ${url}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error(`Invalid JSON for ${url}`));
          }
        });
      },
    );
    req.on("timeout", () => {
      req.destroy(new Error(`${options.method ?? "GET"} ${url} timed out after ${timeoutMs}ms`));
    });
    req.on("error", reject);
    req.end();
  });
}

function smokeTrace(message) {
  if (process.argv.includes("--smoke-auth")) {
    process.stderr.write(`[auth-smoke] ${message}\n`);
  }
}

function withTimeout(promise, label, timeoutMs) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

class CdpSession {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    this.socketFailure = null;
  }

  async open() {
    const failPending = (reason) => {
      this.socketFailure = reason;
      for (const [id, deferred] of this.pending) {
        clearTimeout(deferred.timer);
        deferred.reject(new Error(`${reason} (pending CDP request ${id})`));
      }
      this.pending.clear();
    };

    this.ws.addEventListener("message", (event) => {
      const data = JSON.parse(String(event.data));
      if (!data.id) {
        this.events.push(data);
        return;
      }
      const deferred = this.pending.get(data.id);
      if (!deferred) return;
      clearTimeout(deferred.timer);
      this.pending.delete(data.id);
      if (data.error) deferred.reject(new Error(data.error.message));
      else deferred.resolve(data.result);
    });
    this.ws.addEventListener("error", (event) => {
      const detail = event?.message || event?.error?.message || "CDP websocket error";
      failPending(detail);
    });
    this.ws.addEventListener("close", (event) => {
      failPending(`CDP websocket closed (${event.code}${event.reason ? `: ${event.reason}` : ""})`);
    });

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("CDP websocket open timed out")), 10000);
      this.ws.addEventListener("open", () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      this.ws.addEventListener("error", (event) => {
        clearTimeout(timer);
        reject(new Error(event?.message || event?.error?.message || "CDP websocket open failed"));
      }, { once: true });
    });
  }

  send(method, params = {}, timeoutMs = 10000) {
    if (this.socketFailure) {
      return Promise.reject(new Error(this.socketFailure));
    }
    if (this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error(`CDP websocket is not open (readyState ${this.ws.readyState})`));
    }
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(payload);
    });
  }

  async evaluate(expression, timeoutMs = 10000) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      timeout: timeoutMs,
    }, timeoutMs + 1000);
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text ?? "Runtime.evaluate failed");
    }
    return result.result?.value;
  }

  recentEvents() {
    return [...this.events];
  }

  close() {
    this.ws.close();
  }
}

async function launchBrowser() {
  const profileDir = path.join(os.tmpdir(), `smartflow-arux-cdp-${process.pid}`);
  const output = { stdout: "", stderr: "" };
  const launchArgs = [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profileDir}`,
    "--remote-allow-origins=*",
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1440,1000",
    "about:blank",
  ];
  if (process.env.SMARTFLOW_ARUX_HEADED !== "1") {
    launchArgs.unshift("--headless=new");
  }
  const proc = spawn(browserPath(), launchArgs, { stdio: ["ignore", "pipe", "pipe"] });
  proc.stdout?.on("data", (chunk) => {
    output.stdout = `${output.stdout}${String(chunk)}`.slice(-4000);
  });
  proc.stderr?.on("data", (chunk) => {
    output.stderr = `${output.stderr}${String(chunk)}`.slice(-4000);
  });
  await waitForHttpJson(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
  return { proc, profileDir, output };
}

function browserProcessDiagnostics(browser) {
  return {
    exitCode: browser.proc.exitCode,
    signalCode: browser.proc.signalCode,
    killed: browser.proc.killed,
    stdout: sanitizeText(browser.output.stdout),
    stderr: sanitizeText(browser.output.stderr),
  };
}

async function newPage() {
  const targetUrl = `http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`;
  let target;
  try {
    target = await httpJsonWithTimeout(targetUrl, { method: "PUT" }, 5000);
  } catch (error) {
    smokeTrace(`PUT /json/new failed: ${error instanceof Error ? error.message : String(error)}`);
    target = await httpJsonWithTimeout(targetUrl, {}, 5000);
  }
  const wsUrl = String(target.webSocketDebuggerUrl).replace("ws://localhost:", "ws://127.0.0.1:");
  smokeTrace(`connecting websocket ${wsUrl.replace(/\/devtools\/page\/.+$/, "/devtools/page/[redacted]")}`);
  const cdp = new CdpSession(wsUrl);
  await cdp.open();
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  await cdp.send("Network.enable");
  await cdp.send("Log.enable");
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      (() => {
        const makeIntent = (prompt, responseLanguage) => {
          const userMessage = String(prompt).match(/User message: ([\\s\\S]*)$/)?.[1]?.trim() || "";
          const lower = userMessage.toLowerCase();
          const now = new Date().toISOString();
          let type = "inspect_tasks";
          let toolId = "tasks.list";
          let requestedDomain = "tasks";
          if (/calendar|kalender|termine|termin|تقویم|قرار|جلسه/.test(lower)) {
            type = "inspect_calendar";
            toolId = "calendar.list_today";
            requestedDomain = "calendar";
          } else if (/learning|learn|درس|یادگیری|ادامه درس/.test(lower)) {
            type = "inspect_learning";
            toolId = "learning.get_progress";
            requestedDomain = "learning";
          } else if (/workspace|summarize my workspace/.test(lower)) {
            type = "inspect_workspace";
            toolId = "workspace.get_context";
            requestedDomain = "workspace";
          }
          return {
            id: "intent-arux-" + now,
            type,
            confidence: "high",
            userMessage,
            requestedDomain,
            toolId,
            requiresTool: true,
            requiresApproval: false,
            reasons: ["Local ARUX browser QA proposal."],
            language: responseLanguage || "en",
            generatedAt: now,
            schemaVersion: 1,
          };
        };
        const originalFetch = window.fetch.bind(window);
        window.fetch = async (input, init) => {
          const url = typeof input === "string" ? input : input?.url;
          if (String(url).replace(/\\/+$/, "") === "${LOCAL_WORKER_URL}/chat") {
            const body = JSON.parse(init?.body || "{}");
            return new Response(JSON.stringify({ intent: makeIntent(body.message, body.responseLanguage) }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
          return originalFetch(input, init);
        };
      })();
    `,
  });
  return cdp;
}

async function waitFor(cdp, expression, timeoutMs = 15000) {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeoutMs) {
    try {
      last = await cdp.evaluate(expression, 5000);
      if (last) return last;
    } catch {
      // Keep polling until timeout.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for expression: ${expression.slice(0, 120)}`);
}

async function navigate(cdp, url) {
  await cdp.send("Page.navigate", { url });
  await waitFor(cdp, "document.readyState === 'complete' || document.readyState === 'interactive'");
}

async function signInIfNeeded(cdp, password) {
  await waitFor(cdp, "Boolean(location.pathname === '/auth' || document.querySelector('textarea') || document.body.innerText.includes('Dashboard'))", 20000);
  const isAuth = await cdp.evaluate("location.pathname === '/auth'");
  if (!isAuth) return;
  await waitFor(cdp, "Boolean(document.querySelector('input[type=email]') && document.querySelector('input[type=password]'))");
  await cdp.evaluate(`
    (() => {
      const setValue = (el, value) => {
        const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
        setter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };
      setValue(document.querySelector('input[type=email]'), ${JSON.stringify(QA_EMAIL)});
      setValue(document.querySelector('input[type=password]'), ${JSON.stringify(password)});
      [...document.querySelectorAll('button')].find((button) => /sign in/i.test(button.textContent || ''))?.click();
    })();
  `);
  await waitFor(cdp, "location.pathname !== '/auth'", 20000);
}

async function prepareChat(cdp, row, password) {
  await navigate(cdp, `${APP_URL}/chat`);
  await signInIfNeeded(cdp, password);
  await cdp.evaluate(`
    localStorage.setItem('smartflow:v1:ai-defaults', JSON.stringify({ aiResponseLanguage: ${JSON.stringify(row.languageMode)} }));
    sessionStorage.setItem('smartflow:v1:launched', 'true');
  `);
  await navigate(cdp, `${APP_URL}/chat`);
  await waitFor(cdp, "document.querySelector('textarea') && !document.querySelector('textarea').disabled", 25000);
  if (row.tool === "tasks.complete") {
    await waitFor(cdp, "/1\\s+Tasks created/i.test(document.body.innerText)", 15000);
  }
  // Let the render that exposed the bounded fixture count update callback state.
  await new Promise((resolve) => setTimeout(resolve, 250));
}

async function clickButton(cdp, textRegex, timeoutMs = 15000) {
  const source = `
    (() => {
      const regex = new RegExp(${JSON.stringify(textRegex.source)}, ${JSON.stringify(textRegex.flags)});
      const button = [...document.querySelectorAll('button')]
        .find((item) => regex.test((item.textContent || '').trim()) && !item.disabled);
      if (!button) return false;
      button.click();
      return true;
    })()
  `;
  await waitFor(cdp, source, timeoutMs);
}

async function submitPrompt(cdp, prompt) {
  await cdp.evaluate(`
    (() => {
      const textarea = document.querySelector('textarea');
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(textarea), 'value').set;
      setter.call(textarea, ${JSON.stringify(prompt)});
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    })();
  `);
  await new Promise((resolve) => setTimeout(resolve, 150));
  await clickButton(cdp, /^Send$/i);
}

async function bodyText(cdp) {
  return sanitizeText(await cdp.evaluate("document.body.innerText"));
}

async function collectBrowserDiagnostics(cdp) {
  const page = await cdp.evaluate(`
    (() => {
      const authKeys = Object.keys(localStorage).filter((key) => /supabase|auth/i.test(key));
      const root = document.querySelector('#root');
      return {
        currentUrl: location.href,
        pathname: location.pathname,
        readyState: document.readyState,
        renderedText: document.body?.innerText?.slice(0, 700) || "",
        bodyTextContent: document.body?.textContent?.slice(0, 700) || "",
        renderedHtmlLength: document.documentElement?.outerHTML?.length || 0,
        rootChildCount: root?.childElementCount ?? null,
        rootHtmlLength: root?.innerHTML?.length ?? null,
        scripts: [...document.scripts].map((script) => script.src || "inline").slice(0, 20),
        resources: performance.getEntriesByType('resource').map((entry) => ({
          name: entry.name,
          initiatorType: entry.initiatorType,
          duration: Math.round(entry.duration),
        })).slice(0, 40),
        selectors: {
          emailInput: Boolean(document.querySelector('input[type=email]')),
          passwordInput: Boolean(document.querySelector('input[type=password]')),
          textarea: Boolean(document.querySelector('textarea')),
          signInButton: Boolean([...document.querySelectorAll('button')].find((button) => /sign in/i.test(button.textContent || ''))),
        },
        staleAuthenticatedSession: authKeys.length > 0,
        authStorageKeyCount: authKeys.length,
      };
    })()
  `);
  const events = cdp.recentEvents();
  const requestUrls = new Map(
    events
      .filter((event) => event.method === "Network.requestWillBeSent")
      .map((event) => [event.params?.requestId, event.params?.request?.url]),
  );
  const failedNetworkRequests = events
    .filter((event) => event.method === "Network.loadingFailed")
    .map((event) => ({
      url: requestUrls.get(event.params?.requestId),
      errorText: event.params?.errorText,
      canceled: event.params?.canceled,
      type: event.params?.type,
    }));
  const networkResponses = events
    .filter((event) => event.method === "Network.responseReceived")
    .map((event) => ({
      url: event.params?.response?.url,
      status: event.params?.response?.status,
      mimeType: event.params?.response?.mimeType,
      type: event.params?.type,
    }))
    .slice(-80);
  const consoleErrors = events
    .filter((event) => event.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(event.params?.type))
    .map((event) => ({
      type: event.params?.type,
      text: event.params?.args?.map((arg) => sanitizeText(arg.value ?? arg.description ?? "")).join(" "),
    }));
  const logErrors = events
    .filter((event) => event.method === "Log.entryAdded" && ["error", "warning"].includes(event.params?.entry?.level))
    .map((event) => ({
      level: event.params?.entry?.level,
      source: event.params?.entry?.source,
      text: sanitizeText(event.params?.entry?.text ?? ""),
      url: event.params?.entry?.url,
    }));
  const runtimeExceptions = events
    .filter((event) => event.method === "Runtime.exceptionThrown")
    .map((event) => ({
      text: sanitizeText(event.params?.exceptionDetails?.text ?? ""),
      description: sanitizeText(event.params?.exceptionDetails?.exception?.description ?? ""),
      url: event.params?.exceptionDetails?.url,
      lineNumber: event.params?.exceptionDetails?.lineNumber,
    }));

  return {
    page: {
      ...page,
      renderedText: sanitizeText(page.renderedText),
    },
    failedNetworkRequests,
    networkResponses,
    consoleErrors,
    logErrors,
    runtimeExceptions,
  };
}

async function checkBrowserSupabaseReachability(cdp) {
  return cdp.evaluate(`
    (async () => {
      try {
        const response = await fetch(${JSON.stringify(requiredEnv("SUPABASE_LOCAL_URL"))} + "/auth/v1/health", {
          headers: { apikey: ${JSON.stringify(requiredEnv("SUPABASE_LOCAL_ANON_KEY"))} },
        });
        return { reachable: true, status: response.status, ok: response.ok };
      } catch (error) {
        return { reachable: false, error: String(error?.message || error) };
      }
    })()
  `);
}

function checksPass(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function forbiddenPass(text, patterns) {
  return patterns.every((pattern) => !pattern.test(text));
}

async function verifyPersistedState(row) {
  if (row.tool !== "tasks.complete") return { checked: false, result: "not applicable" };
  const admin = createClient(requiredEnv("SUPABASE_LOCAL_URL"), requiredEnv("SUPABASE_LOCAL_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: users, error: usersError } = await admin.auth.admin.listUsers();
  if (usersError) throw usersError;
  const user = users.users.find((item) => item.email?.toLowerCase() === QA_EMAIL);
  if (!user) throw new Error("Local QA user not found for persisted-state verification.");
  const { data, error } = await admin
    .from("tasks")
    .select("title,completed")
    .eq("user_id", user.id)
    .eq("title", "Selected task")
    .maybeSingle();
  if (error) throw error;
  return {
    checked: true,
    result: data?.completed === true ? "selected task completed" : "selected task not completed",
    passed: data?.completed === true,
  };
}

async function captureRtlScreenshot(cdp, row) {
  if (!row.rtl) return { checked: false };

  fs.mkdirSync(RTL_SCREENSHOT_DIR, { recursive: true });
  const filePath = path.join(RTL_SCREENSHOT_DIR, `${row.id.toLowerCase()}.png`);
  const result = await cdp.send(
    "Page.captureScreenshot",
    { format: "png", captureBeyondViewport: false },
    15000,
  );
  fs.writeFileSync(filePath, Buffer.from(result.data, "base64"));

  return {
    checked: true,
    path: filePath.replaceAll("\\", "/"),
  };
}

async function runRow(row, cdp, password) {
  runSeed(row.scenario);
  await cdp.send("Network.clearBrowserCookies");
  await cdp.send("Storage.clearDataForOrigin", {
    origin: APP_URL,
    storageTypes: "all",
  });
  await prepareChat(cdp, row, password);
  await submitPrompt(cdp, row.prompt);
  await waitFor(
    cdp,
    "document.body.innerText.toLowerCase().includes('interpreted intent') || document.body.innerText.includes('نیت تشخیص داده شد')",
    20000,
  );

  const actions = ["Submit prompt"];
  if (row.tool === "tasks.complete") {
    await clickButton(cdp, /Review approval/i);
    actions.push("Review approval");
    await waitFor(cdp, "document.body.innerText.includes('Review this action')");
    await clickButton(cdp, /^Approve$/i);
    actions.push("Approve");
    await waitFor(cdp, "document.body.innerText.includes('Approved for this exact task') || document.body.innerText.includes('Complete task')", 10000);
    await clickButton(cdp, /^Complete task$/i);
    actions.push("Complete task");
  } else {
    await clickButton(cdp, new RegExp(`Run\\s+${row.tool.replaceAll(".", "\\.")}`, "i"));
    actions.push(`Run ${row.tool}`);
  }

  await waitFor(cdp, `(() => {
    const text = document.body.innerText;
    return !text.includes('Typing') && !text.includes('Running...') && (${row.mustContain.map((pattern) => `${pattern}.test(text)`).join(" || ")});
  })()`, 25000).catch(() => undefined);

  const visible = await bodyText(cdp);
  const persisted = await verifyPersistedState(row);
  const screenshotEvidence = await captureRtlScreenshot(cdp, row);
  const rtl = row.rtl
    ? await cdp.evaluate(`
        (() => {
          const fa = [...document.querySelectorAll('[lang="fa"][dir="rtl"]')].pop();
          const isolatedBlocks = fa ? [...fa.querySelectorAll('[dir="auto"]')] : [];
          const latinBlocks = isolatedBlocks.filter((element) => /[A-Za-z]/.test(element.textContent || ''));
          return {
            checked: true,
            direction: fa ? getComputedStyle(fa).direction || fa.getAttribute('dir') || '' : '',
            isolatedNaturalLanguageBlockCount: isolatedBlocks.length,
            latinBlockCount: latinBlocks.length,
            latinBlockDirections: latinBlocks.map((element) => getComputedStyle(element).direction),
            latinBlocksNaturallyLtr: latinBlocks.every((element) => getComputedStyle(element).direction === 'ltr'),
          };
        })()
      `)
    : { checked: false };
  const expectedOk = checksPass(visible, row.mustContain);
  const forbiddenOk = forbiddenPass(visible, row.forbidden);
  const runtimeOk = !/Failed to send|Worker responded|error/i.test(visible);
  const persistedOk = !persisted.checked || persisted.passed;
  const rtlOk =
    !row.rtl ||
    (rtl.direction === "rtl" &&
      rtl.isolatedNaturalLanguageBlockCount > 0 &&
      rtl.latinBlockCount > 0 &&
      rtl.latinBlocksNaturallyLtr === true);

  return {
    id: row.id,
    executedAt: new Date().toISOString(),
    fixture: row.scenario,
    scenario: row.scenario,
    tool: row.tool,
    initialBoundedState: {
      scenario: row.scenario,
      localOnly: true,
    },
    prompt: row.prompt,
    interfaceLanguage: "en",
    aiResponseLanguageMode: row.languageMode,
    visibleUiActions: actions,
    sanitizedVisibleResponse: visible,
    expectedResult: row.expected,
    actualResult: expectedOk ? row.expected : "Expected bounded result was not visible.",
    status: expectedOk && forbiddenOk && runtimeOk && persistedOk && rtlOk ? "PASS" : "FAIL",
    forbiddenMetadataCheck: {
      passed: forbiddenOk,
      forbiddenPatterns: row.forbidden.map((pattern) => pattern.toString()),
    },
    browserRuntimeErrorCheck: {
      passed: runtimeOk,
      result: runtimeOk ? "no browser/runtime error detected in visible UI" : "error text detected",
    },
    persistedStateVerification: persisted,
    rtlEvidence: rtl,
    screenshotEvidence,
    evidenceMethod: "authenticated-visible-browser-ui-local-supabase-cdp",
    runStructure: "independent-row-run",
    ...proposalCoverage(row, true),
  };
}

async function runAuthSmoke() {
  requiredEnv("SUPABASE_LOCAL_URL");
  requiredEnv("SUPABASE_LOCAL_ANON_KEY");
  requiredEnv("SUPABASE_LOCAL_SERVICE_ROLE_KEY");
  const password = requiredEnv("SMARTFLOW_LOCAL_QA_PASSWORD");
  smokeTrace("seeding empty scenario");
  runSeed("empty");

  smokeTrace("launching browser");
  const browser = await withTimeout(launchBrowser(), "browser launch", 20000);
  let cdp;
  try {
    smokeTrace("creating cdp page");
    cdp = await withTimeout(newPage(), "cdp page creation", 20000);
    smokeTrace("navigating to chat");
    await navigate(cdp, `${APP_URL}/chat`);
    smokeTrace("waiting for initial render");
    try {
      await waitFor(
        cdp,
        "Boolean(location.pathname === '/auth' || document.querySelector('textarea') || document.body.innerText.length > 0)",
        20000,
      );
    } catch (error) {
      let diagnostics = {
        page: null,
        failedNetworkRequests: [],
        networkResponses: [],
        consoleErrors: [],
        logErrors: [],
        runtimeExceptions: [],
      };
      try {
        diagnostics = await collectBrowserDiagnostics(cdp);
      } catch (diagnosticError) {
        diagnostics.diagnosticError = sanitizeText(
          diagnosticError instanceof Error ? diagnosticError.message : String(diagnosticError),
        );
      }
      const smokeResult = {
        status: "BLOCKED",
        purpose: "bounded-auth-smoke",
        app: APP_URL,
        blockedStage: "initial-render",
        error: sanitizeText(error instanceof Error ? error.message : String(error)),
        ...diagnostics,
        browserProcess: browserProcessDiagnostics(browser),
        supabaseReachability: await checkBrowserSupabaseReachability(cdp).catch((reachabilityError) => ({
          reachable: false,
          error: sanitizeText(reachabilityError instanceof Error ? reachabilityError.message : String(reachabilityError)),
        })),
        selectorWaitFix: "auth input wait uses Boolean(...) so CDP returnByValue does not serialize DOM nodes",
      };
      atomicWriteJson(AUTH_SMOKE_PATH, smokeResult);
      process.stdout.write(`${JSON.stringify(smokeResult, null, 2)}\n`);
      throw error;
    }
    smokeTrace("collecting pre-auth state");
    const beforeAuthDiagnostics = await collectBrowserDiagnostics(cdp);
    const beforeAuth = beforeAuthDiagnostics.page;
    const supabaseReachability = await checkBrowserSupabaseReachability(cdp);
    smokeTrace("signing in if needed");
    await withTimeout(signInIfNeeded(cdp, password), "sign-in flow", 30000);
    await cdp.evaluate("sessionStorage.setItem('smartflow:v1:launched', 'true')");
    if (await cdp.evaluate("location.pathname !== '/chat'")) {
      smokeTrace("returning to chat after auth redirect");
      await navigate(cdp, `${APP_URL}/chat`);
    }
    smokeTrace("waiting for chat textarea");
    try {
      await waitFor(cdp, "Boolean(document.querySelector('textarea') && !document.querySelector('textarea').disabled)", 25000);
    } catch (error) {
      let diagnostics = {
        page: null,
        failedNetworkRequests: [],
        networkResponses: [],
        consoleErrors: [],
        logErrors: [],
        runtimeExceptions: [],
      };
      try {
        diagnostics = await collectBrowserDiagnostics(cdp);
      } catch (diagnosticError) {
        diagnostics.diagnosticError = sanitizeText(
          diagnosticError instanceof Error ? diagnosticError.message : String(diagnosticError),
        );
      }
      const smokeResult = {
        status: "BLOCKED",
        purpose: "bounded-auth-smoke",
        app: APP_URL,
        blockedStage: "chat-ready-after-auth",
        error: sanitizeText(error instanceof Error ? error.message : String(error)),
        ...diagnostics,
        browserProcess: browserProcessDiagnostics(browser),
        supabaseReachability: await checkBrowserSupabaseReachability(cdp).catch((reachabilityError) => ({
          reachable: false,
          error: sanitizeText(reachabilityError instanceof Error ? reachabilityError.message : String(reachabilityError)),
        })),
        selectorWaitFix: "auth input wait uses Boolean(...) so CDP returnByValue does not serialize DOM nodes",
      };
      atomicWriteJson(AUTH_SMOKE_PATH, smokeResult);
      process.stdout.write(`${JSON.stringify(smokeResult, null, 2)}\n`);
      throw error;
    }
    smokeTrace("collecting post-auth state");
    const afterAuth = await cdp.evaluate(`
      (() => ({
        currentUrl: location.href,
        pathname: location.pathname,
        chatReady: Boolean(document.querySelector('textarea') && !document.querySelector('textarea').disabled),
        renderedText: document.body.innerText.slice(0, 700),
      }))()
    `);
    const finalDiagnostics = await collectBrowserDiagnostics(cdp);
    const smokeResult = {
      status: "PASS",
      purpose: "bounded-auth-smoke",
      app: APP_URL,
      beforeAuth: {
        ...beforeAuth,
        renderedText: sanitizeText(beforeAuth.renderedText),
      },
      afterAuth: {
        ...afterAuth,
        renderedText: sanitizeText(afterAuth.renderedText),
      },
      supabaseReachability,
      failedNetworkRequests: finalDiagnostics.failedNetworkRequests,
      consoleErrors: finalDiagnostics.consoleErrors,
      logErrors: finalDiagnostics.logErrors,
      selectorWaitFix: "auth input wait uses Boolean(...) so CDP returnByValue does not serialize DOM nodes",
    };
    atomicWriteJson(AUTH_SMOKE_PATH, smokeResult);
    process.stdout.write(`${JSON.stringify(smokeResult, null, 2)}\n`);
  } finally {
    cdp?.close();
    browser.proc.kill();
  }
}

async function main() {
  requiredEnv("SUPABASE_LOCAL_URL");
  requiredEnv("SUPABASE_LOCAL_ANON_KEY");
  requiredEnv("SUPABASE_LOCAL_SERVICE_ROLE_KEY");
  const password = requiredEnv("SMARTFLOW_LOCAL_QA_PASSWORD");

  const browser = await launchBrowser();
  let cdp;
  try {
    cdp = await newPage();
    const rowArgIndex = process.argv.indexOf("--row");
    const selectedRowId = rowArgIndex >= 0 ? process.argv[rowArgIndex + 1] : undefined;
    const selectedRows = selectedRowId ? ROWS.filter((row) => row.id === selectedRowId) : ROWS;
    if (selectedRowId && selectedRows.length !== 1) {
      throw new Error(`Unknown ARUX row: ${selectedRowId}`);
    }

    for (const row of selectedRows) {
      try {
        const result = await runRow(row, cdp, password);
        writeRow(result);
        console.log(`${row.id}: ${result.status}`);
      } catch (error) {
        const failureDiagnostics = cdp
          ? await cdp.evaluate(`
              (() => ({
                url: location.href,
                text: document.body?.innerText || '',
                buttons: [...document.querySelectorAll('button')].map((button) => ({
                  text: (button.textContent || '').trim(),
                  disabled: button.disabled,
                })),
                textarea: Boolean(document.querySelector('textarea')),
              }))()
            `).catch(() => undefined)
          : undefined;
        const blocked = {
          id: row.id,
          executedAt: new Date().toISOString(),
          fixture: row.scenario,
          scenario: row.scenario,
          tool: row.tool,
          initialBoundedState: { scenario: row.scenario, localOnly: true },
          prompt: row.prompt,
          interfaceLanguage: "en",
          aiResponseLanguageMode: row.languageMode,
          visibleUiActions: [],
          sanitizedVisibleResponse: sanitizeText(failureDiagnostics?.text ?? ""),
          expectedResult: row.expected,
          actualResult: sanitizeText(error?.message ?? String(error)),
          status: "BLOCKED",
          forbiddenMetadataCheck: { passed: false },
          browserRuntimeErrorCheck: { passed: false, result: sanitizeText(error?.message ?? String(error)) },
          persistedStateVerification: { checked: false, result: "not reached" },
          rtlEvidence: { checked: false },
          screenshotEvidence: { checked: false },
          failureDiagnostics: failureDiagnostics
            ? {
                url: failureDiagnostics.url,
                buttons: failureDiagnostics.buttons,
                textarea: failureDiagnostics.textarea,
              }
            : undefined,
          evidenceMethod: "authenticated-visible-browser-ui-local-supabase-cdp",
          runStructure: "independent-row-run",
          ...proposalCoverage(row, false),
        };
        writeRow(blocked);
        console.log(`${row.id}: BLOCKED`);
      }
    }
  } finally {
    cdp?.close();
    browser.proc.kill();
  }

  const evidence = JSON.parse(fs.readFileSync(ARUX_EVIDENCE_PATH, "utf8"));
  validateAruxEvidence(evidence);
}

const keepAlive = setInterval(() => {}, 1000);

try {
  if (process.argv.includes("--smoke-auth")) {
    await runAuthSmoke();
  } else {
    await main();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  clearInterval(keepAlive);
}
