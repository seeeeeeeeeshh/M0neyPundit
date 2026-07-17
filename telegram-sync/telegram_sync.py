"""
Telegram Sync Service
Continuously syncs messages from multiple Telegram channels to Supabase.
Uses Telethon (MTProto) with personal account authentication.
"""

import os
import re
import sys
import time
import json
import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from telethon import TelegramClient, events
from telethon.errors import SessionPasswordNeededError
import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('telegram_sync.log', encoding='utf-8'),
    ],
)
logger = logging.getLogger('telegram-sync')


# ─── Load Environment ────────────────────────────────────────────────
load_dotenv()

TELEGRAM_API_ID = os.getenv('TELEGRAM_API_ID')
TELEGRAM_API_HASH = os.getenv('TELEGRAM_API_HASH')
TELEGRAM_PHONE = os.getenv('TELEGRAM_PHONE', '+6581275741')

# Support both single channel and multiple channels
TELEGRAM_CHANNEL = os.getenv('TELEGRAM_CHANNEL', '@goodlobang')
TELEGRAM_CHANNELS_RAW = os.getenv('TELEGRAM_CHANNELS', TELEGRAM_CHANNEL)

# Parse channels: support comma-separated or single channel
TELEGRAM_CHANNELS = [
    c.strip() for c in TELEGRAM_CHANNELS_RAW.split(',') if c.strip()
]

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
SESSION_FILE = os.getenv('SESSION_FILE', 'goodlobang.session')
SYNC_MESSAGE_LIMIT = int(os.getenv('SYNC_MESSAGE_LIMIT', '100'))
SYNC_INTERVAL = int(os.getenv('SYNC_INTERVAL_SECONDS', '3600'))

# Validate required env vars
if not TELEGRAM_API_ID or not TELEGRAM_API_HASH:
    logger.error(
        "Missing TELEGRAM_API_ID or TELEGRAM_API_HASH. "
        "Get them from https://my.telegram.org"
    )
    sys.exit(1)

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    logger.warning(
        "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. "
        "Deals will be logged only (no DB storage)."
    )


# ─── Category Detection ─────────────────────────────────────────────
CATEGORY_KEYWORDS = {
    'food': [
        'food', 'eat', 'lunch', 'dinner', 'breakfast', 'coffee', 'tea',
        'burger', 'rice', 'noodle', 'pizza', 'cake', 'dessert', 'snack',
        'drink', 'bubble tea', 'hawker', 'restaurant', 'cafe', 'mcdonald',
        'kfc', 'subway', 'starbucks', 'domino', 'pizza hut', 'buffet',
        'set meal', 'combo', 'promo', 'discount', '% off', 'buy 1',
        '2 for 1', 'half price', 'free', 'value meal', 'meal deal',
        'char kway teow', 'kopitiam', 'mamak', 'curry', 'laksa', 'nasi',
        'teh', 'coffee', 'sandwich', 'wrap', 'salad', 'pasta', 'sushi',
    ],
    'tech': [
        'printer', 'printing', 'laptop', 'phone', 'charger', 'usb', 'cable',
        'software', 'app', 'ebook', 'course', 'tutorial', 'webinar',
        'gadget', 'electronics', 'mouse', 'keyboard', 'monitor', 'tech',
    ],
    'events': [
        'event', 'workshop', 'seminar', 'talk', 'networking', 'freebie',
        'giveaway', 'contest', 'competition', 'party', 'concert',
        'festival', 'expo', 'launch', 'meetup', 'community', 'volunteer',
    ],
    'transport': [
        'transport', 'bus', 'train', 'grab', 'taxi', 'ride', 'shuttle',
        'parking', 'petrol', 'fuel', 'ocar', 'ez-link', 'mrt', 'lrt',
        'changi', 'airport',
    ],
}

POPULAR_KEYWORDS = [
    'hot', 'trending', 'popular', 'limited', 'flash sale', 'today only',
    'last day', 'hurry', "don't miss", 'must try', 'student fav',
    'campus favorite', 'best deal', 'top pick',
]

