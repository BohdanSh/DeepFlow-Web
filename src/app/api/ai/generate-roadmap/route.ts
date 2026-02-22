import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface SuggestedTask {
  title: string
  description: string
  suggested_due_date: string
  priority: 'low' | 'medium' | 'high'
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, target_date } = await request.json()

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
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

Return ONLY a JSON array with this structure (no markdown, no code blocks):
[
  {
    "title": "Task title",
    "description": "Brief description of what to do",
    "suggested_due_date": "YYYY-MM-DD",
    "priority": "high" | "medium" | "low"
  }
]

Space out the due dates logically from today to the target date. If no target date, spread over 2-4 weeks.
Start with high-priority foundational tasks, then medium, then low priority polish tasks.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful productivity assistant. Always respond with valid JSON only, no markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const responseText = completion.choices[0]?.message?.content || '[]'
    
    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim()
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const tasks: SuggestedTask[] = JSON.parse(cleanedResponse)

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('AI roadmap generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate roadmap' },
      { status: 500 }
    )
  }
}
