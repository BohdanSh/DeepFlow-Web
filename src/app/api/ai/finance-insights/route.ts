import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { transactions } = await request.json()

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Transactions array is required' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // Prepare transaction summary for analysis
    const summary = {
      total_transactions: transactions.length,
      income_transactions: transactions.filter((t: { type: string }) => t.type === 'income'),
      expense_transactions: transactions.filter((t: { type: string }) => t.type === 'expense'),
    }

    const totalIncome = summary.income_transactions.reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0)
    const totalExpenses = summary.expense_transactions.reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0)

    // Group expenses by category
    const expensesByCategory: Record<string, number> = {}
    summary.expense_transactions.forEach((t: { category: string; amount: number }) => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Number(t.amount)
    })

    const prompt = `You are a personal finance advisor analyzing a user's financial data.

Here's the financial data:
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Net: $${(totalIncome - totalExpenses).toFixed(2)}
- Expenses by category: ${JSON.stringify(expensesByCategory)}
- Number of transactions: ${transactions.length}

Analyze this data and provide helpful insights in JSON format:
{
  "spending_analysis": "A 2-3 sentence analysis of their spending patterns and habits",
  "recommendations": ["3-4 specific, actionable recommendations to improve their finances"],
  "savings_forecast": "A brief forecast or projection based on current trends"
}

Be encouraging but honest. Focus on practical advice. Respond ONLY with valid JSON, no markdown, no explanation.`

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

    const insights = JSON.parse(jsonText)

    return NextResponse.json(insights)
  } catch (error) {
    console.error('Error generating finance insights:', error)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}
