import type { CollectionConfig } from 'payload'

export const Reproducteurs: CollectionConfig = {
  slug: 'reproducteurs',
  
  labels: {
    singular: {
      en: 'Reproducteur',
      fr: 'Reproducteur',
    },
    plural: {
      en: 'Reproducteurs',
      fr: 'Reproducteurs',
    },
  },

  admin: {
    useAsTitle: 'nomComplet',
    defaultColumns: ['nomComplet', 'sexe', 'titre'],
    description: 'Gérez ici vos chats adultes.',
  },

  fields: [
    // ============================================
    // 1. SEXE (En premier)
    // ============================================
    {
      name: 'sexe',
      type: 'select',
      label: 'Sexe',
      options: [
        { label: 'Mâle', value: 'male' },
        { label: 'Femelle', value: 'femelle' },
      ],
      required: true,
    },

    // ============================================
    // 2. NOM + AFFIXE (Sur la même ligne)
    // ============================================
    {
      type: 'row',
      fields: [
        {
          name: 'nom',
          type: 'text',
          label: 'Nom du chat (sans affixe)',
          required: true,
          admin: { 
            width: '50%',
            placeholder: 'ex: Simba, Luna, Félix',
          },
        },
        {
          name: 'affixe',
          type: 'relationship',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          relationTo: 'affixes'as any,
          label: 'Affixe / Élevage',
          required: true,
          admin: {
            width: '50%',
            allowCreate: true,
          },
        },
      ],
    },

    // ============================================
    // 3. CHAMP CALCULÉ (Invisible, mais stocké)
    // ============================================
    {
      name: 'nomComplet',
      type: 'text',
      label: 'Nom Complet (Calculé)',
      admin: { hidden: true },
      hooks: {
        beforeChange: [
          async ({ data, req }) => {
            if (data?.nom && data?.affixe) {
              const affixeId = typeof data.affixe === 'object' 
                ? data.affixe.id 
                : data.affixe;

              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const affixeDoc = await req.payload.findByID({
                  collection: 'affixes' as any,
                  id: affixeId,
                }) as Record<string, any> // Temporary: permet à TS de passer

                if (affixeDoc) {
                  if (affixeDoc.position === 'prefix') {
                    return `${affixeDoc.nom} ${data.nom}`;
                  }
                  return `${data.nom} ${affixeDoc.nom}`;
                }
              } catch (error) {
                console.error('Erreur récupération affixe:', error)
              }
            }

            return data?.nom || '';
          }
        ],
      },
    },

    // ============================================
    // 4. ORDRE D'AFFICHAGE
    // ============================================
    {
      name: 'ordre',
      type: 'number',
      label: 'Ordre d\'affichage',
      defaultValue: 10,
    },

    // ============================================
    // 5. DATE DE NAISSANCE
    // ============================================
    {
      name: 'dateNaissance',
      type: 'date',
      label: 'Date de Naissance',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd/MM/yyyy',
        },
      },
    },

    // ============================================
    // 6. ROBE / COULEUR
    // ============================================
    {
      name: 'couleur',
      type: 'text',
      label: 'Robe / Couleur',
      admin: {
        placeholder: 'ex: Brown mackerel tabby et blanc',
      },
    },

    // ============================================
    // 7. TITRE
    // ============================================
    {
      name: 'titre',
      type: 'text',
      label: 'Titre (le cas échéant)',
      admin: {
        placeholder: 'ex: Grand Champion International',
      },
    },

    // ============================================
    // 8. NOTE / QUALITÉ
    // ============================================
    {
      name: 'etoiles',
      type: 'select',
      label: 'Note',
        options: [
        { label: '1 étoiles', value: '1' },
        { label: '2 étoiles', value: '2' },
        { label: '3 étoiles', value: '3' },
        { label: '4 étoiles', value: '4' },
        { label: '5 étoiles', value: '5' },
      ],
    },

    // ============================================
    // 9. GÉNÉALOGIE (Group field)
    // ============================================
    {
      name: 'parents',
      type: 'group',
      label: 'Généalogie',
      fields: [
        {
          name: 'pere',
          type: 'text',
          label: 'Nom du Père',
          admin: {
            placeholder: 'ex: Cherokee',
          },
        },
        {
          name: 'mere',
          type: 'text',
          label: 'Nom de la Mère',
          admin: {
            placeholder: 'ex: Ghost Rider',
          },
        },
      ],
    },

    // ============================================
    // 10. PHOTO PRINCIPALE
    // ============================================
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Photo Principale',
    },
  ],
}
