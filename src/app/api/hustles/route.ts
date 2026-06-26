import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sideHustles } from '@/lib/seed-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sortBy') || 'pay_rate';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Fetch hustles from Supabase
    let query = supabase
      .from('hustles')
      .select('*', { count: 'exact' })
      .order('is_popular', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: dbHustles, error, count } = await query;

    if (error) {
      console.error('Error fetching hustles:', error);
    }

    // If no hustles from DB, fall back to seed data
    if (!dbHustles || dbHustles.length === 0) {
      let filtered = [...sideHustles];
      
      if (category && category !== 'all') {
        filtered = filtered.filter(h => h.type === category);
      }
      
      if (search) {
        filtered = filtered.filter(h =>
          h.title.toLowerCase().includes(search.toLowerCase()) ||
          h.description.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      filtered.sort((a, b) => b.hourlyRate - a.hourlyRate);
      
      const paginated = filtered.slice(offset, offset + limit);
      
      return NextResponse.json({
        success: true,
        data: paginated,
        total: filtered.length,
        hasMore: offset + limit < filtered.length,
        source: 'seed-data',
      });
    }

    // Transform DB hustles to frontend format
    const formattedHustles = dbHustles.map(h => ({
      id: h.id,
      title: h.title,
      description: h.description,
      type: h.category,
      hourlyRate: h.pay_rate ? parseFloat(h.pay_rate.replace(/[^0-9.]/g, '')) || 0 : 0,
      location: h.location || 'Singapore',
      url: h.url,
      deadline: h.deadline,
      contact: h.contact,
      isFeatured: h.is_popular,
      createdAt: h.created_at,
      category: h.category,
      payRate: h.pay_rate,
    }));

    // Sort by pay rate if requested
    if (sortBy === 'pay_rate') {
      formattedHustles.sort((a, b) => b.hourlyRate - a.hourlyRate);
    }

    return NextResponse.json({
      success: true,
      data: formattedHustles,
      total: count || formattedHustles.length,
      hasMore: (offset || 0) + (formattedHustles.length || 0) < (count || 0),
      source: 'database',
    });
  } catch (error: any) {
    console.error('Error in hustles API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch hustles',
        data: sideHustles.slice(0, limit),
      },
      { status: 500 }
    );
  }
}