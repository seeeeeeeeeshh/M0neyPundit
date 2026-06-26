// Agent system for M0neyPundit

import { deals as seedDeals, marketplaceItems, sideHustles, spendingData, userProfile } from './seed-data';

// Fetch deals from API (Supabase), fallback to seed data
async function fetchDealsFromApi(): Promise<any[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/deals?limit=50`);
    if (!res.ok) throw new Error('API fetch failed');
    const data = await res.json();
    return data.deals || [];
  } catch (error) {
    console.warn('API not available, using seed data:', error);
    return [];
  }
}

// Get active deals (API if available, fallback to seed)
async function getActiveDeals(): Promise<any[]> {
  const apiDeals = await fetchDealsFromApi();
  return apiDeals.length > 0 ? apiDeals.map(d => ({
    id: d.telegram_id || d.id,
    title: d.title,
    description: d.description,
    discount: d.discount,
    category: d.category,
    location: d.location || 'Campus Area',
    expiryDate: d.expiry_date || 'No expiry',
    isPopular: d.is_popular || d.isPopular,
  })) : seedDeals;
}

export interface AgentResponse {
  agent: string;
  title: string;
  content: string;
  recommendations?: Recommendation[];
  data?: any;
}

export interface Recommendation {
  type: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action?: string;
}

// Financial Agent
export class FinancialAgent {
  analyzeSpending(): AgentResponse {
    const totalSpent = spendingData.reduce((sum, cat) => sum + cat.amount, 0);
    const totalLimit = spendingData.reduce((sum, cat) => sum + cat.limit, 0);
    const remaining = userProfile.remainingBudget;
    const daysLeft = userProfile.daysUntilPayday;
    
    // Find overspending categories
    const overspent = spendingData.filter(cat => cat.percentage > 100);
    const nearLimit = spendingData.filter(cat => cat.percentage > 75 && cat.percentage <= 100);
    const underBudget = spendingData.filter(cat => cat.percentage <= 50);

    let content = `💰 **Financial Analysis Report**\n\n`;
    content += `You've spent **$${totalSpent}** of your $${totalLimit} monthly budget. `;
    content += `You have **$${remaining}** left for ${daysLeft} days. `;
    content += `That's about **$${(remaining / daysLeft).toFixed(2)}/day**.\n\n`;

    if (overspent.length > 0) {
      content += `⚠️ **Overspending Alerts:**\n`;
      overspent.forEach(cat => {
        content += `- ${cat.category}: $${cat.amount}/$${cat.limit} (${cat.percentage}%)\n`;
      });
      content += `\n`;
    }

    if (nearLimit.length > 0) {
      content += `📊 **Near Limit:**\n`;
      nearLimit.forEach(cat => {
        content += `- ${cat.category}: $${cat.amount}/$${cat.limit} (${cat.percentage}%)\n`;
      });
      content += `\n`;
    }

    // Daily budget recommendation
    const recommendedDailyFoodBudget = Math.min(10, remaining / daysLeft);
    
    const recommendations: Recommendation[] = [
      {
        type: 'budget',
        title: 'Reduce Daily Food Spending',
        description: `Your food budget is running high. Try to keep daily food spending under $${recommendedDailyFoodBudget.toFixed(2)}.`,
        impact: 'high',
        action: 'view-deals'
      },
      {
        type: 'alert',
        title: 'Study Materials Over Budget',
        description: 'You have exceeded your study materials budget. Check marketplace for cheaper alternatives.',
        impact: 'medium',
        action: 'view-marketplace'
      },
      {
        type: 'save',
        title: 'Cut Entertainment Spending',
        description: 'Consider reducing entertainment spending this week to recover budget.',
        impact: 'medium',
        action: ''
      }
    ];

    return {
      agent: 'financial',
      title: 'Financial Health Check',
      content,
      recommendations
    };
  }

  answerFinancialQuestion(question: string): AgentResponse {
    const lowerQ = question.toLowerCase();
    const remaining = userProfile.remainingBudget;
    const daysLeft = userProfile.daysUntilPayday;
    const dailyBudget = remaining / daysLeft;

    if (lowerQ.includes('broke') || lowerQ.includes('no money') || lowerQ.includes('no funds')) {
      return {
        agent: 'financial',
        title: 'Emergency Financial Plan',
        content: `🚨 **You have $${remaining} left for ${daysLeft} days.**\n\nHere's your emergency survival plan:\n\n1. **Immediate**: Switch to cheapest meals ($2.50-$5 per meal)\n2. **Today**: Apply for quick income opportunities\n3. **This week**: Cut all non-essential spending\n4. **Result**: You can make it to payday with minimal stress`,
        recommendations: [
          { type: 'action', title: 'Apply for Quick Gig', description: 'Complete a delivery or event staff gig for instant cash', impact: 'high', action: 'view-hustles' },
          { type: 'action', title: 'Use Cheap Food Deals', description: 'Save $15-20 on food this week with deals', impact: 'high', action: 'view-deals' },
          { type: 'action', title: 'Cancel Entertainment Spending', description: 'Skip paid activities until next paycheck', impact: 'medium', action: '' }
        ]
      };
    }

    if (lowerQ.includes('afford') && (lowerQ.includes('eat') || lowerQ.includes('food') || lowerQ.includes('out'))) {
      const mealCost = 12;
      const canAfford = remaining - mealCost >= dailyBudget * (daysLeft - 1);
      return {
        agent: 'financial',
        title: 'Can You Afford to Eat Out?',
        content: canAfford 
          ? `✅ **Yes, you can afford it!** After spending $${mealCost} on a meal out, you'll still have $${remaining - mealCost} for ${daysLeft} days, which is above your daily budget of $${dailyBudget.toFixed(2)}.\n\nBut consider: cheaper alternatives save you $${mealCost - 5}.`
          : `❌ **Not recommended.** Eating out for $${mealCost} would leave you below your daily budget. Try the deals instead - similar meals for $2.50-$5!`,
        recommendations: [
          { type: 'alternative', title: 'Cheaper Alternative', description: `Save $${mealCost - 2.50} by using our food deals`, impact: 'high', action: 'view-deals' }
        ]
      };
    }

    if (lowerQ.includes('predict') || lowerQ.includes('budget') || lowerQ.includes('running out')) {
      return {
        agent: 'financial',
        title: 'Budget Prediction',
        content: `📊 **End of Month Prediction:**\n\nBased on your current spending patterns:\n- Remaining budget: **$${remaining}**\n- Days until payday: **${daysLeft}**\n- Average daily spending: **$${(spendingData.reduce((s,c) => s+c.amount, 0) / 30).toFixed(2)}**\n- Projected end balance: **$${remaining - dailyBudget * daysLeft > 0 ? '+' : ''}${(remaining - dailyBudget * daysLeft).toFixed(2)}**\n\n${remaining / daysLeft < 5 ? '⚠️ You need to reduce spending immediately!' : '✅ You\'re on track, but watch your spending.'}`,
        recommendations: [
          { type: 'prediction', title: 'Projected Balance', description: `You'll have approximately $${(remaining - dailyBudget * daysLeft).toFixed(2)} left on payday`, impact: 'high', action: '' }
        ]
      };
    }

    return {
      agent: 'financial',
      title: 'Financial Advice',
      content: `💡 Based on your budget of $${remaining} over ${daysLeft} days:\n\nYour daily allowance is **$${dailyBudget.toFixed(2)}**. Here's how to make it last:\n\n• Track every expense\n• Use food deals to save 30-50%\n• Borrow instead of buy when possible\n• Look into quick income opportunities`,
      recommendations: [
        { type: 'tip', title: 'Daily Budget: $' + dailyBudget.toFixed(2), description: 'Stick to this daily limit', impact: 'high', action: 'view-deals' }
      ]
    };
  }
}

