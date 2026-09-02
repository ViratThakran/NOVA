import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveAuthoritativeStudentJourney,
  type AuthoritativeJourneyState,
} from "./journey";

export type StudentDashboardState = AuthoritativeJourneyState;
export type StudentDashboardMentorFeedback = AuthoritativeJourneyState["recentMentorFeedback"][number];

/**
 * Aggregates full real-time dashboard data for an authenticated student from Supabase.
 * Strictly scopes all queries to studentId and active enrollment.
 * Uses the single Authoritative Journey Resolver.
 */
export async function getStudentDashboardState(
  supabase: SupabaseClient,
  studentId: string
): Promise<StudentDashboardState> {
  return resolveAuthoritativeStudentJourney(supabase, studentId);
}
