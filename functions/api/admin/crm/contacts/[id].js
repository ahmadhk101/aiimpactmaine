import { requireAdmin, json } from "../../../../_shared/auth.js";
import { clean, idFromRequest, intOrNull, isMissingTable, logProductivityActivity, missingMigrationResponse, readJson } from "../../_productivity.js";
import { crmStage, findOrCreateCompany, isValidEmail, normalizeEmail, upsertContactDetails } from "../_shared.js";

async function contactWithDetails(env, id) {
  return env.DB.prepare(
    `SELECT c.id, c.client_id, c.lead_id, c.name, c.email, c.phone, c.organization, c.role,
            c.notes, c.source, c.status AS contact_status, c.created_at, c.updated_at,
            d.company_id, d.title, d.tags, d.lifecycle_stage, d.lead_status, d.owner,
            d.last_contacted_at, d.next_follow_up_date, d.follow_up_notes, d.source AS crm_source,
            co.name AS company_name, co.website AS company_website, co.industry AS company_industry,
            co.location AS company_location
     FROM contacts c
     LEFT JOIN crm_contact_details d ON d.contact_id = c.id
     LEFT JOIN crm_companies co ON co.id = d.company_id
     WHERE c.id = ?`
  ).bind(id).first();
}

export async function onRequestGet({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const id = idFromRequest(request, params);
  if (!id) return json({ error: "id required" }, 400);

  try {
    const contact = await contactWithDetails(env, id);
    if (!contact) return json({ error: "not found" }, 404);
    const { results: activities } = await env.DB.prepare(
      `SELECT * FROM crm_activities
       WHERE contact_id = ?
       ORDER BY datetime(activity_date) DESC, created_at DESC
       LIMIT 100`
    ).bind(id).all();
    return json({ contact, activities });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export async function onRequestPut({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const id = idFromRequest(request, params);
  if (!id) return json({ error: "id required" }, 400);

  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  if (email && !isValidEmail(email)) return json({ error: "invalid email" }, 400);

  try {
    const existing = await contactWithDetails(env, id);
    if (!existing) return json({ error: "not found" }, 404);

    const updates = [];
    const values = [];
    const baseFields = {
      client_id: value => intOrNull(value),
      lead_id: value => intOrNull(value),
      name: value => clean(value, 300) || existing.name,
      email: value => normalizeEmail(value),
      phone: value => clean(value, 100),
      organization: value => clean(value, 300),
      role: value => clean(value, 200),
      notes: value => clean(value, 5000),
      source: value => clean(value, 200),
      contact_status: value => clean(value, 100) || "active",
    };

    for (const [field, transform] of Object.entries(baseFields)) {
      if (field in body) {
        const dbField = field === "contact_status" ? "status" : field;
        updates.push(`${dbField} = ?`);
        values.push(transform(body[field]));
      }
    }
    if (updates.length) {
      updates.push("updated_at = CURRENT_TIMESTAMP");
      values.push(id);
      await env.DB.prepare(`UPDATE contacts SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
    }

    const companyId = await findOrCreateCompany(env, body.company || body.organization || body.company_name, {
      website: body.company_website,
      industry: body.company_industry,
      location: body.company_location,
      source: body.source,
    });

    await upsertContactDetails(env, id, {
      ...existing,
      ...body,
      lifecycle_stage: crmStage(body.lifecycle_stage || body.stage || existing.lifecycle_stage || "new"),
    }, companyId || intOrNull(body.company_id) || existing.company_id);

    await logProductivityActivity(env, request, "crm_contact_updated", body.name || existing.name || `Contact #${id}`);
    return json({ id, updated: true });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export async function onRequestDelete({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const id = idFromRequest(request, params);
  if (!id) return json({ error: "id required" }, 400);

  try {
    await env.DB.prepare("UPDATE contacts SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(id)
      .run();
    await upsertContactDetails(env, id, { lifecycle_stage: "inactive", lead_status: "inactive" });
    await logProductivityActivity(env, request, "crm_contact_inactive", `Contact #${id}`);
    return json({ id, inactive: true });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