// Lobang Agent (Deals & Discounts)
export class LobangAgent {
  async findDeals(query?: string): Promise<AgentResponse> {
    const allDeals = await getActiveDeals();
    let filteredDeals = [...allDeals];
    
    if (query) {
      const lowerQ = query.toLowerCase();
      if (lowerQ.includes('food') || lowerQ.includes('eat') || lowerQ.includes('lunch') || lowerQ.includes('dinner') || lowerQ.includes('coffee')) {
        filteredDeals = filteredDeals.filter(d => d.category === 'food');
      } else if (lowerQ.includes('tech') || lowerQ.includes('print')) {
        filteredDeals = filteredDeals.filter(d => d.category === 'tech');
      } else if (lowerQ.includes('transport') || lowerQ.includes('bus') || lowerQ.includes('train')) {
        filteredDeals = filteredDeals.filter(d => d.category === 'transport');
      } else if (lowerQ.includes('event') || lowerQ.includes('free')) {
        filteredDeals = filteredDeals.filter(d => d.category === 'events');
      }
    }

    // Sort by popularity
    filteredDeals.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));

    const topDeals = filteredDeals.slice(0, 5);

    let content = `🎉 **Current Student Deals**\n\n`;
    content += `Found **${topDeals.length} hot deals** for you:\n\n`;

    topDeals.forEach((deal, i) => {
      content += `${i + 1}. **${deal.title}**\n`;
      content += `   ${deal.description}\n`;
      content += `   📍 ${deal.location} | 💸 ${deal.discount}\n\n`;
    });

    const totalSavings = topDeals.reduce((sum, d) => {
      if (d.discount.includes('%')) {
        return sum + parseInt(d.discount) * 2; // Estimated savings
      }
      if (d.discount.startsWith('$')) {
        return sum + parseFloat(d.discount.replace('$', '')) * 5;
      }
      return sum + 5;
    }, 0);

    content += `💰 **Potential Savings: Up to $${totalSavings} this week!**`;

    return {
      agent: 'lobang',
      title: 'Best Deals Right Now',
      content,
      recommendations: topDeals.map(deal => ({
        type: 'deal',
        title: deal.title,
        description: deal.description,
        impact: deal.isPopular ? 'high' : 'medium',
        action: ''
      }))
    };
  }

  async findCheapestLunch(): Promise<AgentResponse> {
    const allDeals = await getActiveDeals();
    const foodDeals = allDeals.filter(d => d.category === 'food');
    const cheapest = foodDeals.find(d => d.discount.includes('$2')) || foodDeals[0] || seedDeals[0];

    return {
      agent: 'lobang',
      title: 'Cheapest Lunch Near Campus',
      content: `🍜 **Best Budget Lunch Deal:**\n\n**${cheapest.title}**\n${cheapest.description}\n\n📍 Location: ${cheapest.location}\n💰 Price: ${cheapest.discount}\n⏰ Valid until: ${cheapest.expiryDate}\n\n${cheapest.isPopular ? '🔥 This is a student favorite!' : ''}\n\n**Alternative options:**\n${foodDeals.slice(0, 3).map((d, i) => `${i + 1}. ${d.title} - ${d.discount}`).join('\n')}`,
      recommendations: [
        { type: 'deal', title: cheapest.title, description: cheapest.description, impact: 'high', action: '' }
      ]
    };
  }

  async findNearbyDeals(): Promise<AgentResponse> {
    const allDeals = await getActiveDeals();
    const nearbyDeals = allDeals.filter(d => d.isPopular).slice(0, 4);
    
    let content = `📍 **Deals Near You**\n\n`;
    nearbyDeals.forEach((deal, i) => {
      content += `${i + 1}. **${deal.title}**\n   ${deal.description}\n   📍 ${deal.location}\n\n`;
    });

    return {
      agent: 'lobang',
      title: 'Nearby Student Deals',
      content,
      recommendations: nearbyDeals.map(d => ({
        type: 'deal',
        title: d.title,
        description: d.description,
        impact: 'high',
        action: ''
      }))
    };
  }
}

