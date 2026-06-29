import http from "node:http";
import { readFile, writeFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dbPath = path.join(__dirname, "data", "ims-db.json");
const port = Number(process.env.PORT || 58080);

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
};

function sendJson(res, status, payload) {
  res.writeHead(status, jsonHeaders);
  res.end(JSON.stringify(payload, null, 2));
}

function sendError(res, status, message, details = undefined) {
  sendJson(res, status, {
    ok: false,
    message,
    details,
  });
}

async function readDb() {
  return JSON.parse(await readFile(dbPath, "utf8"));
}

async function writeDb(db) {
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

function routePath(req) {
  return new URL(req.url, `http://${req.headers.host}`).pathname;
}

function queryParams(req) {
  return new URL(req.url, `http://${req.headers.host}`).searchParams;
}

function normalizeProject(input, existing = {}) {
  const project = {
    ...existing,
    brd: String(input.brd || existing.brd || "").trim(),
    name: String(input.name || existing.name || "").trim(),
    division: String(input.division || existing.division || "").trim(),
    department: String(input.department || existing.department || "").trim(),
    site: String(input.site || existing.site || "").trim(),
    category: String(input.category || existing.category || "IT System").trim(),
    priority: String(input.priority || existing.priority || "Medium").trim(),
    status: String(input.status || existing.status || "Draft").trim(),
    health: String(input.health || existing.health || "Green").trim(),
    pic: String(input.pic || existing.pic || "Investment Admin").trim(),
    vendor: String(input.vendor || existing.vendor || "").trim(),
    budget: Number(input.budget ?? existing.budget ?? 0),
    approved: Number(input.approved ?? input.budget ?? existing.approved ?? 0),
    actual: Number(input.actual ?? existing.actual ?? 0),
    progress: Number(input.progress ?? existing.progress ?? 0),
    start: String(input.start || existing.start || "").trim(),
    finish: String(input.finish || existing.finish || "").trim(),
    approvalDays: Number(input.approvalDays ?? existing.approvalDays ?? 0),
    objective: String(input.objective || existing.objective || "").trim(),
    remarks: String(input.remarks || existing.remarks || "").trim(),
  };

  const missing = [];
  if (!project.brd) missing.push("brd");
  if (!project.name) missing.push("name");
  if (!project.division) missing.push("division");
  if (!project.site) missing.push("site");
  if (missing.length) {
    const error = new Error("Project validation failed.");
    error.status = 422;
    error.details = missing.map((field) => ({ field, message: `${field} is required.` }));
    throw error;
  }

  project.progress = Math.max(0, Math.min(100, project.progress));
  project.updatedAt = new Date().toISOString();
  return project;
}

function applyProjectFilters(projects, searchParams) {
  const searchable = String(searchParams.get("search") || "").toLowerCase();
  const filters = ["division", "site", "category", "status", "priority", "pic"];
  return projects.filter((project) => {
    const matchesSearch = !searchable || [
      project.brd,
      project.name,
      project.division,
      project.site,
      project.category,
      project.pic,
      project.vendor,
    ].join(" ").toLowerCase().includes(searchable);

    const matchesFilters = filters.every((key) => {
      const value = searchParams.get(key);
      return !value || value === "All" || project[key] === value;
    });

    return matchesSearch && matchesFilters;
  });
}

function dashboardPayload(db) {
  const totalApproved = db.projects.reduce((sum, project) => sum + Number(project.approved || 0), 0);
  const totalActual = db.projects.reduce((sum, project) => sum + Number(project.actual || 0), 0);
  const byStatus = countBy(db.projects, "status");
  const byDivision = sumBy(db.projects, "division", "approved");
  const byCategory = sumBy(db.projects, "category", "approved");
  const bySite = sumBy(db.projects, "site", "approved");
  const criticalIssues = db.issues.filter((issue) => issue.severity === "Critical" && issue.status !== "Closed");

  return {
    kpis: {
      totalInvestment: totalApproved,
      totalProjects: db.projects.length,
      runningProjects: db.projects.filter((project) => ["Running", "Procurement"].includes(project.status)).length,
      completedProjects: db.projects.filter((project) => project.status === "Completed").length,
      pendingProjects: db.projects.filter((project) => ["Draft", "Submitted", "Under Review"].includes(project.status)).length,
      overdueProjects: db.projects.filter((project) => project.status === "Overdue").length,
      budgetUtilization: totalApproved ? Math.round((totalActual / totalApproved) * 100) : 0,
      averageProjectDuration: 204,
      openIssues: db.issues.filter((issue) => issue.status !== "Closed").length,
      criticalIssues: criticalIssues.length,
    },
    charts: {
      monthlyInvestmentTrend: [
        { month: "Jan", budget: 28.4, actual: 21.2 },
        { month: "Feb", budget: 32.1, actual: 24.5 },
        { month: "Mar", budget: 25.8, actual: 19.1 },
        { month: "Apr", budget: 41.7, actual: 27.9 },
        { month: "May", budget: 36.9, actual: 31.4 },
        { month: "Jun", budget: 52.5, actual: 37.6 },
        { month: "Jul", budget: 46.2, actual: 34.2 },
        { month: "Aug", budget: 58.1, actual: 45.4 },
        { month: "Sep", budget: 61.8, actual: 50.8 },
        { month: "Oct", budget: 54.3, actual: 43.1 },
        { month: "Nov", budget: 64.5, actual: 55.7 },
        { month: "Dec", budget: 72.4, actual: 63.2 }
      ],
      byStatus,
      byDivision,
      byCategory,
      bySite,
    },
    widgets: {
      upcomingDeadlines: [...db.projects].sort((a, b) => String(a.finish).localeCompare(String(b.finish))).slice(0, 5),
      recentActivities: [...db.activities].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5),
      latestIssues: db.issues.slice(0, 5),
      latestDocuments: db.documents.slice(0, 5),
    },
  };
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] || 0) + 1;
    return acc;
  }, {});
}

