import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = path.resolve("outputs", "ims_excel_backend");
const outputPath = path.join(outputDir, "ims_excel_backend.xlsx");

const workbook = Workbook.create();

const colors = {
  navy: "#173B78",
  blue: "#2563EB",
  teal: "#0F9488",
  green: "#15803D",
  amber: "#B45309",
  red: "#BE123C",
  slate: "#475569",
  light: "#F4F7FB",
  line: "#D9E2EC",
  white: "#FFFFFF",
};

const master = {
  divisions: ["Supply Chain", "Finance", "Operations", "Quality", "Logistics", "Human Capital", "Manufacturing", "Commercial", "General Affairs", "Procurement"],
  departments: ["Warehouse", "Accounting", "Utility", "Laboratory", "Distribution", "HRIS", "Packing", "Digital", "Facilities", "Strategic Sourcing"],
  sites: ["Jakarta", "Bandung", "Surabaya", "Medan", "Makassar", "Semarang"],
  vendors: ["Accenture", "SAP Partner Indonesia", "Schneider Electric", "Siemens", "Telkomsigma", "Local Contractor"],
  categories: ["Automation", "IT System", "Energy", "Equipment", "Infrastructure", "Sustainability"],
  statuses: ["Draft", "Submitted", "Under Review", "Approved", "Procurement", "Running", "Completed", "Closed", "Overdue"],
  priorities: ["High", "Medium", "Low"],
  issueCategories: ["Schedule", "Budget", "Technical", "Vendor", "Scope"],
  issueSeverities: ["Critical", "High", "Medium", "Low"],
  approvalDecisions: ["Waiting Review", "Under Review", "Approved", "Rejected", "Revision Required"],
  procurementStages: ["Purchase Request", "RFQ", "Vendor Selection", "Purchase Order", "Contract", "Delivery", "Installation", "BAST", "Finished"],
  documentCategories: ["BRD", "Financial Analysis", "Committee Minutes", "Approval Letter", "Vendor Quotation", "Purchase Order", "Contract", "Invoice", "Delivery Note", "BAST", "Progress Report", "Meeting Minutes", "Project Photos", "LPJ", "Benefit Realization", "Final Report"],
  activityTypes: ["BRD Submitted", "Committee Meeting", "Vendor Selection", "Purchase Order", "Material Delivery", "Installation", "Testing", "Go Live", "Project Completed"],
};