// Marketplace Agent
export class MarketplaceAgent {
  findItems(query?: string): AgentResponse {
    let filteredItems = [...marketplaceItems];
    
    if (query) {
      const lowerQ = query.toLowerCase();
      
      // Search by keywords
      const keywords = ['textbook', 'book', 'study'];
      if (keywords.some(k => lowerQ.includes(k))) {
        filteredItems = filteredItems.filter(i => i.category === 'Textbook');
      }
      
      const calcKeywords = ['calculator', 'calc', 'math'];
      if (calcKeywords.some(k => lowerQ.includes(k))) {
        filteredItems = filteredItems.filter(i => i.category === 'Calculator');
      }
      
      const elecKeywords = ['charger', 'electronic', 'laptop', 'monitor'];
      if (elecKeywords.some(k => lowerQ.includes(k))) {
        filteredItems = filteredItems.filter(i => i.category === 'Electronics');
      }

      const borrowKeywords = ['borrow', 'rent', 'lend'];
      if (borrowKeywords.some(k => lowerQ.includes(k))) {
        filteredItems = filteredItems.filter(i => i.type === 'borrow' || i.type === 'rent');
      }
    }

    // Separate by type
    const toSell = filteredItems.filter(i => i.type === 'sell');
    const toBorrow = filteredItems.filter(i => i.type === 'borrow');
    const toRent = filteredItems.filter(i => i.type === 'rent');

    let content = `🏪 **Marketplace Results**\n\n`;

    if (toSell.length > 0) {
      content += `**📦 For Sale:**\n`;
      toSell.forEach(item => {
        content += `- ${item.image} **${item.title}** - $${item.price} (${item.condition})\n  ${item.description}\n  📍 ${item.location} | Seller: ${item.seller}\n\n`;
      });
    }

    if (toBorrow.length > 0) {
      content += `**🔄 Available to Borrow:**\n`;
      toBorrow.forEach(item => {
        content += `- ${item.image} **${item.title}** - FREE\n  ${item.description}\n  📍 ${item.location}\n\n`;
      });
    }

    if (toRent.length > 0) {
      content += `**💰 Available to Rent:**\n`;
      toRent.forEach(item => {
        content += `- ${item.image} **${item.title}** - $${item.price}/week\n  ${item.description}\n  📍 ${item.location}\n\n`;
      });
    }

    return {
      agent: 'marketplace',
      title: 'Marketplace Listings',
      content: content || '🏪 **Marketplace**\n\nNo items found matching your criteria. Here are all available items:\n\n' + marketplaceItems.map(i => `- ${i.image} ${i.title} ($${i.price})`).join('\n'),
      recommendations: filteredItems.map(item => ({
        type: item.type,
        title: item.title,
        description: `${item.description} - $${item.price}`,
        impact: item.price === 0 ? 'high' : item.price < 20 ? 'high' : 'medium',
        action: ''
      }))
    };
  }

