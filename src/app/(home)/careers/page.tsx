import CareersClient from "./CareersClient";
import Container from "@components/shared/Container";
import {
  getActiveJobs,
  checkUserApplicationStatus,
  Job,
} from "@/lib/actions/careers.actions";
import { createServerComponentClient } from "@utils/supabase/server";

export default async function CareersPage() {
  // Fetch jobs on the server
  let jobs: Job[];
  let userApplications: Record<string, string> = {};

  try {
    jobs = await getActiveJobs();
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    jobs = [];
  }

  // Check if user is logged in and get their application status
  try {
    const supabase = await createServerComponentClient();
    const { data: userData } = await supabase.auth.getUser();

    if (userData?.user?.email) {
      userApplications = await checkUserApplicationStatus(userData.user.email);
    }
  } catch (error) {
    console.error("Failed to fetch user applications:", error);
    userApplications = {};
  }

  return (
    <div className="min-h-screen bg-white">
      <Container>
        <div className="py-12">
          {/* Simple Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Careers</h1>
            <p className="text-gray-600">
              Join our team and help build the future of food delivery
            </p>
          </div>

          {/* Job Listings */}
          <CareersClient jobs={jobs} userApplications={userApplications} />
        </div>
      </Container>
    </div>
  );
}
