import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { task_title, available_goals } = await request.json()

    if (!task_title) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 })
    }

    if (!available_goals || available_goals.length === 0) {
      return NextResponse.json({ 
        suggested_goal_id: null, 
        confidence: 0,
        reason: 'No goals available'
      })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const goalsText = available_goals
      .map((g: { id: string; title: string }, i: number) => `${i + 1}. "${g.title}" (id: ${g.id})`)
      .join('\n')

    const prompt = `You are a productivity assistant helping categorize tasks.

Task: "${task_title}"

Available goals:
${goalsText}

Which goal does this task best belong to? Consider the task's nature and the goal titles.

Return ONLY valid JSON (no markdown):
{
  "suggested_goal_id": "the goal id that best matches, or null if none fit",
  "confidence": 0.85,
  "reason": "Brief explanation why this goal was chosen",
  "suggested_priority": "high" or "medium" or "low"
}

If the task doesn't clearly fit any goal, set suggested_goal_id to null and confidence to 0.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 512,
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
    console.error('Error suggesting goal:', error)
    return NextResponse.json({ error: 'Failed to suggest goal' }, { status: 500 })
  }
}
