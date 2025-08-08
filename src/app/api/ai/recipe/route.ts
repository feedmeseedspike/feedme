import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Ensure you have your OpenAI API key in your environment variables
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not set in environment variables' }, { status: 500 });
  }
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required and must be a string.' }, { status: 400 });
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
            content: 'You are a helpful chef assistant. When given a meal or recipe request, respond with a JSON object containing a recipe name, a list of ingredients, and step-by-step instructions. Example: { "recipe": "Spaghetti Bolognese", "ingredients": ["spaghetti", "ground beef", "tomato sauce"], "instructions": ["Boil spaghetti", "Cook beef", "Mix with sauce"] }',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiRes.ok) {
      const error = await openaiRes.text();
      return NextResponse.json({ error: 'OpenAI API error', details: error }, { status: 500 });
    }

    const data = await openaiRes.json();
    const message = data.choices?.[0]?.message?.content;

    // Try to parse the AI's response as JSON
    let recipeData;
    try {
      recipeData = JSON.parse(message);
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse AI response as JSON', raw: message }, { status: 500 });
    }

    return NextResponse.json({ recipe: recipeData });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
  }
} 