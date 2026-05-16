import { requireAdmin, json } from "../../_shared/auth.js";
import { isMissingTable, missingMigrationResponse } from "./_productivity.js";

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
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  try {
    const [
      todayEvents,
      upcomingEvents,
      openTasks,
      urgentTasks,
      overdueTasks,
      newLeads,
      upcomingFollowUps,
      activeProjects,
      blockedProjects,
      upcomingMilestones,
      overdueMilestones,
      waitingProjects,
      recentActivity,
    ] = await Promise.all([
      all(env,
        `SELECT ce.id, ce.title, ce.start_time, ce.event_type, c.name AS client_name
         FROM calendar_events ce LEFT JOIN clients c ON c.id = ce.client_id
         WHERE date(ce.start_time) = date(?) AND ce.status != 'canceled'
         ORDER BY datetime(ce.start_time) ASC LIMIT 10`, today),
      all(env,
        `SELECT ce.id, ce.title, ce.start_time, ce.event_type, c.name AS client_name
         FROM calendar_events ce LEFT JOIN clients c ON c.id = ce.client_id
         WHERE date(ce.start_time) >= date(?) AND ce.status != 'canceled'
         ORDER BY datetime(ce.start_time) ASC LIMIT 10`, tomorrow),
      all(env,
        `SELECT id, title, priority, due_date FROM tasks
         WHERE status IN ('open','in_progress')
         ORDER BY COALESCE(due_date, '9999-12-31') ASC LIMIT 10`),
      all(env,
        `SELECT id, title, priority, due_date FROM tasks
         WHERE status IN ('open','in_progress') AND priority = 'urgent'
         ORDER BY COALESCE(due_date, '9999-12-31') ASC LIMIT 10`),
      all(env,
        `SELECT id, title, priority, due_date FROM tasks
         WHERE status IN ('open','in_progress') AND due_date IS NOT NULL AND date(due_date) < date(?)
         ORDER BY date(due_date) ASC LIMIT 10`, today),
      all(env,
        `SELECT id, name, email, organization, created_at FROM leads
         WHERE status = 'new'
         ORDER BY created_at DESC LIMIT 10`),
      all(env,
        `SELECT f.id, f.title, f.due_date, l.name AS lead_name, c.name AS client_name
         FROM follow_ups f
         LEFT JOIN leads l ON l.id = f.lead_id
         LEFT JOIN clients c ON c.id = f.client_id
         WHERE f.status = 'open' AND date(f.due_date) <= date(?)
         ORDER BY date(f.due_date) ASC LIMIT 10`, nextWeek),
      all(env,
        `SELECT id, name, progress_percent, target_end_date FROM projects
         WHERE status = 'active'
         ORDER BY COALESCE(target_end_date, '9999-12-31') ASC LIMIT 10`),
      all(env,
        `SELECT id, name, progress_percent, target_end_date FROM projects
         WHERE status = 'blocked'
         ORDER BY updated_at DESC LIMIT 10`),
      all(env,
        `SELECT m.id, m.title, m.due_date, p.name AS project_name
         FROM project_milestones m JOIN projects p ON p.id = m.project_id
         WHERE m.status != 'completed' AND m.due_date IS NOT NULL AND date(m.due_date) <= date(?)
         ORDER BY date(m.due_date) ASC LIMIT 10`, nextWeek),
      all(env,
        `SELECT m.id, m.title, m.due_date, p.name AS project_name
         FROM project_milestones m JOIN projects p ON p.id = m.project_id
         WHERE m.status != 'completed' AND m.due_date IS NOT NULL AND date(m.due_date) < date(?)
         ORDER BY date(m.due_date) ASC LIMIT 10`, today),
      all(env,
        `SELECT id, name, progress_percent, target_end_date FROM projects
         WHERE status = 'waiting_on_client'
         ORDER BY updated_at DESC LIMIT 10`),
      all(env,
        `SELECT id, event_type, detail, created_at FROM activity_log
         ORDER BY created_at DESC LIMIT 15`),
    ]);

    const counts = {
      today_events: todayEvents.length,
      open_tasks: (await one(env, "SELECT COUNT(*) AS count FROM tasks WHERE status IN ('open','in_progress')"))?.count || 0,
      urgent_tasks: urgentTasks.length,
      overdue_tasks: overdueTasks.length,
      new_leads: newLeads.length,
      active_projects: (await one(env, "SELECT COUNT(*) AS count FROM projects WHERE status = 'active'"))?.count || 0,
      blocked_projects: blockedProjects.length,
      waiting_on_client: waitingProjects.length,
      overdue_milestones: overdueMilestones.length,
    };

    return json({
      counts,
      today_events: todayEvents,
      upcoming_events: upcomingEvents,
      open_tasks: openTasks,
      urgent_tasks: urgentTasks,
      overdue_tasks: overdueTasks,
      new_leads: newLeads,
      upcoming_follow_ups: upcomingFollowUps,
      active_projects: activeProjects,
      blocked_projects: blockedProjects,
      upcoming_milestones: upcomingMilestones,
      overdue_milestones: overdueMilestones,
      waiting_projects: waitingProjects,
      recent_activity: recentActivity,
    });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
