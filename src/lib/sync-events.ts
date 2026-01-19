import { supabase } from "@/integrations/supabase/client";

/**
 * Supprime un événement du CMS associé à un match E2D
 */
export async function removeE2DEventFromCMS(matchId: string) {
  try {
    // Récupérer les infos du match pour identifier l'événement
    const { data: match, error: matchError } = await supabase
      .from('sport_e2d_matchs')
      .select('equipe_adverse, date_match')
      .eq('id', matchId)
      .single();

    if (matchError || !match) return { success: false };

    const eventTitle = `Match E2D vs ${match.equipe_adverse || 'Adversaire'}`;
    
    // Supprimer l'événement correspondant
    const { error: deleteError } = await supabase
      .from('cms_events')
      .delete()
      .eq('title', eventTitle)
      .eq('event_date', match.date_match);

    if (deleteError) throw deleteError;

    console.log('Événement E2D retiré du site:', eventTitle);
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la suppression événement E2D:', error);
    return { success: false, error };
  }
}

/**
 * Synchronise un match E2D vers les événements du site web
 * Uniquement si statut_publication = 'publie'
 */
export async function syncE2DMatchToEvent(matchId: string) {
  try {
    // Récupérer le match avec statut_publication
    const { data: match, error: matchError } = await supabase
      .from('sport_e2d_matchs')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError) throw matchError;
    if (!match) return;

    // Vérifier le statut de publication
    const statutPublication = (match as any).statut_publication || 'brouillon';
    
    // Si non publié, retirer du site web
    if (statutPublication !== 'publie') {
      await removeE2DEventFromCMS(matchId);
      return { success: true, action: 'removed' };
    }

    const eventTitle = `Match E2D vs ${match.equipe_adverse || 'Adversaire'}`;
    
    // Construire la description avec score si terminé
    let eventDescription = `${match.type_match || 'Match'} - ${match.statut}`;
    if (match.statut === 'termine' && match.score_e2d !== null && match.score_adverse !== null) {
      eventDescription = `Terminé: ${match.score_e2d} - ${match.score_adverse}`;
    }
    
    // Vérifier si l'événement existe déjà
    const { data: existingEvent } = await supabase
      .from('cms_events')
      .select('id')
      .eq('title', eventTitle)
      .eq('event_date', match.date_match)
      .maybeSingle();

    if (existingEvent) {
      // Mettre à jour l'événement existant
      const { error: updateError } = await supabase
        .from('cms_events')
        .update({
          title: eventTitle,
          description: eventDescription,
          event_date: match.date_match,
          event_time: match.heure_match,
          location: match.lieu,
          is_active: match.statut !== 'annule',
          match_id: matchId,
          match_type: 'e2d',
          auto_sync: true,
        })
        .eq('id', existingEvent.id);

      if (updateError) throw updateError;
    } else {
      // Créer un nouvel événement
      const { error: insertError } = await supabase
        .from('cms_events')
        .insert([{
          title: eventTitle,
          description: eventDescription,
          event_date: match.date_match,
          event_time: match.heure_match,
          location: match.lieu,
          is_active: match.statut !== 'annule',
          is_featured: false,
          match_id: matchId,
          match_type: 'e2d',
          auto_sync: true,
        }]);

      if (insertError) throw insertError;
    }

    console.log('Match E2D synchronisé vers le site:', eventTitle);
    return { success: true, action: 'synced' };
  } catch (error) {
    console.error('Erreur lors de la synchronisation E2D:', error);
    return { success: false, error };
  }
}

/**
 * Synchronise tous les matchs E2D publiés vers les événements du site
 * Les matchs Phoenix ne sont plus synchronisés (internes uniquement)
 * @param includeAll - Si true, inclut tous les matchs (passés et futurs). Sinon, uniquement les matchs futurs.
 */
export async function syncAllSportEventsToWebsite(includeAll: boolean = true) {
  try {
    // Construire la requête de base
    let query = supabase
      .from('sport_e2d_matchs')
      .select('id')
      .neq('statut', 'annule')
      .eq('statut_publication', 'publie');

    // Filtrer par date seulement si includeAll est false
    if (!includeAll) {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('date_match', today);
    }

    const { data: e2dMatches, error } = await query;

    if (error) throw error;

    // Synchroniser tous les matchs E2D publiés
    const promises = (e2dMatches || []).map(m => syncE2DMatchToEvent(m.id));

    await Promise.all(promises);

    console.log(`✅ Synchronisation terminée: ${e2dMatches?.length || 0} matchs E2D`);

    return { 
      success: true, 
      synced: {
        e2d: e2dMatches?.length || 0,
      }
    };
  } catch (error) {
    console.error('Erreur lors de la synchronisation globale:', error);
    return { success: false, error };
  }
}
