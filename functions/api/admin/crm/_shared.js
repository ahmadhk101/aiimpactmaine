import { clean, intOrNull, valueIn } from "../_productivity.js";

export const CRM_STAGES = ["new", "contacted", "meeting_scheduled", "proposal_sent", "won", "lost", "inactive"];
export const CRM_ACTIVITY_TYPES = ["email", "call", "meeting", "note", "follow_up", "proposal", "other"];
export const CRM_DUPLICATE_ACTIONS = ["skip", "update", "create"];

export function normalizeEmail(value) {
  const email = clean(value, 320);
  return email ? email.toLowerCase() : null;
}

export function isValidEmail(value) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
}

export function crmStage(value, fallback = "new") {
  return valueIn(value, CRM_STAGES, fallback);
}

export function crmActivityType(value, fallback = "note") {
  return valueIn(value, CRM_ACTIVITY_TYPES, fallback);
}

export function duplicateAction(value) {
  return valueIn(value, CRM_DUPLICATE_ACTIONS, "skip");
}

export function cents(value) {
  if (value === "" || value == null) return null;
  const n = Number.parseFloat(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export async function findOrCreateCompany(env, companyName, extras = {}) {
  const name = clean(companyName, 300);
  if (!name) return null;

  const existing = await env.DB.prepare(
    "SELECT id FROM crm_companies WHERE lower(name) = lower(?)"
  ).bind(name).first();
  if (existing) return existing.id;

  const { meta } = await env.DB.prepare(
    `INSERT INTO crm_companies (name, website, industry, location, notes, source)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    name,
    clean(extras.website, 500),
    clean(extras.industry, 200),
    clean(extras.location, 300),
    clean(extras.notes, 3000),
    clean(extras.source, 200)
  ).run();
  return meta.last_row_id;
}

export async function upsertContactDetails(env, contactId, body, companyId = undefined) {
  const stage = crmStage(body.lifecycle_stage || body.stage || body.status, "new");
  const leadStatus = crmStage(body.lead_status || body.stage || body.status, stage);
  await env.DB.prepare(
    `INSERT INTO crm_contact_details
      (contact_id, company_id, title, tags, lifecycle_stage, lead_status, owner,
       last_contacted_at, next_follow_up_date, follow_up_notes, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(contact_id) DO UPDATE SET
       company_id = excluded.company_id,
       title = excluded.title,
       tags = excluded.tags,
       lifecycle_stage = excluded.lifecycle_stage,
       lead_status = excluded.lead_status,
       owner = excluded.owner,
       last_contacted_at = excluded.last_contacted_at,
       next_follow_up_date = excluded.next_follow_up_date,
       follow_up_notes = excluded.follow_up_notes,
       source = excluded.source,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(
    contactId,
    companyId === undefined ? intOrNull(body.company_id) : companyId,
    clean(body.title || body.role, 200),
    clean(body.tags, 1000),
    stage,
    leadStatus,
    clean(body.owner, 200),
    clean(body.last_contacted_at || body.last_contacted_date, 80),
    clean(body.next_follow_up_date, 80),
    clean(body.follow_up_notes, 2000),
    clean(body.source, 200)
  ).run();
}

export function csvEscape(value) {
  const s = value == null ? "" : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows, headers) {
  const lines = [headers.map(h => csvEscape(h.label)).join(",")];
  for (const row of rows) {
    lines.push(headers.map(h => csvEscape(row[h.key])).join(","));
  }
  return "\ufeff" + lines.join("\r\n");
}

export function xmlEscape(value) {
  return String(value ?? "").replace(/[<>&'"]/g, c => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  }[c]));
}

export function toExcelXml(rows, headers) {
  const headerRow = headers.map(h => `<Cell><Data ss:Type="String">${xmlEscape(h.label)}</Data></Cell>`).join("");
  const bodyRows = rows.map(row => `<Row>${headers.map(h => `<Cell><Data ss:Type="String">${xmlEscape(row[h.key])}</Data></Cell>`).join("")}</Row>`).join("");
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="CRM Export">
  <Table>
   <Row>${headerRow}</Row>
   ${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function downloadResponse(body, filename, format = "csv") {
  const isExcel = format === "xls";
  return new Response(body, {
    headers: {
      "Content-Type": isExcel ? "application/vnd.ms-excel; charset=utf-8" : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  row.push(field);
  rows.push(row);

  const headers = (rows.shift() || []).map(h => h.trim());
  return rows
    .filter(r => r.some(v => String(v || "").trim()))
    .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

export function pickMapped(row, mapping, field, fallback = []) {
  const keys = [mapping?.[field], ...fallback].filter(Boolean);
  for (const key of keys) {
    if (key in row && String(row[key] ?? "").trim()) return row[key];
  }
  return "";
}