# Common Singapore locations
LOCATION_KEYWORDS = [
    'nus', 'ntu', 'smu', 'poly', 'jurong', 'bugis', 'orchard',
    'marina bay', 'chinatown', 'little india', 'woodlands', 'yishun',
    'tampines', 'bedok', 'passir ris', 'clementi', 'toa payoh',
    'queenstown', 'bukit timah', 'serangoon', 'sengkang', 'punggol',
    'changi', 'kallang', 'geylang', 'potong pasir', 'hougang',
    'bulim', 'simei', 'tanglin', 'river valley', 'one fullerton',
    'shenton way', 'city hall', 'vivocity', 'ion orchard', 'paragon',
    'plaza senoso', 'bugis junction', 'suntec', 'takashimaya',
]

# Common Singapore merchants
MERCHANT_KEYWORDS = [
    'starbucks', 'mcdonald', 'kfc', 'subway', 'dominos', 'pizza hut',
    'burger king', 'chick-fil-a', 'jollibee', 'mos burger',
    'family mart', '7-eleven', 'cold storage', 'fairprice',
    'price champion', 'sheng siong', 'giant', 'changi airport',
    'takashimaya', 'ion orchard', 'paragon', 'vivocity',
    'bugis junction', 'suntec',
]

# Hustle/Job keywords for detecting freelance/part-time gigs
HUSTLE_KEYWORDS = {
    'hiring': ['hiring', 'hire', 'need someone', 'looking for', 'seeking', 'recruiting', 'vacancy', 'position available'],
    'part-time': ['part-time', 'part time', 'part timer', 'PT', 'evening shift', 'weekend shift', 'after-school'],
    'freelance': ['freelance', 'freelancer', 'freelancing', 'contract work', 'project-based', 'project based'],
    'tutoring': ['tutor', 'tuition', 'teaching', 'lessons', 'teach', 'tutoring', 'private tutor', 'academic'],
    'full-time': ['full-time', 'full time', 'FT', 'permanent', 'employment', 'career'],
    'internship': ['internship', 'intern', 'attachment', 'OJT', 'on-the-job'],
    'gig': ['gig', 'gigs', 'side hustle', 'side-hustle', 'side income', 'extra cash', 'quick money'],
    'remote': ['remote', 'work from home', 'wfh', 'wfh', 'online', 'virtual', 'home-based'],
    'paid-opportunity': ['paid', 'earn', 'income', 'salary', 'pay', '$', 'rates', 'rate', 'commission', 'stipend', 'allowance'],
}

# Hustle subcategories
HUSTLE_CATEGORIES = [
    'tutoring', 'freelance', 'part-time', 'full-time', 'internship', 'gig', 'remote', 'event-staff', 'delivery', 'admin'
]

# Pay rate patterns
PAY_PATTERNS = [
    r'\$(\d+\.?\d*)\s*(?:\/|per)\s*(?:hr|hour|hourly)',
    r'\$(\d+\.?\d*)\s*(?:to|–|-)\s*\$(\d+\.?\d*)\s*(?:\/|per)?\s*(?:hr|hour|hourly)?',
    r'(?:pay|rate|salary|earn(?:ing)?)\s*(?:of\s*)?\$?(\d+\.?\d*)',
    r'\$(\d+\.?\d*)\s*(?:\/|per)\s*(?:day|month|week)',
    r'(\d+\.?\d*)\s*(?:per|\/)\s*(?:hr|hour|hourly)',
    r'from\s*\$?(\d+\.?\d*)',
    r'up\s*to\s*\$?(\d+\.?\d*)',
]


def detect_category(text: str) -> str:
    """Detect deal category from message text."""
    lower_text = text.lower()
    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in lower_text)
        scores[category] = score
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else 'other'


def is_popular_deal(text: str) -> bool:
    """Check if deal should be marked as popular."""
    lower_text = text.lower()
    return any(kw in lower_text for kw in POPULAR_KEYWORDS)


