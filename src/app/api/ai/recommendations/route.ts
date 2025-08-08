import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not set in environment variables' }, { status: 500 });
  }
  try {
    const body = await req.json();
    const { preferences, dietary_restrictions, budget } = body;

    if (!preferences || typeof preferences !== 'string') {
      return NextResponse.json({ error: 'Preferences are required and must be a string.' }, { status: 400 });
    }

    // Call OpenAI API
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a food recommendation assistant. Based on user preferences, dietary restrictions, and budget, provide personalized food recommendations. Respond with a JSON object containing an array of recommended products with name, category, price_range, and description. Example: { "recommendations": [{ "name": "Organic Quinoa Bowl", "category": "healthy", "price_range": "medium", "description": "Nutritious quinoa bowl with vegetables" }] }`,
          },
          {
            role: 'user',
            content: `Preferences: ${preferences}${dietary_restrictions ? `, Dietary restrictions: ${dietary_restrictions}` : ''}${budget ? `, Budget: ${budget}` : ''}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!openaiRes.ok) {
      const error = await openaiRes.text();
      return NextResponse.json({ error: 'OpenAI API error', details: error }, { status: 500 });
    }

    const data = await openaiRes.json();
    const message = data.choices?.[0]?.message?.content;

    // Try to parse the AI's response as JSON
    let recommendationsData;
    try {
      recommendationsData = JSON.parse(message);
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse AI response as JSON', raw: message }, { status: 500 });
    }

    return NextResponse.json({ recommendations: recommendationsData });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
  }
}