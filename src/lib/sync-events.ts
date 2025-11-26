import { supabase } from "@/integrations/supabase/client";

/**
 * Synchronise un match E2D vers les événements du site web
 */
export async function syncE2DMatchToEvent(matchId: string) {
  try {
    // Récupérer le match
    const { data: match, error: matchError } = await supabase
      .from('sport_e2d_matchs')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError) throw matchError;
    if (!match) return;

    const eventTitle = `Match E2D vs ${match.equipe_adverse || 'Adversaire'}`;
    const eventDescription = `${match.type_match || 'Match'} - ${match.statut}`;
    
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
        }]);

      if (insertError) throw insertError;
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la synchronisation E2D:', error);
    return { success: false, error };
  }
}

/**
 * Synchronise un match Phoenix vers les événements du site web
 */
export async function syncPhoenixMatchToEvent(matchId: string) {
  try {
    const { data: match, error: matchError } = await supabase
      .from('sport_phoenix_matchs')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError) throw matchError;
    if (!match) return;

    const eventTitle = `Match Phoenix vs ${match.equipe_adverse || 'Adversaire'}`;
    const eventDescription = `${match.type_match || 'Match'} - ${match.statut}`;
    
    const { data: existingEvent } = await supabase
      .from('cms_events')
      .select('id')
      .eq('title', eventTitle)
      .eq('event_date', match.date_match)
      .maybeSingle();

    if (existingEvent) {
      const { error: updateError } = await supabase
        .from('cms_events')
        .update({
          title: eventTitle,
          description: eventDescription,
          event_date: match.date_match,
          event_time: match.heure_match,
          location: match.lieu,
          is_active: match.statut !== 'annule',
        })
        .eq('id', existingEvent.id);

      if (updateError) throw updateError;
    } else {
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
        }]);

      if (insertError) throw insertError;
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la synchronisation Phoenix:', error);
    return { success: false, error };
  }
}

/**
 * Synchronise un entraînement Phoenix vers les événements du site web
 */
export async function syncPhoenixEntrainementToEvent(entrainementId: string) {
  try {
    const { data: entrainement, error: entrainementError } = await supabase
      .from('phoenix_entrainements')
      .select('*')
      .eq('id', entrainementId)
      .single();

    if (entrainementError) throw entrainementError;
    if (!entrainement) return;

    const eventTitle = `Entraînement Phoenix - ${entrainement.type_entrainement || 'Général'}`;
    const eventDescription = entrainement.notes || 'Entraînement de l\'équipe Phoenix';
    
    const { data: existingEvent } = await supabase
      .from('cms_events')
      .select('id')
      .eq('title', eventTitle)
      .eq('event_date', entrainement.date_entrainement)
      .maybeSingle();

    if (existingEvent) {
      const { error: updateError } = await supabase
        .from('cms_events')
        .update({
          title: eventTitle,
          description: eventDescription,
          event_date: entrainement.date_entrainement,
          event_time: entrainement.heure_debut,
          location: entrainement.lieu,
          is_active: true,
        })
        .eq('id', existingEvent.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('cms_events')
        .insert([{
          title: eventTitle,
          description: eventDescription,
          event_date: entrainement.date_entrainement,
          event_time: entrainement.heure_debut,
          location: entrainement.lieu,
          is_active: true,
          is_featured: false,
        }]);

      if (insertError) throw insertError;
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la synchronisation entraînement:', error);
    return { success: false, error };
  }
}

/**
 * Synchronise tous les matchs et entraînements futurs vers les événements
 */
export async function syncAllSportEventsToWebsite() {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Récupérer tous les matchs E2D futurs
    const { data: e2dMatches } = await supabase
      .from('sport_e2d_matchs')
      .select('id')
      .gte('date_match', today)
      .neq('statut', 'annule');

    // Récupérer tous les matchs Phoenix futurs
    const { data: phoenixMatches } = await supabase
      .from('sport_phoenix_matchs')
      .select('id')
      .gte('date_match', today)
      .neq('statut', 'annule');

    // Récupérer tous les entraînements futurs
    const { data: entrainements } = await supabase
      .from('phoenix_entrainements')
      .select('id')
      .gte('date_entrainement', today);

    // Synchroniser tous les événements
    const promises = [
      ...(e2dMatches || []).map(m => syncE2DMatchToEvent(m.id)),
      ...(phoenixMatches || []).map(m => syncPhoenixMatchToEvent(m.id)),
      ...(entrainements || []).map(e => syncPhoenixEntrainementToEvent(e.id)),
    ];

    await Promise.all(promises);

    return { 
      success: true, 
      synced: {
        e2d: e2dMatches?.length || 0,
        phoenix: phoenixMatches?.length || 0,
        entrainements: entrainements?.length || 0,
      }
    };
  } catch (error) {
    console.error('Erreur lors de la synchronisation globale:', error);
    return { success: false, error };
  }
}
