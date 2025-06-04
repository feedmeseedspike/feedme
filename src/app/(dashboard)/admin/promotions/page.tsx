import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { Metadata } from "next";
import HomeBannersManager from "@components/admin/promotions/HomeBannersManager";
import TagBannersManager from "@components/admin/promotions/TagBannersManager";
import PromotionManager from "@components/admin/promotions/PromoCardsManager";
import UniqueTagList from "@components/admin/promotions/UniqueTagList";

export const metadata: Metadata = {
  title: "Manage Promotions | FeedMe Admin",
  description: "Manage promotional content for FeedMe",
};

export default async function PromotionsPage() {
  return (
    // <AdminLayout>
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Manage Promotions</h1>

      <Tabs defaultValue="promo-cards">
        <TabsList className="mb-6">
          <TabsTrigger value="promo-cards">Promo Cards</TabsTrigger>
          <TabsTrigger value="home-banners">Home Banners</TabsTrigger>
          <TabsTrigger value="tag-banners">Tag Page Banners</TabsTrigger>
        </TabsList>

        <TabsContent value="promo-cards">
          <PromotionManager />
        </TabsContent>

        <TabsContent value="home-banners">
          <HomeBannersManager />
        </TabsContent>

        <TabsContent value="tag-banners">
          <TagBannersManager />
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <UniqueTagList />
      </div>
    </div>
    // </AdminLayout>
  );
}
