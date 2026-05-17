import { requireAdmin, json } from "../../../_shared/auth.js";
import { clean, isMissingTable, logProductivityActivity, missingMigrationResponse } from "../_productivity.js";
import {
  crmStage,
  duplicateAction,
  findOrCreateCompany,
  isValidEmail,
  normalizeEmail,
  parseCsv,
  pickMapped,
  upsertContactDetails,
} from "./_shared.js";

const FIELD_FALLBACKS = {
  name: ["Name", "Full Name", "Contact Name", "full_name", "name"],
  email: ["Email", "Email Address", "email", "email_address"],
  phone: ["Phone", "Phone Number", "Mobile", "phone"],
  company: ["Company", "Organization", "Business", "Account", "company", "organization"],
  title: ["Title", "Role", "Job Title", "Position", "title", "role"],
  source: ["Source", "Lead Source", "source"],
  tags: ["Tags", "tags"],
  stage: ["Stage", "Status", "Lifecycle Stage", "stage", "status"],
  owner: ["Owner", "Assigned To", "owner", "assigned_to"],
  last_contacted_at: ["Last Contacted", "Last Contacted Date", "last_contacted_at", "last_contacted"],
  next_follow_up_date: ["Next Follow Up", "Next Follow-up", "Next Follow Up Date", "next_follow_up_date"],
  notes: ["Notes", "Message", "Comments", "notes", "message"],
};

function mapped(row, mapping) {
  const email = normalizeEmail(pickMapped(row, mapping, "email", FIELD_FALLBACKS.email));
  const name = clean(pickMapped(row, mapping, "name", FIELD_FALLBACKS.name), 300) || email;
  const company = clean(pickMapped(row, mapping, "company", FIELD_FALLBACKS.company), 300);
  const title = clean(pickMapped(row, mapping, "title", FIELD_FALLBACKS.title), 200);
  return {
    name,
    email,
    phone: clean(pickMapped(row, mapping, "phone", FIELD_FALLBACKS.phone), 100),
    organization: company,
    company,
    role: title,
    title,
    source: clean(pickMapped(row, mapping, "source", FIELD_FALLBACKS.source), 200),
    tags: clean(pickMapped(row, mapping, "tags", FIELD_FALLBACKS.tags), 1000),
    lifecycle_stage: crmStage(clean(pickMapped(row, mapping, "stage", FIELD_FALLBACKS.stage), 100), "new"),
    lead_status: crmStage(clean(pickMapped(row, mapping, "stage", FIELD_FALLBACKS.stage), 100), "new"),
    owner: clean(pickMapped(row, mapping, "owner", FIELD_FALLBACKS.owner), 200),
    last_contacted_at: clean(pickMapped(row, mapping, "last_contacted_at", FIELD_FALLBACKS.last_contacted_at), 80),
    next_follow_up_date: clean(pickMapped(row, mapping, "next_follow_up_date", FIELD_FALLBACKS.next_follow_up_date), 80),
    notes: clean(pickMapped(row, mapping, "notes", FIELD_FALLBACKS.notes), 5000),
  };
}

async function getPayload(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    const text = file && typeof file.text === "function" ? await file.text() : "";
    return {
      rows: parseCsv(text),
      mapping: JSON.parse(form.get("mapping") || "{}"),
      duplicate_action: form.get("duplicate_action") || "skip",
      filename: file?.name || "upload.csv",
      source: form.get("source") || "crm_import",
    };
  }
  return request.json().catch(() => ({}));
}

async function updateContact(env, id, contact, companyId) {
  await env.DB.prepare(
    `UPDATE contacts
     SET name = ?, email = ?, phone = ?, organization = ?, role = ?, notes = ?, source = COALESCE(?, source),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(
    contact.name,
    contact.email,
    contact.phone,
    contact.organization,
    contact.role,
    contact.notes,
    contact.source,
    id
  ).run();
  await upsertContactDetails(env, id, contact, companyId);
}

async function insertContact(env, contact, companyId) {
  const { meta } = await env.DB.prepare(
    `INSERT INTO contacts (name, email, phone, organization, role, notes, source, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`
  ).bind(
    contact.name,
    contact.email,
    contact.phone,
    contact.organization,
    contact.role,
    contact.notes,
    contact.source
  ).run();
  await upsertContactDetails(env, meta.last_row_id, contact, companyId);
  return meta.last_row_id;
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const payload = await getPayload(request);
  const rows = Array.isArray(payload.rows) ? payload.rows.slice(0, 1000) : [];
  const mapping = payload.mapping || {};
  const action = duplicateAction(payload.duplicate_action);

  if (!rows.length) return json({ error: "no rows found" }, 400);

  try {
    const { meta } = await env.DB.prepare(
      `INSERT INTO crm_import_batches (filename, source, duplicate_action, total_rows)
       VALUES (?, ?, ?, ?)`
    ).bind(clean(payload.filename, 300), clean(payload.source, 200), action, rows.length).run();
    const batchId = meta.last_row_id;

    const summary = { imported: 0, updated: 0, skipped: 0, errors: 0 };
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2;
      const contact = mapped(rows[i], mapping);
      if (!contact.email || !isValidEmail(contact.email)) {
        summary.errors++;
        errors.push({ row_number: rowNumber, error: "Valid email required", row: rows[i] });
        continue;
      }

      const existing = await env.DB.prepare(
        "SELECT id FROM contacts WHERE lower(email) = lower(?) LIMIT 1"
      ).bind(contact.email).first();

      if (existing && action === "skip") {
        summary.skipped++;
        continue;
      }

      const companyId = await findOrCreateCompany(env, contact.company, { source: contact.source });
      if (existing && action === "update") {
        await updateContact(env, existing.id, contact, companyId);
        summary.updated++;
      } else {
        await insertContact(env, contact, companyId);
        summary.imported++;
      }
    }

    for (const error of errors.slice(0, 100)) {
      await env.DB.prepare(
        `INSERT INTO crm_import_errors (batch_id, row_number, error, raw_json)
         VALUES (?, ?, ?, ?)`
      ).bind(batchId, error.row_number, error.error, JSON.stringify(error.row).slice(0, 5000)).run();
    }

    await env.DB.prepare(
      `UPDATE crm_import_batches
       SET imported_rows = ?, updated_rows = ?, skipped_rows = ?, error_rows = ?
       WHERE id = ?`
    ).bind(summary.imported, summary.updated, summary.skipped, summary.errors, batchId).run();

    await logProductivityActivity(env, request, "crm_import_completed", `${summary.imported} imported, ${summary.updated} updated`);
    return json({
      batch_id: batchId,
      imported: summary.imported,
      updated: summary.updated,
      skipped: summary.skipped,
      error_rows: summary.errors,
      errors: errors.slice(0, 25),
    });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
