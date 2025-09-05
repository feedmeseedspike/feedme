import { vectorStore } from "../src/lib/langchain/rag-chain";
import { getProducts } from "../src/queries/products";
import { getBundles } from "../src/queries/bundles";
import { Document } from "@langchain/core/documents";

async function populateVectorStore() {
  try {
    console.log("Starting vector store population...");
    
    // Get products and bundles
    const productsResult = await getProducts({ limit: 1000, publishedStatus: "Published" });
    const products = productsResult.data || [];
    const bundles = await getBundles();
    
    console.log(`Found ${products.length} products and ${bundles.length} bundles`);
    
    // Create documents from products
    const productDocs = products.map((product: any) => new Document({
      pageContent: `Product: ${product.name}\nDescription: ${product.description || 'No description available'}\nPrice: ₦${product.price || 0}\nCategory: ${product.category_ids?.join(', ') || 'Uncategorized'}\nTags: ${product.tags?.join(', ') || 'No tags'}`,
      metadata: {
        type: 'product',
        id: product.id,
        name: product.name,
        price: product.price || 0,
        category: product.category_ids
      }
    }));
    
    // Create documents from bundles
    const bundleDocs = bundles.map((bundle: any) => new Document({
      pageContent: `Bundle: ${bundle.name}\nDescription: ${bundle.description || 'No description available'}\nPrice: ₦${bundle.price || 0}\nCategory: Bundle`,
      metadata: {
        type: 'bundle',
        id: bundle.id,
        name: bundle.name,
        price: bundle.price || 0,
        category: 'Bundle'
      }
    }));
    
    // Add general website information
    const websiteDocs = [
      new Document({
        pageContent: `FeedMe is an e-commerce website specializing in food products and bundles. We offer fresh fruits, vegetables, and curated food combinations. Our mission is to provide quality food products with convenient delivery. Contact us at +234 808 828 2487 or email support@feedme.com for assistance.`,
        metadata: {
          type: 'website_info',
          title: 'About FeedMe'
        }
      }),
      new Document({
        pageContent: `We offer various food bundles including fruit combos, vegetable packs, and mixed food selections. Our bundles are carefully curated to provide value and variety. Each bundle comes with fresh, quality ingredients.`,
        metadata: {
          type: 'bundle_info',
          title: 'Bundle Information'
        }
      }),
      new Document({
        pageContent: `Our delivery service covers multiple locations. We ensure fresh products are delivered to your doorstep. Standard delivery takes 2-4 hours. For urgent orders, contact our support team.`,
        metadata: {
          type: 'delivery_info',
          title: 'Delivery Information'
        }
      })
    ];
    
    const allDocs = [...productDocs, ...bundleDocs, ...websiteDocs];
    
    console.log(`Created ${allDocs.length} documents`);
    
    // Add documents to vector store
    await vectorStore.addDocuments(allDocs);
    
    console.log("Vector store population completed successfully!");
    
  } catch (error) {
    console.error("Error populating vector store:", error);
  }
}

// Run the script
populateVectorStore();
