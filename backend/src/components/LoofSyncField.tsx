'use client';

import React, { useState, useCallback } from 'react';
import { useField, useForm } from '@payloadcms/ui';

export const LoofSyncField = () => {
  // useField pour le champ courant (Puce)
  const { value, setValue } = useField<string>({ path: 'numero_identification' });
  
  // useForm pour contrôler TOUS les autres champs du formulaire
  const { dispatchFields } = useForm();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSync = useCallback(async () => {
    if (!value || value.length < 15) {
      setMsg('❌ Numéro invalide (15 chiffres requis)');
      return;
    }

    setLoading(true);
    setMsg('⏳ Connexion au LOOF...');

    try {
      const res = await fetch(`/api/loof-sync?puce=${value}`);
      const json = await res.json();

      if (json.success) {
        setMsg('✅ Données importées !');
        const info = json.data;

        // --- MAGIE : MISE À JOUR DYNAMIQUE DES CHAMPS ---
        
        // 1. Race
        if (info.race) {
          dispatchFields({ type: 'UPDATE', path: 'race', value: info.race });
        }
        
        // 2. Couleur
        if (info.couleur) {
          dispatchFields({ type: 'UPDATE', path: 'couleur', value: info.couleur });
        }
        
        // 3. Sexe (Attention aux valeurs select 'male'/'femelle')
        if (info.sexe) {
          dispatchFields({ type: 'UPDATE', path: 'sexe', value: info.sexe });
        }

        // 4. SQR
        if (info.sqr) {
          dispatchFields({ type: 'UPDATE', path: 'sqr', value: info.sqr });
        }

        // 5. Titres (Tableau complexe)
        if (info.titres && Array.isArray(info.titres)) {
           // On mappe les données du LOOF vers la structure de ton Array Payload
           const formattedTitres = info.titres.map((t: any) => ({
             nom: t.titre,
             federation: t.federation,
             date: t.date_obtention
           }));
           
           // On remplace tout le tableau (plus simple que d'ajouter)
           dispatchFields({ type: 'UPDATE', path: 'titres', value: formattedTitres });
        }

      } else {
        setMsg(`❌ Erreur : ${json.error}`);
      }
    } catch (_) {
      setMsg('❌ Erreur technique');
    } finally {
      setLoading(false);
    }
  }, [value, dispatchFields]);

  return (
    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
      <label className="field-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>
        Synchronisation LOOF
      </label>
      
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            className="field-input"
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="N° Puce (ex: 25026...)"
          />
        </div>
        
        <button
          type="button"
          onClick={handleSync}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#2ecc71', // Vert pour l'action positive
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            transition: 'background 0.2s'
          }}
        >
          {loading ? 'Chargement...' : '⬇️ Importer'}
        </button>
      </div>

      {msg && (
        <div style={{ 
          marginTop: '8px', 
          fontSize: '0.85em', 
          fontWeight: '500',
          color: msg.startsWith('✅') ? '#27ae60' : '#c0392b' 
        }}>
          {msg}
        </div>
      )}
      
      <p style={{ fontSize: '0.75em', color: '#7f8c8d', marginTop: '8px', fontStyle: 'italic' }}>
        Entrez le numéro et cliquez sur Importer pour remplir automatiquement la fiche.
      </p>
    </div>
  );
};
