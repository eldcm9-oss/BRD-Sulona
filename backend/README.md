# IMS Local Backend

Backend ini dibuat untuk simulasi integrasi awal sebelum full Laravel 12 dibangun.

## Run

```powershell
& 'C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\backend\server.mjs
```

Default URL:

```text
http://127.0.0.1:58080
```

## Endpoint Utama

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/{id}`
- `PATCH /api/projects/{id}`
- `DELETE /api/projects/{id}`
- `GET /api/project-issues`
- `GET /api/project-activities`
- `GET /api/project-approvals`
- `GET /api/project-procurements`
- `GET /api/project-documents`
- `GET /api/master-data`

Data disimpan di `backend/data/ims-db.json`, jadi hasil simulasi edit akan tetap tersimpan selama file ini tidak dihapus.
