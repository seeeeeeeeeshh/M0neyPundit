/**
 * Telegram message parser for extracting structured deal data
 * from raw text messages posted by @goodlobang channel
 */

export interface ParsedDeal {
  title: string;
  description: string;
  discount: string;
  category: 'food' | 'tech' | 'events' | 'transport' | 'other';
  merchant?: string;
  location?: string;
  expiryDate?: string;
  url?: string;
  imageUrl?: string;
  isPopular: boolean;
  matchedKeywords: string[];
}

// Keywords for category detection
const CATEGORY_KEYWORDS = {
  food: ['food', 'eat', 'lunch', 'dinner', 'breakfast', 'coffee', 'tea', 'burger', 'rice', 'noodle', 'pizza', 'cake', 'dessert', 'snack', 'drink', 'bubble tea', 'char kway teow', 'hawker', 'restaurant', 'cafe', 'mcdonald', 'kfc', 'subway', 'starbucks', 'domino', 'pizza hut', 'local', 'buffet', 'set meal', 'combo', 'promo', 'discount', '% off', 'buy 1', '2 for 1', 'half price', 'free', 'value meal', 'meal deal'],
  tech: ['tech', 'printer', 'printing', 'laptop', 'phone', 'charger', 'usb', 'cable', 'software', 'app', 'ebook', 'course', 'tutorial', 'webinar', 'tech', 'gadget', 'electronics', 'mouse', 'keyboard', 'monitor'],
  events: ['event', 'workshop', 'seminar', 'talk', 'networking', 'freebie', 'giveaway', 'contest', 'competition', 'party', 'concert', 'festival', 'expo', 'launch', 'meetup', 'community', 'volunteer'],
  transport: ['transport', 'bus', 'train', 'Grab', 'gojek', 'taxi', 'ride', 'shuttle', 'parking', 'petrol', 'fuel', 'ocar', 'ez-link', ' MRT', 'LRT', 'changi', 'airport'],
};

// Keywords for popularity detection
const POPULAR_KEYWORDS = ['hot', 'trending', 'popular', 'limited', 'flash sale', 'today only', 'last day', 'hurry', 'don\'t miss', 'must try', 'student fav', 'campus favorite', 'best deal', 'top pick'];

// Regex patterns for extracting structured data
const PATTERNS = {
  // Discount patterns: "50% off", "$2 off", "Buy 1 Get 1 Free", "Half Price"
  discount: /(\d+%?\s*(?:off|OFF)|(?:buy\s*\d+\s*get\s*\d+|b1g1)[\s-]*(?:free|FREEDISCOUNT)|half[\s-]?price|2\s*for\s*[\$\d]+|[\$\d]+\s*(?:for|and)\s*[\$\d]+)/gi,
  
  // Price patterns: "$3.50", "S$5", "5 dollars"
  price: /(?:\$|S\$|sgd|dollars?)\s*\d+(?:\.\d{2})?/gi,
  
  // Location patterns: "NUS", "NTU", "SMU", "polytechnic", "Jurong", "Bugis", "Orchard"
  location: /(NUS|NTU|SMU|poly|jurong|bugis|orchard|marina\s*bay|chinatown|little\s*india|woodlands|yishun|sembawang|tampines|bedok|pasir\s*ris|ang\s*moh\s*foo|clementi|toa\s*payoh|queenstown|bukit\s*timah|serangoon|sengkang|punggol|changi|kallang|roban|massi|geylang|potong\s*pasir|hougang|bulim|simei|tanglin|river\s*valley|one\s*fullerton|shenton\s*way|city\s*hall|napier|lockman|outram\s*park|duro|promenade|clarter|orange\s*teal|purple|green\s*line|red\s*line|circle\s*line|thomson|east\s*west)\b/i,
  
  // Merchant patterns (common Singapore student merchants)
  merchant: /(starbucks|mcdonald|kfc|subway|dominos|pizza\s*hut|burger\s*king|chick\-*fil\-*a|wendy's|texas\s*petite|jollibee|mos\s*burger|family\s*mart|7-eleven|cold\s*storage|fairprice|\*price\s*champion|sheng\s*siong|giant|hs\b|changi\s*airport|takashimaya|ion\s*orchard|paragon|plaza\s*sen\s*so|\*vivocity|bugis\s*junction|lum\s*chian|suntec|guoco\s*tower|mapletree|ocbc\s*center|uob\s*plaza|sea\s*ports\s*centre)/i,
  
  // URL patterns
  url: /(https?:\/\/[^\s<]+)/i,
  
  // Image patterns (Telegram image links)
  imageUrl: /(https?:\/\/[^"\s]+\.(?:jpg|jpeg|png|webp|gif))/i,
  
  // Expiry date patterns: "until 31 Dec", "ends Jan 15", "valid till 2024"
  expiry: /(until|ends?|valid[\s-]*(?:till|til|until|through))\s+(\d{1,2}(?:st|nd|rd|th)?(?:\s*)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)?\s*\d{2,4})/gi,
};

/**
 * Detect deal category from message text
 */
function detectCategory(text: string): 'food' | 'tech' | 'events' | 'transport' | 'other' {
  const lowerText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return category as 'food' | 'tech' | 'events' | 'transport' | 'other';
      }
    }
  }
  
  return 'other';
}