function sumBy(rows, groupKey, valueKey) {
  return rows.reduce((acc, row) => {
    acc[row[groupKey]] = (acc[row[groupKey]] || 0) + Number(row[valueKey] || 0);
    return acc;
  }, {});
}

async function handleApi(req, res) {
  const method = req.method || "GET";
  const pathname = routePath(req);
  const db = await readDb();

  if (method === "OPTIONS") {
    res.writeHead(204, jsonHeaders);
    res.end();
    return;
  }

  if (method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, { ok: true, app: "IMS Backend", timestamp: new Date().toISOString() });
    return;
  }

  if (method === "GET" && pathname === "/api/dashboard") {
    sendJson(res, 200, { ok: true, data: dashboardPayload(db) });
    return;
  }

  if (method === "GET" && pathname === "/api/master-data") {
    sendJson(res, 200, { ok: true, data: db.masterData });
    return;
  }

  if (method === "GET" && pathname === "/api/projects") {
    const rows = applyProjectFilters(db.projects, queryParams(req));
    sendJson(res, 200, { ok: true, data: rows, meta: { total: rows.length } });
    return;
  }

  const projectMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (projectMatch) {
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

    if (method === "PUT" || method === "PATCH") {
      const input = await readBody(req);
      const updated = normalizeProject(input, db.projects[index]);
      db.projects[index] = updated;
      db.activities.unshift({
        id: `act_${Date.now()}`,
        projectId: updated.id,
        date: new Date().toISOString().slice(0, 10),
        type: "Project Updated",
        project: updated.name,
        text: `${updated.brd} updated through IMS API simulation.`,
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

  if (method === "POST" && pathname === "/api/projects") {
    const input = await readBody(req);
    const sequence = db.meta.nextProjectNumber || 26013;
    const fallbackBrd = `BRD-${sequence}`;
    const project = normalizeProject({ ...input, brd: input.brd || fallbackBrd });
    project.id = `prj_${Date.now()}`;
    project.createdAt = new Date().toISOString();
    db.meta.nextProjectNumber = sequence + 1;
    db.projects.unshift(project);
    db.activities.unshift({
      id: `act_${Date.now()}`,
      projectId: project.id,
      date: new Date().toISOString().slice(0, 10),
      type: "Investment Request Created",
      project: project.name,
      text: `${project.brd} created through IMS API simulation.`,
    });
    await writeDb(db);
    sendJson(res, 201, { ok: true, data: project });
    return;
  }

  const collections = {
    "/api/project-issues": "issues",
    "/api/project-activities": "activities",
    "/api/project-approvals": "approvals",
    "/api/project-procurements": "procurements",
    "/api/project-documents": "documents",
  };

  if (method === "GET" && collections[pathname]) {
    const key = collections[pathname];
    sendJson(res, 200, { ok: true, data: db[key], meta: { total: db[key].length } });
    return;
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
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not a file.");
    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
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
  console.log(`IMS backend running at http://127.0.0.1:${port}`);
});
