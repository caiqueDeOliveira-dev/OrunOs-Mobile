import { supabase } from "./supabaseClient";
import { getUserId } from "../stores/authStore";

export interface ScheduledJob {
  id: string;
  agent_id: string;
  name: string;
  cron_expression: string;
  prompt: string;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

export interface JobRun {
  id: string;
  job_id: string;
  status: "success" | "error" | "skipped";
  result: string | null;
  error_message: string | null;
  duration_ms: number | null;
  ran_at: string;
}

/**
 * Loads all scheduled jobs for the current user.
 */
export async function loadScheduledJobs(agentId?: string): Promise<ScheduledJob[]> {
  let query = supabase
    .from("scheduled_jobs")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (agentId) query = query.eq("agent_id", agentId);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load scheduled jobs: ${error.message}`);
  return (data ?? []) as ScheduledJob[];
}

/**
 * Creates a new scheduled job.
 */
export async function createScheduledJob(
  agentId: string,
  name: string,
  cronExpression: string,
  prompt: string,
): Promise<ScheduledJob> {
  const userId = getUserId();
  const nextRun = computeNextRun(cronExpression);

  const { data, error } = await supabase
    .from("scheduled_jobs")
    .insert({
      user_id: userId,
      agent_id: agentId,
      name,
      cron_expression: cronExpression,
      prompt,
      next_run_at: nextRun,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create scheduled job: ${error.message}`);
  return data as ScheduledJob;
}

/**
 * Toggles a scheduled job's enabled state.
 */
export async function toggleScheduledJob(jobId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from("scheduled_jobs")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  if (error) throw new Error(`Failed to toggle scheduled job: ${error.message}`);
}

/**
 * Deletes a scheduled job (soft delete).
 */
export async function deleteScheduledJob(jobId: string): Promise<void> {
  const { error } = await supabase
    .from("scheduled_jobs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", jobId);

  if (error) throw new Error(`Failed to delete scheduled job: ${error.message}`);
}

/**
 * Loads run history for a specific job.
 */
export async function loadJobRuns(jobId: string, limit: number = 20): Promise<JobRun[]> {
  const { data, error } = await supabase
    .from("job_runs")
    .select("*")
    .eq("job_id", jobId)
    .order("ran_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load job runs: ${error.message}`);
  return (data ?? []) as JobRun[];
}

/**
 * Computes the next run time from a cron expression.
 * Simple implementation — handles basic cron patterns.
 * For production, use a proper cron library on the server side.
 */
function computeNextRun(cronExpression: string): string {
  const parts = cronExpression.split(" ");
  if (parts.length !== 5) return new Date(Date.now() + 3600000).toISOString();

  const [minute, hour, , , ] = parts;
  const now = new Date();
  const next = new Date(now);

  if (minute !== "*") next.setMinutes(parseInt(minute, 10), 0, 0);
  else next.setMinutes(now.getMinutes() + 1, 0, 0);

  if (hour !== "*") next.setHours(parseInt(hour, 10), 0, 0);
  else next.setHours(now.getHours());

  if (next <= now) next.setTime(next.getTime() + 86400000);
  return next.toISOString();
}

/**
 * Returns human-readable description of a cron expression.
 */
export function describeCron(expr: string): string {
  const parts = expr.split(" ");
  if (parts.length !== 5) return expr;

  const [minute, hour, dom, month, dow] = parts;

  if (minute === "*" && hour === "*") return "A cada minuto";
  if (minute === "0" && hour === "*") return "A cada hora";
  if (minute !== "*" && hour !== "*") {
    const time = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
    if (dow === "1-5") return `As ${hour}h dias de semana`;
    if (dow === "0,6") return `As ${hour}h fins de semana`;
    if (dom === "*" && month === "*") return `${time} todos os dias`;
    return `${time}`;
  }
  if (minute !== "*") return `A cada hora no minuto :${minute.padStart(2, "0")}`;
  if (dow === "1-5") return `As ${hour}h dias de semana`;
  if (dow === "0,6") return `As ${hour}h fins de semana`;
  if (dom === "*" && month === "*") return `As ${hour}h todos os dias`;

  return expr;
}
