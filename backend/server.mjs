import http from "node:http";
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dbPath = path.join(__dirname, "data", "ims-db.json");
const port = Number(process.env.PORT || 58080);

const collectionRoutes = {
  "/api/project-activities": { key: "activities", idPrefix: "ACT" },
  "/api/project-issues": { key: "issues", idPrefix: "ISS" },
  "/api/project-approvals": { key: "approvals", idPrefix: "APR" },
  "/api/project-procurements": { key: "procurements", idPrefix: "PRC" },
  "/api/project-documents": { key: "documents", idPrefix: "DOC" },
  "/api/project-reviews": { key: "reviews", idPrefix: "REV" },
};

const headers = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
};

function sendJson(res, status, payload) {
  res.writeHead(status, headers);
  res.end(JSON.stringify(payload, null, 2));
}

function sendError(res, status, message, details = undefined) {
  sendJson(res, status, { ok: false, message, details });
}

function now() {
  return new Date().toISOString();
}

async function readDb() {
  await mkdir(path.dirname(dbPath), { recursive: true });
  return JSON.parse(await readFile(dbPath, "utf8"));
}

async function writeDb(db) {
  db.meta = { ...(db.meta || {}), updatedAt: now() };
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.status = 422;
    throw error;
  }
}

function urlOf(req) {
  return new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
}

function routePath(req) {
  return urlOf(req).pathname;
}