  compareBuyVsBorrow(itemName: string): AgentResponse {
    const item = marketplaceItems.find(i => 
      i.title.toLowerCase().includes(itemName.toLowerCase()) || 
      itemName.toLowerCase().includes(i.category.toLowerCase())
    );

    const sellPrice = item?.price || 50;
    const borrowAvailable = marketplaceItems.some(i => i.type === 'borrow' && i.category === item?.category);

    let content = `📊 **Buy vs Borrow Analysis: ${itemName}**\n\n`;
    
    if (borrowAvailable) {
      content += `**Option 1: Borrow**\n`;
      content += `✅ FREE\n✅ Support community sharing\n✅ Try before you buy\n\n`;
      content += `**Option 2: Buy Used**\n`;
      content += `✅ Approximately $${Math.floor(sellPrice * 0.6)} (60% of retail)\n✅ Own it permanently\n\n`;
      content += `**Option 3: Buy New**\n`;
      content += `❌ Approximately $${sellPrice * 2} (full retail price)\n\n`;
      content += `💡 **Recommendation: BORROW first, then decide!**`;
      
      return {
        agent: 'marketplace',
        title: `Buy vs Borrow: ${itemName}`,
        content,
        recommendations: [
          { type: 'recommendation', title: 'Borrow First', description: 'Try borrowing before spending money', impact: 'high', action: 'view-marketplace' },
          { type: 'save', title: `Save $${sellPrice}`, description: `Borrowing saves you $${sellPrice} compared to buying`, impact: 'high', action: '' }
        ]
      };
    }

    content += `**Option 1: Buy Used** - ~$${Math.floor(sellPrice * 0.6)}\n`;
    content += `**Option 2: Buy New** - ~$${sellPrice * 2}\n\n`;
    content += `💡 **You can save ~$${sellPrice * 1.4} by buying used!**`;

    return {
      agent: 'marketplace',
      title: `Price Comparison: ${itemName}`,
      content,
      recommendations: [
        { type: 'save', title: 'Buy Used', description: `Save $${sellPrice * 1.4} by buying second-hand`, impact: 'high', action: 'view-marketplace' }
      ]
    };
  }
}

