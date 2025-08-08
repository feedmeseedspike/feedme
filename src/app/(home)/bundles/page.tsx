export const dynamic = "force-dynamic";

import { createServerComponentClient } from "src/utils/supabase/server";
import Container from "@components/shared/Container";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import BundleCard from "@components/shared/bundles/BundleCard";

export default async function BundlesPage() {
  try {
    const supabase = await createServerComponentClient();
    
    // Fetch all published bundles
    const { data: bundles, error } = await supabase
      .from('bundles')
      .select('*')
      .eq('published_status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (
      <main className="min-h-screen">
        <div className="bg-white py-4">
          <Container>
            <CustomBreadcrumb />
          </Container>
        </div>
        
        <div className="py-2 md:border-b shadow-sm">
          <Container>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center">
                <h1 className="text-[#1B6013] text-2xl md:text-3xl font-bold">
                  Our Bundles
                </h1>
              </div>
            </div>
          </Container>
        </div>
        
        <Container className="py-8">
          {!bundles || bundles.length === 0 ? (
            <p className="text-center text-gray-500">
              No bundles available at the moment.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {bundles.map((bundle) => (
                <BundleCard
                  key={bundle.id}
                  bundle={bundle}
                />
              ))}
            </div>
          )}
        </Container>
      </main>
    );
  } catch (error) {
    console.error("Error fetching bundles:", error);
    return (
      <main className="min-h-screen">
        <Container className="py-8">
          <div className="text-center text-red-600">
            Error loading bundles. Please try again later.
          </div>
        </Container>
      </main>
    );
  }
}