function query(req) {
  return urlOf(req).searchParams;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function makeId(prefix) {
  return `${prefix}-${String(Date.now()).slice(-8)}`;
}

function normalizeProject(input, existing = {}) {
  const project = {
    ...existing,
    id: existing.id || input.id || makeId("PRJ"),
    brd: String(input.brd ?? existing.brd ?? "").trim(),
    name: String(input.name ?? existing.name ?? "").trim(),
    division: String(input.division ?? existing.division ?? "").trim(),
    department: String(input.department ?? existing.department ?? "").trim(),
    site: String(input.site ?? existing.site ?? "").trim(),
    category: String(input.category ?? existing.category ?? "IT System").trim(),
    priority: String(input.priority ?? existing.priority ?? "Medium").trim(),
    status: String(input.status ?? existing.status ?? "Draft").trim(),
    health: String(input.health ?? existing.health ?? "Green").trim(),
    pic: String(input.pic ?? existing.pic ?? "Investment Admin").trim(),
    vendor: String(input.vendor ?? existing.vendor ?? "").trim(),
    budget: toNumber(input.budget ?? existing.budget),
    approved: toNumber(input.approved ?? input.budget ?? existing.approved),
    actual: toNumber(input.actual ?? existing.actual),
    progress: Math.max(0, Math.min(100, toNumber(input.progress ?? existing.progress))),
    start: String(input.start ?? existing.start ?? "").trim(),
    finish: String(input.finish ?? existing.finish ?? "").trim(),
    approvalDays: toNumber(input.approvalDays ?? existing.approvalDays),
    objective: String(input.objective ?? existing.objective ?? "").trim(),
    remarks: String(input.remarks ?? existing.remarks ?? "").trim(),
    archived: Boolean(input.archived ?? existing.archived ?? false),
    createdAt: existing.createdAt || input.createdAt || now(),
    updatedAt: now(),
  };

  const missing = ["brd", "name", "division", "site"].filter((field) => !project[field]);
  if (missing.length) {
    const error = new Error("Project validation failed.");
    error.status = 422;
    error.details = missing.map((field) => ({ field, message: `${field} is required.` }));
    throw error;
  }

  if (!project.health || project.health === "Auto") {
    project.health = deriveHealth(project);
  }

  return project;
}

function deriveHealth(project) {
  if (project.status === "Overdue") return "Red";
  if (project.progress < 50 && ["Running", "Procurement"].includes(project.status)) return "Yellow";
  if (project.actual > project.approved && project.approved > 0) return "Yellow";
  return "Green";
}

function applySearchFilterSortPage(rows, searchParams, searchableFields, filterFields) {
  let result = [...rows];
  const search = String(searchParams.get("search") || "").toLowerCase().trim();
  if (search) {
    result = result.filter((row) => searchableFields.some((field) => String(row[field] || "").toLowerCase().includes(search)));
  }

  for (const field of filterFields) {
    const value = searchParams.get(field);
    if (value && value !== "All") {
      result = result.filter((row) => String(row[field] ?? "") === value);
    }
  }

  const sort = searchParams.get("sort") || "updatedAt";
  const direction = searchParams.get("direction") === "asc" ? "asc" : "desc";
  result.sort((a, b) => {
    const av = a[sort] ?? "";
    const bv = b[sort] ?? "";
    const compare = typeof av === "number" || typeof bv === "number"
      ? toNumber(av) - toNumber(bv)
      : String(av).localeCompare(String(bv));
    return direction === "asc" ? compare : -compare;
  });

  const total = result.length;
  const page = Math.max(1, toNumber(searchParams.get("page"), 1));
  const perPage = Math.max(1, Math.min(100, toNumber(searchParams.get("perPage"), total || 25)));
  const start = (page - 1) * perPage;
  const data = result.slice(start, start + perPage);

  return {
    data,
    meta: {
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
      sort,
      direction,
    },
  };
}

function dashboardPayload(db) {
  const projects = db.projects || [];
  const issues = db.issues || [];
  const documents = db.documents || [];
  const activities = db.activities || [];
  const totalApproved = projects.reduce((sum, project) => sum + toNumber(project.approved), 0);
  const totalActual = projects.reduce((sum, project) => sum + toNumber(project.actual), 0);
  const durations = projects
    .map((project) => project.start && project.finish ? Math.max(0, Math.ceil((new Date(project.finish) - new Date(project.start)) / 86400000)) : 0)
    .filter(Boolean);

  return {
    kpis: {
      totalInvestment: totalApproved,
      totalProjects: projects.length,
      runningProjects: projects.filter((project) => ["Running", "Procurement"].includes(project.status)).length,
      completedProjects: projects.filter((project) => project.status === "Completed").length,
      pendingProjects: projects.filter((project) => ["Draft", "Submitted", "Under Review"].includes(project.status)).length,
      overdueProjects: projects.filter((project) => project.status === "Overdue").length,
      budgetUtilization: totalApproved ? Math.round((totalActual / totalApproved) * 100) : 0,
      averageProjectDuration: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      openIssues: issues.filter((issue) => issue.status !== "Closed").length,
      criticalIssues: issues.filter((issue) => issue.severity === "Critical" && issue.status !== "Closed").length,
    },
    charts: {
      byStatus: countBy(projects, "status"),
      byHealth: countBy(projects, "health"),
      byDivision: sumBy(projects, "division", "approved"),
      byCategory: sumBy(projects, "category", "approved"),
      bySite: sumBy(projects, "site", "approved"),
      budgetVsActual: projects.map((project) => ({
        id: project.id,
        project: project.name,
        approved: toNumber(project.approved),
        actual: toNumber(project.actual),
      })),
      monthlyInvestmentTrend: monthlyTrend(),
      monthlyCompletionTrend: monthlyCompletionTrend(),
    },
    widgets: {
      highlightedProject: [...projects].sort((a, b) => toNumber(b.approved) - toNumber(a.approved))[0] || null,
      upcomingDeadlines: [...projects].sort((a, b) => String(a.finish).localeCompare(String(b.finish))).slice(0, 8),
      recentActivities: [...activities].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 8),
      latestDocuments: documents.slice(0, 8),
      openIssues: issues.filter((issue) => issue.status !== "Closed").slice(0, 8),
    },
  };
}

function monthlyTrend() {
  return [
    ["Jan", 28.4, 21.2], ["Feb", 32.1, 24.5], ["Mar", 25.8, 19.1], ["Apr", 41.7, 27.9],
    ["May", 36.9, 31.4], ["Jun", 52.5, 37.6], ["Jul", 46.2, 34.2], ["Aug", 58.1, 45.4],
    ["Sep", 61.8, 50.8], ["Oct", 54.3, 43.1], ["Nov", 64.5, 55.7], ["Dec", 72.4, 63.2],
  ].map(([month, budget, actual]) => ({ month, budget, actual }));
}

