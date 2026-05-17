import { requireAdmin, json } from "../../../_shared/auth.js";
import { isMissingTable, missingMigrationResponse } from "../_productivity.js";

async function all(env, sql, ...params) {
  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return results;
}

async function one(env, sql, ...params) {
  return env.DB.prepare(sql).bind(...params).first();
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  try {
    const [
      overdueFollowUps,
      upcomingFollowUps,
      stale30,
      stale60,
      stale90,
      recentActivities,
      stageCounts,
      importHistory,
      newContacts,
    ] = await Promise.all([
      all(env,
        `SELECT c.id, c.name, c.email, co.name AS company_name, d.next_follow_up_date, d.follow_up_notes
         FROM contacts c
         JOIN crm_contact_details d ON d.contact_id = c.id
         LEFT JOIN crm_companies co ON co.id = d.company_id
         WHERE d.next_follow_up_date IS NOT NULL AND d.next_follow_up_date != '' AND date(d.next_follow_up_date) < date(?)
         ORDER BY date(d.next_follow_up_date) ASC LIMIT 20`, today),
      all(env,
        `SELECT c.id, c.name, c.email, co.name AS company_name, d.next_follow_up_date, d.follow_up_notes
         FROM contacts c
         JOIN crm_contact_details d ON d.contact_id = c.id
         LEFT JOIN crm_companies co ON co.id = d.company_id
         WHERE d.next_follow_up_date IS NOT NULL AND d.next_follow_up_date != ''
           AND date(d.next_follow_up_date) BETWEEN date(?) AND date(?)
         ORDER BY date(d.next_follow_up_date) ASC LIMIT 20`, today, nextWeek),
      one(env, "SELECT COUNT(*) AS count FROM crm_contact_details WHERE last_contacted_at IS NULL OR date(last_contacted_at) <= date('now', '-30 days')"),
      one(env, "SELECT COUNT(*) AS count FROM crm_contact_details WHERE last_contacted_at IS NULL OR date(last_contacted_at) <= date('now', '-60 days')"),
      one(env, "SELECT COUNT(*) AS count FROM crm_contact_details WHERE last_contacted_at IS NULL OR date(last_contacted_at) <= date('now', '-90 days')"),
      all(env,
        `SELECT a.id, a.activity_type, a.subject, a.activity_date, c.name AS contact_name, co.name AS company_name
         FROM crm_activities a
         LEFT JOIN contacts c ON c.id = a.contact_id
         LEFT JOIN crm_companies co ON co.id = a.company_id
         ORDER BY datetime(a.activity_date) DESC LIMIT 15`),
      all(env,
        `SELECT COALESCE(lifecycle_stage, 'new') AS stage, COUNT(*) AS count
         FROM crm_contact_details
         GROUP BY COALESCE(lifecycle_stage, 'new')
         ORDER BY count DESC`),
      all(env,
        `SELECT id, filename, total_rows, imported_rows, updated_rows, skipped_rows, error_rows, created_at
         FROM crm_import_batches
         ORDER BY created_at DESC LIMIT 8`),
      all(env,
        `SELECT c.id, c.name, c.email, co.name AS company_name, c.created_at
         FROM contacts c
         LEFT JOIN crm_contact_details d ON d.contact_id = c.id
         LEFT JOIN crm_companies co ON co.id = d.company_id
         ORDER BY c.created_at DESC LIMIT 10`),
    ]);

    const counts = {
      contacts: (await one(env, "SELECT COUNT(*) AS count FROM contacts"))?.count || 0,
      companies: (await one(env, "SELECT COUNT(*) AS count FROM crm_companies"))?.count || 0,
      overdue_follow_ups: overdueFollowUps.length,
      upcoming_follow_ups: upcomingFollowUps.length,
      stale_30: stale30?.count || 0,
      stale_60: stale60?.count || 0,
      stale_90: stale90?.count || 0,
    };

    return json({
      counts,
      overdue_follow_ups: overdueFollowUps,
      upcoming_follow_ups: upcomingFollowUps,
      stale: { days_30: stale30?.count || 0, days_60: stale60?.count || 0, days_90: stale90?.count || 0 },
      recent_activities: recentActivities,
      stage_counts: stageCounts,
      import_history: importHistory,
      new_contacts: newContacts,
    });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
