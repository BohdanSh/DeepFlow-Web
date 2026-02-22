import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const EXPENSE_CATEGORIES = ['food', 'housing', 'transport', 'entertainment', 'health', 'subscriptions', 'shopping', 'other']
const INCOME_CATEGORIES = ['salary', 'freelance', 'investments', 'other']

export async function POST(request: NextRequest) {
  try {
    const { description, type = 'expense' } = await request.json()

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

    const prompt = `You are a financial transaction categorizer.

Given this transaction description: "${description}"

Categorize it into ONE of these ${type} categories:
${categories.map(c => `- ${c}`).join('\n')}

Respond with ONLY the category ID (lowercase, single word), nothing else.
Example: "food" or "transport" or "salary"`

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
            temperature: 0.3,
            maxOutputTokens: 50,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      return NextResponse.json({ error: 'AI categorization failed' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const suggestedCategory = text.trim().toLowerCase()

    // Validate that the category is in our list
    if (categories.includes(suggestedCategory)) {
      return NextResponse.json({ category: suggestedCategory })
    }

    // Try to find a partial match
    const partialMatch = categories.find(c => 
      suggestedCategory.includes(c) || c.includes(suggestedCategory)
    )

    if (partialMatch) {
      return NextResponse.json({ category: partialMatch })
    }

    // Default to 'other' if no match found
    return NextResponse.json({ category: 'other' })
  } catch (error) {
    console.error('Error categorizing transaction:', error)
    return NextResponse.json({ error: 'Failed to categorize' }, { status: 500 })
  }
}
