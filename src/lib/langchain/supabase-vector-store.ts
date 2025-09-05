import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";
import { createClient } from "@utils/supabase/client";

export class SupabaseVectorStore extends VectorStore {
  private client: any;
  private tableName: string = "documents";

  constructor(embeddings: Embeddings) {
    super(embeddings, {});
    this.client = createClient();
  }

  _vectorstoreType(): string {
    return 'supabase';
  }

  async addDocuments(documents: Document[]): Promise<void> {
    const texts = documents.map(doc => doc.pageContent);
    const metadatas = documents.map(doc => doc.metadata);
    
    const embeddings = await this.embeddings.embedDocuments(texts);
    
    const documentsToInsert = documents.map((doc, i) => ({
      content: doc.pageContent,
      metadata: metadatas[i],
      embedding: embeddings[i]
    }));

    // Insert in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < documentsToInsert.length; i += batchSize) {
      const batch = documentsToInsert.slice(i, i + batchSize);
      
      const { error } = await this.client
        .from(this.tableName)
        .insert(batch);

      if (error) {
        console.error('Error inserting documents:', error);
        throw error;
      }
    }
  }

  async similaritySearch(query: string, k: number = 4): Promise<Document[]> {
    const queryEmbedding = await this.embeddings.embedQuery(query);
    
    const { data, error } = await this.client.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.78,
      match_count: k
    });

    if (error) {
      console.error('Error searching documents:', error);
      return [];
    }

    return data.map((doc: any) => new Document({
      pageContent: doc.content,
      metadata: doc.metadata
    }));
  }

  async similaritySearchWithScore(query: string, k: number = 4): Promise<[Document, number][]> {
    const queryEmbedding = await this.embeddings.embedQuery(query);
    
    const { data, error } = await this.client.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.78,
      match_count: k
    });

    if (error) {
      console.error('Error searching documents:', error);
      return [];
    }

    return data.map((doc: any) => [
      new Document({
        pageContent: doc.content,
        metadata: doc.metadata
      }),
      doc.similarity
    ]);
  }
}
