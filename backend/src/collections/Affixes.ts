import type { CollectionConfig } from 'payload'

export const Affixes: CollectionConfig = {
  slug: 'affixes',
  
  labels: {
    singular: {
      en: 'Affixe',
      fr: 'Affixe',
    },
    plural: {
      en: 'Affixes',
      fr: 'Affixes',
    },
  },

  admin: {
    hidden: false,
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'position'],
    description: 'Gestion des affixes / élevages. Créé automatiquement lors de l\'ajout d\'un chat.',
  },

  fields: [
    {
      name: 'nom',
      type: 'text',
      label: 'Nom de l\'affixe',
      required: true,
      unique: true,
      // ✅ placeholder va ici, dans admin
      admin: {
        placeholder: 'ex: De la Vallée des Rois',
      },
    },
    {
      name: 'position',
      type: 'select',
      label: 'Position par défaut',
      defaultValue: 'suffix',
      options: [
        { label: 'Après le nom (Suffixe) - Ex: Rex de la Vallée', value: 'suffix' },
        { label: 'Avant le nom (Préfixe) - Ex: De la Vallée Rex', value: 'prefix' },
      ],
    },
  ],
}
