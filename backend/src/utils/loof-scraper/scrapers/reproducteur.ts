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

    // ÉTAPE 3 : Parser UNIQUEMENT les champs présents (pas d'objet vide/corrompu)
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

        // Titres (depuis ul > li)
    const titres: Array<{ titre: string; federation: string; date_obtention: string }> = [];
    $result('ul[data-drupal-selector="edit-list"] li').each((_idx, el) => {
      // Extraire directement les textes depuis l'élément el
      const federationEl = cheerio.load(el)('span.placeholder.federation').first();
      const titreEl = cheerio.load(el)('span.placeholder.i-title');
      const dateEl = cheerio.load(el)('span.placeholder.federation').last();

      const federation = federationEl.text().trim();
      const titre = titreEl.text().trim();
      const date = dateEl.text().trim();

      if (titre) {
        titres.push({
          titre,
          federation: federation || 'LOOF',
          date_obtention: date,
        });
      }
    });

    if (titres.length > 0) {
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
