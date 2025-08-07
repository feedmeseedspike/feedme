import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'src/utils/supabase/server';
import { trackedGemini, selectOptimalGeminiModel } from 'src/lib/gemini-wrapper';

export async function POST(req: NextRequest) {
  const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

  if (!GOOGLE_AI_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_AI_API_KEY is not set in environment variables' }, { status: 500 });
  }
  try {
    const body = await req.json();
    const { 
      message, 
      conversationHistory = [], 
      imageBase64,
      userPreferences = {}
    } = body;

    if (!message && !imageBase64) {
      return NextResponse.json({ 
        error: 'Either message or image is required.' 
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Get products with their options from database
    const { data: products } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        options,
        in_season,
        is_published,
        category_ids,
        image,
        avg_rating,
        num_reviews
      `)
      .eq('is_published', true);

    // Get categories for context
    const { data: categories } = await supabase
      .from('categories')
      .select('id, title');

    // Prepare ALL products context for AI (no limit for better matching)
    const productContext = products?.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      inSeason: product.in_season,
      options: product.options,
    })) || [];

    // System prompt for the AI meal planning assistant
    const systemPrompt = `You are Feedme's AI Meal Planning Assistant. Your job is to help users plan meals and suggest specific products from our database.

AVAILABLE PRODUCTS (COMPLETE LIST):
${JSON.stringify(productContext, null, 2)}

CATEGORIES:
${JSON.stringify(categories, null, 2)}

CRITICAL RULES - MUST FOLLOW:
1. ONLY suggest products that exist in the AVAILABLE PRODUCTS list above
2. NEVER suggest products not in our database - if you can't find a match, suggest similar available products
3. NEVER ask follow-up questions or use the "questions" field
4. Always provide immediate product suggestions based on the user's request
5. Make reasonable assumptions (e.g., 2-4 people serving size)
6. Use exact product IDs and names from the AVAILABLE PRODUCTS list
7. If continuing a conversation, build on previous context without repeating generic introductions
8. When user provides specific details, incorporate them into focused product suggestions

RESPONSE FORMAT:
Always respond with ONLY a valid JSON object (no markdown, no code blocks, no extra text):
{
  "message": "Your helpful response about the meal",
  "questions": [],
  "productSuggestions": [
    {
      "productId": "product_id_from_database",
      "productName": "Product Name",
      "reason": "Essential for making [dish name]",
      "quantity": "1 kg"
    }
  ],
  "needsMoreInfo": false
}

STRICT GUIDELINES:
- ONLY suggest products from the AVAILABLE PRODUCTS list - NO EXCEPTIONS
- Use exact product IDs and names from our database
- If a specific ingredient isn't available, suggest the closest alternative from our list
- Consider seasonal availability (in_season: true is preferred)
- Provide variety in your suggestions when multiple similar products exist
- Be specific about quantities assuming 2-4 people serving
- If user uploads an image, analyze it and suggest matching available ingredients
- Group related products together (e.g., all rice types, all meat options)
- When in doubt, choose products that exist rather than ideal but unavailable ones
- In follow-up responses, be direct and specific rather than giving generic meal suggestions
- Don't repeat "Here are some suggestions for breakfast/lunch/dinner" in conversations - jump straight to products`;

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ];

    // Handle image if provided
    if (imageBase64) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: message || 'I want to make this dish. What ingredients do I need?'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: message
      });
    }

    // Get user ID from request (if available)
    const userId = req.headers.get('user-id') || undefined;
    
    // Select optimal model based on request complexity
    const selectedModel = selectOptimalGeminiModel('complex', message || '');

    // Prepare the prompt for Gemini (convert from OpenAI chat format)
    const conversationPrompt = messages.map((msg: any) => {
      if (msg.role === 'system') return msg.content;
      if (msg.role === 'user') return `User: ${msg.content}`;
      if (msg.role === 'assistant') return `Assistant: ${msg.content}`;
      return '';
    }).join('\n\n');

    // Call Gemini API with usage tracking
    const aiResponse = imageBase64 
      ? await trackedGemini.analyzeImage(
          imageBase64,
          conversationPrompt,
          {
            userId,
            featureType: 'image_recognition',
            userMessage: message || 'Image analysis request',
            hasImage: true,
          }
        )
      : await trackedGemini.generateContent(
          conversationPrompt,
          {
            model: selectedModel,
            temperature: 0.7,
            maxOutputTokens: 1500,
          },
          {
            userId,
            featureType: 'meal_planning',
            userMessage: message || '',
            hasImage: false,
          }
        );

    // Parse AI response
    let parsedResponse;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      parsedResponse = JSON.parse(cleanResponse);
    } catch (e) {
      console.error('JSON parsing error:', e, 'Raw response:', aiResponse);
      // Fallback if AI doesn't return proper JSON
      parsedResponse = {
        message: aiResponse,
        questions: [],
        productSuggestions: [],
        needsMoreInfo: true
      };
    }

    // Validate and enrich product suggestions with actual database data
    const enrichedSuggestions = [];
    for (const suggestion of parsedResponse.productSuggestions || []) {
      const matchedProduct = products?.find(p => 
        p.id === suggestion.productId ||
        p.name.toLowerCase().includes(suggestion.productName.toLowerCase()) ||
        suggestion.productName.toLowerCase().includes(p.name.toLowerCase())
      );

      if (matchedProduct) {
        enrichedSuggestions.push({
          ...suggestion,
          product: {
            id: matchedProduct.id,
            name: matchedProduct.name,
            price: matchedProduct.price || 0,
            options: matchedProduct.options || [],
            inSeason: matchedProduct.in_season || false,
            image: matchedProduct.image || null
          }
        });
      } else {
        // Keep suggestion even if no exact match, but mark as unavailable
        enrichedSuggestions.push({
          ...suggestion,
          available: false
        });
      }
    }

    return NextResponse.json({
      ...parsedResponse,
      productSuggestions: enrichedSuggestions,
      conversationId: Date.now().toString() // Simple conversation tracking
    });

  } catch (error) {
    console.error('AI Meal Planner Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}