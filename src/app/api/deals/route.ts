import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { deals as seedDeals } from '@/lib/seed-data';

export const dynamic = 'force-dynamic';

// Helper: Map snake_case Supabase columns to camelCase for frontend
function mapDeal(d: any) {
  return {
    id: d.id,
    telegram_id: d.telegram_id,
    channel_id: d.channel_id,
    title: d.title,
    description: d.description,
    discount: d.discount,
    category: d.category,
    merchant: d.merchant,
    location: d.location,
    expiry_date: d.expiry_date,
    url: d.url,
    image_url: d.image_url,
    is_popular: d.is_popular,
    raw_text: d.raw_text,
    matched_keywords: d.matched_keywords,
    synced_at: d.synced_at,
    created_at: d.created_at,
  };
}

// GET /api/deals - Fetch deals with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category');
    const merchant = searchParams.get('merchant');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('skip') || '0');
    const sort = searchParams.get('sort') || '-created_at';

    // Build query - use explicit column list for count header
    let query = supabase
      .from('deals')
      .select('*', { count: 'exact' });

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (merchant) {
      query = query.ilike('merchant', `%${merchant}%`);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting - handle camelCase to snake_case mapping
    let sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortOrder = sort.startsWith('-') ? 'desc' : 'asc';
    
    // Map common camelCase field names to snake_case
    const fieldMap: Record<string, string> = {
      isPopular: 'is_popular',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      syncedAt: 'synced_at',
      expiryDate: 'expiry_date',
      imageUrl: 'image_url',
    };
    sortField = fieldMap[sortField] || sortField;
    
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.limit(limit).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error, falling back to seed data:', error);
      return NextResponse.json({
        deals: seedDeals.slice(0, limit).map(d => ({
          ...d,
          _id: d.id,
          isPopular: d.isPopular,
        })),
        pagination: {
          total: seedDeals.length,
          limit,
          skip: offset,
          hasMore: offset + limit < seedDeals.length,
        },
        fallback: true,
      });
    }

    // Map snake_case to the format frontend expects
    const mappedDeals = (data || []).map(mapDeal);

    return NextResponse.json({
      deals: mappedDeals,
      pagination: {
        total: count || 0,
        limit,
        skip: offset,
        hasMore: (offset || 0) + (data?.length || 0) < (count || 0),
      },
    });
  } catch (error) {
    console.error('Failed to fetch deals:', error);
    // Fallback to seed data on any error
    return NextResponse.json({
      deals: seedDeals.slice(0, 20).map(d => ({
        ...d,
        _id: d.id,
        isPopular: d.isPopular,
      })),
      pagination: {
        total: seedDeals.length,
        limit: 20,
        skip: 0,
        hasMore: false,
      },
      fallback: true,
    });
  }
}
