import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/queries/products";
import { getBundles, fetchBundleBySlugWithProducts } from "@/queries/bundles";
import { Tables } from "@/utils/database.types";
import { createClient } from "@/utils/supabase/client";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Initialize embeddings and model
const embeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "text-embedding-004",
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY!,
});

const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  maxOutputTokens: 1500,
  temperature: 0.5,
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { history, image } = await req.json();

    if (!history || history.length === 0) {
      return NextResponse.json(
        { error: "History is required" },
        { status: 400 }
      );
    }

    const lastUserMessage = history[history.length - 1].content;
    const supabase = createClient();

    // Quick intent detection for recipe generation and cooking timelines
    const wantsRecipes = /\b(recipes?|recipe ideas)\b/i.test(lastUserMessage) || /generate\s+\d+\s+recipes/i.test(lastUserMessage);
    const wantsTimeline = /\b(cooking\s+timeline|timeline)\b/i.test(lastUserMessage) || /\bminute\b/i.test(lastUserMessage);

    // Helper to quickly derive ingredient list from a referenced bundle name
    const extractIngredientsForBundle = async (targetNameRaw: string) => {
      let ingredientList: string[] = [];
      const bundleName = targetNameRaw?.toLowerCase() || '';
      if (bundleName.includes('mini bundle')) {
        ingredientList = [
          'Soft Chicken (1kg)',
          'Cooking Oil (1L)',
          'Fresh Tomatoes (1 paint)',
          'Rodo & Tatashe (Pepper mix) (1kg)',
          'Onions (1 portion)'
        ];
        return ingredientList;
      }
      if (bundleName.includes('fried rice pack')) {
        ingredientList = [
          'Live Chicken (1kg)',
          'Basmati Rice (1kg)',
          'Cooking Oil (1L)',
          'Hotdogs',
          'Bell Peppers (500g)',
          'Onions (portion)',
          'Carrots',
          'Cabbage',
          'Spring Onions',
          'Green Peas'
        ];
        return ingredientList;
      }
      // Fallback: quick database lookup only if needed
      const bundlesList = await getBundles();
      const targetBundle = bundlesList.find(b =>
        b.name?.toLowerCase().includes(bundleName) ||
        (bundleName && b.name?.toLowerCase().includes(bundleName))
      );
      if (targetBundle?.description) {
        const desc = targetBundle.description.toLowerCase();
        const ingredientMatches = desc.match(/(?:✅|•|\*)\s*([^–\n]+?)(?:\s*–\s*\d+[^\n]*)?/g);
        if (ingredientMatches) {
          ingredientList = ingredientMatches.map(match =>
            match.replace(/(?:✅|•|\*)\s*/, '').replace(/\s*–\s*\d+[^\n]*/, '').trim()
          ).filter(Boolean);
        }
      }
      return ingredientList;
    };

    if (wantsTimeline) {
      try {
        const usingMatch = lastUserMessage.match(/(?:using|for)\s+([^\n\.]+?)(?:\s+with|\s*\.|\s*$)/i);
        const targetNameRaw = (usingMatch?.[1] || '').trim();
        const minutesMatch = lastUserMessage.match(/(\d{1,2})\s*-?\s*minute/i);
        const totalMinutes = Math.min(Math.max(parseInt(minutesMatch?.[1] || '30', 10) || 30, 10), 90);
        const ingredientList = await extractIngredientsForBundle(targetNameRaw);

        const system = `You are a precise kitchen planner. Create a ${totalMinutes}-minute cooking timeline using ONLY the provided ingredients plus basic pantry items (salt, pepper, stock cubes). Do not introduce ingredients that are not listed.

Output strictly as plain text with minute markers in ascending order, one step per line, like:

00:00 - [action]
03:00 - [action]
10:00 - [action]
...

Rules:
- Ensure the plan finishes by ${totalMinutes}:00
- Parallelize tasks where sensible (prep while simmering)
- Include brief cues about heat levels and quantities when relevant
- Refer only to these ingredients: ${ingredientList.length > 0 ? ingredientList.join(', ') : targetNameRaw || 'bundle ingredients'}
`;
        const userPrompt = `Create a ${totalMinutes}-minute cooking timeline for ${targetNameRaw || 'the bundle'} using the specified ingredients. Begin at 00:00 and end by ${totalMinutes}:00.`;

        const resp = await model.invoke([
          ["system", system],
          ["user", userPrompt]
        ]);
        const text = String(resp.content || '').trim()
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1');

        return NextResponse.json({
          response: text,
          suggestions: [],
          questions: [],
          hasRetry: false
        });
      } catch (e) {
        console.error('Timeline intent branch failed:', e);
        // fall through to generic handling
      }
    }

    if (wantsRecipes) {
      try {
        // Try to extract bundle or dish name after keywords like "using" or "for"
        const usingMatch = lastUserMessage.match(/using\s+([^\n\.]+?)(?:\s+with|\s*\.|\s*$)/i);
        const forMatch = lastUserMessage.match(/for\s+([^\n\.]+?)(?:\s+with|\s*\.|\s*$)/i);
        const targetNameRaw = (usingMatch?.[1] || forMatch?.[1] || '').trim();

        // Quick bundle matching with hardcoded ingredients for speed
        let ingredientList: string[] = [];
        const bundleName = targetNameRaw?.toLowerCase() || '';

        // Fast lookup for known bundles
        if (bundleName.includes('mini bundle')) {
          ingredientList = [
            'Soft Chicken (1kg)',
            'Cooking Oil (1L)',
            'Fresh Tomatoes (1 paint)',
            'Rodo & Tatashe (Pepper mix) (1kg)',
            'Onions (1 portion)'
          ];
        } else if (bundleName.includes('fried rice pack')) {
          ingredientList = [
            'Live Chicken (1kg)',
            'Basmati Rice (1kg)',
            'Cooking Oil (1L)',
            'Hotdogs',
            'Bell Peppers (500g)',
            'Onions (portion)',
            'Carrots',
            'Cabbage',
            'Spring Onions',
            'Green Peas'
          ];
        } else {
          // Fallback: quick database lookup only if needed
          const bundlesList = await getBundles();
          const targetBundle = bundlesList.find(b =>
            b.name?.toLowerCase().includes(bundleName) ||
            (bundleName && b.name?.toLowerCase().includes(bundleName))
          );

          if (targetBundle?.description) {
            const desc = targetBundle.description.toLowerCase();
            const ingredientMatches = desc.match(/(?:✅|•|\*)\s*([^–\n]+?)(?:\s*–\s*\d+[^\n]*)?/g);
            if (ingredientMatches) {
              ingredientList = ingredientMatches.map(match =>
                match.replace(/(?:✅|•|\*)\s*/, '').replace(/\s*–\s*\d+[^\n]*/, '').trim()
              ).filter(Boolean);
            }
          }
        }

        const recipeCountMatch = lastUserMessage.match(/generate\s+(\d+)\s+recipes/i);
        const recipeCount = Math.min(Math.max(parseInt(recipeCountMatch?.[1] || '3', 10) || 3, 1), 5);

        // Build a specialized prompt for recipes with timings
        const recipeSystem = `You are an expert chef. Create ${recipeCount} distinct recipes using ONLY the provided ingredients. DO NOT add ingredients that are not in the list. Each recipe should be practical for a Nigerian kitchen. Provide clear step-by-step instructions with per-step time and total time.

Format each recipe with clear spacing and structure like this:

=== RECIPE 1 ===
Recipe: [Recipe Name]
Servings: [number]
Prep time: [minutes] min
Cook time: [minutes] min
Total time: [minutes] min

Ingredients:
- [ingredient 1]
- [ingredient 2]
- [ingredient 3]

Steps:
1. [instruction] ([time] min)
2. [instruction] ([time] min)
3. [instruction] ([time] min)

=== RECIPE 2 ===
Recipe: [Recipe Name]
Servings: [number]
Prep time: [minutes] min
Cook time: [minutes] min
Total time: [minutes] min

Ingredients:
- [ingredient 1]
- [ingredient 2]
- [ingredient 3]

Steps:
1. [instruction] ([time] min)
2. [instruction] ([time] min)
3. [instruction] ([time] min)

=== RECIPE 3 ===
[Continue same format...]

Use clear separators between recipes and proper spacing for readability.`;

        const ingredientsLine = ingredientList.length > 0
          ? `Ingredients available: ${ingredientList.join(', ')}. Use ONLY these ingredients plus basic pantry items (salt, pepper, stock cubes). DO NOT add vegetables, grains, or proteins not in this list.`
          : targetNameRaw
            ? `Create recipes that a typical "${targetNameRaw}" would enable. Use ONLY ingredients that would realistically come in such a bundle.`
            : `Use typical pantry items if needed (salt, pepper, stock cubes) and common vegetables.`;

        const recipeUser = `Generate ${recipeCount} recipes with steps and timing using ONLY the specified ingredients. ${ingredientsLine}`;

        const recipeResp = await model.invoke([
          ["system", recipeSystem],
          ["user", recipeUser]
        ]);

        const text = String(recipeResp.content || '').trim();
        const sanitized = text
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`(.*?)`/g, '$1')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1');

        return NextResponse.json({
          response: sanitized,
          suggestions: [],
          questions: [],
          hasRetry: false
        });
      } catch (e) {
        console.error('Recipe intent branch failed:', e);
        // fall through to generic handling
      }
    }

    // If image is provided, try to extract dish/ingredients first (vision)
    let extractedFromImage: { dish?: string; ingredients?: string[] } | null = null;
    if (image) {
      try {
        const visionModel = new ChatGoogleGenerativeAI({
          model: 'gemini-1.5-flash',
          maxOutputTokens: 1024,
          temperature: 0.2,
          apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY!,
        });

        const visionPrompt = `You will be given a food image (base64) and user text. Extract probable dish name(s) and a concise list of recognizable ingredients present in the image. If uncertain, return empty fields.

Return strictly JSON with keys: dish (string), ingredients (string[])`;

        // Pass the image as a proper content part so Gemini can see it
        const visionResp = await visionModel.invoke([
          {
            role: "system",
            content: visionPrompt,
          } as any,
          {
            role: "user",
            content: [
              { type: "text", text: lastUserMessage || "" },
              { type: "image_url", image_url: String(image) }
            ] as any
          } as any
        ]);

        const rawVision = String(visionResp.content || '').trim();
        try {
          const parsed = JSON.parse(rawVision);
          if (parsed && typeof parsed === 'object') {
            extractedFromImage = {
              dish: typeof parsed.dish === 'string' ? parsed.dish : undefined,
              ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients.filter((x: any) => typeof x === 'string') : undefined,
            };
          }
        } catch { }
      } catch (e) {
        console.error('Vision parse failed:', e);
      }
    }

    // Delivery locations enrichment from DB (no hardcoding)
    const lowerMsg = String(lastUserMessage || '').toLowerCase();
    let deliveryContext = '';
    try {
      const { data: deliveryLocations } = await supabase
        .from('delivery_locations')
        .select('*');

      if (Array.isArray(deliveryLocations) && deliveryLocations.length > 0) {
        const matched = deliveryLocations.filter((loc: any) =>
          typeof loc?.name === 'string' && lowerMsg.includes(String(loc.name).toLowerCase())
        );
        if (matched.length > 0) {
          const lines = matched.map((m: any) => `${m.name}: ₦${m.price}`);
          deliveryContext = `Delivery fees: ${lines.join(' | ')}`;
        }
      }
    } catch (e) {
      // Silent: enrichment is best-effort
    }

    const enrichedQuery = [
      lastUserMessage,
      deliveryContext,
      extractedFromImage?.dish,
      (extractedFromImage?.ingredients || []).join(', ')
    ].filter(Boolean).join('\n');

    // Smart delivery fee handling using AI knowledge + DB lookup
    const wantsDelivery = /(delivery\s*(fee|price)|deliver(?:y)?\s+to|how\s+much.*deliver|shipping\s+fee|what\s+about|how\s+about|.*\?)/i.test(lastUserMessage);

    if (wantsDelivery) {
      try {
        const { data: deliveryLocations } = await supabase
          .from('delivery_locations')
          .select('*');

        const zones = Array.isArray(deliveryLocations)
          ? deliveryLocations.map((d: any) => ({ name: String(d.name || ''), price: Number(d.price || 0) }))
          : [];
        // Use TRUE VECTOR EMBEDDINGS for intelligent location matching
        // This creates semantic similarity search using the database and vector embeddings!

        // Function to create and store location embeddings in the documents table
        const createLocationEmbeddings = async () => {
          try {
            // Check if location embeddings already exist
            const { data: existingDocs } = await supabase
              .from('documents')
              .select('*')
              .eq('metadata->>type', 'delivery_location');

            if (existingDocs && existingDocs.length > 0) {
              console.log('Location embeddings already exist, skipping creation');
              return;
            }

            console.log('Creating location embeddings...');

            // Create comprehensive location database with neighborhoods for each zone
            const locationDatabase = {
              'Kosofe': {
                price: zones.find(z => z.name.toLowerCase() === 'kosofe')?.price || 2500,
                locations: [
                  'ketu', 'mile 12', 'ogudu', 'oworonsoki', 'agboyi', 'ikosi', 'alapere', 'mende', 'maryland', 'kosofe',
                  'agboyi-ikosi', 'agboyi', 'ikosi', 'maryland', 'alapere', 'mende', 'ogudu', 'oworonsoki', 'mile 12'
                ]
              },
              'Alimosho': {
                price: zones.find(z => z.name.toLowerCase() === 'alimosho')?.price || 2500,
                locations: [
                  'egbeda', 'igando', 'iyana-ipaja', 'ejigbo', 'okota', 'ayetoro', 'abule egba', 'agidingbi', 'ikotun', 'ishaga', 'ishaga tedo', 'abesan', 'ipaja', 'alagbado', 'alimosho',
                  'ishaga', 'ishaga tedo', 'abesan', 'ipaja', 'alagbado', 'egbeda', 'igando', 'iyana-ipaja', 'ejigbo', 'okota', 'ayetoro', 'abule egba', 'agidingbi', 'ikotun', 'isheri', 'ishari'
                ]
              },
              'Surulere': {
                price: zones.find(z => z.name.toLowerCase() === 'surulere')?.price || 2500,
                locations: [
                  'surulere', 'idi oro', 'aguda', 'ijeshatedo', 'ijesha', 'bode thomas', 'eric moore', 'ojuelegba', 'lawanson', 'itire',
                  'idi-oro', 'idi oro', 'aguda', 'ijeshatedo', 'ijesha', 'bode thomas', 'eric moore', 'ojuelegba', 'lawanson', 'itire'
                ]
              },
              'Yaba': {
                price: zones.find(z => z.name.toLowerCase() === 'yaba')?.price || 2500,
                locations: [
                  'yaba', 'sabo', 'akoka', 'bariga', 'onike', 'iwaya', 'makoko', 'ebute meta',
                  'sabo', 'akoka', 'bariga', 'onike', 'iwaya', 'makoko', 'ebute meta'
                ]
              },
              'Lagos Island': {
                price: zones.find(z => z.name.toLowerCase() === 'lagos island')?.price || 2500,
                locations: [
                  'victoria island', 'ikoyi', 'lagos island', 'obalende', 'tarkwa bay', 'banana island',
                  'vi', 'v.i.', 'victoria island', 'ikoyi', 'lagos island', 'obalende', 'tarkwa bay', 'banana island'
                ]
              },
              'Eti-Osa': {
                price: zones.find(z => z.name.toLowerCase() === 'eti-osa')?.price || 2500,
                locations: [
                  'lekki', 'ajah', 'sangotedo', 'abijo', 'bogije', 'ikate', 'jakande', 'agungi', 'osborne',
                  'lekki', 'ajah', 'sangotedo', 'abijo', 'bogije', 'ikate', 'jakande', 'agungi', 'osborne'
                ]
              },
              'Ikeja': {
                price: zones.find(z => z.name.toLowerCase() === 'ikeja')?.price || 2500,
                locations: [
                  'ikeja', 'allen', 'ogba', 'alausa', 'opebi', 'allen avenue', 'simpson street', 'obafemi awolowo way',
                  'ikeja', 'allen', 'ogba', 'alausa', 'opebi', 'allen avenue', 'simpson street', 'obafemi awolowo way', 'opebi street', 'simpson street'
                ]
              },
              'Agege': {
                price: zones.find(z => z.name.toLowerCase() === 'agege')?.price || 2500,
                locations: [
                  'agege', 'ishaga agege', 'pen cinema', 'dopemu', 'agidingbi agege', 'orile agege',
                  'agege', 'ishaga agege', 'pen cinema', 'dopemu', 'agidingbi agege', 'orile agege', 'pen cinema'
                ]
              },
              'Ikorodu': {
                price: zones.find(z => z.name.toLowerCase() === 'ikorodu')?.price || 3000,
                locations: [
                  'ikorodu', 'owutu', 'aguda ikorodu', 'igbogbo', 'baiyeku', 'ijede', 'imota',
                  'ikorodu', 'owutu', 'aguda ikorodu', 'igbogbo', 'baiyeku', 'ijede', 'imota'
                ]
              },
              'Epe': {
                price: zones.find(z => z.name.toLowerCase() === 'epe')?.price || 4500,
                locations: [
                  'epe', 'agungi', 'abijo epe', 'lekki epe', 'ibeju lekki', 'eleko', 'bogije epe',
                  'epe', 'agungi', 'abijo epe', 'lekki epe', 'ibeju lekki', 'eleko', 'bogije epe'
                ]
              }
            };

            // Create embeddings for each location and store in documents table
            for (const [zone, data] of Object.entries(locationDatabase)) {
              for (const location of data.locations) {
                const content = `Delivery location: ${location} in ${zone} zone. Price: ₦${data.price}. This area is covered by ${zone} delivery zone in Lagos, Nigeria.`;
                const embedding = await embeddings.embedQuery(content);

                await supabase.from('documents').insert({
                  content,
                  metadata: {
                    type: 'delivery_location',
                    zone: zone,
                    location: location,
                    price: data.price,
                    category: 'delivery'
                  },
                  embedding
                });
              }
            }

            console.log('Location embeddings created successfully!');
          } catch (error) {
            console.error('Failed to create location embeddings:', error);
          }
        };

        // Create embeddings if they don't exist (only runs once)
        await createLocationEmbeddings();

        // Function to add new delivery location with embedding
        const addNewDeliveryLocation = async (zone: string, location: string, price: number) => {
          try {
            const content = `Delivery location: ${location} in ${zone} zone. Price: ₦${price}. This area is covered by ${zone} delivery zone in Lagos, Nigeria.`;
            const embedding = await embeddings.embedQuery(content);

            await supabase.from('documents').insert({
              content,
              metadata: {
                type: 'delivery_location',
                zone: zone,
                location: location,
                price: price,
                category: 'delivery'
              },
              embedding
            });

            console.log(`Added new delivery location: ${location} in ${zone} zone`);
          } catch (error) {
            console.error('Failed to add new delivery location:', error);
          }
        };

        // Example: Add some common variations that users might ask about
        // This makes the system even more intelligent
        const commonVariations = [
          { zone: 'Alimosho', location: 'ishagi', price: 2500 },
          { zone: 'Alimosho', location: 'ishari', price: 2500 },
          { zone: 'Alimosho', location: 'isheri', price: 2500 },
          { zone: 'Ikeja', location: 'opebi street', price: 2500 },
          { zone: 'Ikeja', location: 'allen avenue', price: 2500 },
          { zone: 'Kosofe', location: 'maryland', price: 2500 },
          { zone: 'Lagos Island', location: 'vi', price: 2500 },
          { zone: 'Lagos Island', location: 'v.i.', price: 2500 }
        ];

        // Add common variations if they don't exist
        for (const variation of commonVariations) {
          await addNewDeliveryLocation(variation.zone, variation.location, variation.price);
        }

        // Function to find delivery zone using vector similarity search
        const findDeliveryZoneWithVectorSearch = async (userLocation: string): Promise<{ zone: string; confidence: number; reason: string; price: number } | null> => {
          try {
            // Generate embedding for user's location query
            const userEmbedding = await embeddings.embedQuery(userLocation);

            // Search for similar locations using vector similarity
            const { data: similarDocs, error } = await supabase.rpc(
              'match_documents' as any,
              {
                query_embedding: userEmbedding,
                match_threshold: 0.7, // High threshold for delivery locations
                match_count: 5
              }
            );

            if (error || !similarDocs || similarDocs.length === 0) {
              return null;
            }

            // Filter for delivery location documents
            const deliveryDocs = similarDocs.filter((doc: any) =>
              doc.metadata?.type === 'delivery_location'
            );

            if (deliveryDocs.length === 0) {
              return null;
            }

            // Get the best match
            const bestMatch = deliveryDocs[0];
            const confidence = bestMatch.similarity || 0.8;

            return {
              zone: bestMatch.metadata.zone,
              confidence,
              reason: `Vector similarity match: "${userLocation}" similar to "${bestMatch.metadata.location}" in ${bestMatch.metadata.zone}`,
              price: bestMatch.metadata.price
            };
          } catch (error) {
            console.error('Vector search failed:', error);
            return null;
          }
        };

        // Enhanced semantic similarity function using vector-like scoring (fallback)
        const findBestZoneMatch = (userLocation: string): { zone: string; confidence: number; reason: string; price: number } | null => {
          const userLocLower = userLocation.toLowerCase().trim();

          // First, try exact matches
          for (const [zone, data] of Object.entries(locationDatabase)) {
            if (data.locations.includes(userLocLower)) {
              return {
                zone,
                confidence: 1.0,
                reason: `Exact match found in ${zone}`,
                price: data.price
              };
            }
          }

          // Then try partial matches and fuzzy matching with vector-like scoring
          let bestMatch: { zone: string; confidence: number; reason: string; price: number } | null = null;

          for (const [zone, data] of Object.entries(locationDatabase)) {
            for (const location of data.locations) {
              // Calculate similarity score (like vector cosine similarity)
              let score = 0;

              // Exact substring match
              if (userLocLower.includes(location) || location.includes(userLocLower)) {
                score += 0.6;
              }

              // Character overlap (like Jaccard similarity)
              const userChars = new Set(userLocLower.split(''));
              const locChars = new Set(location.split(''));
              const intersection = new Set([...userChars].filter(x => locChars.has(x)));
              const union = new Set([...userChars, ...locChars]);
              const jaccard = intersection.size / union.size;
              score += jaccard * 0.3;

              // Length similarity
              const lengthDiff = Math.abs(userLocLower.length - location.length);
              const maxLength = Math.max(userLocLower.length, location.length);
              const lengthSimilarity = 1 - (lengthDiff / maxLength);
              score += lengthSimilarity * 0.1;

              // Check for common abbreviations and variations
              if (userLocLower === 'vi' && location === 'victoria island') {
                return { zone, confidence: 0.95, reason: 'VI is Victoria Island', price: data.price };
              }
              if (userLocLower === 'v.i.' && location === 'victoria island') {
                return { zone, confidence: 0.95, reason: 'V.I. is Victoria Island', price: data.price };
              }
              if (userLocLower === 'ishagi' && location === 'ishaga') {
                return { zone, confidence: 0.9, reason: 'Ishagi is similar to Ishaga', price: data.price };
              }
              if (userLocLower === 'ishari' && location === 'ishaga') {
                return { zone, confidence: 0.9, reason: 'Ishari is similar to Ishaga', price: data.price };
              }
              if (userLocLower === 'isheri' && location === 'ishaga') {
                return { zone, confidence: 0.9, reason: 'Ishari is similar to Ishaga', price: data.price };
              }

              if (score > 0.3 && (!bestMatch || score > bestMatch.confidence)) {
                bestMatch = {
                  zone,
                  confidence: score,
                  reason: `Semantic match: "${userLocation}" similar to "${location}" in ${zone}`,
                  price: data.price
                };
              }
            }
          }

          return bestMatch;
        };

        // Extract location mentions from user message - more comprehensive pattern
        const locationPattern = /(?:deliver(?:y)?\s+to|in|at|around|near|what\s+about|how\s+much.*?to|delivery\s+.*?to)\s+([^,\?\n]+)/gi;
        const locationMatches = [...lastUserMessage.matchAll(locationPattern)];

        let foundLocations: Array<{ original: string; zone: string; price: number; confidence: number; reason: string }> = [];

        if (locationMatches.length > 0) {

          for (const match of locationMatches) {
            const location = match[1].trim();

            // Try vector search first (most accurate)
            let zoneMatch = await findDeliveryZoneWithVectorSearch(location);

            // If vector search fails, fall back to semantic matching
            if (!zoneMatch) {
              zoneMatch = findBestZoneMatch(location);
            }

            if (zoneMatch) {
              foundLocations.push({
                original: location,
                zone: zoneMatch.zone,
                price: zoneMatch.price,
                confidence: zoneMatch.confidence,
                reason: zoneMatch.reason
              });
            }
          }

          if (foundLocations.length > 0) {
            const lines = foundLocations.map(loc =>
              `${loc.original}: ₦${loc.price} (${loc.zone} zone - ${loc.reason})`
            );
            const text = `Delivery fees:\n${lines.join('\n')}`;
            return NextResponse.json({ response: text, suggestions: [], questions: [], hasRetry: false });
          }
        }

        // If no specific locations found, try to extract from the message directly
        if (foundLocations.length === 0 && wantsDelivery) {
          // Try to find any location-like words in the message
          const words = lastUserMessage.toLowerCase().split(/\s+/);
          for (const word of words) {
            if (word.length > 2) { // Skip very short words
              // Try vector search first
              let zoneMatch = await findDeliveryZoneWithVectorSearch(word);

              // If vector search fails, fall back to semantic matching
              if (!zoneMatch) {
                zoneMatch = findBestZoneMatch(word);
              }

              if (zoneMatch && zoneMatch.confidence > 0.7) {
                const text = `Delivery to ${word}: ₦${zoneMatch.price} (${zoneMatch.zone} zone - ${zoneMatch.reason})`;
                return NextResponse.json({ response: text, suggestions: [], questions: [], hasRetry: false });
              }
            }
          }
        }

        // If still no locations found, let the RAG system handle it
        console.log('No specific locations detected, using RAG system');
      } catch (e) {
        // fall through to generic RAG
      }
    }

    // Generate embedding for user query (enriched with vision result if any)
    const queryEmbedding = await embeddings.embedQuery(enrichedQuery);

    // Search for relevant documents using vector similarity
    const { data: relevantDocs, error: searchError } = await supabase.rpc(
      'match_documents' as any,
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.3, // Lower threshold for better document retrieval
        match_count: 8
      }
    );

    if (searchError) {
      console.error('Vector search error:', searchError);
    }

    // Get products and bundles for action handling
    const productsResult = await getProducts({ limit: 1000, publishedStatus: "Published" });
    const products = productsResult.data || [];
    const bundles = await getBundles();
    
    console.log("Fetched products count:", products.length);
    console.log("Fetched bundles count:", bundles.length);
    console.log("Relevant documents found:", Array.isArray(relevantDocs) ? relevantDocs.length : 0);

    // Extract context from relevant documents
    const context = Array.isArray(relevantDocs) ? relevantDocs.map((doc: any) => doc.content).join('\n\n') : '';

    // Get delivery zones for context enrichment
    let deliveryZoneContext = '';
    try {
      const { data: deliveryLocations } = await supabase
        .from('delivery_locations')
        .select('*');

      if (Array.isArray(deliveryLocations) && deliveryLocations.length > 0) {
        // Create comprehensive location mapping for semantic search
        const locationMapping = {
          'Kosofe': ['Ketu', 'Mile 12', 'Ogudu', 'Oworonsoki', 'Agboyi', 'Ikosi', 'Alapere', 'Mende', 'Maryland'],
          'Alimosho': ['Egbeda', 'Igando', 'Iyana-Ipaja', 'Ejigbo', 'Okota', 'Ayetoro', 'Abule Egba', 'Agidingbi', 'Ikotun', 'Ishaga', 'Ishaga Tedo', 'Abesan', 'Ipaja', 'Alagbado'],
          'Surulere': ['Surulere', 'Idi Oro', 'Aguda', 'Ijeshatedo', 'Ijesha', 'Bode Thomas', 'Eric Moore', 'Ojuelegba', 'Lawanson', 'Itire'],
          'Yaba': ['Yaba', 'Sabo', 'Akoka', 'Bariga', 'Onike', 'Iwaya', 'Makoko', 'Ebute Meta'],
          'Lagos Island': ['Victoria Island', 'Ikoyi', 'Lagos Island', 'Obalende', 'Tarkwa Bay', 'Banana Island'],
          'Eti-Osa': ['Lekki', 'Ajah', 'Sangotedo', 'Abijo', 'Bogije', 'Ikate', 'Jakande', 'Agungi', 'Osborne'],
          'Ikeja': ['Ikeja', 'Allen', 'Ogba', 'Alausa', 'Opebi', 'Allen Avenue', 'Simpson Street', 'Obafemi Awolowo Way'],
          'Agege': ['Agege', 'Ishaga Agege', 'Pen Cinema', 'Dopemu', 'Agidingbi Agege', 'Orile Agege'],
          'Ikorodu': ['Ikorodu', 'Owutu', 'Aguda Ikorodu', 'Igbogbo', 'Baiyeku', 'Ijede', 'Imota'],
          'Epe': ['Epe', 'Agungi', 'Abijo Epe', 'Lekki Epe', 'Ibeju Lekki', 'Eleko', 'Bogije Epe']
        };

        // Build comprehensive context with all locations
        const allLocations = Object.entries(locationMapping).map(([zone, locations]) =>
          `${zone}: ${locations.join(', ')}`
        ).join('\n');

        deliveryZoneContext = `\n\nDELIVERY ZONES AND PRICING:\n${deliveryLocations.map((loc: any) => `- ${loc.name}: ₦${loc.price}`).join('\n')}\n\nCOMPREHENSIVE LAGOS LOCATION MAPPING:\n${allLocations}\n\nSEMANTIC SEARCH INSTRUCTIONS:\nWhen users ask about delivery to ANY location (street, neighborhood, landmark, or area), use semantic similarity to map it to the closest delivery zone. Consider:\n1. Exact matches first\n2. Partial name matches\n3. Geographic proximity and common knowledge\n4. Local government boundaries\n\nExamples:\n- "Opebi Street" → Ikeja zone (₦2,500)\n- "Allen Avenue" → Ikeja zone (₦2,500)\n- "Simpson Street" → Ikeja zone (₦2,500)\n- "Maryland" → Kosofe zone (₦2,500)\n- "Alapere" → Kosofe zone (₦2,500)\n- "Ipaja" → Alimosho zone (₦2,500)\n- "Abesan" → Alimosho zone (₦2,500)\n\nAlways provide the exact price and explain the zone mapping.`;
      }
    } catch (e) {
      console.log('Failed to fetch delivery zones for context:', e);
    }

    // Create system prompt with context
    const systemPrompt = `You are a comprehensive AI assistant for FeedMe, an e-commerce website that sells food products and bundles in Nigeria.
        
        Use the following context to answer questions accurately. Only provide information that is supported by the context:
        
        ${context}${deliveryZoneContext}
        
        IMPORTANT: If the user asks about products, bundles, or any specific information, only provide details that are confirmed in the context above. If you don't have enough information, say so rather than making things up.
        
        You are knowledgeable about ALL aspects of FeedMe's business:
        
        **Products & Bundles:**
        - Recommend specific products with prices and descriptions
        - Suggest relevant bundles for cooking needs
        - Explain product benefits and uses
        
        **Offers & Deals:**
        - Inform about active Plug & Share offers
        - Explain bulk purchase opportunities
        - Highlight cost savings
        
        **Customer Support:**
        - Provide return policy information
        - Share contact details for support
        - Answer FAQs about policies
        
        **Delivery & Logistics:**
        - Explain delivery options and locations
        - Provide delivery pricing information for specific areas
        - Map any neighborhood or area mentioned to the appropriate delivery zone
        - Share delivery timeframes (4-6 hours, Monday-Saturday)
        - When asked about delivery to specific areas, always provide the exact price and zone
        
        **Cooking & Recipes:**
        - Suggest products for specific dishes
        - Recommend ingredient combinations
        - Provide cooking tips based on available products
        
        CRITICAL FORMATTING RULES - NEVER USE MARKDOWN:
        1. NEVER use **bold** or *italic* - use plain text only
        2. NEVER use backticks or code blocks
        3. NEVER use # headers or > blockquotes
        4. NEVER use [links](url) - just write the text
        5. Use dashes (-) for bullet points, not asterisks
        6. Use plain text formatting only
        
        FORMATTING EXAMPLES:
        WRONG: "**Product Name** costs *₦1000*"
        CORRECT: "Product Name costs ₦1000"
        
        WRONG: "1. **What kind of dish** are you planning?"
        CORRECT: "1. What kind of dish are you planning?"
        
        WRONG: "We have a **great selection**"
        CORRECT: "We have a great selection"
        
        For any question, always:
        1. Ground your response in the actual products/bundles/offers from the context
        2. Provide specific prices and details when available
        3. Suggest relevant bundles or offers that could help
        4. Include customer support information when relevant
        5. Be helpful, accurate, and honest about what you know
        6. Use ONLY plain text - no markdown whatsoever
        
        If someone asks about making a dish, suggest the specific products you have available, relevant bundles, and any applicable offers.`;

    // Generate AI response using RAG
    const aiResponse = await model.invoke([
      ["system", systemPrompt],
      ["user", enrichedQuery]
    ]);

    // Clean any remaining markdown from the response
    const cleanResponse = (text: string): string => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^>\s+/gm, '')
        .trim();
    };

    let responseText = cleanResponse(String(aiResponse.content));

    // Helper to strip HTML from descriptions coming from DB
    const stripHtml = (text?: string | null): string | null => {
      if (!text) return text ?? null;
      return String(text).replace(/<[^>]*>/g, "").trim();
    };

    // Check for specific actions (cart, order, etc.)
    let suggestions: any[] = [];
    let questions: any[] = [];
    let hasRetry = false;

    // Extract product/bundle names from user message for action handling
    const productMatch = lastUserMessage.match(/add\s+(.+?)\s+to\s+(cart|order)/i);
    const bundleMatch = lastUserMessage.match(/add\s+(.+?)\s+bundle\s+to\s+(cart|order)/i);

    if (productMatch || bundleMatch) {
      const itemName = (productMatch || bundleMatch)![1];
      const orderMatch = lastUserMessage.match(/to\s+(cart|order)/i);
      
      // Enhanced context-aware product matching
      let matchedProducts: any[] = [];
      let matchedBundles: any[] = [];
      
      // First, try to match the explicit item name
      const product = products.find(p => 
        p.name.toLowerCase().includes(itemName.toLowerCase()) ||
        itemName.toLowerCase().includes(p.name.toLowerCase())
      );
      
      const bundle = bundles.find(b => 
        b.name.toLowerCase().includes(itemName.toLowerCase()) ||
        itemName.toLowerCase().includes(b.name.toLowerCase())
      );

      if (product) matchedProducts.push(product);
      if (bundle) matchedBundles.push(bundle);

      // If no direct match and user said "them" or similar pronouns, 
      // look at the conversation context for recently mentioned items
      if ((!product && !bundle) && 
          (itemName.toLowerCase().includes('them') || 
           itemName.toLowerCase().includes('these') || 
           itemName.toLowerCase().includes('those') ||
           itemName.toLowerCase().includes('it'))) {
        
        console.log('Context matching triggered for:', itemName);
        
        // Look at the last few messages for mentioned products
        const recentMessages = history.slice(-3); // Last 3 messages
        const mentionedItems: string[] = [];
        
        console.log('Recent messages for context:', recentMessages.map((m: any) => ({ role: m.role, content: m.content.substring(0, 100) + '...' })));
        
        recentMessages.forEach((msg: any) => {
          if (msg.role === 'assistant') {
            // Extract product names from AI responses - improved pattern
            // Look for patterns like "Pineapple (Cotonou):", "Mangoes (Per 1):", etc.
            const productMatches = msg.content.match(/([A-Z][a-zA-Z\s]+)\s*\([^)]*\):/g) || [];
            productMatches.forEach((match: string) => {
              const productName = match.split('(')[0].trim();
              if (productName && productName.length > 2) {
                mentionedItems.push(productName);
              }
            });
            
            // Also look for patterns like "- Pineapple (Cotonou):" with dash prefix
            const dashProductMatches = msg.content.match(/-\s*([A-Z][a-zA-Z\s]+)\s*\([^)]*\):/g) || [];
            dashProductMatches.forEach((match: string) => {
              const productName = match.replace(/^-\s*/, '').split('(')[0].trim();
              if (productName && productName.length > 2) {
                mentionedItems.push(productName);
              }
            });
            
            // Look for bundle names like "Mini Bundle", "Fried Rice Pack"
            const bundleMatches = msg.content.match(/([A-Z][a-zA-Z\s]+Bundle|[A-Z][a-zA-Z\s]+Pack)/g) || [];
            bundleMatches.forEach((match: string) => {
              const bundleName = match.trim();
              if (bundleName && bundleName.length > 2) {
                mentionedItems.push(bundleName);
              }
            });
          }
        });

        console.log('Extracted mentioned items:', mentionedItems);

        // Try to match mentioned items with our catalog
        mentionedItems.forEach(itemName => {
          const foundProduct = products.find(p => 
            p.name.toLowerCase().includes(itemName.toLowerCase()) ||
            itemName.toLowerCase().includes(p.name.toLowerCase())
          );
          
          const foundBundle = bundles.find(b => 
            b.name.toLowerCase().includes(itemName.toLowerCase()) ||
            itemName.toLowerCase().includes(b.name.toLowerCase())
          );

          if (foundProduct && !matchedProducts.find(p => p.id === foundProduct.id)) {
            matchedProducts.push(foundProduct);
          }
          if (foundBundle && !matchedBundles.find(b => b.id === foundBundle.id)) {
            matchedBundles.push(foundBundle);
          }
        });

        console.log('Final matched products:', matchedProducts.map(p => p.name));
        console.log('Final matched bundles:', matchedBundles.map(b => b.name));
      }

      // If still no matches, try broader search in context
      if (matchedProducts.length === 0 && matchedBundles.length === 0) {
        // Look for common food terms in the user's message and recent context
        const foodTerms = ['pineapple', 'mango', 'apple', 'banana', 'rice', 'chicken', 'beef', 'fish', 'tomato', 'onion', 'pepper'];
        const userMessageLower = lastUserMessage.toLowerCase();
        
        foodTerms.forEach(term => {
          if (userMessageLower.includes(term)) {
            const foundProduct = products.find(p => 
              p.name.toLowerCase().includes(term) ||
              p.description?.toLowerCase().includes(term)
            );
            
            const foundBundle = bundles.find(b => 
              b.name.toLowerCase().includes(term) ||
              b.description?.toLowerCase().includes(term)
            );

            if (foundProduct && !matchedProducts.find(p => p.id === foundProduct.id)) {
              matchedProducts.push(foundProduct);
            }
            if (foundBundle && !matchedBundles.find(b => b.id === foundBundle.id)) {
              matchedBundles.push(foundBundle);
            }
          }
        });
      }

      if (matchedProducts.length === 0 && matchedBundles.length === 0) {
        responseText = `I couldn't find "${itemName}" in our catalog. Please contact our support team at +234 808 828 2487 or email support@feedme.com for assistance.`;
      } else {
        // Handle multiple items if found
        const allItems = [...matchedProducts, ...matchedBundles];
        const itemNames = allItems.map(item => item.name).join(', ');
        const totalPrice = allItems.reduce((sum, item) => sum + (item.price || 0), 0);
          
        if (orderMatch) {
          // Handle order placement - just show message for now
          responseText = `Great! I've found ${itemNames} in our catalog. Total cost: ₦${totalPrice}. To complete your order, please visit our website or use the cart feature.`;
        } else {
          // Handle cart addition - show message and provide product suggestions
          responseText = `Perfect! I found ${itemNames} in our catalog. Total cost: ₦${totalPrice}. You can add these items to your cart using the buttons below.`;
        }
            
        // Provide actual product suggestions instead of fake actions
        suggestions = allItems.map(item => ({
          type: matchedBundles.includes(item) ? 'bundle' : 'product',
          data: {
            id: item.id,
            name: item.name,
            price: item.price,
            description: item.description,
            image: item.image || item.thumbnail_url,
            options: item.options || [],
            stock_status: 'in_stock',
            inSeason: true
          }
        }));
      }
    } else {
      // For general questions, use the RAG response
      // responseText is already set from the cleaned AI response above
      
      // Extract relevant products and bundles from the context for smart suggestions
      let relevantProducts: any[] = [];
      let relevantBundles: any[] = [];
      
      if (Array.isArray(relevantDocs) && relevantDocs.length > 0) {
        // Find products and bundles mentioned in the context
        relevantDocs.forEach((doc: any) => {
          if (doc.metadata?.type === 'product' && doc.metadata?.id) {
            const product = products.find(p => p.id === doc.metadata.id);
            if (product) relevantProducts.push(product);
          } else if (doc.metadata?.type === 'bundle' && doc.metadata?.id) {
            const bundle = bundles.find(b => b.id === doc.metadata.id);
            if (bundle) relevantBundles.push(bundle);
          }
        });
        
        // Remove duplicates
        relevantProducts = relevantProducts.filter((product, index, self) => 
          index === self.findIndex(p => p.id === product.id)
        );
        relevantBundles = relevantBundles.filter((bundle, index, self) => 
          index === self.findIndex(b => b.id === bundle.id)
        );
      }

      // Entity-aware catalog mapping (vision + text keywords)
      const keywords: string[] = [];
      const addKw = (k?: string) => { if (!k) return; const parts = k.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean); parts.forEach(p => { if (p.length > 2) keywords.push(p); }); };
      addKw(extractedFromImage?.dish);
      (extractedFromImage?.ingredients || []).forEach(addKw);
      addKw(lastUserMessage);

      const uniqueKeywords = Array.from(new Set(keywords));

      const nameOrDescMatches = (item: any, nameKey = 'name', descKey = 'description') => {
        const name = (item?.[nameKey] || '').toLowerCase();
        const desc = (item?.[descKey] || '').toLowerCase();
        const hay = `${name} ${desc}`;
        return uniqueKeywords.some(k => hay.includes(k));
      };

      // Rank products/bundles by relevance to keywords
      const rankItems = (items: any[], nameKey = 'name', descKey = 'description') => {
        return items
          .map((it) => {
            const name = (it?.[nameKey] || '').toLowerCase();
            const desc = (it?.[descKey] || '').toLowerCase();
            const hay = `${name} ${desc}`;
            const score = uniqueKeywords.reduce((acc, k) => acc + (hay.includes(k) ? 1 : 0), 0);
            return { item: it, score };
          })
          .sort((a, b) => b.score - a.score)
          .filter(x => x.score > 0)
          .map(x => x.item);
      };

      const availableProductsAll = (products || []).filter(p => p.is_published === true && p.stock_status === 'in_stock');
      const availableBundlesAll = (bundles || []).filter(b => b.published_status === 'published' && b.stock_status === 'in_stock');

      // Merge vector-selected and keyword-ranked results
      const keywordProducts = rankItems(availableProductsAll);
      const keywordBundles = rankItems(availableBundlesAll);

      // Prefer context hits; fallback to keyword matches; then generic
      const mergedProducts = [
        ...relevantProducts,
        ...keywordProducts.filter(p => !relevantProducts.find((rp: any) => rp.id === p.id))
      ];
      const mergedBundles = [
        ...relevantBundles,
        ...keywordBundles.filter(b => !relevantBundles.find((rb: any) => rb.id === b.id))
      ];
      
      // Create smart suggestions based on the query and context
      if (lastUserMessage.toLowerCase().includes('jollof') || lastUserMessage.toLowerCase().includes('rice') || (extractedFromImage?.dish || '').toLowerCase().includes('jollof')) {
        // For jollof rice queries, suggest specific products and bundles
        const availableProducts = mergedProducts.filter(product => 
          product.is_published === true &&
          product.stock_status === 'in_stock'
        );
        
        const availableBundles = mergedBundles.filter(bundle => 
          bundle.published_status === 'published' && 
          bundle.stock_status === 'in_stock'
        );
        
        suggestions = [
          ...availableProducts.slice(0, 3).map(product => ({
            type: 'product',
            action: 'add_to_cart',
            data: {
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.images?.[0] || null,
              description: stripHtml(product.description),
              options: product.options || []
            }
          })),
          ...availableBundles.slice(0, 2).map(bundle => ({
            type: 'bundle',
            action: 'add_to_cart',
            data: {
              id: bundle.id,
              name: bundle.name,
              price: bundle.price,
              image: bundle.thumbnail_url || bundle.image || null,
              description: stripHtml(bundle.description)
            }
          }))
        ];
        
        // Only add action suggestions if we have actual products/bundles
        if (availableProducts.length > 0 || availableBundles.length > 0) {
          suggestions.push(
          {
            type: 'action',
            action: 'show_recipes',
            data: { name: 'Show me Jollof Rice recipes', type: 'action' }
          },
          {
            type: 'action',
            action: 'browse_ingredients',
            data: { name: 'Browse all cooking ingredients', type: 'action' }
          }
          );
        }
        
        // Add smart follow-up questions only if we have available products
        if (availableProducts.length > 0 || availableBundles.length > 0) {
        questions = [
          {
            id: 'cooking_method',
            text: 'How do you prefer to cook your jollof rice?',
            type: 'question',
            options: ['Traditional pot method', 'Rice cooker', 'Oven-baked', 'Show me all methods']
          },
          {
            id: 'spice_level',
            text: 'What spice level do you prefer?',
            type: 'question',
            options: ['Mild', 'Medium', 'Hot', 'Extra hot']
          },
          {
            id: 'serving_size',
            text: 'How many people are you cooking for?',
            type: 'question',
            options: ['1-2 people', '3-4 people', '5-6 people', 'Large gathering (7+ people)']
          }
        ];
        } else {
          // If no products available, provide helpful guidance
          responseText = `I don't have the specific ingredients for jollof rice available at the moment. However, I can help you with other cooking needs or suggest alternatives. Would you like me to show you what we do have available?`;
          suggestions = [
            {
              type: 'action',
              action: 'browse_products',
              data: { name: 'Browse available products', type: 'action' }
            },
            {
              type: 'action',
              action: 'contact_support',
              data: { name: 'Contact Support', type: 'action' }
            }
          ];
        }
      } else if (lastUserMessage.toLowerCase().includes('bundle') || lastUserMessage.toLowerCase().includes('pack')) {
        // For bundle queries
        const availableBundles = mergedBundles.filter(bundle => 
          bundle.published_status === 'published' && 
          bundle.stock_status === 'in_stock'
        );
        
        suggestions = [
          ...availableBundles.slice(0, 4).map(bundle => ({
            type: 'bundle',
            action: 'add_to_cart',
            data: {
              id: bundle.id,
              name: bundle.name,
              price: bundle.price,
              image: bundle.thumbnail_url || bundle.image || null,
              description: stripHtml(bundle.description)
            }
          }))
        ];
        
        // Only add action suggestions if we have actual bundles
        if (availableBundles.length > 0) {
          suggestions.push(
          {
            type: 'action',
            action: 'compare_bundles',
            data: { name: 'Compare bundle prices', type: 'action' }
          },
          {
            type: 'action',
            action: 'custom_bundle',
            data: { name: 'Create custom bundle', type: 'action' }
          }
          );
        }
      } else if (lastUserMessage.toLowerCase().includes('custom bundle') || lastUserMessage.toLowerCase().includes('create bundle')) {
        // For custom bundle queries, provide helpful guidance
        responseText = `I'd love to help you create a custom bundle! While I can't build custom bundles directly, I can definitely help you find the perfect combination of ingredients from our existing products and bundles to suit your needs.

To best assist you, could you tell me:
1. What kind of dish are you planning to make? Knowing the type of cuisine will help me suggest the most relevant ingredients.
2. How many people will you be serving? This will help determine the appropriate quantity of ingredients.
3. Are there any specific ingredients you already have or would like to avoid? This will help me tailor the suggestions to your preferences.

Once I have this information, I can suggest individual items or existing bundles that would work well together to create your ideal custom meal kit.`;

        // Add relevant suggestions for custom bundle creation
        const availableProducts = relevantProducts.filter(product => 
          product.published_status === 'Published' && 
          product.stock_status === 'in_stock'
        );
        
        const availableBundles = relevantBundles.filter(bundle => 
          bundle.published_status === 'published' && 
          bundle.stock_status === 'in_stock'
        );
        
        suggestions = [
          ...mergedProducts.filter(product => product.is_published === true && product.stock_status === 'in_stock').slice(0, 3).map(product => ({
            type: 'product',
            action: 'add_to_cart',
            data: {
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.images?.[0] || null,
              description: stripHtml(product.description),
              options: product.options || []
            }
          })),
          ...mergedBundles.filter(bundle => bundle.published_status === 'published' && bundle.stock_status === 'in_stock').slice(0, 2).map(bundle => ({
            type: 'bundle',
            action: 'add_to_cart',
            data: {
              id: bundle.id,
              name: bundle.name,
              price: bundle.price,
              image: bundle.thumbnail_url || bundle.image || null,
              description: stripHtml(bundle.description)
            }
          }))
        ];
        
        // Add action suggestions
        suggestions.push(
          {
            type: 'action',
            action: 'browse_ingredients',
            data: { name: 'Browse all cooking ingredients', type: 'action' }
          },
          {
            type: 'action',
            action: 'view_bundles',
            data: { name: 'View all bundles', type: 'action' }
          }
        );

        // Add follow-up questions for custom bundle creation
        questions = [
          {
            id: 'dish_type',
            text: 'What kind of dish are you planning to make?',
            type: 'question',
            options: ['Nigerian cuisine', 'International dishes', 'Soup/Stew', 'Rice dishes', 'Other']
          },
          {
            id: 'serving_size',
            text: 'How many people will you be serving?',
            type: 'question',
            options: ['1-2 people', '3-4 people', '5-6 people', 'Large gathering (7+ people)']
          },
          {
            id: 'ingredient_preferences',
            text: 'Any specific ingredients you want to include or avoid?',
            type: 'question',
            options: ['Spicy ingredients', 'Fresh vegetables', 'Grains', 'No preferences', 'Tell me more']
          }
        ];
      } else if (lastUserMessage.toLowerCase().includes('browse products') || lastUserMessage.toLowerCase().includes('show products') || lastUserMessage.toLowerCase().includes('all products') || (extractedFromImage && uniqueKeywords.length > 0)) {
        // For product browsing queries, return actual product suggestions
        const availableProducts = mergedProducts.filter(product => 
          product.is_published === true &&
          product.stock_status === 'in_stock'
        );
        
        if (availableProducts.length > 0) {
        responseText = `Here are some of our available products. You can click on any product to add it to your cart:`;

        // Return actual product suggestions
        suggestions = [
            ...availableProducts.slice(0, 6).map(product => ({
            type: 'product',
            action: 'add_to_cart',
            data: {
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.images?.[0] || null,
                description: stripHtml(product.description),
              options: product.options || []
            }
            }))
          ];
          
          // Add action suggestions
          suggestions.push(
          {
            type: 'action',
            action: 'view_bundles',
            data: { name: 'View all bundles', type: 'action' }
          },
          {
            type: 'action',
            action: 'check_offers',
            data: { name: 'Check current offers', type: 'action' }
          }
          );
        } else {
          responseText = `I don't have any products available at the moment. Please check back later or contact our support team for assistance.`;
          suggestions = [
            {
              type: 'action',
              action: 'contact_support',
              data: { name: 'Contact Support', type: 'action' }
            }
          ];
        }

        // Add follow-up questions
        questions = [
          {
            id: 'product_category',
            text: 'What type of products are you most interested in?',
            type: 'question',
            options: ['Vegetables', 'Grains', 'Spices', 'Fresh produce', 'All categories']
          },
          {
            id: 'budget_range',
            text: 'What\'s your budget range?',
            type: 'question',
            options: ['Under ₦5000', '₦5000 - ₦15000', '₦15000 - ₦50000', 'Above ₦50000']
          }
        ];
      } else {
        // General suggestions
        suggestions = [
          {
            type: 'action',
            action: 'browse_products',
            data: { name: 'Browse all products', type: 'action' }
          },
          {
            type: 'action',
            action: 'view_bundles',
            data: { name: 'View all bundles', type: 'action' }
          },
          {
            type: 'action',
            action: 'check_offers',
            data: { name: 'Check current offers', type: 'action' }
          },
          {
            type: 'action',
            action: 'get_help',
            data: { name: 'Get cooking help', type: 'action' }
          }
        ];
      }
    }

    return NextResponse.json({
      response: responseText,
      suggestions,
      questions,
      hasRetry: false,
      vision: extractedFromImage || undefined
    });

  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      { 
        error: "An error occurred while processing your request",
        response: "I'm sorry, I encountered an error. Please try again or contact support if the problem persists.",
        suggestions: ["Try again", "Contact support"],
        questions: [],
        hasRetry: true
      },
      { status: 500 }
    );
  }
}