const projects = [
  ["PRJ-26001", "BRD-26001", "Warehouse Automation Line", "Supply Chain", "Warehouse", "Jakarta", "Automation", "High", "Automate warehouse handling", "Reduce manual transfer risk and improve throughput.", 20000000000, 18500000000, "Siemens", "Ari Wibowo", new Date("2026-01-10"), new Date("2026-09-30"), "Running", "UAT conveyor control in progress", 13600000000, 68],
  ["PRJ-26002", "BRD-26002", "ERP Finance Extension", "Finance", "Accounting", "Bandung", "IT System", "High", "Extend finance ERP", "Improve reporting and approval workflow.", 9500000000, 9200000000, "SAP Partner Indonesia", "Dina Putri", new Date("2026-03-01"), new Date("2026-12-15"), "Under Review", "Solution design review", 2100000000, 22],
  ["PRJ-26003", "BRD-26003", "Solar Rooftop Phase 2", "Operations", "Utility", "Surabaya", "Energy", "Medium", "Increase renewable energy", "Reduce utility cost and emissions.", 14500000000, 14200000000, "Schneider Electric", "Raka Santoso", new Date("2025-08-20"), new Date("2026-04-10"), "Completed", "Benefit tracking", 13900000000, 100],
  ["PRJ-26004", "BRD-26004", "Quality Lab Upgrade", "Quality", "Laboratory", "Medan", "Equipment", "Medium", "Upgrade lab equipment", "Accelerate quality release cycle.", 7000000000, 6800000000, "Local Contractor", "Maya Sari", new Date("2026-02-14"), new Date("2026-08-31"), "Running", "Equipment installation", 3800000000, 57],
  ["PRJ-26005", "BRD-26005", "Cold Chain Expansion", "Logistics", "Distribution", "Makassar", "Infrastructure", "High", "Expand cold chain capacity", "Support regional distribution growth.", 24000000000, 23100000000, "Local Contractor", "Fajar Nugraha", new Date("2025-11-01"), new Date("2026-05-30"), "Overdue", "Civil handover delay", 19300000000, 74],
  ["PRJ-26006", "BRD-26006", "HR Workforce Analytics", "Human Capital", "HRIS", "Jakarta", "IT System", "Low", "Create workforce analytics", "Improve workforce planning accuracy.", 3900000000, 3600000000, "Telkomsigma", "Nadia Lestari", new Date("2025-10-12"), new Date("2026-02-28"), "Completed", "Closed", 3500000000, 100],
  ["PRJ-26007", "BRD-26007", "Packaging Robot Cell", "Manufacturing", "Packing", "Semarang", "Automation", "High", "Automate packaging cell", "Improve packing speed and consistency.", 12500000000, 11800000000, "Siemens", "Yusuf Hakim", new Date("2026-07-01"), new Date("2027-01-30"), "Submitted", "Capex review", 1600000000, 15],
  ["PRJ-26008", "BRD-26008", "Fleet Telematics Platform", "Logistics", "Transport", "Bandung", "IT System", "Medium", "Improve fleet visibility", "Reduce transport waste and improve delivery ETA.", 6200000000, 5900000000, "Telkomsigma", "Clara Tan", new Date("2026-04-05"), new Date("2026-11-20"), "Procurement", "Pilot deployment", 2500000000, 41],
  ["PRJ-26009", "BRD-26009", "Water Treatment Retrofit", "Operations", "Utility", "Medan", "Sustainability", "High", "Retrofit water treatment", "Improve environmental compliance.", 8100000000, 7600000000, "Schneider Electric", "Bima Prakoso", new Date("2025-12-01"), new Date("2026-05-15"), "Overdue", "Commissioning defect", 5700000000, 63],
  ["PRJ-26010", "BRD-26010", "Customer Data Platform", "Commercial", "Digital", "Jakarta", "IT System", "Medium", "Build customer data platform", "Improve campaign and service analytics.", 13500000000, 12800000000, "Accenture", "Tania Rahman", new Date("2026-05-01"), new Date("2026-12-31"), "Running", "Data model", 4100000000, 34],
  ["PRJ-26011", "BRD-26011", "Regional Office Renovation", "General Affairs", "Facilities", "Surabaya", "Infrastructure", "Low", "Renovate regional office", "Improve workspace safety and productivity.", 4500000000, 4300000000, "Local Contractor", "Rio Saputra", new Date("2025-09-01"), new Date("2026-01-30"), "Completed", "Closed", 4200000000, 100],
  ["PRJ-26012", "BRD-26012", "Supplier Portal", "Procurement", "Strategic Sourcing", "Jakarta", "IT System", "Medium", "Create supplier portal", "Improve RFQ and vendor collaboration.", 5200000000, 4800000000, "Accenture", "Salsa Kirana", new Date("2026-08-01"), new Date("2027-03-15"), "Under Review", "Vendor selection", 900000000, 18],
];

function addSheet(name) {
  const ws = workbook.worksheets.add(name);
  ws.showGridLines = false;
  return ws;
}

function writeTitle(ws, title, subtitle, endCol = "J") {
  ws.getRange(`A1:${endCol}1`).merge();
  ws.getRange("A1").values = [[title]];
  ws.getRange("A1").format = {
    fill: colors.navy,
    font: { bold: true, color: colors.white, size: 16 },
  };
  ws.getRange(`A2:${endCol}2`).merge();
  ws.getRange("A2").values = [[subtitle]];
  ws.getRange("A2").format = {
    fill: colors.light,
    font: { color: colors.slate, italic: true },
  };
}

function addTable(ws, startCell, headers, rows, tableName) {
  const start = cellToIndexes(startCell);
  const matrix = [headers, ...rows];
  ws.getRangeByIndexes(start.row, start.col, matrix.length, headers.length).values = matrix;
  const end = indexesToCell(start.row + matrix.length - 1, start.col + headers.length - 1);
  const rangeAddress = `${startCell}:${end}`;
  ws.tables.add(rangeAddress, true, tableName);
  ws.getRangeByIndexes(start.row, start.col, 1, headers.length).format = {
    fill: colors.navy,
    font: { bold: true, color: colors.white },
  };
  ws.getRangeByIndexes(start.row, start.col, matrix.length, headers.length).format.borders = {
    preset: "inside",
    style: "thin",
    color: colors.line,
  };
  ws.freezePanes.freezeRows(start.row + 1);
  return { rangeAddress, start, rows: rows.length, cols: headers.length };
}