// Side Hustle Agent
export class SideHustleAgent {
  findOpportunities(query?: string): AgentResponse {
    let filteredHustles = [...sideHustles];
    
    if (query) {
      const lowerQ = query.toLowerCase();
      
      if (lowerQ.includes('quick') || lowerQ.includes('fast') || lowerQ.includes('urgent')) {
        filteredHustles = filteredHustles.filter(h => h.urgency === 'high');
      }
      
      if (lowerQ.includes('flexible') || lowerQ.includes('anytime')) {
        filteredHustles = filteredHustles.filter(h => h.schedule.includes('Flexible') || h.schedule.includes('Project'));
      }

      // Match with skills
      if (lowerQ.includes('design')) {
        filteredHustles = filteredHustles.filter(h => h.skills.some(s => s.toLowerCase().includes('design')));
      }
      if (lowerQ.includes('teach') || lowerQ.includes('tutor')) {
        filteredHustles = filteredHustles.filter(h => h.type === 'tutoring');
      }
      if (lowerQ.includes('programming') || lowerQ.includes('code') || lowerQ.includes('python')) {
        filteredHustles = filteredHustles.filter(h => h.skills.some(s => ['Programming', 'Python', 'JavaScript'].includes(s)));
      }
    }

    // Sort by hourly rate
    filteredHustles.sort((a, b) => b.hourlyRate - a.hourlyRate);

    let content = `💼 **Side Hustle Opportunities**\n\n`;
    content += `Found **${filteredHustles.length} opportunities** that match your profile:\n\n`;

    filteredHustles.forEach((hustle, i) => {
      content += `${i + 1}. **${hustle.title}**\n`;
      content += `   ${hustle.description}\n`;
      content += `   💰 $${hustle.hourlyRate}/hr | 📍 ${hustle.location}\n`;
      content += `   🕐 ${hustle.schedule} | 🔖 ${hustle.type}\n`;
      content += `   Skills: ${hustle.skills.join(', ')}\n\n`;
    });

    const bestOption = filteredHustles[0];
    content += `🏆 **Top Pick: ${bestOption.title} ($${bestOption.hourlyRate}/hr)**`;

    return {
      agent: 'sidehustle',
      title: 'Recommended Opportunities',
      content,
      recommendations: filteredHustles.map(hustle => ({
        type: 'job',
        title: hustle.title,
        description: `$${hustle.hourlyRate}/hr - ${hustle.schedule}`,
        impact: hustle.urgency,
        action: ''
      }))
    };
  }

  recommendBestOption(): AgentResponse {
    // Match with user profile skills
    const userSkills = userProfile.skills;
    
    const matchedHustles = sideHustles.map(h => ({
      ...h,
      matchScore: h.skills.filter(s => userSkills.some(us => us.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(us.toLowerCase()))).length
    })).sort((a, b) => b.matchScore - a.matchScore);

    const bestMatch = matchedHustles[0];
    const bestPaid = sideHustles.reduce((prev, current) => prev.hourlyRate > current.hourlyRate ? prev : current);

    let content = `🎯 **Personalized Job Recommendations**\n\n`;
    content += `Based on your skills (${userSkills.join(', ')}) and availability (${userProfile.availability}):\n\n`;

    content += `**🏆 Best Match for YOU:**\n`;
    content += `${bestMatch.title}\n`;
    content += `${bestMatch.description}\n`;
    content += `💰 $${bestMatch.hourlyRate}/hr | 📍 ${bestMatch.location}\n`;
    content += `🕐 ${bestMatch.schedule}\n`;
    content += `Match Score: ${bestMatch.matchScore}/${userSkills.length} skills aligned\n\n`;

    content += `**💵 Highest Paying:**\n`;
    content += `${bestPaid.title}\n`;
    content += `💰 $${bestPaid.hourlyRate}/hr\n\n`;

    const weeklyEarning = bestMatch.hourlyRate * 5; // 5 hours/week
    content += `💡 **Potential Earnings:** If you work 5 hours/week, that's **$${weeklyEarning}/week** or **$${weeklyEarning * 4}/month**!`;

    return {
      agent: 'sidehustle',
      title: 'Your Personalized Recommendations',
      content,
      recommendations: matchedHustles.slice(0, 3).map(h => ({
        type: 'job',
        title: h.title,
        description: `$${h.hourlyRate}/hr - ${h.matchScore} skill matches`,
        impact: h.urgency,
        action: 'apply'
      }))
    };
  }