/**
 * Check if a deal should be marked as popular
 */
function isPopularDeal(text: string): boolean {
  const lowerText = text.toLowerCase();
  return POPULAR_KEYWORDS.some((kw) => lowerText.includes(kw.toLowerCase()));
}

/**
 * Extract discount info from text
 */
function extractDiscount(text: string): string {
  const match = text.match(PATTERNS.discount);
  if (match && match.length > 0) {
    return match[0];
  }
  return '';
}

/**
 * Extract URL from text
 */
function extractUrl(text: string): string | undefined {
  const match = text.match(PATTERNS.url);
  return match?.[0];
}

/**
 * Extract image URL from text
 */
function extractImageUrl(text: string): string | undefined {
  const match = text.match(PATTERNS.imageUrl);
  return match?.[0];
}

/**
 * Extract location from text
 */
function extractLocation(text: string): string | undefined {
  const match = text.match(PATTERNS.location);
  return match?.[0];
}

/**
 * Extract merchant from text
 */
function extractMerchant(text: string): string | undefined {
  const match = text.match(PATTERNS.merchant);
  return match?.[0];
}

/**
 * Extract expiry date from text
 */
function extractExpiryDate(text: string): string | undefined {
  const match = text.match(PATTERNS.expiry);
  if (match && match.length > 0) {
    // Return just the date part (second capture group)
    const dateMatch = text.match(/(?:until|ends?|valid[\s-]*(?:till|til|until|through))\s+(\d+)/i);
    return dateMatch?.[1];
  }
  return undefined;
}

/**
 * Generate a deal title from the message
 * Takes the first meaningful line or a truncated version of the message
 */
function generateTitle(rawText: string, category: string): string {
  const lines = rawText.split('\n').filter((line) => line.trim().length > 0);
  
  if (lines.length > 0) {
    // Take the first line as title, truncate if too long
    let title = lines[0].trim();
    if (title.length > 80) {
      title = title.substring(0, 77) + '...';
    }
    return title;
  }
  
  // Fallback: generate from category
  return `${category.charAt(0).toUpperCase() + category.slice(1)} Deal`;
}

/**
 * Extract matched keywords for debugging/analytics
 */
function extractMatchedKeywords(text: string): string[] {
  const matched: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matched.push(keyword);
      }
    }
  }
  
  // Add popular keywords if detected
  if (isPopularDeal(text)) {
    matched.push('popular');
  }
  
  return matched;
}

/**
 * Main parser function - extracts structured deal data from raw Telegram message text
 */
export function parseTelegramDeal(rawText: string, telegramId: string): ParsedDeal {
  const category = detectCategory(rawText);
  const discount = extractDiscount(rawText);
  const title = generateTitle(rawText, category);
  
  return {
    title,
    description: rawText,
    discount: discount || 'Check deal',
    category,
    merchant: extractMerchant(rawText),
    location: extractLocation(rawText),
    expiryDate: extractExpiryDate(rawText),
    url: extractUrl(rawText),
    imageUrl: extractImageUrl(rawText),
    isPopular: isPopularDeal(rawText),
    matchedKeywords: extractMatchedKeywords(rawText),
  };
}

/**
 * Clean up Telegram message formatting (remove emojis, extra whitespace, etc.)
 */
export function cleanTelegramMessage(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Remove excessive blank lines
    .trim();
}