import { requireAdmin, json } from "../../../_shared/auth.js";
import { isMissingTable, missingMigrationResponse } from "../_productivity.js";
import { downloadResponse, toCsv, toExcelXml } from "./_shared.js";

const CONTACT_HEADERS = [
  ["id", "ID"],
  ["name", "Name"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["company_name", "Company"],
  ["title", "Title"],
  ["lifecycle_stage", "Stage"],
  ["tags", "Tags"],
  ["owner", "Owner"],
  ["source", "Source"],
  ["last_contacted_at", "Last Contacted"],
  ["days_since_contact", "Days Since Contact"],
  ["next_follow_up_date", "Next Follow-up"],
  ["follow_up_notes", "Follow-up Notes"],
  ["notes", "Notes"],
  ["created_at", "Created"],
  ["updated_at", "Updated"],
];

const COMPANY_HEADERS = [
  ["id", "ID"],
  ["name", "Company"],
  ["website", "Website"],
  ["industry", "Industry"],
  ["location", "Location"],
  ["source", "Source"],
  ["contact_count", "Contacts"],
  ["last_contacted_at", "Last Contacted"],
  ["next_follow_up_date", "Next Follow-up"],
  ["notes", "Notes"],
  ["created_at", "Created"],
  ["updated_at", "Updated"],
];

const ACTIVITY_HEADERS = [
  ["id", "ID"],
  ["activity_type", "Type"],
  ["activity_date", "Date"],
  ["contact_name", "Contact"],
  ["contact_email", "Email"],
  ["company_name", "Company"],
  ["subject", "Subject"],
  ["notes", "Notes"],
  ["outcome", "Outcome"],
  ["next_follow_up_date", "Next Follow-up"],
];

const DEAL_HEADERS = [
  ["id", "ID"],
  ["name", "Deal"],
  ["stage", "Stage"],
  ["amount_cents", "Amount Cents"],
  ["expected_close_date", "Expected Close"],
  ["owner", "Owner"],
  ["contact_name", "Contact"],
  ["company_name", "Company"],
  ["notes", "Notes"],
  ["created_at", "Created"],
  ["updated_at", "Updated"],
];

function headers(items) {
  return items.map(([key, label]) => ({ key, label }));
}

async function contacts(env) {
  const { results } = await env.DB.prepare(
    `SELECT c.id, c.name, c.email, c.phone, COALESCE(co.name, c.organization) AS company_name,
            COALESCE(d.title, c.role) AS title, COALESCE(d.lifecycle_stage, 'new') AS lifecycle_stage,
            d.tags, d.owner, COALESCE(d.source, c.source) AS source,
            d.last_contacted_at,
            CAST(julianday('now') - julianday(COALESCE(d.last_contacted_at, c.updated_at, c.created_at)) AS INTEGER) AS days_since_contact,
            d.next_follow_up_date, d.follow_up_notes, c.notes, c.created_at, c.updated_at
     FROM contacts c
     LEFT JOIN crm_contact_details d ON d.contact_id = c.id
     LEFT JOIN crm_companies co ON co.id = d.company_id
     ORDER BY c.updated_at DESC
     LIMIT 5000`
  ).all();
  return { rows: results, headers: headers(CONTACT_HEADERS) };
}

async function companies(env) {
  const { results } = await env.DB.prepare(
    `SELECT co.*,
            COUNT(d.contact_id) AS contact_count,
            MAX(d.last_contacted_at) AS last_contacted_at,
            MIN(CASE WHEN d.next_follow_up_date IS NOT NULL AND d.next_follow_up_date != '' THEN d.next_follow_up_date END) AS next_follow_up_date
     FROM crm_companies co
     LEFT JOIN crm_contact_details d ON d.company_id = co.id
     GROUP BY co.id
     ORDER BY co.name ASC
     LIMIT 5000`
  ).all();
  return { rows: results, headers: headers(COMPANY_HEADERS) };
}

async function activities(env) {
  const { results } = await env.DB.prepare(
    `SELECT a.*, c.name AS contact_name, c.email AS contact_email, co.name AS company_name
     FROM crm_activities a
     LEFT JOIN contacts c ON c.id = a.contact_id
     LEFT JOIN crm_companies co ON co.id = a.company_id
     ORDER BY datetime(a.activity_date) DESC
     LIMIT 5000`
  ).all();
  return { rows: results, headers: headers(ACTIVITY_HEADERS) };
}

async function deals(env) {
  const { results } = await env.DB.prepare(
    `SELECT d.*, c.name AS contact_name, co.name AS company_name
     FROM crm_deals d
     LEFT JOIN contacts c ON c.id = d.contact_id
     LEFT JOIN crm_companies co ON co.id = d.company_id
     ORDER BY d.updated_at DESC
     LIMIT 5000`
  ).all();
  return { rows: results, headers: headers(DEAL_HEADERS) };
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "contacts";
  const format = url.searchParams.get("format") === "xls" ? "xls" : "csv";
  const today = new Date().toISOString().slice(0, 10);

  try {
    const data = type === "companies"
      ? await companies(env)
      : type === "activities"
        ? await activities(env)
        : type === "pipeline" || type === "deals"
          ? await deals(env)
          : await contacts(env);

    const body = format === "xls" ? toExcelXml(data.rows, data.headers) : toCsv(data.rows, data.headers);
    const extension = format === "xls" ? "xls" : "csv";
    return downloadResponse(body, `aiimpactmaine-crm-${type}-${today}.${extension}`, format);
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    return json({ error: "export failed" }, 500);
  }
}