  helpEarnMoney(amount: number): AgentResponse {
    const hustles = sideHustles.filter(h => h.urgency === 'high' || h.hourlyRate >= 20);
    hustles.sort((a, b) => b.hourlyRate - a.hourlyRate);

    let content = `🚀 **Earn $${amount} This Week - Action Plan**\n\n`;
    content += `Here's how to make $${amount}:\n\n`;

    let remaining = amount;
    hustles.forEach((hustle, i) => {
      const hoursNeeded = Math.ceil(remaining / hustle.hourlyRate);
      const actualEarning = hoursNeeded * hustle.hourlyRate;
      
      content += `${i + 1}. **${hustle.title}**\n`;
      content += `   Work ${hoursNeeded} hours × $${hustle.hourlyRate}/hr = $${actualEarning}\n`;
      content += `   ${hustle.description}\n\n`;
      
      remaining -= actualEarning;
      if (remaining <= 0) return;
    });

    content += `✅ **Total projected earnings: $${hustles.reduce((sum, h, i) => {
      if (amount <= 0) return sum;
      const hours = Math.ceil(amount / h.hourlyRate);
      amount -= hours * h.hourlyRate;
      return sum + hours * h.hourlyRate;
    }, 0)}**`;

    return {
      agent: 'sidehustle',
      title: `How to Earn $${amount}`,
      content,
      recommendations: hustles.map(h => ({
        type: 'action-plan',
        title: h.title,
        description: `Earn $${h.hourlyRate}/hr - ${h.schedule}`,
        impact: 'high',
        action: 'view-hustles'
      }))
    };
  }
}

// Master Orchestrator Agent
export class OrchestratorAgent {
  async orchestrateResponse(userMessage: string): Promise<{ response: string; agents: string[]; recommendations: Recommendation[] }> {
    const lowerMsg = userMessage.toLowerCase();
    
    const financialAgent = new FinancialAgent();
    const lobangAgent = new LobangAgent();
    const marketplaceAgent = new MarketplaceAgent();
    const sideHustleAgent = new SideHustleAgent();

    const activatedAgents: string[] = [];
    const allRecommendations: Recommendation[] = [];
    let response = '';

    // Detect intent and activate relevant agents
    const intents = this.detectIntents(lowerMsg);

    let agentResponses: AgentResponse[] = [];

    if (intents.financial) {
      activatedAgents.push('Financial');
      const finResponse = financialAgent.answerFinancialQuestion(userMessage);
      agentResponses.push(finResponse);
      if (finResponse.recommendations) allRecommendations.push(...finResponse.recommendations);
    }

    if (intents.deals || intents.food) {
      activatedAgents.push('Lobang');
      const lobangResponse = await lobangAgent.findDeals(userMessage);
      agentResponses.push(lobangResponse);
      if (lobangResponse.recommendations) allRecommendations.push(...lobangResponse.recommendations);
    }

    if (intents.marketplace || intents.borrow || intents.buy) {
      activatedAgents.push('Marketplace');
      const marketResponse = marketplaceAgent.findItems(userMessage);
      agentResponses.push(marketResponse);
      if (marketResponse.recommendations) allRecommendations.push(...marketResponse.recommendations);
    }

    if (intents.earn || intents.job || intents.hustle) {
      activatedAgents.push('Side Hustle');
      const hustleResponse = sideHustleAgent.findOpportunities(userMessage);
      agentResponses.push(hustleResponse);
      if (hustleResponse.recommendations) allRecommendations.push(...hustleResponse.recommendations);
    }

    // Default: activate all agents for a comprehensive response
    if (agentResponses.length === 0) {
      activatedAgents.push('Financial', 'Lobang', 'Marketplace', 'Side Hustle');
      
      const finResponse = financialAgent.analyzeSpending();
      const lobangResponse = await lobangAgent.findDeals();
      const marketResponse = marketplaceAgent.findItems();
      const hustleResponse = sideHustleAgent.recommendBestOption();
      
      agentResponses = [finResponse, lobangResponse, marketResponse, hustleResponse];
      [finResponse, lobangResponse, marketResponse, hustleResponse].forEach(r => {
        if (r.recommendations) allRecommendations.push(...r.recommendations);
      });
    }

    // Generate orchestrated survival plan
    response = this.generateSurvivalPlan(userMessage, agentResponses, allRecommendations);

    return { response, agents: activatedAgents, recommendations: allRecommendations };
  }

