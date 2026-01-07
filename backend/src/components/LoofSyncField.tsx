'use client';

import React, { useState, useCallback } from 'react';
import { useField, useAllFormFields } from '@payloadcms/ui';

export const LoofSyncField = () => {
  const { value, setValue } = useField<string>({ path: 'numero_identification' });
  const [, dispatch] = useAllFormFields();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Validation locale stricte
  const cleanValue = (value || '').trim();
  const isValid = /^\d{15}$/.test(cleanValue);

  const handleSync = useCallback(async () => {
    // Blocage absolu si format invalide
    if (!isValid) {
      setMsg('❌ Format invalide : 15 chiffres requis');
      return;
    }

    setLoading(true);
    setMsg('⏳ Connexion au LOOF...');

    try {
      const res = await fetch(`/api/loof-sync?puce=${cleanValue}`);
      const json = await res.json();

      // Gestion d'erreur API
      if (!res.ok) {
        setMsg(`❌ ${json.error || 'Erreur API'}`);
        setLoading(false);
        return;
      }

      if (json.success && json.data && json.data.race) {
        const info = json.data;
        
        // Mise à jour des champs simples
        dispatch({ type: 'UPDATE', path: 'race', value: info.race });
        dispatch({ type: 'UPDATE', path: 'couleur', value: info.couleur || '' });
        dispatch({ type: 'UPDATE', path: 'sexe', value: info.sexe });
        dispatch({ type: 'UPDATE', path: 'sqr', value: info.sqr || '' });

        // Titres : Remplir titre_1 à titre_4 (déjà triés par date)
        dispatch({ type: 'UPDATE', path: 'titre_1', value: null });
        dispatch({ type: 'UPDATE', path: 'titre_2', value: null });
        dispatch({ type: 'UPDATE', path: 'titre_3', value: null });
        dispatch({ type: 'UPDATE', path: 'titre_4', value: null });
        
        if (info.titres && Array.isArray(info.titres)) {
          // ✅ Afficher les 4 titres (déjà triés par date, récents d'abord)
          info.titres.slice(0, 4).forEach((t: any, idx: number) => {
            dispatch({ type: 'UPDATE', path: `titre_${idx + 1}`, value: t.titre });
          });
          
          if (info.titres.length > 4) {
            setMsg(`✅ ${info.titres.length} titres trouvés. Les 4 plus récents sont affichés. Vous pouvez éditer les champs pour en ajouter d'autres.`);
          } else {
            setMsg('✅ Données trouvées ! Enregistrez pour valider.');
          }
          
          console.log('👉 Client - Titres importés (triés par date):', info.titres);
        } else {
          setMsg('✅ Données trouvées ! Enregistrez pour valider.');
        }
      } else {
        setMsg('❌ Puce inconnue au LOOF');
      }
    } catch (e) {
      console.error(e);
      setMsg('❌ Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [cleanValue, isValid, dispatch]);

  return (
    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
      <label style={{ marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>
        Synchronisation LOOF
      </label>
      
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => {
              // Filtrer : chiffres uniquement, max 15
              const clean = e.target.value.replace(/[^0-9]/g, '').slice(0, 15);
              setValue(clean);
            }}
            style={{ 
              width: '100%',
              padding: '10px', 
              border: isValid ? '2px solid #2ecc71' : '2px solid #e74c3c',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="250268712612228"
            maxLength={15}
          />
        </div>
        <button
          onClick={handleSync}
          disabled={!isValid || loading}
          style={{
            padding: '10px 20px',
            backgroundColor: isValid && !loading ? '#2ecc71' : '#bdc3c7',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isValid && !loading ? 'pointer' : 'not-allowed',
            fontWeight: '600',
            whiteSpace: 'nowrap'
          }}
        >
          {loading ? 'Chargement...' : '⬇️ Importer'}
        </button>
      </div>
      
      {!isValid && value && (
        <div style={{ marginTop: '8px', color: '#c0392b', fontSize: '0.9em', fontWeight: '600' }}>
          ❌ Le numéro doit contenir exactement 15 chiffres ({cleanValue.length} saisis)
        </div>
      )}
      {msg && (
        <div style={{ 
          marginTop: '8px', 
          color: msg.startsWith('✅') ? '#27ae60' : '#c0392b', 
          fontSize: '0.9em',
          fontWeight: '600'
        }}>
          {msg}
        </div>
      )}

      {/* Bloc explicatif réintégré */}
      <div style={{ 
        padding: '12px', 
        marginTop: '15px', 
        backgroundColor: '#e8f4f8', 
        borderLeft: '4px solid #3498db', 
        fontSize: '0.85em', 
        borderRadius: '0 4px 4px 0', 
        color: '#2c3e50' 
      }}>
        <strong>📌 Comment ça marche :</strong>
        <ol style={{ marginTop: '5px', marginBottom: '0', paddingLeft: '20px' }}>
          <li>Entrez le N° de puce (15 chiffres) et cliquez sur &quot;Importer&quot;.</li>
          <li>Les champs (Race, Couleur, Titres...) se remplissent automatiquement.</li>
          <li><strong>Cliquez sur &quot;Publier / Enregistrer&quot;</strong> pour sauvegarder définitivement ces données en base.</li>
        </ol>
      </div>
    </div>
  );
};
