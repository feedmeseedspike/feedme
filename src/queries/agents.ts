import { createClient } from "../utils/supabase/client";
import { Database } from "../utils/database.types";

const supabase = createClient();

export type Agent = Database["public"]["Tables"]["agents"]["Row"];
export type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
export type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];

export async function getAgentsQuery() {
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addAgentMutation(agent: AgentInsert) {
  const { data, error } = await supabase
    .from("agents")
    .insert([agent])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateAgentMutation(id: string, agent: AgentUpdate) {
  const { data, error } = await supabase
    .from("agents")
    .update(agent)
    .eq("id", id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteAgentMutation(id: string) {
  const { error } = await supabase
    .from("agents")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
} 