import { json } from "../../_shared/auth.js";

export const EVENT_TYPES = ["consultation", "training", "AI audit", "follow-up", "internal task", "deadline"];
export const EVENT_STATUSES = ["scheduled", "completed", "canceled"];
export const TASK_STATUSES = ["open", "in_progress", "completed", "canceled"];
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"];
export const LEAD_STATUSES = ["new", "contacted", "proposal_sent", "won", "lost", "qualified", "closed", "spam"];
export const FOLLOW_UP_STATUSES = ["open", "completed", "canceled"];
export const PROJECT_TYPES = ["AI training", "AI audit", "municipal assessment", "policy/governance", "website/internal", "sponsorship/conference", "client support", "other"];
export const PROJECT_STATUSES = ["planning", "active", "waiting_on_client", "blocked", "completed", "archived"];
export const MILESTONE_STATUSES = ["not_started", "in_progress", "completed", "blocked"];

export function clean(value, max = 2000) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, max) : null;
}

export function intOrNull(value) {
  if (value === "" || value == null) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

export function clampInt(value, min, max, fallback = 0) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function valueIn(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

export function idFromRequest(request, params = {}) {
  const fromParams = params.id ? Number.parseInt(params.id, 10) : null;
  if (Number.isFinite(fromParams) && fromParams > 0) return fromParams;
  const fromQuery = Number.parseInt(new URL(request.url).searchParams.get("id"), 10);
  return Number.isFinite(fromQuery) && fromQuery > 0 ? fromQuery : null;
}

export function missingMigrationResponse() {
  return json({ error: "productivity tables missing; run migrations/0006_productivity_ops.sql in D1" }, 503);
}

export function isMissingTable(err) {
  return /no such table/i.test(String(err?.message || err));
}

export async function readJson(request) {
  return request.json().catch(() => ({}));
}

export async function logProductivityActivity(env, request, eventType, detail) {
  try {
    const ip = request.headers.get("CF-Connecting-IP") || "";
    const ua = request.headers.get("User-Agent") || "";
    await env.DB.prepare(
      "INSERT INTO activity_log (event_type, detail, ip_address, user_agent) VALUES (?, ?, ?, ?)"
    ).bind(eventType, detail || null, ip, ua).run();
  } catch {
    // Activity logging should never block the productivity action.
  }
}

export async function updateRow(env, table, id, body, fields) {
  const updates = [];
  const params = [];
  for (const [field, transform] of Object.entries(fields)) {
    if (field in body) {
      updates.push(`${field} = ?`);
      params.push(transform(body[field], body));
    }
  }
  if (!updates.length) return { error: "no fields to update" };
  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  await env.DB.prepare(`UPDATE ${table} SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  return { updated: updates.length - 1 };
}
