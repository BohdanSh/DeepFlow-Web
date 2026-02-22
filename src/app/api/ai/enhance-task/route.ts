import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { title, context, mode = 'enhance' } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    let prompt = ''

    if (mode === 'subtasks') {
      prompt = `You are a productivity coach helping break down tasks.

Task: "${title}"
${context ? `Context/Goal: "${context}"` : ''}

Break this task into 3-5 smaller, actionable subtasks.

Return ONLY valid JSON (no markdown):
{
  "subtasks": [
    { "title": "Subtask 1", "estimated_minutes": 30 },
    { "title": "Subtask 2", "estimated_minutes": 45 }
  ]
}`
    } else {
      prompt = `You are a productivity coach helping improve task definitions.

Task: "${title}"
${context ? `Context/Goal: "${context}"` : ''}

Improve this task by:
1. Making the title more specific and actionable (start with a verb)
2. Writing a brief helpful description
3. Estimating time needed
4. Suggesting priority based on importance/urgency

Return ONLY valid JSON (no markdown):
{
  "enhanced_title": "Improved task title starting with action verb",
  "description": "1-2 sentence description with specific details or tips",
  "estimated_hours": 1.5,
  "suggested_priority": "high" or "medium" or "low"
}`
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
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

    let jsonText = text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    }

    const result = JSON.parse(jsonText)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error enhancing task:', error)
    return NextResponse.json({ error: 'Failed to enhance task' }, { status: 500 })
  }
}
