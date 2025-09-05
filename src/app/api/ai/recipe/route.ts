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
            content: 'You are a helpful chef assistant. When given a meal or recipe request, respond strictly as JSON with an array of 3 recipes. Each recipe must include: name (string), servings (number), prep_time_minutes (number), cook_time_minutes (number), total_time_minutes (number), ingredients (string[]), and steps (array of objects with: step_number, instruction, time_minutes). Keep ingredients limited to those implied by the prompt; suggest reasonable substitutions only if necessary. Example: { "recipes": [ { "name": "Chicken Fried Rice", "servings": 4, "prep_time_minutes": 15, "cook_time_minutes": 20, "total_time_minutes": 35, "ingredients": ["rice", "chicken", "oil"], "steps": [ { "step_number": 1, "instruction": "Boil rice until al dente.", "time_minutes": 12 }, { "step_number": 2, "instruction": "Stir-fry chicken.", "time_minutes": 6 } ] } ] }',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1200,
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

    return NextResponse.json({ recipes: recipeData.recipes || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
  }
} 