import { NextResponse } from 'next/server';
import { scrapeReproducteurByChip } from '@/utils/loof-scraper/scrapers/reproducteur'; // Ajuste le chemin selon ton alias (@ ou ../)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const puce = searchParams.get('puce');

  if (!puce) {
    return NextResponse.json({ success: false, error: 'Puce manquante' }, { status: 400 });
  }

  try {
    const result = await scrapeReproducteurByChip(puce);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
