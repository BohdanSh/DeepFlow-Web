import { NextRequest, NextResponse } from 'next/server'

interface SuggestedTask {
  title: string
  description: string
  suggested_due_date: string
  priority: 'low' | 'medium' | 'high'
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { title, description, target_date } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const today = new Date().toISOString().split('T')[0]
    const targetDateStr = target_date || 'not specified'

    const prompt = `You are a productivity coach helping break down goals into actionable tasks.

Goal: ${title}
Description: ${description || 'No description provided'}
Target Date: ${targetDateStr}
Today's Date: ${today}

Generate a roadmap of 5-8 concrete, actionable tasks that will help achieve this goal. 
Each task should be:
- Specific and measurable
- Achievable in a reasonable timeframe
- Ordered by priority/dependency

Return ONLY a JSON array with this structure (no markdown, no code blocks, no explanation):
[
  {
    "title": "Task title",
    "description": "Brief description of what to do",
    "suggested_due_date": "YYYY-MM-DD",
    "priority": "high" or "medium" or "low"
  }
]

Space out the due dates logically from today to the target date. If no target date, spread over 2-4 weeks.
Start with high-priority foundational tasks, then medium, then low priority polish tasks.`

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
            maxOutputTokens: 2048,
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

    const tasks: SuggestedTask[] = JSON.parse(jsonText)

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('AI roadmap generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate roadmap' },
      { status: 500 }
    )
  }
}