def extract_discount(text: str) -> str:
    """Extract discount info from text."""
    patterns = [
        r'(\d+%?\s*(?:off|OFF))',
        r'(?:buy\s*\d+\s*get\s*\d+(?:\s*free)?)',
        r'(half[\s-]?price)',
        r'(2\s*for\s*[\$\d]+)',
        r'([\$\d]+\s*(?:for|and)\s*[\$\d]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    return ''


def extract_url(text: str) -> str | None:
    """Extract URL from text."""
    match = re.search(r'(https?://[^\s<]+)', text)
    return match.group(1) if match else None


def extract_image_url(text: str) -> str | None:
    """Extract image URL from text."""
    match = re.search(r'(https?://[^\s"<]+\.(?:jpg|jpeg|png|webp|gif))', text)
    return match.group(1) if match else None


def extract_location(text: str) -> str | None:
    """Extract location from text."""
    lower_text = text.lower()
    for loc in LOCATION_KEYWORDS:
        if loc in lower_text:
            return loc.title()
    return None


def extract_merchant(text: str) -> str | None:
    """Extract merchant from text."""
    lower_text = text.lower()
    for merchant in MERCHANT_KEYWORDS:
        if merchant.lower() in lower_text:
            return merchant
    return None


def extract_expiry_date(text: str) -> str | None:
    """Extract expiry date from text."""
    patterns = [
        r'(?:until|ends?|valid[\s-]*(?:till|til|until|through))\s+(\d{1,2}(?:st|nd|rd|th)?(?:\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:ember|uary)?\s*\d{2,4})?)',
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'(\d{4}-\d{2}-\d{2})',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None


def is_hustle_post(text: str) -> bool:
    """Check if a message is a hustle/job posting."""
    lower_text = text.lower()
    for category, keywords in HUSTLE_KEYWORDS.items():
        for kw in keywords:
            if kw in lower_text:
                return True
    return False


def detect_hustle_subcategory(text: str) -> str:
    """Detect the type of hustle from message text."""
    lower_text = text.lower()
    scores = {}
    for category, keywords in HUSTLE_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in lower_text)
        scores[category] = score
    best = max(scores, key=scores.get)
    return best if scores.get(best, 0) > 0 else 'other'


def extract_pay_rate(text: str) -> str | None:
    """Extract pay rate information from text."""
    lower_text = text.lower()
    for pattern in PAY_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            groups = match.groups()
            if len(groups) >= 2:
                return f"${groups[0]} - ${groups[1]}"
            return f"${match.group(1)}"
    # Check for common phrases
    if 'negotiable' in lower_text:
        return 'Negotiable'
    if 'commission' in lower_text:
        return 'Commission-based'
    if 'free' in lower_text and ('learn' in lower_text or 'experience' in lower_text):
        return 'Unpaid (with experience)'
    return None


def extract_job_deadline(text: str) -> str | None:
    """Extract application deadline from text."""
    patterns = [
        r'(?:apply|deadline|last\s*(?:day|date)|before|by)\s+(?:the\s+)?(\d{1,2}(?:st|nd|rd|th)?(?:\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:ember|uary)?\s*\d{2,4})?)',
        r'(?:until|till|through)\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'(\d{4}-\d{2}-\d{2})',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None


def extract_contact_info(text: str) -> str | None:
    """Extract contact information (email, WhatsApp, etc)."""
    # Email
    email_match = re.search(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', text)
    if email_match:
        return email_match.group(1)
    # WhatsApp link
    wa_match = re.search(r'(wa\.me/[^\s]+)', text)
    if wa_match:
        return wa_match.group(1)
    # Telegram username
    tg_match = re.search(r'(@[\w_]+)', text)
    if tg_match:
        return tg_match.group(1)
    return None


def generate_hustle_title(raw_text: str) -> str:
    """Generate a hustle/job title from the message."""
    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
    if lines:
        title = lines[0]
        # Clean up title - remove emojis, markdown, and extra formatting
        title = clean_markdown(title)
        title = remove_emoji_decorations(title)
        title = re.sub(r'[\U0001F000-\U0001F9FF]', '', title).strip()
        if len(title) > 100:
            title = title[:97] + '...'
        return title or 'Job Opportunity'
    return 'Job Opportunity'


def clean_markdown(text: str) -> str:
    """Remove markdown formatting characters from text."""
    if not text:
        return ''
    # Remove bold/italic markers (**, __, _)
    text = re.sub(r'\*\*', '', text)
    text = re.sub(r'__', '', text)
    text = re.sub(r'\*', '', text)
    text = re.sub(r'(?<!\w)_(?!\w)', '', text)  # standalone underscores not adjacent to word chars
    # Remove leading/trailing special characters that are used as decoration
    text = re.sub(r'^[!"#$%&\'()*+,./:;<=>?@\[\\\]^`{|}~\s]+', '', text)
    text = re.sub(r'[!"#$%&\'()*+,./:;<=>?@\[\\\]^`{|}~\s]+$', '', text)
    return text.strip()


def remove_emoji_decorations(text: str) -> str:
    """Remove repeated emoji decorations from title."""
    if not text:
        return text
    # Remove leading/trailing emojis and decorative characters
    text = re.sub(r'^[\U0001F000-\U0001F9FF\u2600-\u26FF\u2700-\u27BF\s]+', '', text)
    text = re.sub(r'[\U0001F000-\U0001F9FF\u2600-\u26FF\u2700-\u27BF\s]+$', '', text)
    return text.strip()


def generate_title(raw_text: str, category: str) -> str:
    """Generate a deal title from the message."""
    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
    if lines:
        title = lines[0]
        # Clean markdown and emoji decorations
        title = clean_markdown(title)
        title = remove_emoji_decorations(title)
        if len(title) > 80:
            title = title[:77] + '...'
        return title or f"{category.capitalize()} Deal"
    return f"{category.capitalize()} Deal"


def make_unique_telegram_id(channel_id: str, message_id: str) -> str:
    """Create a unique telegram_id combining channel and message ID."""
    return f"{channel_id}:{message_id}"


def clean_description(raw_text: str) -> str:
    """Clean the description by removing the title line and arrow chains."""
    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
    if not lines:
        return ''

    # Skip the first line (it's the title)
    body_lines = lines[1:] if len(lines) > 1 else []

    if not body_lines:
        return ''

    # Join remaining lines and clean up arrow chains (➡️)
    description = '\n'.join(body_lines)

    # Remove arrow chains and their content (e.g., "➡️ $5++ Moutai Lala Soup Base Add-on")
    description = re.sub(r'\s*➡️\s*[^\n]*', '', description)
    description = re.sub(r'\s*→\s*[^\n]*', '', description)
    description = re.sub(r'\s*->\s*[^\n]*', '', description)

    # Clean markdown from description too
    description = clean_markdown(description)

    # Strip leading/trailing whitespace
    description = description.strip()

    return description


def parse_telegram_message(message_text: str, telegram_id: str, channel_source: str) -> dict:
    """Parse a Telegram message into a structured deal dict (Supabase format)."""
    category = detect_category(message_text)
    discount = extract_discount(message_text)
    title = generate_title(message_text, category)
    description = clean_description(message_text)

    # Extract matched keywords for analytics
    matched_keywords = []
    lower_text = message_text.lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in lower_text:
                matched_keywords.append(kw)
    if is_popular_deal(message_text):
        matched_keywords.append('popular')

    return {
        'telegram_id': make_unique_telegram_id(channel_source, telegram_id),
        'channel_id': channel_source,
        'title': title,
        'description': description if description else 'Check out this deal!',
        'discount': discount or 'Check deal',
        'category': category,
        'merchant': extract_merchant(message_text),
        'location': extract_location(message_text),
        'expiry_date': extract_expiry_date(message_text),
        'url': extract_url(message_text),
        'image_url': extract_image_url(message_text),
        'is_popular': is_popular_deal(message_text),
        'raw_text': message_text,
        'matched_keywords': matched_keywords,
        'synced_at': datetime.now(timezone.utc).isoformat(),
        'created_at': datetime.now(timezone.utc).isoformat(),
    }


def parse_hustle_message(message_text: str, telegram_id: str, channel_source: str) -> dict:
    """Parse a Telegram message into a structured hustle dict (Supabase format)."""
    hustle_type = detect_hustle_subcategory(message_text)
    title = generate_hustle_title(message_text)
    pay_rate = extract_pay_rate(message_text)
    deadline = extract_job_deadline(message_text)
    contact = extract_contact_info(message_text)
    url = extract_url(message_text) or contact
    description = clean_description(message_text)
    
    # Extract matched keywords for analytics
    matched_keywords = []
    lower_text = message_text.lower()
    for cat, keywords in HUSTLE_KEYWORDS.items():
        for kw in keywords:
            if kw in lower_text:
                matched_keywords.append(kw)

    return {
        'telegram_id': make_unique_telegram_id(channel_source, telegram_id),
        'channel_id': channel_source,
        'title': title,
        'description': description if description else 'Check out this opportunity!',
        'category': hustle_type,
        'pay_rate': pay_rate or 'See posting',
        'deadline': deadline,
        'contact': contact,
        'url': url,
        'location': extract_location(message_text),
        'is_popular': any(kw in lower_text for kw in ['urgent', 'immediately', 'quick hire', 'now']),
        'raw_text': message_text,
        'matched_keywords': matched_keywords,
        'synced_at': datetime.now(timezone.utc).isoformat(),
        'created_at': datetime.now(timezone.utc).isoformat(),
    }


# ─── Supabase Storage ───────────────────────────────────────────────

def get_supabase_headers():
    """Get headers for Supabase API calls."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None
    return {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
    }


def save_deal_to_supabase(deal_data: dict) -> bool:
    """Save a deal to Supabase using upsert. Returns True if saved."""
    headers = get_supabase_headers()
    if not headers:
        logger.info(f"[DRY RUN] Would save deal: {deal_data['title']}")
        return True

    url = f"{SUPABASE_URL}/rest/v1/deals?on_conflict=telegram_id"

    try:
        response = httpx.post(
            url,
            json=[deal_data],
            headers=headers,
            timeout=30.0,
        )

        if response.status_code in (200, 201):
            return True
        else:
            logger.error(f"Failed to save deal: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error saving deal to Supabase: {e}")
        return False


def save_hustle_to_supabase(hustle_data: dict) -> bool:
    """Save a hustle to Supabase using upsert. Returns True if saved."""
    headers = get_supabase_headers()
    if not headers:
        logger.info(f"[DRY RUN] Would save hustle: {hustle_data['title']}")
        return True

    url = f"{SUPABASE_URL}/rest/v1/hustles?on_conflict=telegram_id"

    try:
        response = httpx.post(
            url,
            json=[hustle_data],
            headers=headers,
            timeout=30.0,
        )

        if response.status_code in (200, 201):
            return True
        else:
            logger.error(f"Failed to save hustle: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error saving hustle to Supabase: {e}")
        return False


def get_last_synced_ids_supabase(table: str = 'deals') -> dict:
    """Get the highest telegram message ID already synced per channel."""
    headers = get_supabase_headers()
    if not headers:
        return {}

    url = f"{SUPABASE_URL}/rest/v1/{table}?select=telegram_id,channel_id&order=telegram_id.desc"

    try:
        response = httpx.get(url, headers=headers, timeout=30.0)
        if response.status_code == 200:
            data = response.json()
            # Find max ID per channel
            channel_max_ids = {}
            for item in data:
                tid = item.get('telegram_id', '')
                cid = item.get('channel_id', '')
                if ':' in str(tid):
                    # Parse channel:message format
                    parts = str(tid).split(':', 1)
                    if len(parts) == 2:
                        ch, msg_id = parts
                        if ch not in channel_max_ids or int(msg_id) > int(channel_max_ids[ch]):
                            channel_max_ids[ch] = msg_id
            return channel_max_ids
    except Exception as e:
        logger.error(f"Failed to get last synced IDs: {e}")
    return {}


# ─── Telegram Client ────────────────────────────────────────────────

class TelegramSyncService:
    """Manages Telegram connection and message syncing."""

    def __init__(self):
        self.client: TelegramClient | None = None
        self.running = False

    async def connect_telegram(self):
        """Connect to Telegram using MTProto with personal account."""
        logger.info(f"Connecting to Telegram as {TELEGRAM_PHONE}...")

        self.client = TelegramClient(
            SESSION_FILE,
            int(TELEGRAM_API_ID),
            TELEGRAM_API_HASH,
            retry_delay=2,
        )

        if not self.client.is_connected():
            await self.client.connect()

        # Check if already authorized
        if not await self.client.is_user_authorized():
            logger.info("Not authorized. Sending OTP code...")
            await self.client.send_code_request(TELEGRAM_PHONE)

            try:
                code = input("Enter the code Telegram sent you: ").strip()
                await self.client.sign_in(TELEGRAM_PHONE, code)
            except TimeoutError:
                logger.error("Code input timed out. Run the script again.")
                sys.exit(1)
            except SessionPasswordNeededError:
                # 2FA enabled
                password = input("Enter your 2FA password: ").strip()
                await self.client.sign_in(password=password)

        logger.info("Telegram connected successfully!")

    async def fetch_and_store_deals_for_channel(self, channel: str, last_id: int | None = None):
        """Fetch messages from a specific channel and store in Supabase."""
        if not self.client:
            return 0

        logger.info(f"Fetching deals from {channel}...")

        try:
            # Resolve channel entity
            channel_entity = await self.client.get_entity(channel)
            logger.info(f"Found channel: {channel_entity.title}")

            # Get all messages for this channel
            all_messages = await self.client.get_messages(
                channel_entity,
                limit=SYNC_MESSAGE_LIMIT + 50,
            )
            messages = list(all_messages) if all_messages else []

            # Filter by last synced ID if available
            if last_id:
                messages = [m for m in messages if m.id > last_id]

            if not messages:
                logger.info(f"No new messages from {channel} since last sync.")
                return 0

            logger.info(f"Found {len(messages)} new messages to process from {channel}.")

            saved_count = 0
            skipped_count = 0
            error_count = 0

            for msg in reversed(messages):  # Process oldest first
                try:
                    if not msg.text:
                        skipped_count += 1
                        continue

                    deal_data = parse_telegram_message(
                        msg.text,
                        str(msg.id),
                        channel.lstrip('@'),
                    )
                    
                    # Handle nullable date
                    if msg.date:
                        deal_data['created_at'] = msg.date.replace(tzinfo=timezone.utc).isoformat()
                    else:
                        deal_data['created_at'] = datetime.now(timezone.utc).isoformat()

                    if save_deal_to_supabase(deal_data):
                        saved_count += 1
                    else:
                        skipped_count += 1
                        
                except Exception as msg_error:
                    error_count += 1
                    logger.debug(f"Error processing message {msg.id} from {channel}: {msg_error}")
                    continue

            logger.info(
                f"Sync from {channel} complete. Saved: {saved_count}, Skipped (duplicates): {skipped_count}, Errors: {error_count}"
            )
            return saved_count

        except Exception as e:
            logger.error(f"Error fetching messages from {channel}: {e}")
            return 0

    async def fetch_and_store_hustles_for_channel(self, channel: str, last_id: int | None = None):
        """Fetch hustle messages from a specific channel and store in Supabase."""
        if not self.client:
            return 0

        logger.info(f"Fetching hustles from {channel}...")

        try:
            # Resolve channel entity
            channel_entity = await self.client.get_entity(channel)
            logger.info(f"Found channel: {channel_entity.title}")

            # Get all messages for this channel
            all_messages = await self.client.get_messages(
                channel_entity,
                limit=SYNC_MESSAGE_LIMIT + 50,
            )
            messages = list(all_messages) if all_messages else []

            # Filter by last synced ID if available
            if last_id:
                messages = [m for m in messages if m.id > last_id]

            if not messages:
                logger.info(f"No new hustle messages from {channel} since last sync.")
                return 0

            logger.info(f"Found {len(messages)} new messages to process from {channel}.")

            saved_count = 0
            skipped_count = 0
            error_count = 0

            for msg in reversed(messages):  # Process oldest first
                try:
                    if not msg.text:
                        skipped_count += 1
                        continue

                    # Only process if it's a hustle post
                    if not is_hustle_post(msg.text):
                        skipped_count += 1
                        continue

                    hustle_data = parse_hustle_message(
                        msg.text,
                        str(msg.id),
                        channel.lstrip('@'),
                    )
                    
                    # Handle nullable date
                    if msg.date:
                        hustle_data['created_at'] = msg.date.replace(tzinfo=timezone.utc).isoformat()
                    else:
                        hustle_data['created_at'] = datetime.now(timezone.utc).isoformat()

                    if save_hustle_to_supabase(hustle_data):
                        saved_count += 1
                    else:
                        skipped_count += 1
                        
                except Exception as msg_error:
                    error_count += 1
                    logger.debug(f"Error processing message {msg.id} from {channel}: {msg_error}")
                    continue

            logger.info(
                f"Hustle sync from {channel} complete. Saved: {saved_count}, Skipped (non-hustle): {skipped_count}, Errors: {error_count}"
            )
            return saved_count

        except Exception as e:
            logger.error(f"Error fetching hustle messages from {channel}: {e}")
            return 0

    async def sync_all_channels(self, from_ids: dict | None = None):
        """Sync deals from all configured channels."""
        if from_ids is None:
            from_ids = {}

        total_saved = 0
        for channel in TELEGRAM_CHANNELS:
            channel_name = channel.lstrip('@')
            last_id = int(from_ids.get(channel_name, 0)) if from_ids else None
            
            # Sync deals
            saved = await self.fetch_and_store_deals_for_channel(channel, last_id)
            total_saved += saved
            
            # Sync hustles from channels that might have hustle posts
            if channel_name == 'sgfreelancing':
                hustle_saved = await self.fetch_and_store_hustles_for_channel(channel, last_id)
                total_saved += hustle_saved

        logger.info(f"Total deals saved across all channels: {total_saved}")

    async def start_continuous_sync(self):
        """Start continuous syncing with interval."""
        await self.connect_telegram()

        # Get last synced IDs per channel
        last_ids = get_last_synced_ids_supabase()
        for ch, mid in last_ids.items():
            logger.info(f"Channel @{ch}: last synced message ID {mid}")

        # Initial sync
        await self.sync_all_channels(from_ids=last_ids)

        logger.info(f"Starting continuous sync (interval: {SYNC_INTERVAL}s)...")
        logger.info("Press Ctrl+C to stop.")

        # Also do periodic full syncs
        self.running = True
        try:
            while self.running:
                await asyncio.sleep(SYNC_INTERVAL)
                if self.client and self.client.is_connected():
                    last_ids = get_last_synced_ids_supabase()
                    await self.sync_all_channels(from_ids=last_ids)
        except KeyboardInterrupt:
            logger.info("Stopping sync service...")
            self.running = False

    async def sync_once(self):
        """Perform a single sync (for on-demand use)."""
        await self.connect_telegram()

        last_ids = get_last_synced_ids_supabase()
        for ch, mid in last_ids.items():
            logger.info(f"Channel @{ch}: last synced message ID {mid}")

        await self.sync_all_channels(from_ids=last_ids)

        if self.client:
            await self.client.disconnect()


# ─── Main Entry Point ───────────────────────────────────────────────

async def async_main():
    """Async main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description='Telegram to Supabase Sync Service')
    parser.add_argument(
        '--once',
        action='store_true',
        help='Perform a single sync and exit (for on-demand use)',
    )
    parser.add_argument(
        '--daemon',
        action='store_true',
        help='Run in daemon mode with continuous sync',
    )
    args = parser.parse_args()

    service = TelegramSyncService()

    if args.once:
        # Single sync mode (called via API)
        await service.sync_once()
    elif args.daemon:
        # Continuous sync mode
        await service.start_continuous_sync()
    else:
        # Default: continuous sync
        await service.start_continuous_sync()


if __name__ == '__main__':
    asyncio.run(async_main())