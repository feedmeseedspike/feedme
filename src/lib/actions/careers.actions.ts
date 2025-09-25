"use server";

import { createClient, createServiceRoleClient } from "../../utils/supabase/server";

// Types
export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience_level: 'entry' | 'mid' | 'senior' | 'executive';
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  salary_range?: string;
  status: 'active' | 'inactive' | 'filled';
  posted_date: string;
  closing_date?: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  resume_url: string;
  cover_letter?: string;
  status: 'pending' | 'reviewing' | 'interviewed' | 'rejected' | 'hired';
  applied_at: string;
  created_at: string;
  updated_at: string;
  // Relations
  job?: Job;
}

// Jobs Actions
export async function getAllJobs(filters?: {
  status?: string;
  department?: string;
  type?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select("*")
    .order("posted_date", { ascending: false });

  if (filters) {
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.department) query = query.eq("department", filters.department);
    if (filters.type) query = query.eq("type", filters.type);
    if (filters.limit && filters.offset !== undefined) {
      query = query.range(filters.offset, filters.offset + filters.limit - 1);
    }
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Job[];
}

export async function getActiveJobs() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "active")
    .order("posted_date", { ascending: false });

  if (error) throw error;
  return data as Job[];
}

export async function getJobById(jobId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) throw error;
  return data as Job;
}

// Admin Actions
export async function createJob(jobData: Omit<Job, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("jobs")
    .insert([{
      ...jobData,
      posted_date: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Job;
}

export async function updateJob(jobId: string, jobData: Partial<Job>) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("jobs")
    .update(jobData)
    .eq("id", jobId)
    .select()
    .single();

  if (error) throw error;
  return data as Job;
}

export async function deleteJob(jobId: string) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", jobId);

  if (error) throw error;
}

// Job Applications Actions
export async function createJobApplication(applicationData: Omit<JobApplication, 'id' | 'created_at' | 'updated_at' | 'applied_at'>) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("job_applications")
    .insert([{
      ...applicationData,
      applied_at: new Date().toISOString(),
      status: 'pending'
    }])
    .select()
    .single();

  if (error) throw error;
  return data as JobApplication;
}

export async function getJobApplications(jobId?: string) {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from("job_applications")
    .select(`
      *,
      job:jobs(*)
    `)
    .order("applied_at", { ascending: false });

  if (jobId) {
    query = query.eq("job_id", jobId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as JobApplication[];
}

export async function updateApplicationStatus(applicationId: string, status: JobApplication['status']) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId)
    .select()
    .single();

  if (error) throw error;
  return data as JobApplication;
}

export async function checkUserApplicationStatus(email: string, jobId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("job_applications")
    .select("job_id, status")
    .eq("email", email);

  if (jobId) {
    query = query.eq("job_id", jobId);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  // Return a map of job_id -> status for easy lookup
  const applicationMap: Record<string, string> = {};
  data?.forEach(app => {
    applicationMap[app.job_id] = app.status;
  });
  
  return applicationMap;
}

// Department types and actions
export interface Department {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Helper functions
export async function getDepartments() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("department_config")
      .select("name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return data.map(dept => dept.name);
  } catch (error) {
    console.warn("Failed to fetch departments from database, using fallback:", error);
    // Fallback to hardcoded list if database query fails
    return [
      'Engineering',
      'Product',
      'Design',
      'Marketing',
      'Sales',
      'Customer Success',
      'Operations',
      'Finance',
      'Human Resources',
      'Legal',
      'Data Science',
      'Quality Assurance',
      'DevOps',
      'Business Development'
    ];
  }
}

// Department management functions (admin only)
export async function getAllDepartments() {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("department_config")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createDepartment(departmentData: { name: string; sort_order?: number }) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("department_config")
    .insert([departmentData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDepartment(departmentName: string, departmentData: { is_active?: boolean; sort_order?: number }) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("department_config")
    .update(departmentData)
    .eq("name", departmentName)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDepartment(departmentName: string) {
  const supabase = createServiceRoleClient();

  // Check if department is being used by any jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id")
    .eq("department", departmentName)
    .limit(1);

  if (jobs && jobs.length > 0) {
    throw new Error("Cannot delete department that is being used by existing jobs");
  }

  const { error } = await supabase
    .from("department_config")
    .delete()
    .eq("name", departmentName);

  if (error) throw error;
}