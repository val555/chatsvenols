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
        // Clonage propre pour éviter deepmerge loop
        const cleanData = JSON.parse(JSON.stringify(data));

        const newPuce = cleanData.numero_identification;
        const oldPuce = originalDoc?.numero_identification;
        // On déclenche scraping à la création OU si le numéro change à l'update
        const shouldScrape = (operation === 'create' && newPuce) || (operation === 'update' && newPuce && newPuce !== oldPuce);

        if (shouldScrape) {
          console.log(`🤖 Scraping LOOF activé pour la puce : ${newPuce}`);
          try {
            const result = await scrapeReproducteurByChip(newPuce);

            if (result.success && result.data) {
              const info = result.data;
              
              cleanData.race = info.race || cleanData.race;
              cleanData.couleur = info.couleur || cleanData.couleur;
              cleanData.sexe = info.sexe || cleanData.sexe;
              cleanData.sqr = info.sqr || cleanData.sqr;
              
              if (info.titres && info.titres.length > 0) {
                // Typage any pour contourner le check strict ici
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cleanData.titres = info.titres.map((t: any) => ({
                  nom: t.titre,
                  federation: t.federation,
                  date: t.date_obtention
                }));
              }
              console.log('✨ Données fusionnées avec succès');
            }
          } catch (e) {
            console.error("❌ Erreur non bloquante dans le hook :", e);
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
          // Cast 'as any' pour éviter le conflit de types React.FC vs Payload Component
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
      name: 'titres',
      type: 'array',
      label: 'Titres & Distinctions',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'nom', type: 'text', label: 'Titre', required: true, admin: { width: '40%' } },
            { name: 'federation', type: 'text', label: 'Fédération', admin: { width: '20%' } },
            { name: 'date', type: 'text', label: 'Date', admin: { width: '40%' } }
          ]
        }
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
