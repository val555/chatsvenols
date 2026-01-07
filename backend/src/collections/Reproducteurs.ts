import type { CollectionConfig } from 'payload';
import { scrapeReproducteurByChip } from '../utils/loof-scraper/scrapers/reproducteur';
import { LoofSyncField } from '../components/LoofSyncField';

export const Reproducteurs: CollectionConfig = {
  slug: 'reproducteurs',
  admin: {
    useAsTitle: 'nomComplet',
    defaultColumns: ['nomComplet', 'numero_identification', 'statut', 'sqr'],
    group: 'Élevage',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation }) => {
        const cleanData = JSON.parse(JSON.stringify(data));

        const newPuce = cleanData.numero_identification;
        const oldPuce = originalDoc?.numero_identification;
        const shouldScrape = (operation === 'create' && newPuce) || (operation === 'update' && newPuce && newPuce !== oldPuce);

        if (shouldScrape) {
          console.log(`🤖 Scraping LOOF pour puce : ${newPuce}`);
          try {
            const result = await scrapeReproducteurByChip(newPuce);

            if (result.success && result.data) {
              const info = result.data;
              
              // Mise à jour des champs simples
              cleanData.race = info.race || 'Maine Coon';
              cleanData.couleur = info.couleur ?? null;
              cleanData.sexe = info.sexe || 'femelle';
              cleanData.sqr = info.sqr ?? null;
              
              // Titres : Remplir titre_1 à titre_5 (déjà triés par date, récents d'abord)
              cleanData.titre_1 = null;
              cleanData.titre_2 = null;
              cleanData.titre_3 = null;
              cleanData.titre_4 = null;
              
              if (info.titres && Array.isArray(info.titres)) {
                // ✅ Afficher les 4 titres les plus récents
                info.titres.slice(0, 4).forEach((t: any, idx: number) => {
                  cleanData[`titre_${idx + 1}`] = t.titre;
                });

                // ✅ Warning si plus de 4 titres
                if (info.titres.length > 4) {
                  console.warn(`
⚠️ ATTENTION : ${info.titres.length} titres trouvés au LOOF.
📌 Seuls les 4 titres les PLUS RÉCENTS sont affichés dans les champs.

Les autres titres :
${info.titres.slice(5).map((t: any) => `  - ${t.titre}`).join('\n')}

💡 Vous pouvez ÉDITER les champs titre_1 à titre_5 à la main pour ajouter les autres titres si souhaité.
                  `);
                }
              }
              
              console.log('✅ Données nettoyées et fusionnées en base');
            } else {
              console.warn('⚠️ Scraping échoué, données non modifiées');
            }
          } catch (e) {
            console.error("❌ Erreur hook:", e);
          }
        }
        return cleanData;
      }
    ]
  },
  fields: [
    {
      name: 'numero_identification',
      type: 'text',
      label: 'N° Identification',
      required: true,
      unique: true,
      admin: {
        components: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Field: LoofSyncField as any,
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'statut',
          type: 'select',
          options: [
            { label: 'Actif', value: 'actif' },
            { label: 'Retraité', value: 'retraite' },
            { label: 'Décédé', value: 'decede' },
          ],
          defaultValue: 'actif',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'sqr',
          type: 'text',
          label: 'Niveau SQR (LOOF)',
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'ordre',
          type: 'number',
          label: 'Ordre d\'affichage',
          defaultValue: 10,
          admin: { width: '50%' },
        },
        {
          name: 'etoiles',
          type: 'select',
          label: 'Qualité',
          options: [
            { label: '1 ⭐', value: '1' },
            { label: '2 ⭐⭐', value: '2' },
            { label: '3 ⭐⭐⭐', value: '3' },
            { label: '4 ⭐⭐⭐⭐', value: '4' },
            { label: '5 ⭐⭐⭐⭐⭐', value: '5' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'nom',
          type: 'text',
          required: true,
          label: 'Nom court (sans affixe)',
        },
        {
          name: 'sexe',
          type: 'select',
          required: true,
          options: [
            { label: 'Mâle', value: 'male' },
            { label: 'Femelle', value: 'femelle' },
          ],
        },
      ],
    },
    {
      name: 'affixe',
      type: 'relationship',
      relationTo: 'affixes',
      required: true,
    },
    {
      name: 'nomComplet',
      type: 'text',
      admin: { readOnly: true },
      hooks: {
        beforeChange: [
          async ({ data, req }) => {
            if (!data?.affixe) return data?.nom;
            const affixe = await req.payload.findByID({
              collection: 'affixes',
              id: data.affixe as number,
            });
            if (!affixe) return data.nom;
            return affixe.position === 'prefix'
              ? `${affixe.nom} ${data.nom}`
              : `${data.nom} ${affixe.nom}`;
          },
        ],
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'race',
          type: 'text',
          defaultValue: 'Maine Coon',
          admin: { width: '50%' },
        },
        {
          name: 'couleur',
          type: 'text',
          label: 'Couleur / Robe',
          admin: { width: '50%' },
        },
      ]
    },
    {
      type: 'row',
      fields: [
        {
          name: 'dateNaissance',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayOnly' }, width: '100%' },
        },
      ]
    },
    {
      label: 'Titres & Distinctions (LOOF)',
      type: 'collapsible',
      fields: [
        {
          name: 'titre_1',
          type: 'text',
          label: 'Titre 1 (plus récent)',
          admin: { description: 'Ex: Champion (2018)' }
        },
        {
          name: 'titre_2',
          type: 'text',
          label: 'Titre 2',
        },
        {
          name: 'titre_3',
          type: 'text',
          label: 'Titre 3',
        },
        {
          name: 'titre_4',
          type: 'text',
          label: 'Titre 4',
        },
      ]
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'photos_galerie',
      type: 'array',
      label: 'Galerie Photos',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      label: 'Généalogie (Parents)',
      type: 'collapsible',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'pere_interne',
              type: 'relationship',
              relationTo: 'reproducteurs',
              filterOptions: { sexe: { equals: 'male' } },
              label: 'Père (Interne)',
            },
            {
              name: 'pere_externe',
              type: 'text',
              label: 'OU Père (Externe)',
              admin: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                condition: (_data: any, siblingData: any) => !siblingData?.pere_interne,
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'mere_interne',
              type: 'relationship',
              relationTo: 'reproducteurs',
              filterOptions: { sexe: { equals: 'femelle' } },
              label: 'Mère (Interne)',
            },
            {
              name: 'mere_externe',
              type: 'text',
              label: 'OU Mère (Externe)',
              admin: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                condition: (_data: any, siblingData: any) => !siblingData?.mere_interne,
              },
            },
          ],
        },
        {
          name: 'pedigree_officiel',
          type: 'upload',
          relationTo: 'media',
          label: 'Scan Pedigree (PDF/Img)',
        }
      ],
    },
    {
      name: 'sante',
      type: 'group',
      fields: [
        { name: 'dna_id', type: 'text', label: 'Identification ADN' },
        { name: 'tests_sante', type: 'textarea', label: 'Tests (HCM, PKD...)' },
      ],
    },
  ],
};