function setWidths(ws, widths) {
  widths.forEach((width, index) => {
    ws.getRangeByIndexes(0, index, 1, 1).format.columnWidth = width;
  });
}

function validateList(ws, range, values) {
  ws.getRange(range).dataValidation = {
    rule: { type: "list", values },
  };
}

function cellToIndexes(cell) {
  const [, letters, rowText] = cell.match(/^([A-Z]+)(\d+)$/);
  let col = 0;
  for (const ch of letters) col = col * 26 + ch.charCodeAt(0) - 64;
  return { row: Number(rowText) - 1, col: col - 1 };
}

function indexesToCell(row, col) {
  let c = col + 1;
  let letters = "";
  while (c > 0) {
    const rem = (c - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    c = Math.floor((c - 1) / 26);
  }
  return `${letters}${row + 1}`;
}

function styleCurrency(ws, range) {
  ws.getRange(range).format.numberFormat = "Rp #,##0";
}

function styleDate(ws, range) {
  ws.getRange(range).format.numberFormat = "yyyy-mm-dd";
}

function stylePercent(ws, range) {
  ws.getRange(range).format.numberFormat = "0%";
}

function renderFormulaRows(ws, startRow, formulas, rows) {
  Object.entries(formulas).forEach(([col, formula]) => {
    ws.getRange(`${col}${startRow}`).formulas = [[formula]];
    ws.getRange(`${col}${startRow}:${col}${startRow + rows - 1}`).fillDown();
  });
}

const dictionary = addSheet("Data Dictionary");
writeTitle(dictionary, "IMS Excel Backend - Data Dictionary", "Workbook schema for simulation before Laravel backend implementation.", "H");
addTable(dictionary, "A4",
  ["Sheet", "Purpose", "Primary Key", "Editable", "Laravel Target"],
  [
    ["Dashboard", "Executive summary and formulas", "-", "No", "DashboardController / AnalyticsService"],
    ["Projects", "Investment request and project master table", "Project ID", "Yes", "projects"],
    ["Approvals", "Manual approval tracking", "Approval ID", "Yes", "project_approvals"],
    ["Procurement", "Procurement stage tracking", "Procurement ID", "Yes", "project_procurements"],
    ["Project Progress", "Progress, schedule, budget and health", "Progress ID", "Yes", "project_progress"],
    ["Issues", "Project issue log", "Issue ID", "Yes", "project_issues"],
    ["Activities", "Chronological activity timeline", "Activity ID", "Yes", "project_activities"],
    ["Reviews", "Completed project review", "Review ID", "Yes", "project_reviews"],
    ["Documents", "Document repository metadata", "Document ID", "Yes", "project_documents"],
    ["Master Data", "Lookup values for validation", "Lookup Value", "Yes", "master data tables"],
    ["Analytics Helper", "Formula-ready helper tables", "-", "No", "analytics endpoints"],
  ],
  "DataDictionaryTable"
);
setWidths(dictionary, [26, 44, 20, 14, 34]);

const dashboard = addSheet("Dashboard");
writeTitle(dashboard, "Executive Dashboard", "Formula-backed KPI layer. Edit module sheets and refresh formulas in Excel.", "N");
dashboard.getRange("A4:D4").values = [["KPI", "Value", "Unit", "Formula / Source"]];
dashboard.getRange("A4:D4").format = { fill: colors.navy, font: { bold: true, color: colors.white } };
const kpiRows = [
  ["Total Investment", "=SUM('Projects'!L5:L204)", "IDR", "SUM Budget Approved"],
  ["Total Projects", "=COUNTA('Projects'!A5:A204)", "Count", "Count Project ID"],
  ["Running Projects", '=COUNTIF(\'Projects\'!Q5:Q204,"Running")+COUNTIF(\'Projects\'!Q5:Q204,"Procurement")', "Count", "Running + Procurement"],
  ["Completed Projects", '=COUNTIF(\'Projects\'!Q5:Q204,"Completed")', "Count", "Completed"],
  ["Pending Projects", '=COUNTIF(\'Projects\'!Q5:Q204,"Draft")+COUNTIF(\'Projects\'!Q5:Q204,"Submitted")+COUNTIF(\'Projects\'!Q5:Q204,"Under Review")', "Count", "Draft + Submitted + Review"],
  ["Overdue Projects", '=COUNTIF(\'Projects\'!Q5:Q204,"Overdue")', "Count", "Status Overdue"],
  ["Budget Utilization", '=IFERROR(SUM(\'Projects\'!S5:S204)/SUM(\'Projects\'!L5:L204),0)', "%", "Actual / Approved"],
  ["Average Project Duration", '=IFERROR(AVERAGE(\'Project Progress\'!I5:I204),0)', "Days", "Average Duration Days"],
  ["Open Issues", '=COUNTIF(\'Issues\'!J5:J204,"Open")+COUNTIF(\'Issues\'!J5:J204,"In Progress")', "Count", "Open + In Progress"],
  ["Critical Issues", '=COUNTIFS(\'Issues\'!F5:F204,"Critical",\'Issues\'!J5:J204,"<>Closed")', "Count", "Critical not Closed"],
];
dashboard.getRange("A5:D14").values = kpiRows.map(([label, , unit, source]) => [label, null, unit, source]);
dashboard.getRange("B5:B14").formulas = kpiRows.map(([, formula]) => [formula]);
dashboard.getRange("B5:B10").format.numberFormat = "#,##0";
dashboard.getRange("B11").format.numberFormat = "0%";
dashboard.getRange("B12:B14").format.numberFormat = "#,##0";
dashboard.getRange("A5:D14").format.borders = { preset: "inside", style: "thin", color: colors.line };
dashboard.getRange("A16:F16").values = [["Status", "Count", "", "Division", "Approved Budget", "Share"]];
dashboard.getRange("A16:F16").format = { fill: colors.teal, font: { bold: true, color: colors.white } };
dashboard.getRange("A17:A25").values = master.statuses.map((x) => [x]);
dashboard.getRange("B17").formulas = [['=COUNTIF(\'Projects\'!$Q$5:$Q$204,A17)']];
dashboard.getRange("B17:B25").fillDown();
dashboard.getRange("D17:D26").values = master.divisions.map((x) => [x]);
dashboard.getRange("E17").formulas = [['=SUMIF(\'Projects\'!$D$5:$D$204,D17,\'Projects\'!$L$5:$L$204)']];
dashboard.getRange("F17").formulas = [["=IFERROR(E17/SUM($E$17:$E$26),0)"]];
dashboard.getRange("E17:F26").fillDown();
styleCurrency(dashboard, "E17:E26");
stylePercent(dashboard, "F17:F26");
setWidths(dashboard, [28, 16, 12, 24, 20, 14, 4, 18, 18, 18, 18, 18, 18, 18]);

const projectSheet = addSheet("Projects");
writeTitle(projectSheet, "Projects / Investment Request", "Main editable backend table for investment requests and project master data.", "T");
const projectHeaders = ["Project ID", "BRD Number", "Project Name", "Division", "Department", "Site", "Category", "Priority", "Project Objective", "Business Justification", "Budget Requested", "Budget Approved", "Vendor", "PIC", "Planned Start Date", "Planned Finish Date", "Status", "Remarks", "Actual Spend", "Progress %", "Budget Variance", "Duration Days"];
addTable(projectSheet, "A4", projectHeaders, projects.map((p) => [...p, null, null]), "ProjectsTable");
renderFormulaRows(projectSheet, 5, {
  U: "=K5-S5",
  V: "=P5-O5",
}, projects.length);
styleCurrency(projectSheet, "K5:M204");
styleCurrency(projectSheet, "S5:U204");
styleDate(projectSheet, "O5:P204");
stylePercent(projectSheet, "T5:T204");
validateList(projectSheet, "D5:D204", master.divisions);
validateList(projectSheet, "F5:F204", master.sites);
validateList(projectSheet, "G5:G204", master.categories);
validateList(projectSheet, "H5:H204", master.priorities);
validateList(projectSheet, "M5:M204", master.vendors);
validateList(projectSheet, "Q5:Q204", master.statuses);
setWidths(projectSheet, [14, 14, 30, 20, 20, 16, 18, 12, 30, 42, 18, 18, 24, 18, 16, 16, 16, 30, 16, 12, 16, 14]);

const approvals = addSheet("Approvals");
writeTitle(approvals, "Approval Tracking", "Manual approval decision records captured by Investment Admin.", "I");
addTable(approvals, "A4",
  ["Approval ID", "Project ID", "Approval Level", "Approver Name", "Approval Date", "Meeting Number", "Decision", "Notes", "Revision Notes"],
  [
    ["APR-26001", "PRJ-26001", "Committee", "Investment Committee", new Date("2026-01-24"), "MOM-26001", "Approved", "Proceed to procurement", ""],
    ["APR-26002", "PRJ-26002", "Finance Review", "Finance Director", new Date("2026-06-28"), "MOM-26044", "Revision Required", "Clarify budget phasing", "Revise benefit assumptions"],
    ["APR-26003", "PRJ-26012", "Committee", "Investment Committee", new Date("2026-06-28"), "MOM-26045", "Under Review", "Vendor comparison pending", ""],
  ],
  "ApprovalsTable"
);
styleDate(approvals, "E5:E204");
validateList(approvals, "G5:G204", master.approvalDecisions);
setWidths(approvals, [16, 14, 18, 24, 16, 18, 18, 34, 34]);

const procurement = addSheet("Procurement");
writeTitle(procurement, "Procurement Tracking", "Stage-level procurement status from PR through BAST.", "H");
addTable(procurement, "A4",
  ["Procurement ID", "Project ID", "Stage", "Stage Date", "PIC", "Vendor", "Status", "Remarks"],
  [
    ["PRC-26001", "PRJ-26001", "Purchase Order", new Date("2026-05-18"), "Ari Wibowo", "Siemens", "Completed", "PO released"],
    ["PRC-26002", "PRJ-26008", "RFQ", new Date("2026-06-08"), "Clara Tan", "Telkomsigma", "Completed", "RFQ closed"],
    ["PRC-26003", "PRJ-26008", "Vendor Selection", new Date("2026-06-21"), "Clara Tan", "Telkomsigma", "In Progress", "Commercial evaluation"],
  ],
  "ProcurementsTable"
);
styleDate(procurement, "D5:D204");
validateList(procurement, "C5:C204", master.procurementStages);
validateList(procurement, "F5:F204", master.vendors);
setWidths(procurement, [18, 14, 22, 16, 20, 24, 16, 34]);

const progress = addSheet("Project Progress");
writeTitle(progress, "Project Progress", "Progress, schedule, budget utilization, and traffic-light health.", "K");
addTable(progress, "A4",
  ["Progress ID", "Project ID", "Progress %", "Milestone", "Current Status", "Budget Approved", "Actual Spend", "Budget Utilization", "Duration Days", "Schedule Status", "Health"],
  projects.map((p, i) => [`PGS-${String(i + 1).padStart(5, "0")}`, p[0], p[19], p[17], p[16], p[11], p[18], null, null, null, null]),
  "ProgressTable"
);
renderFormulaRows(progress, 5, {
  H: "=IFERROR(G5/F5,0)",
  I: "=XLOOKUP(B5,'Projects'!$A$5:$A$204,'Projects'!$V$5:$V$204,0)",
  J: '=IF(XLOOKUP(B5,\'Projects\'!$A$5:$A$204,\'Projects\'!$P$5:$P$204,"")<TODAY(),"Overdue","On Track")',
  K: '=IF(OR(J5="Overdue",H5>0.95),"Red",IF(OR(C5<0.5,H5>0.8),"Yellow","Green"))',
}, projects.length);
stylePercent(progress, "C5:C204");
styleCurrency(progress, "F5:G204");
stylePercent(progress, "H5:H204");
validateList(progress, "E5:E204", master.statuses);
validateList(progress, "K5:K204", ["Green", "Yellow", "Red"]);
setWidths(progress, [16, 14, 12, 28, 18, 18, 18, 16, 14, 16, 12]);

const issues = addSheet("Issues");
writeTitle(issues, "Issue Management", "Project issue log for dashboard issue KPIs and trend tracking.", "K");
addTable(issues, "A4",
  ["Issue ID", "Project ID", "Issue Number", "Title", "Category", "Severity", "Priority", "Owner", "Due Date", "Status", "Resolution"],
  [
    ["ISS-26001", "PRJ-26005", "ISS-001", "Civil handover delay", "Schedule", "Critical", "High", "Fajar Nugraha", new Date("2026-06-07"), "Open", ""],
    ["ISS-26002", "PRJ-26009", "ISS-002", "Commissioning defect", "Technical", "Critical", "High", "Bima Prakoso", new Date("2026-06-12"), "Open", ""],
    ["ISS-26003", "PRJ-26001", "ISS-003", "PLC integration retest", "Technical", "High", "High", "Ari Wibowo", new Date("2026-07-02"), "In Progress", "Retest scheduled"],
    ["ISS-26004", "PRJ-26004", "ISS-004", "Calibration certificate pending", "Vendor", "Medium", "Medium", "Maya Sari", new Date("2026-07-10"), "Open", ""],
  ],
  "IssuesTable"
);
styleDate(issues, "I5:I204");
validateList(issues, "E5:E204", master.issueCategories);
validateList(issues, "F5:F204", master.issueSeverities);
validateList(issues, "G5:G204", master.priorities);
validateList(issues, "J5:J204", ["Open", "In Progress", "Resolved", "Closed"]);
setWidths(issues, [16, 14, 14, 32, 16, 14, 14, 20, 16, 16, 34]);

const activities = addSheet("Activities");
writeTitle(activities, "Project Activity Timeline", "Chronological project activity records.", "G");
addTable(activities, "A4",
  ["Activity ID", "Project ID", "Activity Date", "Activity Type", "Description", "PIC", "Status"],
  [
    ["ACT-26001", "PRJ-26002", new Date("2026-06-28"), "Committee Meeting", "Revision notes recorded from investment committee.", "Dina Putri", "Completed"],
    ["ACT-26002", "PRJ-26008", new Date("2026-06-27"), "Purchase Order", "PO release planning confirmed.", "Clara Tan", "Completed"],
    ["ACT-26003", "PRJ-26004", new Date("2026-06-25"), "Installation", "Equipment installation reached 57% progress.", "Maya Sari", "In Progress"],
    ["ACT-26004", "PRJ-26005", new Date("2026-06-24"), "Committee Meeting", "Critical delay escalated for weekly steering review.", "Fajar Nugraha", "Open"],
  ],
  "ActivitiesTable"
);
styleDate(activities, "C5:C204");
validateList(activities, "D5:D204", master.activityTypes);
setWidths(activities, [16, 14, 16, 22, 50, 18, 14]);

const reviews = addSheet("Reviews");
writeTitle(reviews, "Project Review", "Review records generated for completed projects.", "K");
addTable(reviews, "A4",
  ["Review ID", "Project ID", "Executive Summary", "Timeline Performance", "Budget Performance", "Scope Achievement", "Benefit Realization", "Risk Evaluation", "Issue Summary", "Lessons Learned", "Recommendation"],
  [
    ["REV-26003", "PRJ-26003", "Solar installation completed and benefit tracking active.", "Completed within approved baseline.", "Actual spend below approved budget.", "Scope achieved.", "Initial savings aligned with target.", "Low residual risk.", "No critical open issues.", "Earlier utility shutdown coordination helps execution.", "Continue benefit monitoring."],
    ["REV-26006", "PRJ-26006", "HR analytics closed and adopted by HRIS team.", "Completed within planned window.", "Actual spend below approved budget.", "Scope achieved.", "Forecast accuracy improved.", "Low residual risk.", "No open issues.", "Data ownership must be agreed earlier.", "Standardize dashboard governance."],
  ],
  "ReviewsTable"
);
setWidths(reviews, [16, 14, 36, 30, 30, 28, 30, 24, 24, 34, 30]);

const documents = addSheet("Documents");
writeTitle(documents, "Document Management", "Metadata backend for project document repository and versioning.", "I");
addTable(documents, "A4",
  ["Document ID", "Project ID", "Category", "File Name", "Version", "Upload Date", "Uploaded By", "Storage Path", "Remarks"],
  [
    ["DOC-26001", "PRJ-26001", "BRD", "BRD-26001-Warehouse-Automation.pdf", "1.0", new Date("2026-01-05"), "Investment Admin", "/storage/projects/PRJ-26001/brd.pdf", "Approved BRD"],
    ["DOC-26002", "PRJ-26008", "Vendor Quotation", "Telematics-Quotation.xlsx", "1.0", new Date("2026-06-10"), "Investment Admin", "/storage/projects/PRJ-26008/quotation.xlsx", "RFQ response"],
    ["DOC-26003", "PRJ-26003", "Final Report", "Solar-Rooftop-Final-Report.pdf", "1.0", new Date("2026-04-12"), "Investment Admin", "/storage/projects/PRJ-26003/final-report.pdf", "Closure document"],
  ],
  "DocumentsTable"
);
styleDate(documents, "F5:F204");
validateList(documents, "C5:C204", master.documentCategories);
setWidths(documents, [16, 14, 24, 34, 12, 16, 20, 42, 28]);

const masterSheet = addSheet("Master Data");
writeTitle(masterSheet, "Master Data", "Lookup values used by editable backend tables.", "J");
const masterColumns = [
  ["Division", master.divisions],
  ["Department", master.departments],
  ["Site", master.sites],
  ["Vendor", master.vendors],
  ["Project Category", master.categories],
  ["Project Status", master.statuses],
  ["Priority", master.priorities],
  ["Issue Category", master.issueCategories],
  ["Issue Severity", master.issueSeverities],
  ["Document Category", master.documentCategories],
];
masterSheet.getRange("A4:J4").values = [masterColumns.map(([title]) => title)];
masterSheet.getRange("A4:J4").format = { fill: colors.navy, font: { bold: true, color: colors.white } };
const maxLen = Math.max(...masterColumns.map(([, values]) => values.length));
const masterMatrix = Array.from({ length: maxLen }, (_, row) => masterColumns.map(([, values]) => values[row] || null));
masterSheet.getRangeByIndexes(4, 0, masterMatrix.length, masterColumns.length).values = masterMatrix;
masterSheet.getRangeByIndexes(3, 0, masterMatrix.length + 1, masterColumns.length).format.borders = { preset: "inside", style: "thin", color: colors.line };
setWidths(masterSheet, [22, 22, 16, 26, 20, 20, 12, 18, 18, 24]);

const analytics = addSheet("Analytics Helper");
writeTitle(analytics, "Analytics Helper", "Formula-backed backend views for charts and executive analytics.", "I");
analytics.getRange("A4:C4").values = [["Month", "Budget Trend", "Actual Trend"]];
analytics.getRange("A4:C4").format = { fill: colors.navy, font: { bold: true, color: colors.white } };
analytics.getRange("A5:C16").values = [
  ["Jan", 28.4, 21.2],
  ["Feb", 32.1, 24.5],
  ["Mar", 25.8, 19.1],
  ["Apr", 41.7, 27.9],
  ["May", 36.9, 31.4],
  ["Jun", 52.5, 37.6],
  ["Jul", 46.2, 34.2],
  ["Aug", 58.1, 45.4],
  ["Sep", 61.8, 50.8],
  ["Oct", 54.3, 43.1],
  ["Nov", 64.5, 55.7],
  ["Dec", 72.4, 63.2],
];
analytics.getRange("E4:G4").values = [["Health", "Count", "Meaning"]];
analytics.getRange("E4:G4").format = { fill: colors.teal, font: { bold: true, color: colors.white } };
analytics.getRange("E5:E7").values = [["Green"], ["Yellow"], ["Red"]];
analytics.getRange("F5").formulas = [['=COUNTIF(\'Project Progress\'!$K$5:$K$204,E5)']];
analytics.getRange("F5:F7").fillDown();
analytics.getRange("G5:G7").values = [["On track"], ["Watch"], ["Critical / overdue"]];
setWidths(analytics, [16, 16, 16, 4, 16, 12, 24, 4, 20]);

for (const ws of workbook.worksheets.items) {
  const used = ws.getUsedRange(true);
  if (used) {
    used.format.font = { name: "Aptos", size: 10 };
    used.format.wrapText = false;
    used.format.autofitRows();
  }
}

const previewSheets = ["Dashboard", "Projects", "Issues", "Master Data"];
await fs.mkdir(outputDir, { recursive: true });
for (const sheetName of previewSheets) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(path.join(outputDir, `${sheetName.replaceAll(" ", "_")}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const formulaErrors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(formulaErrors.ndjson);

const dashboardCheck = await workbook.inspect({
  kind: "table",
  sheetId: "Dashboard",
  range: "A1:F26",
  include: "values,formulas",
  tableMaxRows: 26,
  tableMaxCols: 6,
  maxChars: 4000,
});
console.log(dashboardCheck.ndjson);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);

