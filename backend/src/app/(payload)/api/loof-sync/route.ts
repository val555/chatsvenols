import { NextResponse } from 'next/server';
import { scrapeReproducteurByChip } from '@/utils/loof-scraper/scrapers/reproducteur';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const puce = searchParams.get('puce');

    // Validation stricte serveur
    if (!puce) {
      return NextResponse.json(
        { success: false, error: 'Puce manquante' },
        { status: 400 }
      );
    }

    if (!/^\d{15}$/.test(puce.trim())) {
      return NextResponse.json(
        { success: false, error: 'Format invalide : 15 chiffres requis' },
        { status: 400 }
      );
    }

    const result = await scrapeReproducteurByChip(puce.trim());
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
