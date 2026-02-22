import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const prompt = `You are a productivity coach helping users define their life goals.

Given this goal title: "${title}"

Generate a helpful goal structure in JSON format:
{
  "description": "A motivating 1-2 sentence description of what achieving this goal means",
  "category": "one of: career, health, finance, personal, relationships",
  "target_date": "suggested target date in YYYY-MM-DD format (be realistic, 3-12 months for medium goals, 1-3 years for big goals)",
  "suggested_projects": [
    {
      "title": "First milestone/project name",
      "description": "Brief description"
    },
    {
      "title": "Second milestone/project name", 
      "description": "Brief description"
    }
  ]
}

Respond ONLY with valid JSON, no markdown, no explanation.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonText = text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    }

    const generated = JSON.parse(jsonText)

    return NextResponse.json(generated)
  } catch (error) {
    console.error('Error generating goal:', error)
    return NextResponse.json({ error: 'Failed to generate goal' }, { status: 500 })
  }
}
