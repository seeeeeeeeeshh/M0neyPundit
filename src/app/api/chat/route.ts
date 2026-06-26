import { NextRequest, NextResponse } from 'next/server';
import { FinancialAgent, LobangAgent, MarketplaceAgent, SideHustleAgent, Recommendation } from '@/lib/agents';
import { getBudget, getTotalExpenses, getRemainingBudget, getExpensesByCategory, getLast7DaysData, getLast4WeeksData, getCategoryInfo, type ExpenseCategory } from '@/lib/finances';

const AGNES_BASE_URL = 'https://apihub.agnes-ai.com/v1';
const AGNES_MODEL = 'agnes-2.0-flash';

function detectIntents(message: string) {
  const m = message.toLowerCase();
  return {
    financial: m.includes('broke') || m.includes('money') || m.includes('budget') ||
               m.includes('afford') || m.includes('spend') || m.includes('expensive') ||
               m.includes('predict') || m.includes('running out'),
    deals:     m.includes('deal') || m.includes('discount') || m.includes('cheap') ||
               m.includes('eat') || m.includes('food') || m.includes('lunch') ||
               m.includes('dinner') || m.includes('hungry') || m.includes('saving'),
    marketplace: m.includes('buy') || m.includes('sell') || m.includes('borrow') ||
                 m.includes('rent') || m.includes('textbook') || m.includes('calculator') ||
                 m.includes('marketplace'),
    hustle:    m.includes('earn') || m.includes('job') || m.includes('hustle') ||
               m.includes('work') || m.includes('income') || m.includes('cash') ||
               m.includes('broke') || m.includes('money'),
  };
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    const intents = detectIntents(message);
    const anyIntent = Object.values(intents).some(Boolean);

    const activatedAgents: string[] = [];
    const allRecommendations: Recommendation[] = [];
    const contextSections: string[] = [];

    if (intents.financial || !anyIntent) {
      activatedAgents.push('Financial');
      const result = new FinancialAgent().answerFinancialQuestion(message);
      contextSections.push(`=== FINANCIAL DATA ===\n${result.content}`);
      if (result.recommendations) allRecommendations.push(...result.recommendations);
    }

    if (intents.deals || !anyIntent) {
      activatedAgents.push('Lobang');
      const result = await new LobangAgent().findDeals(message);
      contextSections.push(`=== DEALS & DISCOUNTS ===\n${result.content}`);
      if (result.recommendations) allRecommendations.push(...result.recommendations);
    }

    if (intents.marketplace || !anyIntent) {
      activatedAgents.push('Marketplace');
      const result = new MarketplaceAgent().findItems(message);
      contextSections.push(`=== MARKETPLACE ITEMS ===\n${result.content}`);
      if (result.recommendations) allRecommendations.push(...result.recommendations);
    }

    if (intents.hustle || !anyIntent) {
      activatedAgents.push('Side Hustle');
      const result = new SideHustleAgent().findOpportunities(message);
      contextSections.push(`=== SIDE HUSTLE OPPORTUNITIES ===\n${result.content}`);
      if (result.recommendations) allRecommendations.push(...result.recommendations);
    }

    // Build real-time financial context from localStorage
    const budget = getBudget();
    const totalExpenses = getTotalExpenses();
    const remaining = getRemainingBudget();
    const categoryData = getExpensesByCategory();
    const daysLeft = Math.max(1, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate());
    const dailyAllowance = remaining / daysLeft;
    const last7Days = getLast7DaysData();
    const last4Weeks = getLast4WeeksData();

    // Build expense summary for AI context
    const financialContext = Object.entries(categoryData)
      .filter(([, v]) => (v as number) > 0)
      .map(([cat, amount]) => {
        const info = getCategoryInfo(cat as ExpenseCategory);
        return `- ${info.icon} ${cat}: $${(amount as number).toFixed(2)}`;
      })
      .join('\n');

    const recentExpenses = [...budget.expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map(e => `- ${e.name}: $${e.amount.toFixed(2)} (${e.category}) on ${e.date}`)
      .join('\n');

    const systemPrompt = `You are M0neyPundit, an AI financial assistant helping students optimize their money, opportunities, and resources.

=== REAL-TIME FINANCIAL DATA (from user's localStorage) ===
- Monthly Budget: $${budget.monthlyBudget.toFixed(2)}
- Total Spent: $${totalExpenses.toFixed(2)}
- Remaining: $${remaining.toFixed(2)}
- Days Left in Month: ${daysLeft}
- Daily Allowance: $${dailyAllowance.toFixed(2)}

Spending by Category:
${financialContext || '- No expenses recorded yet'}

Recent Transactions:
${recentExpenses || '- No recent transactions'}

Last 7 Days Daily Spending:
${last7Days.map(d => `- ${d.label}: $${d.amount.toFixed(2)}`).join('\n')}

Last 4 Weeks Weekly Spending:
${last4Weeks.map(d => `- ${d.label}: $${d.amount.toFixed(2)}`).join('\n')}

Here is additional campus data to help you answer:

${contextSections.join('\n\n')}

Using ALL the data above, respond to the student's message. Be concise, practical, and friendly — students are often stressed about money. Reference their actual numbers and give personalized advice. Use markdown with bold text and bullet points. Keep it under 300 words unless a detailed breakdown is needed.`;

    const agnesRes = await fetch(`${AGNES_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AGNES_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AGNES_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 800,
      }),
    });

    if (!agnesRes.ok) {
      const errText = await agnesRes.text();
      console.error('Agnes API error:', agnesRes.status, errText);
      return NextResponse.json({ error: 'AI service error' }, { status: 502 });
    }

    const data = await agnesRes.json();
    const responseText = data.choices?.[0]?.message?.content ?? 'No response generated.';

    return NextResponse.json({
      response: responseText,
      agents: [...new Set(activatedAgents)],
      recommendations: allRecommendations.slice(0, 6),
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}