  private detectIntents(message: string): Record<string, boolean> {
    return {
      financial: message.includes('broke') || message.includes('money') || message.includes('budget') || 
                 message.includes('afford') || message.includes('spend') || message.includes('expensive') ||
                 message.includes('predict') || message.includes('running out'),
      deals: message.includes('deal') || message.includes('discount') || message.includes('promotion') ||
             message.includes('cheap') || message.includes('saving'),
      food: message.includes('eat') || message.includes('food') || message.includes('lunch') || 
            message.includes('dinner') || message.includes('hungry') || message.includes('restaurant'),
      marketplace: message.includes('buy') || message.includes('sell') || message.includes('marketplace') ||
                   message.includes('textbook') || message.includes('calculator') || message.includes('lab'),
      borrow: message.includes('borrow') || message.includes('rent') || message.includes('lend') ||
              message.includes('should i buy or borrow'),
      earn: message.includes('earn') || message.includes('money') || message.includes('income') ||
            message.includes('cash') || message.includes('broke') || message.includes('no money'),
      job: message.includes('job') || message.includes('work') || message.includes('part-time') ||
           message.includes('freelance') || message.includes('gig'),
      hustle: message.includes('hustle') || message.includes('side') || message.includes('opportunity'),
    };
  }

  private generateSurvivalPlan(message: string, responses: AgentResponse[], recommendations: Recommendation[]): string {
    let plan = `🤖 **M0neyPundit Survival Plan**\n\n`;
    plan += `> "${message}"\n\n`;
    plan += `---\n\n`;

    // Group recommendations by priority
    const highImpact = recommendations.filter(r => r.impact === 'high').slice(0, 4);
    const mediumImpact = recommendations.filter(r => r.impact === 'medium').slice(0, 3);

    if (highImpact.length > 0) {
      plan += `**🔥 Top Priority Actions:**\n\n`;
      highImpact.forEach((rec, i) => {
        plan += `${i + 1}. **${rec.title}**\n`;
        plan += `   ${rec.description}\n\n`;
      });
    }

    if (mediumImpact.length > 0) {
      plan += `**📋 Additional Suggestions:**\n\n`;
      mediumImpact.forEach((rec, i) => {
        plan += `${i + 1}. **${rec.title}**\n`;
        plan += `   ${rec.description}\n\n`;
      });
    }

    // Calculate potential savings/earnings
    const savingsRecs = recommendations.filter(r => r.type === 'save' || r.type === 'deal');
    const earnRecs = recommendations.filter(r => r.type === 'job' || r.type === 'action-plan');

    if (savingsRecs.length > 0 || earnRecs.length > 0) {
      plan += `---\n\n`;
      plan += `**💡 Impact Summary:**\n`;
      
      if (savingsRecs.length > 0) {
        plan += `• ${savingsRecs.length} way(s) to save money\n`;
      }
      if (earnRecs.length > 0) {
        plan += `• ${earnRecs.length} income opportunity(ies) found\n`;
      }
      
      plan += `\n🎯 **Your personalized survival plan is ready!**`;
    }

    // Add agent attribution
    plan += `\n---\n\n*Powered by Financial Agent, Lobang Agent, Marketplace Agent & Side Hustle Agent*`;

    return plan;
  }
}