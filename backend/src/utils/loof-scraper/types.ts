export interface LoofReproducteurData {
  numero_identification: string;
  race?: string;
  couleur?: string;
  sexe?: 'male' | 'femelle';
  sqr?: string;
  titres?: Array<{
    titre: string;
    federation: string;
    date_obtention: string;
  }>;
}

export type LoofScraperResult = 
  | { success: true; data: LoofReproducteurData }
  | { success: false; error: string };
