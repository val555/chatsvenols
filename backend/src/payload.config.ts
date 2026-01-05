import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { fr } from '@payloadcms/translations/languages/fr'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Reproducteurs } from './collections/Reproducteurs'
import { Affixes } from './collections/Affixes'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    dateFormat: 'dd/MM/yyyy',
  },

    // 🔥 CONFIGURATION I18N DE NETTOYAGE
  i18n: {
    supportedLanguages: { fr },
    fallbackLanguage: 'fr',
    translations: {
      fr: {
        general: {
          // --- TITRES ET ACTIONS ---
          createNew: 'Ajouter', // Le bouton en haut
          creatingNew: 'Ajouter {{label}}', // Le titre de la page Create
          editing: 'Modifier {{label}}', // Le titre de la page Edit
          
          // --- MESSAGES VIDES ---
          noResultsFound: 'Aucun résultat.', // Message de recherche vide
          noRowsFound: 'Aucun élément trouvé.', // Liste vide
          
          // --- BOUTONS ---
          add: 'Ajouter',
          save: 'Enregistrer',
          cancel: 'Annuler',
          edit: 'Modifier',
          delete: 'Supprimer',
          
          // --- CONFIRMATIONS ---
          updatedSuccessfully: 'Enregistré.',
          confirmDeletion: 'Confirmer la suppression',
          
          // --- AUTRES CLÉS COUPABLES ---
          'create-new': 'Ajouter',
          'create-new-label': 'Ajouter {{label}}',
          'no-results': 'Rien trouvé',
        },
        // 🔥 SURCHARGE RACINE (CRUCIAL POUR PAYLOAD 3.0)
        'general:creatingNew': 'Ajouter {{label}}',
        'general:editing': 'Modifier {{label}}',
        'general:createNew': 'Ajouter',
      },
    },
  },


  // Localization pour les données (champs traduisibles)
  localization: {
    locales: ['fr'],
    defaultLocale: 'fr',
    fallback: true,
  },

  collections: [
    Users,
    Media,
    Affixes,      
    Reproducteurs,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || 'file:./payload.db',
    },
  }),
  sharp,
  plugins: [],
})
