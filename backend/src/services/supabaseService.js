// src/services/supabaseService.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error("Missing Supabase env vars");
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Example helper: get user profile by id
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Example helper: fetch students list
 */
export async function listStudents(limit = 100) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .limit(limit);
  if (error) throw error;
  return data;
}