function monthlyCompletionTrend() {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    .map((month, index) => ({ month, completed: [1, 2, 2, 3, 5, 6, 8, 10, 12, 14, 17, 20][index] }));
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "Unassigned";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function sumBy(rows, groupKey, valueKey) {
  return rows.reduce((acc, row) => {
    const value = row[groupKey] || "Unassigned";
    acc[value] = (acc[value] || 0) + toNumber(row[valueKey]);
    return acc;
  }, {});
}

function projectWorkspace(db, id) {
  const project = (db.projects || []).find((item) => item.id === id || item.brd === id);
  if (!project) return null;
  const activities = (db.activities || []).filter((item) => item.projectId === project.id || item.project === project.name);
  const documents = (db.documents || []).filter((item) => item.projectId === project.id || item["Project ID"] === project.id);
  const issues = (db.issues || []).filter((item) => item.projectId === project.id || item.project === project.name);
  const duration = project.start && project.finish ? Math.max(0, Math.ceil((new Date(project.finish) - new Date(project.start)) / 86400000)) : 0;
  const budgetVariance = toNumber(project.approved) - toNumber(project.actual);

  return {
    project,
    overview: {
      duration,
      budgetVariance,
      budgetUtilization: project.approved ? Math.round((toNumber(project.actual) / toNumber(project.approved)) * 100) : 0,
      delayStatus: project.status === "Overdue" ? "Delayed" : "On Track",
      health: project.health || deriveHealth(project),
    },
    activities: [...activities].sort((a, b) => String(b.date).localeCompare(String(a.date))),
    documents,
    issues,
    review: (db.reviews || []).find((item) => item.projectId === project.id || item["Project ID"] === project.id) || null,
  };
}

function findById(rows, id) {
  return rows.findIndex((item) => item.id === id || item.ID === id || item[Object.keys(item)[0]] === id);
}

function normalizeGeneric(input, existing = {}, idPrefix = "ROW") {
  return {
    ...existing,
    ...input,
    id: existing.id || input.id || makeId(idPrefix),
    createdAt: existing.createdAt || input.createdAt || now(),
    updatedAt: now(),
  };
}

async function handleCollection(req, res, db, route, id = null) {
  const config = collectionRoutes[route];
  const rows = db[config.key] || [];
  db[config.key] = rows;
  const method = req.method || "GET";

  if (!id && method === "GET") {
    const result = applySearchFilterSortPage(rows, query(req), Object.keys(rows[0] || {}), ["projectId", "status", "severity", "category", "type"]);
    sendJson(res, 200, { ok: true, data: result.data, meta: result.meta });
    return true;
  }

  if (!id && method === "POST") {
    const created = normalizeGeneric(await readBody(req), {}, config.idPrefix);
    rows.unshift(created);
    await writeDb(db);
    sendJson(res, 201, { ok: true, data: created });
    return true;
  }

  if (id) {
    const index = findById(rows, id);
    if (index === -1) {
      sendError(res, 404, "Record not found.");
      return true;
    }
    if (method === "GET") {
      sendJson(res, 200, { ok: true, data: rows[index] });
      return true;
    }
    if (method === "PATCH" || method === "PUT") {
      rows[index] = normalizeGeneric(await readBody(req), rows[index], config.idPrefix);
      await writeDb(db);
      sendJson(res, 200, { ok: true, data: rows[index] });
      return true;
    }
    if (method === "DELETE") {
      const deleted = rows.splice(index, 1)[0];
      await writeDb(db);
      sendJson(res, 200, { ok: true, data: deleted });
      return true;
    }
  }

  return false;
}

async function handleApi(req, res) {
  const method = req.method || "GET";
  const pathname = routePath(req);
  const db = await readDb();

  if (method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  if (method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, { ok: true, app: "IPMS Backend", storage: dbPath, timestamp: now() });
    return;
  }

  if (method === "GET" && pathname === "/api/dashboard") {
    sendJson(res, 200, { ok: true, data: dashboardPayload(db) });
    return;
  }

  if (method === "GET" && pathname === "/api/master-data") {
    sendJson(res, 200, { ok: true, data: db.masterData || {} });
    return;
  }

  if (method === "GET" && pathname === "/api/projects") {
    const result = applySearchFilterSortPage(
      db.projects || [],
      query(req),
      ["id", "brd", "name", "division", "department", "site", "category", "priority", "status", "pic", "vendor"],
      ["division", "site", "category", "status", "priority", "pic", "health"],
    );
    sendJson(res, 200, { ok: true, data: result.data, meta: result.meta });
    return;
  }

  if (method === "POST" && pathname === "/api/projects") {
    const project = normalizeProject(await readBody(req));
    db.projects = db.projects || [];
    db.projects.unshift(project);
    db.activities = db.activities || [];
    db.activities.unshift({
      id: makeId("ACT"),
      projectId: project.id,
      date: now().slice(0, 10),
      type: "Investment Request Created",
      project: project.name,
      text: `${project.brd} created.`,
      status: "Completed",
      createdAt: now(),
      updatedAt: now(),
    });
    await writeDb(db);
    sendJson(res, 201, { ok: true, data: project });
    return;
  }

  const workspaceMatch = pathname.match(/^\/api\/project-workspaces\/([^/]+)$/);
  if (method === "GET" && workspaceMatch) {
    const workspace = projectWorkspace(db, decodeURIComponent(workspaceMatch[1]));
    if (!workspace) {
      sendError(res, 404, "Project workspace not found.");
      return;
    }
    sendJson(res, 200, { ok: true, data: workspace });
    return;
  }

  const reportMatch = pathname.match(/^\/api\/reports\/project-review\/([^/]+)$/);
  if (method === "GET" && reportMatch) {
    const workspace = projectWorkspace(db, decodeURIComponent(reportMatch[1]));
    if (!workspace) {
      sendError(res, 404, "Project not found for report.");
      return;
    }
    sendJson(res, 200, {
      ok: true,
      data: {
        title: "Project Final Review Report",
        generatedAt: now(),
        sections: ["Cover Page", "Project Information", "Executive Summary", "Timeline Analysis", "Budget Analysis", "Activity Timeline", "Lessons Learned", "Benefit Realization", "Recommendation", "Signature Section"],
        workspace,
      },
    });
    return;
  }

  const projectMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (projectMatch) {
    db.projects = db.projects || [];
    const id = decodeURIComponent(projectMatch[1]);
    const index = db.projects.findIndex((project) => project.id === id || project.brd === id);
    if (index === -1) {
      sendError(res, 404, "Project not found.");
      return;
    }
    if (method === "GET") {
      sendJson(res, 200, { ok: true, data: db.projects[index] });
      return;
    }
    if (method === "PATCH" || method === "PUT") {
      const updated = normalizeProject(await readBody(req), db.projects[index]);
      db.projects[index] = updated;
      db.activities = db.activities || [];
      db.activities.unshift({
        id: makeId("ACT"),
        projectId: updated.id,
        date: now().slice(0, 10),
        type: "Project Updated",
        project: updated.name,
        text: `${updated.brd} updated.`,
        status: "Completed",
        createdAt: now(),
        updatedAt: now(),
      });
      await writeDb(db);
      sendJson(res, 200, { ok: true, data: updated });
      return;
    }
    if (method === "DELETE") {
      const deleted = db.projects.splice(index, 1)[0];
      await writeDb(db);
      sendJson(res, 200, { ok: true, data: deleted });
      return;
    }
  }

  for (const route of Object.keys(collectionRoutes)) {
    const match = pathname.match(new RegExp(`^${route.replaceAll("/", "\\/")}(?:\\/([^/]+))?$`));
    if (match && await handleCollection(req, res, db, route, match[1] ? decodeURIComponent(match[1]) : null)) return;
  }

  sendError(res, 404, "API endpoint not found.");
}

async function serveStatic(req, res) {
  let pathname = decodeURIComponent(routePath(req));
  if (pathname === "/") pathname = "/index.html";
  const filePath = path.resolve(rootDir, `.${pathname}`);
  if (!filePath.startsWith(rootDir)) {
    sendError(res, 403, "Forbidden.");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("Not a file.");
    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }[ext] || "application/octet-stream";
    res.writeHead(200, { "content-type": contentType });
    createReadStream(filePath).pipe(res);
  } catch {
    sendError(res, 404, "File not found.");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (routePath(req).startsWith("/api/")) {
      await handleApi(req, res);
      return;
    }
    await serveStatic(req, res);
  } catch (error) {
    sendError(res, error.status || 500, error.message || "Internal server error.", error.details);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`IPMS backend running at http://127.0.0.1:${port}`);
});
