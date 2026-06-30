# IPMS Local Backend

Backend ini adalah API lokal untuk simulasi sebelum implementasi Laravel 12 asli.

Catatan:
- Tidak membutuhkan dependency npm.
- Data disimpan di `backend/data/ims-db.json`.
- API memakai pola REST dengan response envelope `{ ok, data, meta }`.
- Frontend GitHub Pages tetap bisa static; backend ini opsional untuk simulasi lokal.

## Run

```powershell
& 'C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\backend\server.mjs
```

Default URL:

```text
http://127.0.0.1:58080
```

## Core Endpoints

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/master-data`

## Projects

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/{id-or-brd}`
- `PATCH /api/projects/{id-or-brd}`
- `DELETE /api/projects/{id-or-brd}`

Query support:

```text
?search=&division=&site=&category=&status=&priority=&pic=&health=&sort=approved&direction=desc&page=1&perPage=10
```

## Project Workspace

- `GET /api/project-workspaces/{id-or-brd}`

Returns project overview, duration, budget variance, budget utilization, delay status, activities, documents, issues, and review data.

## Module Collections

Each supports:

- `GET /endpoint`
- `POST /endpoint`
- `GET /endpoint/{id}`
- `PATCH /endpoint/{id}`
- `DELETE /endpoint/{id}`

Endpoints:

- `/api/project-activities`
- `/api/project-issues`
- `/api/project-approvals`
- `/api/project-procurements`
- `/api/project-documents`
- `/api/project-reviews`

## Report Preview

- `GET /api/reports/project-review/{id-or-brd}`

Returns structured JSON sections for a future PDF generator.
