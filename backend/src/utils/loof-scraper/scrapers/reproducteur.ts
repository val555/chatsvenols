import * as cheerio from 'cheerio';
import { LoofReproducteurData, LoofScraperResult } from '../types';

const LOOF_SEARCH_URL = 'https://loof.asso.fr/mon-chat-est-il-enregistre-au-loof';

export const scrapeReproducteurByChip = async (puce: string): Promise<LoofScraperResult> => {
  try {
    // ÉTAPE 1 : Récupérer le formulaire (pour tokens)
    const initialRes = await fetch(LOOF_SEARCH_URL);
    if (!initialRes.ok) {
      return { success: false, error: `Erreur réseau: ${initialRes.status}` };
    }

    const initialHtml = await initialRes.text();
    const $form = cheerio.load(initialHtml);

    const formBuildId = $form('input[name="form_build_id"]').val() as string;
    const formId = $form('input[name="form_id"]').val() as string;

    if (!formBuildId || !formId) {
      return { success: false, error: 'Tokens formulaire introuvables' };
    }

    // ÉTAPE 2 : Soumettre le formulaire
    const params = new URLSearchParams();
    params.append('number', puce);
    params.append('op', 'Rechercher');
    params.append('form_build_id', formBuildId);
    params.append('form_id', formId);

    const submitRes = await fetch(LOOF_SEARCH_URL, {
      method: 'POST',
      body: params.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const resultHtml = await submitRes.text();
    const $result = cheerio.load(resultHtml);

    // ÉTAPE 3 : Parser UNIQUEMENT les champs présents
    const data: LoofReproducteurData = {
      numero_identification: puce,
    };

    // Race & Couleur (depuis .placeholder.description)
    const descText = $result('span.placeholder.description').text().trim();
    if (descText) {
      const knownRaces = [
        'Maine Coon',
        'Norvégien',
        'Bengal',
        'Ragdoll',
        'Sacré de Birmanie',
        'Chartreux',
        'Sibérien',
      ];
      let raceFound = '';
      for (const race of knownRaces) {
        if (descText.toLowerCase().startsWith(race.toLowerCase())) {
          raceFound = race;
          break;
        }
      }
      data.race = raceFound || descText.split(' ')[0];
      data.couleur = raceFound
        ? descText.substring(raceFound.length).trim()
        : descText;
    }

    // Sexe (depuis .placeholder.sex)
    const sexText = $result('span.placeholder.sex').text().trim().toLowerCase();
    if (sexText === 'mâle' || sexText === 'male') {
      data.sexe = 'male';
    } else if (sexText === 'femelle') {
      data.sexe = 'femelle';
    }

    // SQR (depuis .placeholder.qualif)
    const sqrText = $result('span.placeholder.qualif').text().trim();
    if (sqrText) {
      data.sqr = sqrText;
    }

    // Titres : Extraction corrigée
    const titres: Array<{ titre: string; federation: string; date_obtention: string }> = [];
    $result('ul[data-drupal-selector="edit-list"] li').each((_idx, el) => {
      const $li = cheerio.load(el);
      
      // Extraire le titre (span avec class i-title)
      const titre = $li('span.placeholder.i-title').text().trim();
      
      // Extraire la date : c'est le TEXTE AFTER "Obtenu le :"
      const liText = $li(el).text();
      const dateMatch = liText.match(/Obtenu le\s*:\s*(\d{2}-\d{2}-\d{4})/);
      const date_obtention = dateMatch ? dateMatch[1] : '';

      if (titre) {
        // Extraire l'année de la date (2018 from 14-11-2018)
        const year = date_obtention ? date_obtention.split('-')[2] : '';
        const titreFormate = year ? `${titre} (${year})` : titre;
        
        titres.push({
          titre: titreFormate,
          federation: 'LOOF',
          date_obtention: date_obtention
        });
      }
    });

    // ✅ Trier par date (les plus récents d'abord)
    if (titres.length > 0) {
      titres.sort((a, b) => {
        const dateA = new Date(a.date_obtention.split('-').reverse().join('-')).getTime();
        const dateB = new Date(b.date_obtention.split('-').reverse().join('-')).getTime();
        return dateB - dateA; // DESC (plus récent d'abord)
      });
      data.titres = titres;
    }

    console.log('✅ Scraping réussi:', data);
    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('❌ Scraping échoué:', msg);
    return { success: false, error: msg };
  }
};
