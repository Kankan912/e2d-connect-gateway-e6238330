export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activites_membres: {
        Row: {
          created_at: string
          description: string
          id: string
          membre_id: string
          metadata: Json | null
          montant: number | null
          reference_id: string | null
          reference_table: string | null
          type_activite: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          membre_id: string
          metadata?: Json | null
          montant?: number | null
          reference_id?: string | null
          reference_table?: string | null
          type_activite: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          membre_id?: string
          metadata?: Json | null
          montant?: number | null
          reference_id?: string | null
          reference_table?: string | null
          type_activite?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_activites_membres_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_activites_membres_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      adhesions: {
        Row: {
          association_id: string
          created_at: string
          email: string
          id: string
          membre_id: string | null
          message: string | null
          montant_paye: number
          nom: string
          payment_id: string | null
          payment_method: string
          payment_status: string
          prenom: string
          processed: boolean
          telephone: string
          type_adhesion: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          email: string
          id?: string
          membre_id?: string | null
          message?: string | null
          montant_paye: number
          nom: string
          payment_id?: string | null
          payment_method: string
          payment_status?: string
          prenom: string
          processed?: boolean
          telephone: string
          type_adhesion: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          created_at?: string
          email?: string
          id?: string
          membre_id?: string | null
          message?: string | null
          montant_paye?: number
          nom?: string
          payment_id?: string | null
          payment_method?: string
          payment_status?: string
          prenom?: string
          processed?: boolean
          telephone?: string
          type_adhesion?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adhesions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adhesions_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "adhesions_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      aides: {
        Row: {
          association_id: string
          beneficiaire_id: string
          contexte_aide: string
          created_at: string
          created_by: string | null
          date_allocation: string
          exercice_id: string | null
          id: string
          justificatif_url: string | null
          montant: number
          notes: string | null
          reunion_id: string | null
          statut: string
          type_aide_id: string
          updated_at: string | null
        }
        Insert: {
          association_id?: string
          beneficiaire_id: string
          contexte_aide?: string
          created_at?: string
          created_by?: string | null
          date_allocation?: string
          exercice_id?: string | null
          id?: string
          justificatif_url?: string | null
          montant: number
          notes?: string | null
          reunion_id?: string | null
          statut?: string
          type_aide_id: string
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          beneficiaire_id?: string
          contexte_aide?: string
          created_at?: string
          created_by?: string | null
          date_allocation?: string
          exercice_id?: string | null
          id?: string
          justificatif_url?: string | null
          montant?: number
          notes?: string | null
          reunion_id?: string | null
          statut?: string
          type_aide_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aides_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aides_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aides_reunion_id_fkey"
            columns: ["reunion_id"]
            isOneToOne: false
            referencedRelation: "reunions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_aides_beneficiaire"
            columns: ["beneficiaire_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_aides_beneficiaire"
            columns: ["beneficiaire_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_aides_type_aide"
            columns: ["type_aide_id"]
            isOneToOne: false
            referencedRelation: "aides_types"
            referencedColumns: ["id"]
          },
        ]
      }
      aides_types: {
        Row: {
          association_id: string
          created_at: string
          delai_remboursement: number | null
          description: string | null
          id: string
          mode_repartition: string
          montant_defaut: number | null
          nom: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          delai_remboursement?: number | null
          description?: string | null
          id?: string
          mode_repartition?: string
          montant_defaut?: number | null
          nom: string
        }
        Update: {
          association_id?: string
          created_at?: string
          delai_remboursement?: number | null
          description?: string | null
          id?: string
          mode_repartition?: string
          montant_defaut?: number | null
          nom?: string
        }
        Relationships: [
          {
            foreignKeyName: "aides_types_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      aides_validation_history: {
        Row: {
          action: string
          aide_id: string
          ancien_statut: string | null
          association_id: string
          commentaire: string | null
          created_at: string | null
          id: string
          nouveau_statut: string | null
          valide_par: string | null
        }
        Insert: {
          action: string
          aide_id: string
          ancien_statut?: string | null
          association_id?: string
          commentaire?: string | null
          created_at?: string | null
          id?: string
          nouveau_statut?: string | null
          valide_par?: string | null
        }
        Update: {
          action?: string
          aide_id?: string
          ancien_statut?: string | null
          association_id?: string
          commentaire?: string | null
          created_at?: string | null
          id?: string
          nouveau_statut?: string | null
          valide_par?: string | null
        }
        Relationships: []
      }
      alertes_budgetaires: {
        Row: {
          association_id: string
          categorie: string
          created_at: string | null
          description: string | null
          id: string
          niveau: string
          recommandation: string | null
          resolu: boolean | null
          resolu_le: string | null
          seuil: number | null
          titre: string
          updated_at: string | null
          valeur_actuelle: number | null
        }
        Insert: {
          association_id?: string
          categorie: string
          created_at?: string | null
          description?: string | null
          id?: string
          niveau: string
          recommandation?: string | null
          resolu?: boolean | null
          resolu_le?: string | null
          seuil?: number | null
          titre: string
          updated_at?: string | null
          valeur_actuelle?: number | null
        }
        Update: {
          association_id?: string
          categorie?: string
          created_at?: string | null
          description?: string | null
          id?: string
          niveau?: string
          recommandation?: string | null
          resolu?: boolean | null
          resolu_le?: string | null
          seuil?: number | null
          titre?: string
          updated_at?: string | null
          valeur_actuelle?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "alertes_budgetaires_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      association_settings: {
        Row: {
          association_id: string
          cle: string
          created_at: string
          description: string | null
          id: string
          max_cotisations_mensuelles_par_membre: number
          updated_at: string
          valeur: Json | null
        }
        Insert: {
          association_id?: string
          cle: string
          created_at?: string
          description?: string | null
          id?: string
          max_cotisations_mensuelles_par_membre?: number
          updated_at?: string
          valeur?: Json | null
        }
        Update: {
          association_id?: string
          cle?: string
          created_at?: string
          description?: string | null
          id?: string
          max_cotisations_mensuelles_par_membre?: number
          updated_at?: string
          valeur?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "association_settings_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      associations: {
        Row: {
          adresse: string | null
          caisse_config: Json
          created_at: string | null
          description: string | null
          email_config: Json
          email_contact: string | null
          feature_flags: Json
          id: string
          langue_principale: string
          locale: string
          logo_url: string | null
          nom: string
          pays: string | null
          sigle: string | null
          site_template: string
          slug: string
          statut: string
          subdomain: string | null
          telephone: string | null
          theme_tokens: Json
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          caisse_config?: Json
          created_at?: string | null
          description?: string | null
          email_config?: Json
          email_contact?: string | null
          feature_flags?: Json
          id?: string
          langue_principale?: string
          locale?: string
          logo_url?: string | null
          nom: string
          pays?: string | null
          sigle?: string | null
          site_template?: string
          slug: string
          statut?: string
          subdomain?: string | null
          telephone?: string | null
          theme_tokens?: Json
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          caisse_config?: Json
          created_at?: string | null
          description?: string | null
          email_config?: Json
          email_contact?: string | null
          feature_flags?: Json
          id?: string
          langue_principale?: string
          locale?: string
          logo_url?: string | null
          nom?: string
          pays?: string | null
          sigle?: string | null
          site_template?: string
          slug?: string
          statut?: string
          subdomain?: string | null
          telephone?: string | null
          theme_tokens?: Json
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          association_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          association_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          association_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficiaires_config: {
        Row: {
          actif: boolean
          association_id: string
          created_at: string
          description: string | null
          id: string
          mode_calcul: string
          montant_fixe: number | null
          nom: string
          pourcentage_cotisations: number | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          association_id?: string
          created_at?: string
          description?: string | null
          id?: string
          mode_calcul?: string
          montant_fixe?: number | null
          nom: string
          pourcentage_cotisations?: number | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          association_id?: string
          created_at?: string
          description?: string | null
          id?: string
          mode_calcul?: string
          montant_fixe?: number | null
          nom?: string
          pourcentage_cotisations?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beneficiaires_config_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficiaires_paiements_audit: {
        Row: {
          action: string
          association_id: string
          created_at: string
          deductions: Json | null
          effectue_par: string | null
          exercice_id: string | null
          id: string
          ip_address: unknown
          membre_id: string
          montant_brut: number | null
          montant_final: number | null
          notes: string | null
          reunion_beneficiaire_id: string | null
          reunion_id: string | null
          statut_apres: string | null
          statut_avant: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          association_id?: string
          created_at?: string
          deductions?: Json | null
          effectue_par?: string | null
          exercice_id?: string | null
          id?: string
          ip_address?: unknown
          membre_id: string
          montant_brut?: number | null
          montant_final?: number | null
          notes?: string | null
          reunion_beneficiaire_id?: string | null
          reunion_id?: string | null
          statut_apres?: string | null
          statut_avant?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          association_id?: string
          created_at?: string
          deductions?: Json | null
          effectue_par?: string | null
          exercice_id?: string | null
          id?: string
          ip_address?: unknown
          membre_id?: string
          montant_brut?: number | null
          montant_final?: number | null
          notes?: string | null
          reunion_beneficiaire_id?: string | null
          reunion_id?: string | null
          statut_apres?: string | null
          statut_avant?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beneficiaires_paiements_audit_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficiaires_paiements_audit_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficiaires_paiements_audit_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "beneficiaires_paiements_audit_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficiaires_paiements_audit_reunion_beneficiaire_id_fkey"
            columns: ["reunion_beneficiaire_id"]
            isOneToOne: false
            referencedRelation: "reunion_beneficiaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficiaires_paiements_audit_reunion_id_fkey"
            columns: ["reunion_id"]
            isOneToOne: false
            referencedRelation: "reunions"
            referencedColumns: ["id"]
          },
        ]
      }
      caisse_config: {
        Row: {
          association_id: string
          created_at: string | null
          id: string
          pourcentage_empruntable: number | null
          seuil_alerte_empruntable: number | null
          seuil_alerte_solde: number | null
          updated_at: string | null
        }
        Insert: {
          association_id?: string
          created_at?: string | null
          id?: string
          pourcentage_empruntable?: number | null
          seuil_alerte_empruntable?: number | null
          seuil_alerte_solde?: number | null
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string | null
          id?: string
          pourcentage_empruntable?: number | null
          seuil_alerte_empruntable?: number | null
          seuil_alerte_solde?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "caisse_config_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendrier_beneficiaires: {
        Row: {
          association_id: string
          created_at: string
          date_prevue: string | null
          exercice_id: string
          id: string
          membre_id: string
          mois_benefice: number | null
          montant_mensuel: number
          montant_total: number
          notes: string | null
          ordre_mois: number | null
          rang: number
          updated_at: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          date_prevue?: string | null
          exercice_id: string
          id?: string
          membre_id: string
          mois_benefice?: number | null
          montant_mensuel?: number
          montant_total?: number
          notes?: string | null
          ordre_mois?: number | null
          rang: number
          updated_at?: string
        }
        Update: {
          association_id?: string
          created_at?: string
          date_prevue?: string | null
          exercice_id?: string
          id?: string
          membre_id?: string
          mois_benefice?: number | null
          montant_mensuel?: number
          montant_total?: number
          notes?: string | null
          ordre_mois?: number | null
          rang?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendrier_beneficiaires_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendrier_beneficiaires_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendrier_beneficiaires_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "calendrier_beneficiaires_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_events: {
        Row: {
          association_id: string
          auto_sync: boolean | null
          created_at: string | null
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          location: string | null
          match_id: string | null
          match_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          association_id?: string
          auto_sync?: boolean | null
          created_at?: string | null
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          match_id?: string | null
          match_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          auto_sync?: boolean | null
          created_at?: string | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          match_id?: string | null
          match_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_events_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_gallery: {
        Row: {
          album_name: string
          association_id: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          is_active: boolean | null
          order_index: number | null
          thumbnail_url: string | null
          title: string | null
          video_url: string | null
        }
        Insert: {
          album_name: string
          association_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string | null
          video_url?: string | null
        }
        Update: {
          album_name?: string
          association_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_gallery_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_hero_slides: {
        Row: {
          association_id: string
          background_image: string
          created_at: string | null
          cta_link: string | null
          cta_text: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          association_id?: string
          background_image: string
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          background_image?: string
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_hero_slides_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          association_id: string
          content: string | null
          created_at: string | null
          id: string
          meta_description: string | null
          meta_keywords: string | null
          page_key: string
          title: string
          updated_at: string | null
        }
        Insert: {
          association_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          page_key: string
          title: string
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          page_key?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_pages_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_partners: {
        Row: {
          association_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string
          name: string
          order_index: number | null
          website_url: string | null
        }
        Insert: {
          association_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url: string
          name: string
          order_index?: number | null
          website_url?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string
          name?: string
          order_index?: number | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_partners_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_sections: {
        Row: {
          association_id: string
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          order_index: number | null
          page_key: string
          subtitle: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          association_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          order_index?: number | null
          page_key: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          order_index?: number | null
          page_key?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_sections_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_settings: {
        Row: {
          association_id: string
          description: string | null
          key: string
          label: string | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          association_id?: string
          description?: string | null
          key: string
          label?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          association_id?: string
          description?: string | null
          key?: string
          label?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_settings_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      configurations: {
        Row: {
          cle: string
          created_at: string
          description: string | null
          id: string
          updated_at: string
          valeur: string
        }
        Insert: {
          cle: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          valeur: string
        }
        Update: {
          cle?: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          valeur?: string
        }
        Relationships: []
      }
      cotisations: {
        Row: {
          association_id: string
          created_at: string | null
          date_paiement: string | null
          exercice_id: string | null
          id: string
          justificatif_url: string | null
          membre_id: string | null
          montant: number
          notes: string | null
          reunion_id: string | null
          statut: string | null
          type_cotisation_id: string | null
          verrouille: boolean
          verrouille_le: string | null
          verrouille_motif: string | null
        }
        Insert: {
          association_id?: string
          created_at?: string | null
          date_paiement?: string | null
          exercice_id?: string | null
          id?: string
          justificatif_url?: string | null
          membre_id?: string | null
          montant: number
          notes?: string | null
          reunion_id?: string | null
          statut?: string | null
          type_cotisation_id?: string | null
          verrouille?: boolean
          verrouille_le?: string | null
          verrouille_motif?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string | null
          date_paiement?: string | null
          exercice_id?: string | null
          id?: string
          justificatif_url?: string | null
          membre_id?: string | null
          montant?: number
          notes?: string | null
          reunion_id?: string | null
          statut?: string | null
          type_cotisation_id?: string | null
          verrouille?: boolean
          verrouille_le?: string | null
          verrouille_motif?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cotisations_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotisations_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotisations_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "cotisations_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotisations_reunion_id_fkey"
            columns: ["reunion_id"]
            isOneToOne: false
            referencedRelation: "reunions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotisations_type_cotisation_id_fkey"
            columns: ["type_cotisation_id"]
            isOneToOne: false
            referencedRelation: "cotisations_types"
            referencedColumns: ["id"]
          },
        ]
      }
      cotisations_membres: {
        Row: {
          actif: boolean
          created_at: string
          exercice_id: string
          id: string
          membre_id: string
          montant_personnalise: number
          type_cotisation_id: string
          updated_at: string
          verrouille: boolean | null
        }
        Insert: {
          actif?: boolean
          created_at?: string
          exercice_id: string
          id?: string
          membre_id: string
          montant_personnalise?: number
          type_cotisation_id: string
          updated_at?: string
          verrouille?: boolean | null
        }
        Update: {
          actif?: boolean
          created_at?: string
          exercice_id?: string
          id?: string
          membre_id?: string
          montant_personnalise?: number
          type_cotisation_id?: string
          updated_at?: string
          verrouille?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "cotisations_membres_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotisations_membres_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "cotisations_membres_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotisations_membres_type_cotisation_id_fkey"
            columns: ["type_cotisation_id"]
            isOneToOne: false
            referencedRelation: "cotisations_types"
            referencedColumns: ["id"]
          },
        ]
      }
      cotisations_mensuelles_audit: {
        Row: {
          cotisation_mensuelle_id: string | null
          created_at: string
          exercice_id: string
          id: string
          membre_id: string
          modifie_par: string | null
          montant_apres: number | null
          montant_avant: number | null
          raison: string | null
        }
        Insert: {
          cotisation_mensuelle_id?: string | null
          created_at?: string
          exercice_id: string
          id?: string
          membre_id: string
          modifie_par?: string | null
          montant_apres?: number | null
          montant_avant?: number | null
          raison?: string | null
        }
        Update: {
          cotisation_mensuelle_id?: string | null
          created_at?: string
          exercice_id?: string
          id?: string
          membre_id?: string
          modifie_par?: string | null
          montant_apres?: number | null
          montant_avant?: number | null
          raison?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cotisations_mensuelles_audit_cotisation_mensuelle_id_fkey"
            columns: ["cotisation_mensuelle_id"]
            isOneToOne: false
            referencedRelation: "cotisations_mensuelles_exercice"
            referencedColumns: ["id"]
          },
        ]
      }
      cotisations_mensuelles_exercice: {
        Row: {
          actif: boolean
          association_id: string
          created_at: string
          exercice_id: string
          id: string
          membre_id: string
          montant: number
          updated_at: string
          verrouille: boolean
        }
        Insert: {
          actif?: boolean
          association_id?: string
          created_at?: string
          exercice_id: string
          id?: string
          membre_id: string
          montant?: number
          updated_at?: string
          verrouille?: boolean
        }
        Update: {
          actif?: boolean
          association_id?: string
          created_at?: string
          exercice_id?: string
          id?: string
          membre_id?: string
          montant?: number
          updated_at?: string
          verrouille?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cotisations_mensuelles_exercice_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotisations_mensuelles_exercice_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotisations_mensuelles_exercice_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "cotisations_mensuelles_exercice_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      cotisations_minimales: {
        Row: {
          actif: boolean
          created_at: string
          id: string
          membre_id: string
          montant_mensuel: number
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          id?: string
          membre_id: string
          montant_mensuel?: number
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          id?: string
          membre_id?: string
          montant_mensuel?: number
          updated_at?: string
        }
        Relationships: []
      }
      cotisations_types: {
        Row: {
          association_id: string
          created_at: string | null
          description: string | null
          id: string
          montant_defaut: number | null
          nom: string
          obligatoire: boolean | null
          type_saisie: string | null
        }
        Insert: {
          association_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          montant_defaut?: number | null
          nom: string
          obligatoire?: boolean | null
          type_saisie?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          montant_defaut?: number | null
          nom?: string
          obligatoire?: boolean | null
          type_saisie?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cotisations_types_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      demandes_adhesion: {
        Row: {
          association_id: string
          created_at: string | null
          email: string
          id: string
          motivation: string | null
          nom: string
          prenom: string
          statut: string | null
          telephone: string | null
          type_adhesion: string
        }
        Insert: {
          association_id?: string
          created_at?: string | null
          email: string
          id?: string
          motivation?: string | null
          nom: string
          prenom: string
          statut?: string | null
          telephone?: string | null
          type_adhesion: string
        }
        Update: {
          association_id?: string
          created_at?: string | null
          email?: string
          id?: string
          motivation?: string | null
          nom?: string
          prenom?: string
          statut?: string | null
          telephone?: string | null
          type_adhesion?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandes_adhesion_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          association_id: string
          bank_transfer_reference: string | null
          created_at: string
          currency: string
          donor_email: string
          donor_message: string | null
          donor_name: string
          donor_phone: string | null
          fiscal_receipt_sent: boolean
          fiscal_receipt_url: string | null
          helloasso_payment_id: string | null
          id: string
          is_recurring: boolean
          payment_method: string
          payment_status: string
          paypal_transaction_id: string | null
          recurring_frequency: string | null
          stripe_customer_id: string | null
          stripe_payment_id: string | null
          transaction_metadata: Json | null
          updated_at: string
        }
        Insert: {
          amount: number
          association_id?: string
          bank_transfer_reference?: string | null
          created_at?: string
          currency?: string
          donor_email: string
          donor_message?: string | null
          donor_name: string
          donor_phone?: string | null
          fiscal_receipt_sent?: boolean
          fiscal_receipt_url?: string | null
          helloasso_payment_id?: string | null
          id?: string
          is_recurring?: boolean
          payment_method: string
          payment_status?: string
          paypal_transaction_id?: string | null
          recurring_frequency?: string | null
          stripe_customer_id?: string | null
          stripe_payment_id?: string | null
          transaction_metadata?: Json | null
          updated_at?: string
        }
        Update: {
          amount?: number
          association_id?: string
          bank_transfer_reference?: string | null
          created_at?: string
          currency?: string
          donor_email?: string
          donor_message?: string | null
          donor_name?: string
          donor_phone?: string | null
          fiscal_receipt_sent?: boolean
          fiscal_receipt_url?: string | null
          helloasso_payment_id?: string | null
          id?: string
          is_recurring?: boolean
          payment_method?: string
          payment_status?: string
          paypal_transaction_id?: string | null
          recurring_frequency?: string | null
          stripe_customer_id?: string | null
          stripe_payment_id?: string | null
          transaction_metadata?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          association_id: string | null
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          provider: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          association_id?: string | null
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          status: string
          subject: string
          to_email: string
        }
        Update: {
          association_id?: string | null
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      epargnes: {
        Row: {
          association_id: string
          created_at: string
          date_depot: string
          exercice_id: string | null
          id: string
          membre_id: string
          montant: number
          notes: string | null
          reunion_id: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          date_depot?: string
          exercice_id?: string | null
          id?: string
          membre_id: string
          montant: number
          notes?: string | null
          reunion_id?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          created_at?: string
          date_depot?: string
          exercice_id?: string | null
          id?: string
          membre_id?: string
          montant?: number
          notes?: string | null
          reunion_id?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "epargnes_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epargnes_reunion_id_fkey"
            columns: ["reunion_id"]
            isOneToOne: false
            referencedRelation: "reunions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_epargnes_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_epargnes_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      exercices: {
        Row: {
          association_id: string
          created_at: string
          croissance_fond_caisse: number | null
          date_debut: string
          date_fin: string
          id: string
          nom: string
          plafond_fond_caisse: number | null
          statut: string
          taux_interet_prets: number | null
        }
        Insert: {
          association_id?: string
          created_at?: string
          croissance_fond_caisse?: number | null
          date_debut: string
          date_fin: string
          id?: string
          nom: string
          plafond_fond_caisse?: number | null
          statut?: string
          taux_interet_prets?: number | null
        }
        Update: {
          association_id?: string
          created_at?: string
          croissance_fond_caisse?: number | null
          date_debut?: string
          date_fin?: string
          id?: string
          nom?: string
          plafond_fond_caisse?: number | null
          statut?: string
          taux_interet_prets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercices_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      exercices_cotisations_types: {
        Row: {
          actif: boolean | null
          association_id: string
          created_at: string | null
          exercice_id: string
          id: string
          type_cotisation_id: string
        }
        Insert: {
          actif?: boolean | null
          association_id?: string
          created_at?: string | null
          exercice_id: string
          id?: string
          type_cotisation_id: string
        }
        Update: {
          actif?: boolean | null
          association_id?: string
          created_at?: string | null
          exercice_id?: string
          id?: string
          type_cotisation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercices_cotisations_types_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercices_cotisations_types_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercices_cotisations_types_type_cotisation_id_fkey"
            columns: ["type_cotisation_id"]
            isOneToOne: false
            referencedRelation: "cotisations_types"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_contribution_settings: {
        Row: {
          actif: boolean
          association_id: string
          created_at: string
          created_by: string | null
          date_effet: string
          exercice_id: string
          id: string
          montant: number
          notes: string | null
          type_cotisation: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          association_id: string
          created_at?: string
          created_by?: string | null
          date_effet?: string
          exercice_id: string
          id?: string
          montant: number
          notes?: string | null
          type_cotisation: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          association_id?: string
          created_at?: string
          created_by?: string | null
          date_effet?: string
          exercice_id?: string
          id?: string
          montant?: number
          notes?: string | null
          type_cotisation?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_contribution_settings_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_contribution_settings_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_contribution_settings_history: {
        Row: {
          action: string
          ancien_montant: number | null
          association_id: string
          exercice_id: string
          id: string
          modifie_le: string
          modifie_par: string | null
          nouveau_montant: number | null
          setting_id: string
          type_cotisation: string
        }
        Insert: {
          action: string
          ancien_montant?: number | null
          association_id: string
          exercice_id: string
          id?: string
          modifie_le?: string
          modifie_par?: string | null
          nouveau_montant?: number | null
          setting_id: string
          type_cotisation: string
        }
        Update: {
          action?: string
          ancien_montant?: number | null
          association_id?: string
          exercice_id?: string
          id?: string
          modifie_le?: string
          modifie_par?: string | null
          nouveau_montant?: number | null
          setting_id?: string
          type_cotisation?: string
        }
        Relationships: []
      }
      exports_programmes: {
        Row: {
          actif: boolean | null
          association_id: string
          configuration: Json | null
          created_at: string | null
          dernier_export: string | null
          format: string
          frequence: string
          id: string
          jour_execution: number | null
          nom: string
          prochain_export: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          association_id?: string
          configuration?: Json | null
          created_at?: string | null
          dernier_export?: string | null
          format: string
          frequence: string
          id?: string
          jour_execution?: number | null
          nom: string
          prochain_export?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          association_id?: string
          configuration?: Json | null
          created_at?: string | null
          dernier_export?: string | null
          format?: string
          frequence?: string
          id?: string
          jour_execution?: number | null
          nom?: string
          prochain_export?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exports_programmes_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      fichiers_joint: {
        Row: {
          association_id: string
          created_at: string
          entite_id: string
          entite_type: string
          id: string
          nom_fichier: string
          taille_fichier: number | null
          type_mime: string | null
          uploaded_by: string | null
          url_fichier: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          entite_id: string
          entite_type: string
          id?: string
          nom_fichier: string
          taille_fichier?: number | null
          type_mime?: string | null
          uploaded_by?: string | null
          url_fichier: string
        }
        Update: {
          association_id?: string
          created_at?: string
          entite_id?: string
          entite_type?: string
          id?: string
          nom_fichier?: string
          taille_fichier?: number | null
          type_mime?: string | null
          uploaded_by?: string | null
          url_fichier?: string
        }
        Relationships: [
          {
            foreignKeyName: "fichiers_joint_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      fond_caisse_clotures: {
        Row: {
          association_id: string
          cloture_par: string
          created_at: string
          date_cloture: string
          ecart: number | null
          id: string
          notes: string | null
          solde_ouverture: number
          solde_reel: number
          solde_theorique: number
          total_entrees: number
          total_sorties: number
        }
        Insert: {
          association_id?: string
          cloture_par: string
          created_at?: string
          date_cloture: string
          ecart?: number | null
          id?: string
          notes?: string | null
          solde_ouverture?: number
          solde_reel?: number
          solde_theorique?: number
          total_entrees?: number
          total_sorties?: number
        }
        Update: {
          association_id?: string
          cloture_par?: string
          created_at?: string
          date_cloture?: string
          ecart?: number | null
          id?: string
          notes?: string | null
          solde_ouverture?: number
          solde_reel?: number
          solde_theorique?: number
          total_entrees?: number
          total_sorties?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_fond_caisse_clotures_cloture_par"
            columns: ["cloture_par"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_fond_caisse_clotures_cloture_par"
            columns: ["cloture_par"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fond_caisse_clotures_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      fond_caisse_operations: {
        Row: {
          association_id: string
          beneficiaire_id: string | null
          categorie: string | null
          created_at: string
          created_by: string | null
          date_operation: string
          exercice_id: string | null
          id: string
          justificatif_url: string | null
          libelle: string
          montant: number
          notes: string | null
          operateur_id: string
          reunion_id: string | null
          source_id: string | null
          source_table: string | null
          type_operation: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          association_id?: string
          beneficiaire_id?: string | null
          categorie?: string | null
          created_at?: string
          created_by?: string | null
          date_operation?: string
          exercice_id?: string | null
          id?: string
          justificatif_url?: string | null
          libelle: string
          montant: number
          notes?: string | null
          operateur_id: string
          reunion_id?: string | null
          source_id?: string | null
          source_table?: string | null
          type_operation: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          association_id?: string
          beneficiaire_id?: string | null
          categorie?: string | null
          created_at?: string
          created_by?: string | null
          date_operation?: string
          exercice_id?: string | null
          id?: string
          justificatif_url?: string | null
          libelle?: string
          montant?: number
          notes?: string | null
          operateur_id?: string
          reunion_id?: string | null
          source_id?: string | null
          source_table?: string | null
          type_operation?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_fond_caisse_operations_beneficiaire"
            columns: ["beneficiaire_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_fond_caisse_operations_beneficiaire"
            columns: ["beneficiaire_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_fond_caisse_operations_operateur"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_fond_caisse_operations_operateur"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fond_caisse_operations_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fond_caisse_operations_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fond_caisse_operations_reunion_id_fkey"
            columns: ["reunion_id"]
            isOneToOne: false
            referencedRelation: "reunions"
            referencedColumns: ["id"]
          },
        ]
      }
      historique_connexion: {
        Row: {
          date_connexion: string
          id: string
          ip_address: unknown
          statut: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          date_connexion?: string
          id?: string
          ip_address?: unknown
          statut?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          date_connexion?: string
          id?: string
          ip_address?: unknown
          statut?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      loan_request_validations: {
        Row: {
          commentaire: string | null
          created_at: string
          id: string
          label: string
          loan_request_id: string
          ordre: number
          role: string
          statut: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          id?: string
          label: string
          loan_request_id: string
          ordre: number
          role: string
          statut?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          id?: string
          label?: string
          loan_request_id?: string
          ordre?: number
          role?: string
          statut?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_request_validations_loan_request_id_fkey"
            columns: ["loan_request_id"]
            isOneToOne: false
            referencedRelation: "loan_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_requests: {
        Row: {
          association_id: string
          avaliste_id: string | null
          avaliste_motif_refus: string | null
          avaliste_self: boolean
          avaliste_statut: string
          avaliste_validated_at: string | null
          capacite_remboursement: string | null
          conditions_acceptees: boolean
          created_at: string
          current_step: number
          description: string
          duree_mois: number
          garantie: string | null
          id: string
          membre_id: string
          montant: number
          motif_rejet: string | null
          pret_id: string | null
          statut: string
          updated_at: string
          urgence: string
        }
        Insert: {
          association_id?: string
          avaliste_id?: string | null
          avaliste_motif_refus?: string | null
          avaliste_self?: boolean
          avaliste_statut?: string
          avaliste_validated_at?: string | null
          capacite_remboursement?: string | null
          conditions_acceptees?: boolean
          created_at?: string
          current_step?: number
          description: string
          duree_mois: number
          garantie?: string | null
          id?: string
          membre_id: string
          montant: number
          motif_rejet?: string | null
          pret_id?: string | null
          statut?: string
          updated_at?: string
          urgence?: string
        }
        Update: {
          association_id?: string
          avaliste_id?: string | null
          avaliste_motif_refus?: string | null
          avaliste_self?: boolean
          avaliste_statut?: string
          avaliste_validated_at?: string | null
          capacite_remboursement?: string | null
          conditions_acceptees?: boolean
          created_at?: string
          current_step?: number
          description?: string
          duree_mois?: number
          garantie?: string | null
          id?: string
          membre_id?: string
          montant?: number
          motif_rejet?: string | null
          pret_id?: string | null
          statut?: string
          updated_at?: string
          urgence?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_requests_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_requests_avaliste_id_fkey"
            columns: ["avaliste_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "loan_requests_avaliste_id_fkey"
            columns: ["avaliste_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_requests_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "loan_requests_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_requests_pret_id_fkey"
            columns: ["pret_id"]
            isOneToOne: false
            referencedRelation: "prets"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_validation_config: {
        Row: {
          actif: boolean
          created_at: string
          id: string
          label: string
          ordre: number
          role: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          id?: string
          label: string
          ordre: number
          role: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          id?: string
          label?: string
          ordre?: number
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      match_compte_rendus: {
        Row: {
          ambiance: string | null
          arbitrage_commentaire: string | null
          association_id: string
          conditions_jeu: string | null
          created_at: string | null
          created_by: string | null
          faits_marquants: string | null
          id: string
          match_id: string
          resume: string | null
          score_mi_temps: string | null
          updated_at: string | null
        }
        Insert: {
          ambiance?: string | null
          arbitrage_commentaire?: string | null
          association_id?: string
          conditions_jeu?: string | null
          created_at?: string | null
          created_by?: string | null
          faits_marquants?: string | null
          id?: string
          match_id: string
          resume?: string | null
          score_mi_temps?: string | null
          updated_at?: string | null
        }
        Update: {
          ambiance?: string | null
          arbitrage_commentaire?: string | null
          association_id?: string
          conditions_jeu?: string | null
          created_at?: string | null
          created_by?: string | null
          faits_marquants?: string | null
          id?: string
          match_id?: string
          resume?: string | null
          score_mi_temps?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_compte_rendus_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_compte_rendus_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "sport_e2d_matchs"
            referencedColumns: ["id"]
          },
        ]
      }
      match_gala_config: {
        Row: {
          actif: boolean | null
          association_id: string
          created_at: string | null
          id: string
          nombre_matchs_minimum: number | null
          pourcentage_presence_minimum: number | null
          sanctions_max: number | null
          taux_cotisation_minimum: number | null
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          association_id?: string
          created_at?: string | null
          id?: string
          nombre_matchs_minimum?: number | null
          pourcentage_presence_minimum?: number | null
          sanctions_max?: number | null
          taux_cotisation_minimum?: number | null
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          association_id?: string
          created_at?: string | null
          id?: string
          nombre_matchs_minimum?: number | null
          pourcentage_presence_minimum?: number | null
          sanctions_max?: number | null
          taux_cotisation_minimum?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_gala_config_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      match_joueurs: {
        Row: {
          created_at: string | null
          equipe: string
          id: string
          match_id: string
          membre_id: string | null
          nom: string
          numero: number | null
          poste: string | null
        }
        Insert: {
          created_at?: string | null
          equipe: string
          id?: string
          match_id: string
          membre_id?: string | null
          nom: string
          numero?: number | null
          poste?: string | null
        }
        Update: {
          created_at?: string | null
          equipe?: string
          id?: string
          match_id?: string
          membre_id?: string | null
          nom?: string
          numero?: number | null
          poste?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_joueurs_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "sport_e2d_matchs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_joueurs_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "match_joueurs_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      match_medias: {
        Row: {
          association_id: string
          created_at: string | null
          created_by: string | null
          id: string
          legende: string | null
          match_id: string
          ordre: number | null
          type: string | null
          url: string
        }
        Insert: {
          association_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          legende?: string | null
          match_id: string
          ordre?: number | null
          type?: string | null
          url: string
        }
        Update: {
          association_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          legende?: string | null
          match_id?: string
          ordre?: number | null
          type?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_medias_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_medias_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "sport_e2d_matchs"
            referencedColumns: ["id"]
          },
        ]
      }
      match_presences: {
        Row: {
          created_at: string
          id: string
          match_id: string
          match_type: string
          membre_id: string
          notes: string | null
          present: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          match_type: string
          membre_id: string
          notes?: string | null
          present?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          match_type?: string
          membre_id?: string
          notes?: string | null
          present?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fk_match_presences_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_match_presences_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_match_presences_membre_id"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_match_presences_membre_id"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      match_statistics: {
        Row: {
          assists: number
          association_id: string
          created_at: string
          goals: number
          id: string
          man_of_match: boolean
          match_id: string
          match_type: string
          membre_id: string | null
          player_name: string
          red_cards: number
          updated_at: string
          yellow_cards: number
        }
        Insert: {
          assists?: number
          association_id?: string
          created_at?: string
          goals?: number
          id?: string
          man_of_match?: boolean
          match_id: string
          match_type: string
          membre_id?: string | null
          player_name: string
          red_cards?: number
          updated_at?: string
          yellow_cards?: number
        }
        Update: {
          assists?: number
          association_id?: string
          created_at?: string
          goals?: number
          id?: string
          man_of_match?: boolean
          match_id?: string
          match_type?: string
          membre_id?: string | null
          player_name?: string
          red_cards?: number
          updated_at?: string
          yellow_cards?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_statistics_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_statistics_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "match_statistics_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      membres: {
        Row: {
          association_id: string
          autoriser_plusieurs_cotisations_mensuelles: boolean
          created_at: string | null
          date_inscription: string | null
          email: string | null
          equipe: string | null
          equipe_e2d: string | null
          equipe_jaune_rouge: string | null
          equipe_phoenix: string | null
          est_adherent_phoenix: boolean | null
          est_membre_e2d: boolean | null
          fonction: string | null
          id: string
          nom: string
          photo_url: string | null
          prenom: string
          statut: string | null
          telephone: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          association_id?: string
          autoriser_plusieurs_cotisations_mensuelles?: boolean
          created_at?: string | null
          date_inscription?: string | null
          email?: string | null
          equipe?: string | null
          equipe_e2d?: string | null
          equipe_jaune_rouge?: string | null
          equipe_phoenix?: string | null
          est_adherent_phoenix?: boolean | null
          est_membre_e2d?: boolean | null
          fonction?: string | null
          id?: string
          nom: string
          photo_url?: string | null
          prenom: string
          statut?: string | null
          telephone: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          association_id?: string
          autoriser_plusieurs_cotisations_mensuelles?: boolean
          created_at?: string | null
          date_inscription?: string | null
          email?: string | null
          equipe?: string | null
          equipe_e2d?: string | null
          equipe_jaune_rouge?: string | null
          equipe_phoenix?: string | null
          est_adherent_phoenix?: boolean | null
          est_membre_e2d?: boolean | null
          fonction?: string | null
          id?: string
          nom?: string
          photo_url?: string | null
          prenom?: string
          statut?: string | null
          telephone?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membres_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      membres_cotisations_config: {
        Row: {
          created_at: string
          id: string
          membre_id: string
          montant_personnalise: number
          type_cotisation_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          membre_id: string
          montant_personnalise: number
          type_cotisation_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          membre_id?: string
          montant_personnalise?: number
          type_cotisation_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membres_cotisations_config_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "membres_cotisations_config_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membres_cotisations_config_type_cotisation_id_fkey"
            columns: ["type_cotisation_id"]
            isOneToOne: false
            referencedRelation: "cotisations_types"
            referencedColumns: ["id"]
          },
        ]
      }
      membres_roles: {
        Row: {
          created_at: string | null
          id: string
          membre_id: string | null
          role_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          membre_id?: string | null
          role_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          membre_id?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membres_roles_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "membres_roles_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membres_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_contact: {
        Row: {
          association_id: string
          created_at: string | null
          email: string
          id: string
          message: string
          nom: string
          objet: string
          statut: string | null
          telephone: string | null
        }
        Insert: {
          association_id?: string
          created_at?: string | null
          email: string
          id?: string
          message: string
          nom: string
          objet: string
          statut?: string | null
          telephone?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          nom?: string
          objet?: string
          statut?: string | null
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_contact_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          association_id: string
          body: string | null
          created_at: string
          id: string
          link: string | null
          metadata: Json
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          association_id?: string
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          association_id?: string
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_campagnes: {
        Row: {
          association_id: string | null
          created_at: string
          created_by: string
          date_envoi_prevue: string | null
          date_envoi_reelle: string | null
          description: string | null
          destinataires: Json
          id: string
          nb_destinataires: number | null
          nb_envoyes: number | null
          nb_erreurs: number | null
          nom: string
          statut: string
          template_contenu: string
          template_sujet: string
          type_campagne: string
          updated_at: string
        }
        Insert: {
          association_id?: string | null
          created_at?: string
          created_by: string
          date_envoi_prevue?: string | null
          date_envoi_reelle?: string | null
          description?: string | null
          destinataires?: Json
          id?: string
          nb_destinataires?: number | null
          nb_envoyes?: number | null
          nb_erreurs?: number | null
          nom: string
          statut?: string
          template_contenu: string
          template_sujet: string
          type_campagne: string
          updated_at?: string
        }
        Update: {
          association_id?: string | null
          created_at?: string
          created_by?: string
          date_envoi_prevue?: string | null
          date_envoi_reelle?: string | null
          description?: string | null
          destinataires?: Json
          id?: string
          nb_destinataires?: number | null
          nb_envoyes?: number | null
          nb_erreurs?: number | null
          nom?: string
          statut?: string
          template_contenu?: string
          template_sujet?: string
          type_campagne?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_campagnes_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_notifications_campagnes_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_campagnes_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_config: {
        Row: {
          actif: boolean
          association_id: string | null
          created_at: string
          delai_jours: number
          id: string
          template_contenu: string | null
          template_sujet: string | null
          type_notification: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          association_id?: string | null
          created_at?: string
          delai_jours?: number
          id?: string
          template_contenu?: string | null
          template_sujet?: string | null
          type_notification: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          association_id?: string | null
          created_at?: string
          delai_jours?: number
          id?: string
          template_contenu?: string | null
          template_sujet?: string | null
          type_notification?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_config_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_envois: {
        Row: {
          association_id: string | null
          campagne_id: string
          canal: string
          created_at: string
          date_envoi: string | null
          date_lecture: string | null
          erreur_message: string | null
          id: string
          membre_id: string
          metadata: Json | null
          statut: string
        }
        Insert: {
          association_id?: string | null
          campagne_id: string
          canal: string
          created_at?: string
          date_envoi?: string | null
          date_lecture?: string | null
          erreur_message?: string | null
          id?: string
          membre_id: string
          metadata?: Json | null
          statut?: string
        }
        Update: {
          association_id?: string | null
          campagne_id?: string
          canal?: string
          created_at?: string
          date_envoi?: string | null
          date_lecture?: string | null
          erreur_message?: string | null
          id?: string
          membre_id?: string
          metadata?: Json | null
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_envois_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_notifications_envois_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_envois_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_envois_campagne_id_fkey"
            columns: ["campagne_id"]
            isOneToOne: false
            referencedRelation: "notifications_campagnes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_historique: {
        Row: {
          association_id: string | null
          contenu: string
          created_at: string
          date_envoi: string
          destinataire_email: string
          erreur_message: string | null
          id: string
          statut: string
          sujet: string
          type_notification: string
          updated_at: string
          variables_utilisees: Json | null
        }
        Insert: {
          association_id?: string | null
          contenu: string
          created_at?: string
          date_envoi?: string
          destinataire_email: string
          erreur_message?: string | null
          id?: string
          statut?: string
          sujet: string
          type_notification: string
          updated_at?: string
          variables_utilisees?: Json | null
        }
        Update: {
          association_id?: string | null
          contenu?: string
          created_at?: string
          date_envoi?: string
          destinataire_email?: string
          erreur_message?: string | null
          id?: string
          statut?: string
          sujet?: string
          type_notification?: string
          updated_at?: string
          variables_utilisees?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_historique_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_logs: {
        Row: {
          association_id: string | null
          campagne_id: string | null
          created_at: string | null
          destinataire_email: string
          destinataire_id: string | null
          erreur: string | null
          id: string
          metadata: Json | null
          statut: string | null
          sujet: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          association_id?: string | null
          campagne_id?: string | null
          created_at?: string | null
          destinataire_email: string
          destinataire_id?: string | null
          erreur?: string | null
          id?: string
          metadata?: Json | null
          statut?: string | null
          sujet?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          association_id?: string | null
          campagne_id?: string | null
          created_at?: string | null
          destinataire_email?: string
          destinataire_id?: string | null
          erreur?: string | null
          id?: string
          metadata?: Json | null
          statut?: string | null
          sujet?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_logs_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_logs_destinataire_id_fkey"
            columns: ["destinataire_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "notifications_logs_destinataire_id_fkey"
            columns: ["destinataire_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notifications_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_templates: {
        Row: {
          actif: boolean | null
          association_id: string | null
          categorie: string
          code: string
          created_at: string | null
          description: string | null
          email_expediteur: string | null
          id: string
          nom: string
          template_contenu: string
          template_sujet: string
          updated_at: string | null
          variables_disponibles: Json | null
        }
        Insert: {
          actif?: boolean | null
          association_id?: string | null
          categorie: string
          code: string
          created_at?: string | null
          description?: string | null
          email_expediteur?: string | null
          id?: string
          nom: string
          template_contenu: string
          template_sujet: string
          updated_at?: string | null
          variables_disponibles?: Json | null
        }
        Update: {
          actif?: boolean | null
          association_id?: string | null
          categorie?: string
          code?: string
          created_at?: string | null
          description?: string | null
          email_expediteur?: string | null
          id?: string
          nom?: string
          template_contenu?: string
          template_sujet?: string
          updated_at?: string | null
          variables_disponibles?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_templates_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_configs: {
        Row: {
          association_id: string
          config_data: Json
          created_at: string
          id: string
          is_active: boolean
          provider: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          association_id?: string
          config_data?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          provider: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          association_id?: string
          config_data?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          provider?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_configs_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions_audit: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      phoenix_adherents: {
        Row: {
          adhesion_payee: boolean | null
          association_id: string
          created_at: string | null
          date_adhesion: string | null
          date_limite_paiement: string | null
          id: string
          membre_id: string | null
          montant_adhesion: number | null
        }
        Insert: {
          adhesion_payee?: boolean | null
          association_id?: string
          created_at?: string | null
          date_adhesion?: string | null
          date_limite_paiement?: string | null
          id?: string
          membre_id?: string | null
          montant_adhesion?: number | null
        }
        Update: {
          adhesion_payee?: boolean | null
          association_id?: string
          created_at?: string | null
          date_adhesion?: string | null
          date_limite_paiement?: string | null
          id?: string
          membre_id?: string | null
          montant_adhesion?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "phoenix_adherents_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phoenix_adherents_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "phoenix_adherents_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_compositions: {
        Row: {
          association_id: string
          created_at: string
          equipe_nom: string
          est_capitaine: boolean | null
          id: string
          match_id: string
          membre_id: string
          poste: string | null
        }
        Insert: {
          association_id?: string
          created_at?: string
          equipe_nom: string
          est_capitaine?: boolean | null
          id?: string
          match_id: string
          membre_id: string
          poste?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string
          equipe_nom?: string
          est_capitaine?: boolean | null
          id?: string
          match_id?: string
          membre_id?: string
          poste?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_phoenix_compositions_match"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "sport_phoenix_matchs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_phoenix_compositions_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_phoenix_compositions_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phoenix_compositions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_cotisations_annuelles: {
        Row: {
          annee: number
          association_id: string
          created_at: string
          date_paiement: string | null
          id: string
          membre_id: string
          montant: number
          notes: string | null
          statut: string | null
          updated_at: string
        }
        Insert: {
          annee: number
          association_id?: string
          created_at?: string
          date_paiement?: string | null
          id?: string
          membre_id: string
          montant?: number
          notes?: string | null
          statut?: string | null
          updated_at?: string
        }
        Update: {
          annee?: number
          association_id?: string
          created_at?: string
          date_paiement?: string | null
          id?: string
          membre_id?: string
          montant?: number
          notes?: string | null
          statut?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_phoenix_cotisations_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_phoenix_cotisations_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phoenix_cotisations_annuelles_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_entrainements: {
        Row: {
          association_id: string
          created_at: string
          date_entrainement: string
          heure_debut: string | null
          heure_fin: string | null
          id: string
          lieu: string | null
          notes: string | null
          type_entrainement: string | null
        }
        Insert: {
          association_id?: string
          created_at?: string
          date_entrainement: string
          heure_debut?: string | null
          heure_fin?: string | null
          id?: string
          lieu?: string | null
          notes?: string | null
          type_entrainement?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string
          date_entrainement?: string
          heure_debut?: string | null
          heure_fin?: string | null
          id?: string
          lieu?: string | null
          notes?: string | null
          type_entrainement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phoenix_entrainements_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_entrainements_internes: {
        Row: {
          association_id: string
          created_at: string
          date_entrainement: string
          equipe_gagnante: string | null
          heure_debut: string | null
          heure_fin: string | null
          id: string
          lieu: string | null
          notes: string | null
          score_jaune: number | null
          score_rouge: number | null
          statut: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          date_entrainement: string
          equipe_gagnante?: string | null
          heure_debut?: string | null
          heure_fin?: string | null
          id?: string
          lieu?: string | null
          notes?: string | null
          score_jaune?: number | null
          score_rouge?: number | null
          statut?: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          created_at?: string
          date_entrainement?: string
          equipe_gagnante?: string | null
          heure_debut?: string | null
          heure_fin?: string | null
          id?: string
          lieu?: string | null
          notes?: string | null
          score_jaune?: number | null
          score_rouge?: number | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phoenix_entrainements_internes_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_equipes: {
        Row: {
          association_id: string
          couleur_hex: string | null
          created_at: string
          id: string
          nom: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          couleur_hex?: string | null
          created_at?: string
          id?: string
          nom: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          couleur_hex?: string | null
          created_at?: string
          id?: string
          nom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phoenix_equipes_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_evenements_match: {
        Row: {
          association_id: string
          created_at: string
          description: string | null
          equipe_nom: string
          id: string
          match_id: string
          membre_id: string
          minute: number | null
          type_evenement: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          description?: string | null
          equipe_nom: string
          id?: string
          match_id: string
          membre_id: string
          minute?: number | null
          type_evenement: string
        }
        Update: {
          association_id?: string
          created_at?: string
          description?: string | null
          equipe_nom?: string
          id?: string
          match_id?: string
          membre_id?: string
          minute?: number | null
          type_evenement?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_phoenix_evenements_match"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "sport_phoenix_matchs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_phoenix_evenements_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_phoenix_evenements_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phoenix_evenements_match_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_presences: {
        Row: {
          adherent_id: string | null
          association_id: string
          created_at: string | null
          date_entrainement: string
          id: string
          present: boolean | null
        }
        Insert: {
          adherent_id?: string | null
          association_id?: string
          created_at?: string | null
          date_entrainement: string
          id?: string
          present?: boolean | null
        }
        Update: {
          adherent_id?: string | null
          association_id?: string
          created_at?: string | null
          date_entrainement?: string
          id?: string
          present?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "phoenix_presences_adherent_id_fkey"
            columns: ["adherent_id"]
            isOneToOne: false
            referencedRelation: "phoenix_adherents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phoenix_presences_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_presences_entrainement: {
        Row: {
          association_id: string
          created_at: string
          entrainement_id: string
          excuse: string | null
          id: string
          membre_id: string
          present: boolean | null
          retard_minutes: number | null
        }
        Insert: {
          association_id?: string
          created_at?: string
          entrainement_id: string
          excuse?: string | null
          id?: string
          membre_id: string
          present?: boolean | null
          retard_minutes?: number | null
        }
        Update: {
          association_id?: string
          created_at?: string
          entrainement_id?: string
          excuse?: string | null
          id?: string
          membre_id?: string
          present?: boolean | null
          retard_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_phoenix_presences_entrainement"
            columns: ["entrainement_id"]
            isOneToOne: false
            referencedRelation: "phoenix_entrainements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_phoenix_presences_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_phoenix_presences_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phoenix_presences_entrainement_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_statistiques_annuelles: {
        Row: {
          annee: number
          association_id: string
          buts_jaune: number | null
          buts_rouge: number | null
          cartons_jaunes_jaune: number | null
          cartons_jaunes_rouge: number | null
          cartons_rouges_jaune: number | null
          cartons_rouges_rouge: number | null
          created_at: string
          exercice_id: string | null
          id: string
          matchs_nuls: number | null
          total_matchs_jaune: number | null
          total_matchs_rouge: number | null
          updated_at: string
          victoires_jaune: number | null
          victoires_rouge: number | null
        }
        Insert: {
          annee: number
          association_id?: string
          buts_jaune?: number | null
          buts_rouge?: number | null
          cartons_jaunes_jaune?: number | null
          cartons_jaunes_rouge?: number | null
          cartons_rouges_jaune?: number | null
          cartons_rouges_rouge?: number | null
          created_at?: string
          exercice_id?: string | null
          id?: string
          matchs_nuls?: number | null
          total_matchs_jaune?: number | null
          total_matchs_rouge?: number | null
          updated_at?: string
          victoires_jaune?: number | null
          victoires_rouge?: number | null
        }
        Update: {
          annee?: number
          association_id?: string
          buts_jaune?: number | null
          buts_rouge?: number | null
          cartons_jaunes_jaune?: number | null
          cartons_jaunes_rouge?: number | null
          cartons_rouges_jaune?: number | null
          cartons_rouges_rouge?: number | null
          created_at?: string
          exercice_id?: string | null
          id?: string
          matchs_nuls?: number | null
          total_matchs_jaune?: number | null
          total_matchs_rouge?: number | null
          updated_at?: string
          victoires_jaune?: number | null
          victoires_rouge?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "phoenix_statistiques_annuelles_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phoenix_statistiques_annuelles_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_statistiques_joueur: {
        Row: {
          arrets_gardien: number | null
          association_id: string
          buts: number | null
          cartons_jaunes: number | null
          cartons_rouges: number | null
          created_at: string
          id: string
          matchs_joues: number | null
          membre_id: string
          note_moyenne: number | null
          passes_decisives: number | null
          saison: string
          updated_at: string
        }
        Insert: {
          arrets_gardien?: number | null
          association_id?: string
          buts?: number | null
          cartons_jaunes?: number | null
          cartons_rouges?: number | null
          created_at?: string
          id?: string
          matchs_joues?: number | null
          membre_id: string
          note_moyenne?: number | null
          passes_decisives?: number | null
          saison: string
          updated_at?: string
        }
        Update: {
          arrets_gardien?: number | null
          association_id?: string
          buts?: number | null
          cartons_jaunes?: number | null
          cartons_rouges?: number | null
          created_at?: string
          id?: string
          matchs_joues?: number | null
          membre_id?: string
          note_moyenne?: number | null
          passes_decisives?: number | null
          saison?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_phoenix_statistiques_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_phoenix_statistiques_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phoenix_statistiques_joueur_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_stats_jaune_rouge: {
        Row: {
          annee: number
          association_id: string
          buts_jaune: number | null
          buts_rouge: number | null
          cartons_jaunes_jaune: number | null
          cartons_jaunes_rouge: number | null
          cartons_rouges_jaune: number | null
          cartons_rouges_rouge: number | null
          created_at: string
          id: string
          matchs_nuls: number | null
          updated_at: string
          victoires_jaune: number | null
          victoires_rouge: number | null
        }
        Insert: {
          annee: number
          association_id?: string
          buts_jaune?: number | null
          buts_rouge?: number | null
          cartons_jaunes_jaune?: number | null
          cartons_jaunes_rouge?: number | null
          cartons_rouges_jaune?: number | null
          cartons_rouges_rouge?: number | null
          created_at?: string
          id?: string
          matchs_nuls?: number | null
          updated_at?: string
          victoires_jaune?: number | null
          victoires_rouge?: number | null
        }
        Update: {
          annee?: number
          association_id?: string
          buts_jaune?: number | null
          buts_rouge?: number | null
          cartons_jaunes_jaune?: number | null
          cartons_jaunes_rouge?: number | null
          cartons_rouges_jaune?: number | null
          cartons_rouges_rouge?: number | null
          created_at?: string
          id?: string
          matchs_nuls?: number | null
          updated_at?: string
          victoires_jaune?: number | null
          victoires_rouge?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "phoenix_stats_jaune_rouge_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          cle: string
          created_at: string
          description: string | null
          id: string
          updated_at: string
          valeur: Json | null
        }
        Insert: {
          cle: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          valeur?: Json | null
        }
        Update: {
          cle?: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          valeur?: Json | null
        }
        Relationships: []
      }
      pret_reconduction_validation_config: {
        Row: {
          actif: boolean
          association_id: string
          created_at: string
          id: string
          label: string
          ordre: number
          role: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          association_id?: string
          created_at?: string
          id?: string
          label: string
          ordre: number
          role: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          association_id?: string
          created_at?: string
          id?: string
          label?: string
          ordre?: number
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pret_reconduction_validation_config_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      pret_reconduction_validations: {
        Row: {
          commentaire: string | null
          created_at: string
          id: string
          label: string
          ordre: number
          reconduction_id: string
          role: string
          statut: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          id?: string
          label: string
          ordre: number
          reconduction_id: string
          role: string
          statut?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          id?: string
          label?: string
          ordre?: number
          reconduction_id?: string
          role?: string
          statut?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pret_reconduction_validations_reconduction_id_fkey"
            columns: ["reconduction_id"]
            isOneToOne: false
            referencedRelation: "prets_reconductions"
            referencedColumns: ["id"]
          },
        ]
      }
      prets: {
        Row: {
          association_id: string
          avaliste_id: string | null
          capital_paye: number | null
          created_at: string
          date_pret: string
          dernier_interet: number | null
          duree_mois: number | null
          echeance: string
          exercice_id: string | null
          id: string
          interet_initial: number | null
          interet_paye: number | null
          justificatif_url: string | null
          membre_id: string
          montant: number
          montant_paye: number | null
          montant_total_du: number | null
          notes: string | null
          reconductions: number | null
          reunion_id: string | null
          statut: string
          taux_interet: number | null
          updated_at: string
        }
        Insert: {
          association_id?: string
          avaliste_id?: string | null
          capital_paye?: number | null
          created_at?: string
          date_pret?: string
          dernier_interet?: number | null
          duree_mois?: number | null
          echeance: string
          exercice_id?: string | null
          id?: string
          interet_initial?: number | null
          interet_paye?: number | null
          justificatif_url?: string | null
          membre_id: string
          montant: number
          montant_paye?: number | null
          montant_total_du?: number | null
          notes?: string | null
          reconductions?: number | null
          reunion_id?: string | null
          statut?: string
          taux_interet?: number | null
          updated_at?: string
        }
        Update: {
          association_id?: string
          avaliste_id?: string | null
          capital_paye?: number | null
          created_at?: string
          date_pret?: string
          dernier_interet?: number | null
          duree_mois?: number | null
          echeance?: string
          exercice_id?: string | null
          id?: string
          interet_initial?: number | null
          interet_paye?: number | null
          justificatif_url?: string | null
          membre_id?: string
          montant?: number
          montant_paye?: number | null
          montant_total_du?: number | null
          notes?: string | null
          reconductions?: number | null
          reunion_id?: string | null
          statut?: string
          taux_interet?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_prets_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_prets_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prets_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prets_avaliste_id_fkey"
            columns: ["avaliste_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "prets_avaliste_id_fkey"
            columns: ["avaliste_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prets_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prets_reunion_id_fkey"
            columns: ["reunion_id"]
            isOneToOne: false
            referencedRelation: "reunions"
            referencedColumns: ["id"]
          },
        ]
      }
      prets_config: {
        Row: {
          association_id: string
          created_at: string | null
          duree_mois: number
          duree_reconduction: number
          exercice_id: string | null
          id: string
          interet_avant_capital: boolean
          max_reconductions: number
          taux_interet_defaut: number
          updated_at: string | null
        }
        Insert: {
          association_id?: string
          created_at?: string | null
          duree_mois?: number
          duree_reconduction?: number
          exercice_id?: string | null
          id?: string
          interet_avant_capital?: boolean
          max_reconductions?: number
          taux_interet_defaut?: number
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string | null
          duree_mois?: number
          duree_reconduction?: number
          exercice_id?: string | null
          id?: string
          interet_avant_capital?: boolean
          max_reconductions?: number
          taux_interet_defaut?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prets_config_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prets_config_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: true
            referencedRelation: "exercices"
            referencedColumns: ["id"]
          },
        ]
      }
      prets_paiements: {
        Row: {
          association_id: string
          created_at: string
          date_paiement: string
          id: string
          mode_paiement: string
          montant_paye: number
          notes: string | null
          pret_id: string
          type_paiement: string | null
          updated_at: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          date_paiement?: string
          id?: string
          mode_paiement?: string
          montant_paye: number
          notes?: string | null
          pret_id: string
          type_paiement?: string | null
          updated_at?: string
        }
        Update: {
          association_id?: string
          created_at?: string
          date_paiement?: string
          id?: string
          mode_paiement?: string
          montant_paye?: number
          notes?: string | null
          pret_id?: string
          type_paiement?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prets_paiements_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prets_paiements_pret_id_fkey"
            columns: ["pret_id"]
            isOneToOne: false
            referencedRelation: "prets"
            referencedColumns: ["id"]
          },
        ]
      }
      prets_reconductions: {
        Row: {
          association_id: string
          created_at: string | null
          created_by: string | null
          current_step: number | null
          date_reconduction: string
          id: string
          interet_mois: number
          motif_rejet: string | null
          notes: string | null
          pret_id: string
          statut: string
          validee_le: string | null
          validee_par: string | null
        }
        Insert: {
          association_id?: string
          created_at?: string | null
          created_by?: string | null
          current_step?: number | null
          date_reconduction?: string
          id?: string
          interet_mois: number
          motif_rejet?: string | null
          notes?: string | null
          pret_id: string
          statut?: string
          validee_le?: string | null
          validee_par?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string | null
          created_by?: string | null
          current_step?: number | null
          date_reconduction?: string
          id?: string
          interet_mois?: number
          motif_rejet?: string | null
          notes?: string | null
          pret_id?: string
          statut?: string
          validee_le?: string | null
          validee_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prets_reconductions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prets_reconductions_pret_id_fkey"
            columns: ["pret_id"]
            isOneToOne: false
            referencedRelation: "prets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          association_id: string
          created_at: string | null
          date_inscription: string | null
          email: string | null
          est_adherent_phoenix: boolean | null
          est_membre_e2d: boolean | null
          id: string
          last_login: string | null
          must_change_password: boolean | null
          nom: string
          password_changed: boolean | null
          photo_url: string | null
          prenom: string
          status: string
          statut: string | null
          telephone: string | null
          updated_at: string | null
        }
        Insert: {
          association_id?: string
          created_at?: string | null
          date_inscription?: string | null
          email?: string | null
          est_adherent_phoenix?: boolean | null
          est_membre_e2d?: boolean | null
          id: string
          last_login?: string | null
          must_change_password?: boolean | null
          nom: string
          password_changed?: boolean | null
          photo_url?: string | null
          prenom: string
          status?: string
          statut?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string | null
          date_inscription?: string | null
          email?: string | null
          est_adherent_phoenix?: boolean | null
          est_membre_e2d?: boolean | null
          id?: string
          last_login?: string | null
          must_change_password?: boolean | null
          nom?: string
          password_changed?: boolean | null
          photo_url?: string | null
          prenom?: string
          status?: string
          statut?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      rapports_seances: {
        Row: {
          association_id: string
          created_at: string
          decisions: string | null
          description: string | null
          id: string
          numero_ordre: number | null
          resolution: string | null
          reunion_id: string
          sujet: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          decisions?: string | null
          description?: string | null
          id?: string
          numero_ordre?: number | null
          resolution?: string | null
          reunion_id: string
          sujet: string
        }
        Update: {
          association_id?: string
          created_at?: string
          decisions?: string | null
          description?: string | null
          id?: string
          numero_ordre?: number | null
          resolution?: string | null
          reunion_id?: string
          sujet?: string
        }
        Relationships: [
          {
            foreignKeyName: "rapports_seances_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_donations: {
        Row: {
          amount: number
          association_id: string
          created_at: string
          currency: string
          donation_id: string
          donor_email: string
          frequency: string
          id: string
          last_payment_date: string | null
          next_payment_date: string | null
          paypal_subscription_id: string | null
          status: string
          stripe_subscription_id: string | null
          total_payments: number
          updated_at: string
        }
        Insert: {
          amount: number
          association_id?: string
          created_at?: string
          currency?: string
          donation_id: string
          donor_email: string
          frequency: string
          id?: string
          last_payment_date?: string | null
          next_payment_date?: string | null
          paypal_subscription_id?: string | null
          status?: string
          stripe_subscription_id?: string | null
          total_payments?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          association_id?: string
          created_at?: string
          currency?: string
          donation_id?: string
          donor_email?: string
          frequency?: string
          id?: string
          last_payment_date?: string | null
          next_payment_date?: string | null
          paypal_subscription_id?: string | null
          status?: string
          stripe_subscription_id?: string | null
          total_payments?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_donations_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_donations_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      reunion_beneficiaires: {
        Row: {
          association_id: string
          calendrier_id: string | null
          config_id: string | null
          created_at: string
          date_benefice_prevue: string
          date_paiement: string | null
          deductions: Json | null
          id: string
          membre_id: string
          montant_benefice: number
          montant_brut: number | null
          montant_final: number | null
          notes_paiement: string | null
          paye_par: string | null
          reunion_id: string
          statut: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          calendrier_id?: string | null
          config_id?: string | null
          created_at?: string
          date_benefice_prevue: string
          date_paiement?: string | null
          deductions?: Json | null
          id?: string
          membre_id: string
          montant_benefice?: number
          montant_brut?: number | null
          montant_final?: number | null
          notes_paiement?: string | null
          paye_par?: string | null
          reunion_id: string
          statut?: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          calendrier_id?: string | null
          config_id?: string | null
          created_at?: string
          date_benefice_prevue?: string
          date_paiement?: string | null
          deductions?: Json | null
          id?: string
          membre_id?: string
          montant_benefice?: number
          montant_brut?: number | null
          montant_final?: number | null
          notes_paiement?: string | null
          paye_par?: string | null
          reunion_id?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reunion_beneficiaires_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunion_beneficiaires_calendrier_id_fkey"
            columns: ["calendrier_id"]
            isOneToOne: false
            referencedRelation: "calendrier_beneficiaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunion_beneficiaires_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "beneficiaires_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunion_beneficiaires_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "reunion_beneficiaires_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunion_beneficiaires_paye_par_fkey"
            columns: ["paye_par"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "reunion_beneficiaires_paye_par_fkey"
            columns: ["paye_par"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunion_beneficiaires_reunion_id_fkey"
            columns: ["reunion_id"]
            isOneToOne: false
            referencedRelation: "reunions"
            referencedColumns: ["id"]
          },
        ]
      }
      reunions: {
        Row: {
          association_id: string
          beneficiaire_id: string | null
          compte_rendu_url: string | null
          created_at: string
          date_reunion: string
          id: string
          lieu_description: string | null
          lieu_membre_id: string | null
          ordre_du_jour: string | null
          seuil_rappel_presence: number | null
          statut: string
          sujet: string | null
          taux_presence: number | null
          type_reunion: string | null
        }
        Insert: {
          association_id?: string
          beneficiaire_id?: string | null
          compte_rendu_url?: string | null
          created_at?: string
          date_reunion: string
          id?: string
          lieu_description?: string | null
          lieu_membre_id?: string | null
          ordre_du_jour?: string | null
          seuil_rappel_presence?: number | null
          statut?: string
          sujet?: string | null
          taux_presence?: number | null
          type_reunion?: string | null
        }
        Update: {
          association_id?: string
          beneficiaire_id?: string | null
          compte_rendu_url?: string | null
          created_at?: string
          date_reunion?: string
          id?: string
          lieu_description?: string | null
          lieu_membre_id?: string | null
          ordre_du_jour?: string | null
          seuil_rappel_presence?: number | null
          statut?: string
          sujet?: string | null
          taux_presence?: number | null
          type_reunion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_reunions_lieu_membre"
            columns: ["lieu_membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_reunions_lieu_membre"
            columns: ["lieu_membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunions_beneficiaire_id_fkey"
            columns: ["beneficiaire_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "reunions_beneficiaire_id_fkey"
            columns: ["beneficiaire_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      reunions_huile_savon: {
        Row: {
          created_at: string | null
          id: string
          membre_id: string
          reunion_id: string
          updated_at: string | null
          valide: boolean | null
          valide_par: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          membre_id: string
          reunion_id: string
          updated_at?: string | null
          valide?: boolean | null
          valide_par?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          membre_id?: string
          reunion_id?: string
          updated_at?: string | null
          valide?: boolean | null
          valide_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reunions_huile_savon_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "reunions_huile_savon_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunions_huile_savon_reunion_id_fkey"
            columns: ["reunion_id"]
            isOneToOne: false
            referencedRelation: "reunions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunions_huile_savon_valide_par_fkey"
            columns: ["valide_par"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "reunions_huile_savon_valide_par_fkey"
            columns: ["valide_par"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      reunions_presences: {
        Row: {
          association_id: string
          created_at: string
          heure_arrivee: string | null
          id: string
          membre_id: string
          notes: string | null
          observations: string | null
          present: boolean
          reunion_id: string
          statut_presence: string | null
          updated_at: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          heure_arrivee?: string | null
          id?: string
          membre_id: string
          notes?: string | null
          observations?: string | null
          present?: boolean
          reunion_id: string
          statut_presence?: string | null
          updated_at?: string
        }
        Update: {
          association_id?: string
          created_at?: string
          heure_arrivee?: string | null
          id?: string
          membre_id?: string
          notes?: string | null
          observations?: string | null
          present?: boolean
          reunion_id?: string
          statut_presence?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reunions_presences_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunions_presences_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "reunions_presences_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunions_presences_reunion_id_fkey"
            columns: ["reunion_id"]
            isOneToOne: false
            referencedRelation: "reunions"
            referencedColumns: ["id"]
          },
        ]
      }
      reunions_sanctions: {
        Row: {
          association_id: string
          contexte: string | null
          created_at: string
          date_levee: string | null
          id: string
          membre_id: string
          montant_amende: number | null
          motif: string
          notes: string | null
          reunion_id: string
          statut: string
          type_sanction: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          contexte?: string | null
          created_at?: string
          date_levee?: string | null
          id?: string
          membre_id: string
          montant_amende?: number | null
          motif: string
          notes?: string | null
          reunion_id: string
          statut?: string
          type_sanction: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          contexte?: string | null
          created_at?: string
          date_levee?: string | null
          id?: string
          membre_id?: string
          montant_amende?: number | null
          motif?: string
          notes?: string | null
          reunion_id?: string
          statut?: string
          type_sanction?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reunions_sanctions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunions_sanctions_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "reunions_sanctions_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunions_sanctions_reunion_id_fkey"
            columns: ["reunion_id"]
            isOneToOne: false
            referencedRelation: "reunions"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          association_id: string | null
          created_at: string
          granted: boolean
          id: string
          permission: string
          resource: string
          role_id: string
        }
        Insert: {
          association_id?: string | null
          created_at?: string
          granted?: boolean
          id?: string
          permission: string
          resource: string
          role_id: string
        }
        Update: {
          association_id?: string | null
          created_at?: string
          granted?: boolean
          id?: string
          permission?: string
          resource?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          association_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean
          name: string
          scope: string
        }
        Insert: {
          association_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          scope?: string
        }
        Update: {
          association_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      sanctions: {
        Row: {
          association_id: string
          contexte_sanction: string | null
          created_at: string
          date_sanction: string
          id: string
          membre_id: string
          montant: number
          montant_paye: number | null
          motif: string | null
          statut: string
          type_sanction_id: string
        }
        Insert: {
          association_id?: string
          contexte_sanction?: string | null
          created_at?: string
          date_sanction?: string
          id?: string
          membre_id: string
          montant: number
          montant_paye?: number | null
          motif?: string | null
          statut?: string
          type_sanction_id: string
        }
        Update: {
          association_id?: string
          contexte_sanction?: string | null
          created_at?: string
          date_sanction?: string
          id?: string
          membre_id?: string
          montant?: number
          montant_paye?: number | null
          motif?: string | null
          statut?: string
          type_sanction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sanctions_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "e2d_player_stats_view"
            referencedColumns: ["membre_id"]
          },
          {
            foreignKeyName: "fk_sanctions_membre"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sanctions_type"
            columns: ["type_sanction_id"]
            isOneToOne: false
            referencedRelation: "sanctions_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanctions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      sanctions_tarifs: {
        Row: {
          actif: boolean
          association_id: string
          categorie_membre: string
          created_at: string
          id: string
          montant: number
          type_sanction_id: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          association_id?: string
          categorie_membre?: string
          created_at?: string
          id?: string
          montant: number
          type_sanction_id: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          association_id?: string
          categorie_membre?: string
          created_at?: string
          id?: string
          montant?: number
          type_sanction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sanctions_tarifs_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanctions_tarifs_type_sanction_id_fkey"
            columns: ["type_sanction_id"]
            isOneToOne: false
            referencedRelation: "sanctions_types"
            referencedColumns: ["id"]
          },
        ]
      }
      sanctions_types: {
        Row: {
          association_id: string
          categorie: string
          created_at: string
          description: string | null
          id: string
          montant: number
          nom: string
        }
        Insert: {
          association_id?: string
          categorie: string
          created_at?: string
          description?: string | null
          id?: string
          montant: number
          nom: string
        }
        Update: {
          association_id?: string
          categorie?: string
          created_at?: string
          description?: string | null
          id?: string
          montant?: number
          nom?: string
        }
        Relationships: [
          {
            foreignKeyName: "sanctions_types_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_scans: {
        Row: {
          created_at: string
          created_by: string | null
          critical_count: number
          id: string
          info_count: number
          report_url: string | null
          scan_date: string
          summary: string | null
          warning_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          critical_count?: number
          id?: string
          info_count?: number
          report_url?: string | null
          scan_date?: string
          summary?: string | null
          warning_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          critical_count?: number
          id?: string
          info_count?: number
          report_url?: string | null
          scan_date?: string
          summary?: string | null
          warning_count?: number
        }
        Relationships: []
      }
      session_config: {
        Row: {
          association_id: string
          created_at: string | null
          id: string
          inactivity_timeout_minutes: number
          role_type: string
          session_duration_minutes: number
          updated_at: string | null
          warning_before_logout_seconds: number | null
        }
        Insert: {
          association_id?: string
          created_at?: string | null
          id?: string
          inactivity_timeout_minutes: number
          role_type: string
          session_duration_minutes: number
          updated_at?: string | null
          warning_before_logout_seconds?: number | null
        }
        Update: {
          association_id?: string
          created_at?: string | null
          id?: string
          inactivity_timeout_minutes?: number
          role_type?: string
          session_duration_minutes?: number
          updated_at?: string | null
          warning_before_logout_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_config_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_about: {
        Row: {
          actif: boolean
          association_id: string
          created_at: string
          histoire_contenu: string
          histoire_titre: string
          id: string
          sous_titre: string
          titre: string
          updated_at: string
          valeurs: Json
        }
        Insert: {
          actif?: boolean
          association_id?: string
          created_at?: string
          histoire_contenu: string
          histoire_titre?: string
          id?: string
          sous_titre?: string
          titre?: string
          updated_at?: string
          valeurs?: Json
        }
        Update: {
          actif?: boolean
          association_id?: string
          created_at?: string
          histoire_contenu?: string
          histoire_titre?: string
          id?: string
          sous_titre?: string
          titre?: string
          updated_at?: string
          valeurs?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_about_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_activities: {
        Row: {
          actif: boolean
          association_id: string
          created_at: string
          description: string
          features: Json
          icon: string
          id: string
          ordre: number
          titre: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          association_id?: string
          created_at?: string
          description: string
          features?: Json
          icon: string
          id?: string
          ordre?: number
          titre: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          association_id?: string
          created_at?: string
          description?: string
          features?: Json
          icon?: string
          id?: string
          ordre?: number
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_activities_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_config: {
        Row: {
          association_id: string
          categorie: string
          cle: string
          created_at: string
          description: string | null
          id: string
          type: string
          updated_at: string
          valeur: string
        }
        Insert: {
          association_id?: string
          categorie?: string
          cle: string
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          updated_at?: string
          valeur: string
        }
        Update: {
          association_id?: string
          categorie?: string
          cle?: string
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          updated_at?: string
          valeur?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_config_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_events: {
        Row: {
          actif: boolean
          album_id: string | null
          association_id: string
          auto_sync: boolean | null
          created_at: string
          date: string
          description: string | null
          heure: string | null
          id: string
          image_url: string | null
          lieu: string
          match_id: string | null
          match_type: string | null
          media_source: string | null
          ordre: number
          titre: string
          type: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          album_id?: string | null
          association_id?: string
          auto_sync?: boolean | null
          created_at?: string
          date: string
          description?: string | null
          heure?: string | null
          id?: string
          image_url?: string | null
          lieu: string
          match_id?: string | null
          match_type?: string | null
          media_source?: string | null
          ordre?: number
          titre: string
          type: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          album_id?: string | null
          association_id?: string
          auto_sync?: boolean | null
          created_at?: string
          date?: string
          description?: string | null
          heure?: string | null
          id?: string
          image_url?: string | null
          lieu?: string
          match_id?: string | null
          match_type?: string | null
          media_source?: string | null
          ordre?: number
          titre?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_events_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "site_gallery_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_events_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_events_carousel_config: {
        Row: {
          actif: boolean | null
          association_id: string
          auto_play: boolean | null
          created_at: string | null
          id: string
          interval: number | null
          show_arrows: boolean | null
          show_indicators: boolean | null
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          association_id?: string
          auto_play?: boolean | null
          created_at?: string | null
          id?: string
          interval?: number | null
          show_arrows?: boolean | null
          show_indicators?: boolean | null
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          association_id?: string
          auto_play?: boolean | null
          created_at?: string | null
          id?: string
          interval?: number | null
          show_arrows?: boolean | null
          show_indicators?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_events_carousel_config_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_gallery: {
        Row: {
          actif: boolean
          album_id: string | null
          association_id: string
          categorie: string
          created_at: string
          id: string
          image_url: string | null
          media_source: string | null
          ordre: number
          titre: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          actif?: boolean
          album_id?: string | null
          association_id?: string
          categorie: string
          created_at?: string
          id?: string
          image_url?: string | null
          media_source?: string | null
          ordre?: number
          titre: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          actif?: boolean
          album_id?: string | null
          association_id?: string
          categorie?: string
          created_at?: string
          id?: string
          image_url?: string | null
          media_source?: string | null
          ordre?: number
          titre?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_gallery_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "site_gallery_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_gallery_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_gallery_albums: {
        Row: {
          actif: boolean | null
          association_id: string
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          ordre: number
          titre: string
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          association_id?: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ordre?: number
          titre: string
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          association_id?: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ordre?: number
          titre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_gallery_albums_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_hero: {
        Row: {
          actif: boolean
          association_id: string
          badge_text: string
          bouton_1_lien: string
          bouton_1_texte: string
          bouton_2_lien: string
          bouton_2_texte: string
          carousel_auto_play: boolean | null
          carousel_interval: number | null
          created_at: string
          id: string
          image_url: string
          media_source: string | null
          sous_titre: string
          stat_1_label: string
          stat_1_nombre: number
          stat_2_label: string
          stat_2_nombre: number
          stat_3_label: string
          stat_3_nombre: number
          titre: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          association_id?: string
          badge_text?: string
          bouton_1_lien?: string
          bouton_1_texte?: string
          bouton_2_lien?: string
          bouton_2_texte?: string
          carousel_auto_play?: boolean | null
          carousel_interval?: number | null
          created_at?: string
          id?: string
          image_url: string
          media_source?: string | null
          sous_titre: string
          stat_1_label?: string
          stat_1_nombre?: number
          stat_2_label?: string
          stat_2_nombre?: number
          stat_3_label?: string
          stat_3_nombre?: number
          titre: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          association_id?: string
          badge_text?: string
          bouton_1_lien?: string
          bouton_1_texte?: string
          bouton_2_lien?: string
          bouton_2_texte?: string
          carousel_auto_play?: boolean | null
          carousel_interval?: number | null
          created_at?: string
          id?: string
          image_url?: string
          media_source?: string | null
          sous_titre?: string
          stat_1_label?: string
          stat_1_nombre?: number
          stat_2_label?: string
          stat_2_nombre?: number
          stat_3_label?: string
          stat_3_nombre?: number
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_hero_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_hero_images: {
        Row: {
          actif: boolean | null
          association_id: string
          created_at: string | null
          hero_id: string
          id: string
          image_url: string
          ordre: number
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          association_id?: string
          created_at?: string | null
          hero_id: string
          id?: string
          image_url: string
          ordre?: number
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          association_id?: string
          created_at?: string | null
          hero_id?: string
          id?: string
          image_url?: string
          ordre?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_hero_images_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_hero_images_hero_id_fkey"
            columns: ["hero_id"]
            isOneToOne: false
            referencedRelation: "site_hero"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pageviews: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown
          path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown
          path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown
          path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_partners: {
        Row: {
          actif: boolean
          association_id: string
          created_at: string
          description: string | null
          id: string
          logo_url: string
          media_source: string | null
          nom: string
          ordre: number
          site_web: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          association_id?: string
          created_at?: string
          description?: string | null
          id?: string
          logo_url: string
          media_source?: string | null
          nom: string
          ordre?: number
          site_web?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          association_id?: string
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string
          media_source?: string | null
          nom?: string
          ordre?: number
          site_web?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_partners_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      smtp_config: {
        Row: {
          actif: boolean | null
          association_id: string
          created_at: string | null
          encryption_type: string | null
          id: string
          mot_de_passe_smtp: string
          port_smtp: number | null
          serveur_smtp: string
          updated_at: string | null
          utilisateur_smtp: string
        }
        Insert: {
          actif?: boolean | null
          association_id?: string
          created_at?: string | null
          encryption_type?: string | null
          id?: string
          mot_de_passe_smtp: string
          port_smtp?: number | null
          serveur_smtp: string
          updated_at?: string | null
          utilisateur_smtp: string
        }
        Update: {
          actif?: boolean | null
          association_id?: string
          created_at?: string | null
          encryption_type?: string | null
          id?: string
          mot_de_passe_smtp?: string
          port_smtp?: number | null
          serveur_smtp?: string
          updated_at?: string | null
          utilisateur_smtp?: string
        }
        Relationships: [
          {
            foreignKeyName: "smtp_config_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_e2d_activites: {
        Row: {
          association_id: string
          created_at: string
          date_activite: string
          id: string
          lieu: string | null
          notes: string | null
          participants_count: number | null
        }
        Insert: {
          association_id?: string
          created_at?: string
          date_activite: string
          id?: string
          lieu?: string | null
          notes?: string | null
          participants_count?: number | null
        }
        Update: {
          association_id?: string
          created_at?: string
          date_activite?: string
          id?: string
          lieu?: string | null
          notes?: string | null
          participants_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sport_e2d_activites_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_e2d_config: {
        Row: {
          association_id: string
          couleur_maillot: string | null
          created_at: string
          entraineur: string | null
          horaire_entrainement: string | null
          id: string
          lieu_entrainement: string | null
          nom_equipe: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          couleur_maillot?: string | null
          created_at?: string
          entraineur?: string | null
          horaire_entrainement?: string | null
          id?: string
          lieu_entrainement?: string | null
          nom_equipe?: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          couleur_maillot?: string | null
          created_at?: string
          entraineur?: string | null
          horaire_entrainement?: string | null
          id?: string
          lieu_entrainement?: string | null
          nom_equipe?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sport_e2d_config_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_e2d_depenses: {
        Row: {
          association_id: string
          created_at: string
          date_depense: string
          id: string
          justificatif_url: string | null
          libelle: string
          montant: number
        }
        Insert: {
          association_id?: string
          created_at?: string
          date_depense?: string
          id?: string
          justificatif_url?: string | null
          libelle: string
          montant: number
        }
        Update: {
          association_id?: string
          created_at?: string
          date_depense?: string
          id?: string
          justificatif_url?: string | null
          libelle?: string
          montant?: number
        }
        Relationships: [
          {
            foreignKeyName: "sport_e2d_depenses_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_e2d_matchs: {
        Row: {
          association_id: string
          created_at: string
          date_match: string
          equipe_adverse: string
          heure_match: string | null
          id: string
          image_url: string | null
          lieu: string | null
          logo_equipe_adverse: string | null
          nom_complet_equipe_adverse: string | null
          notes: string | null
          score_adverse: number | null
          score_e2d: number | null
          statut: string
          statut_publication: string | null
          type_match: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          date_match?: string
          equipe_adverse: string
          heure_match?: string | null
          id?: string
          image_url?: string | null
          lieu?: string | null
          logo_equipe_adverse?: string | null
          nom_complet_equipe_adverse?: string | null
          notes?: string | null
          score_adverse?: number | null
          score_e2d?: number | null
          statut?: string
          statut_publication?: string | null
          type_match?: string
        }
        Update: {
          association_id?: string
          created_at?: string
          date_match?: string
          equipe_adverse?: string
          heure_match?: string | null
          id?: string
          image_url?: string | null
          lieu?: string | null
          logo_equipe_adverse?: string | null
          nom_complet_equipe_adverse?: string | null
          notes?: string | null
          score_adverse?: number | null
          score_e2d?: number | null
          statut?: string
          statut_publication?: string | null
          type_match?: string
        }
        Relationships: [
          {
            foreignKeyName: "sport_e2d_matchs_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_e2d_presences: {
        Row: {
          created_at: string
          date_seance: string
          id: string
          membre_id: string
          notes: string | null
          present: boolean
          type_seance: string
        }
        Insert: {
          created_at?: string
          date_seance: string
          id?: string
          membre_id: string
          notes?: string | null
          present?: boolean
          type_seance: string
        }
        Update: {
          created_at?: string
          date_seance?: string
          id?: string
          membre_id?: string
          notes?: string | null
          present?: boolean
          type_seance?: string
        }
        Relationships: []
      }
      sport_e2d_recettes: {
        Row: {
          association_id: string
          created_at: string
          date_recette: string
          id: string
          libelle: string
          montant: number
          notes: string | null
        }
        Insert: {
          association_id?: string
          created_at?: string
          date_recette?: string
          id?: string
          libelle: string
          montant: number
          notes?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string
          date_recette?: string
          id?: string
          libelle?: string
          montant?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sport_e2d_recettes_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_phoenix_config: {
        Row: {
          association_id: string
          created_at: string
          duree_adhesion_mois: number | null
          id: string
          montant_adhesion: number | null
          nom_club: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          duree_adhesion_mois?: number | null
          id?: string
          montant_adhesion?: number | null
          nom_club?: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          created_at?: string
          duree_adhesion_mois?: number | null
          id?: string
          montant_adhesion?: number | null
          nom_club?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sport_phoenix_config_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_phoenix_depenses: {
        Row: {
          association_id: string
          created_at: string | null
          date_depense: string
          id: string
          justificatif_url: string | null
          libelle: string
          montant: number
          updated_at: string | null
        }
        Insert: {
          association_id?: string
          created_at?: string | null
          date_depense?: string
          id?: string
          justificatif_url?: string | null
          libelle: string
          montant?: number
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string | null
          date_depense?: string
          id?: string
          justificatif_url?: string | null
          libelle?: string
          montant?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sport_phoenix_depenses_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_phoenix_matchs: {
        Row: {
          association_id: string
          created_at: string
          date_match: string
          equipe_adverse: string
          heure_match: string | null
          id: string
          lieu: string | null
          notes: string | null
          score_adverse: number | null
          score_phoenix: number | null
          statut: string
          type_match: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          date_match?: string
          equipe_adverse: string
          heure_match?: string | null
          id?: string
          lieu?: string | null
          notes?: string | null
          score_adverse?: number | null
          score_phoenix?: number | null
          statut?: string
          type_match?: string
        }
        Update: {
          association_id?: string
          created_at?: string
          date_match?: string
          equipe_adverse?: string
          heure_match?: string | null
          id?: string
          lieu?: string | null
          notes?: string | null
          score_adverse?: number | null
          score_phoenix?: number | null
          statut?: string
          type_match?: string
        }
        Relationships: [
          {
            foreignKeyName: "sport_phoenix_matchs_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_phoenix_recettes: {
        Row: {
          association_id: string
          created_at: string | null
          date_recette: string
          id: string
          libelle: string
          montant: number
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          association_id?: string
          created_at?: string | null
          date_recette?: string
          id?: string
          libelle: string
          montant?: number
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          association_id?: string
          created_at?: string | null
          date_recette?: string
          id?: string
          libelle?: string
          montant?: number
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sport_phoenix_recettes_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_attributions: {
        Row: {
          annee: number
          created_at: string
          id: string
          membre_id: string
          mois: number
          montant_attribue: number
          total_cotisations_mois: number
          updated_at: string
        }
        Insert: {
          annee: number
          created_at?: string
          id?: string
          membre_id: string
          mois: number
          montant_attribue: number
          total_cotisations_mois: number
          updated_at?: string
        }
        Update: {
          annee?: number
          created_at?: string
          id?: string
          membre_id?: string
          mois?: number
          montant_attribue?: number
          total_cotisations_mois?: number
          updated_at?: string
        }
        Relationships: []
      }
      tontine_configurations: {
        Row: {
          association_id: string
          categorie: string | null
          cle: string
          created_at: string | null
          description: string | null
          id: string
          type_valeur: string | null
          updated_at: string | null
          valeur: string
        }
        Insert: {
          association_id?: string
          categorie?: string | null
          cle: string
          created_at?: string | null
          description?: string | null
          id?: string
          type_valeur?: string | null
          updated_at?: string | null
          valeur: string
        }
        Update: {
          association_id?: string
          categorie?: string | null
          cle?: string
          created_at?: string | null
          description?: string | null
          id?: string
          type_valeur?: string | null
          updated_at?: string | null
          valeur?: string
        }
        Relationships: [
          {
            foreignKeyName: "tontine_configurations_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      types_sanctions: {
        Row: {
          association_id: string
          categorie: string | null
          contexte: string | null
          created_at: string
          description: string | null
          id: string
          nom: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          categorie?: string | null
          contexte?: string | null
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          categorie?: string | null
          contexte?: string | null
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "types_sanctions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          association_id: string | null
          created_at: string
          id: string
          role_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          association_id?: string | null
          created_at?: string
          id?: string
          role_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          association_id?: string | null
          created_at?: string
          id?: string
          role_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_new_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      utilisateurs_actions_log: {
        Row: {
          action: string
          details: Json | null
          id: string
          new_value: string | null
          old_value: string | null
          performed_at: string | null
          performed_by: string | null
          user_id: string
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_at?: string | null
          performed_by?: string | null
          user_id: string
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_at?: string | null
          performed_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      caisse_soldes_snapshot: {
        Row: {
          association_id: string | null
          derniere_operation: string | null
          nb_operations: number | null
          refreshed_at: string | null
          solde_net: number | null
          total_entrees: number | null
          total_sorties: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fond_caisse_operations_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      configurations_v_compat: {
        Row: {
          association_id: string | null
          cle: string | null
          created_at: string | null
          description: string | null
          id: string | null
          updated_at: string | null
          valeur: Json | null
        }
        Relationships: []
      }
      e2d_player_stats_view: {
        Row: {
          equipe_e2d: string | null
          matchs_joues: number | null
          membre_id: string | null
          moyenne_buts: number | null
          moyenne_passes: number | null
          nom: string | null
          photo_url: string | null
          prenom: string | null
          score_general: number | null
          total_buts: number | null
          total_cartons_jaunes: number | null
          total_cartons_rouges: number | null
          total_motm: number | null
          total_passes: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _apply_tenant_rls: {
        Args: {
          _admin_write?: boolean
          _public_select?: boolean
          _public_select_cond?: string
          _table: string
        }
        Returns: undefined
      }
      audit_auth_membres_sync: {
        Args: never
        Returns: {
          detail: string
          id: string
          type: string
        }[]
      }
      auto_fill_reunion_beneficiaires: {
        Args: { p_reunion_id: string }
        Returns: number
      }
      avaliste_approve_loan_request: {
        Args: { _request_id: string }
        Returns: Json
      }
      avaliste_reject_loan_request: {
        Args: { _motif: string; _request_id: string }
        Returns: Json
      }
      avancer_workflow_aide: {
        Args: { p_action: string; p_aide_id: string; p_commentaire?: string }
        Returns: Json
      }
      calculate_total_pret_amount: {
        Args: {
          montant_initial: number
          reconductions?: number
          taux_interet: number
        }
        Returns: number
      }
      calculer_montant_beneficiaire: {
        Args: { p_exercice_id: string; p_membre_id: string }
        Returns: Json
      }
      can_manage_beneficiaires: { Args: never; Returns: boolean }
      can_self_avaliser: { Args: { _membre_id: string }; Returns: boolean }
      can_view_profile: {
        Args: { _profile_id: string; _viewer?: string }
        Returns: boolean
      }
      cancel_loan_request: { Args: { _request_id: string }; Returns: Json }
      clear_must_change_flag: { Args: never; Returns: boolean }
      create_loan_request: {
        Args: {
          _avaliste_id: string
          _avaliste_self: boolean
          _capacite_remboursement?: string
          _conditions_acceptees?: boolean
          _description: string
          _duree_mois: number
          _garantie?: string
          _montant: number
          _urgence: string
        }
        Returns: string
      }
      current_association_id: { Args: never; Returns: string }
      current_membre_id: { Args: never; Returns: string }
      current_tenant_id: { Args: never; Returns: string }
      default_association_id: { Args: never; Returns: string }
      delete_loan_validation_step: { Args: { _id: string }; Returns: boolean }
      delete_pret_reconduction_validation_step: {
        Args: { _id: string }
        Returns: boolean
      }
      disburse_loan: { Args: { p_pret_id: string }; Returns: boolean }
      get_active_payment_config_public: { Args: never; Returns: Json }
      get_caisse_solde_snapshot: {
        Args: { p_association_id?: string }
        Returns: {
          association_id: string
          derniere_operation: string
          nb_operations: number
          refreshed_at: string
          solde_net: number
          total_entrees: number
          total_sorties: number
        }[]
      }
      get_caisse_stats: { Args: never; Returns: Json }
      get_caisse_synthese: { Args: never; Returns: Json }
      get_cotisation_mensuelle_membre: {
        Args: { _exercice_id: string; _membre_id: string }
        Returns: number
      }
      get_current_association_id: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_exercice_nb_mois: { Args: { _exercice_id: string }; Returns: number }
      get_loan_request_member_email: {
        Args: { _request_id: string }
        Returns: {
          email: string
          nom: string
          prenom: string
        }[]
      }
      get_loan_request_validators_emails: {
        Args: { _request_id: string }
        Returns: {
          email: string
          label: string
          role: string
        }[]
      }
      get_membre_situation: {
        Args: { p_exercice_id?: string; p_membre_id: string }
        Returns: Json
      }
      get_montant_cotisation_membre: {
        Args: {
          _exercice_id: string
          _membre_id: string
          _type_cotisation_id: string
        }
        Returns: number
      }
      get_pret_status: {
        Args: { echeance: string; montant_paye: number; montant_total: number }
        Returns: string
      }
      get_sanction_status: {
        Args: { montant_paye: number; montant_total: number }
        Returns: string
      }
      get_solde_caisse: { Args: never; Returns: number }
      get_solde_empruntable: {
        Args: { p_association_id?: string; p_pourcentage?: number }
        Returns: number
      }
      get_user_associations: { Args: { _user_id?: string }; Returns: string[] }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_association_access: {
        Args: { _association_id: string; _user_id?: string }
        Returns: boolean
      }
      has_permission: {
        Args: { perm: string; resource_name: string }
        Returns: boolean
      }
      has_permission_in: {
        Args: {
          _association_id: string
          _permission: string
          _resource: string
        }
        Returns: boolean
      }
      has_role:
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
        | { Args: { role_name: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_admin_of: {
        Args: { _association_id: string; _user_id?: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id?: string }; Returns: boolean }
      log_audit: {
        Args: {
          _action: string
          _details?: Json
          _row_id?: string
          _table_name: string
        }
        Returns: string
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_new_data?: Json
          p_old_data?: Json
          p_record_id?: string
          p_table_name: string
        }
        Returns: string
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      projeter_cotisations_reunion: {
        Args: { _reunion_id: string }
        Returns: Json
      }
      provision_user_account: {
        Args: {
          p_email: string
          p_membre_id: string
          p_nom: string
          p_prenom: string
          p_role_ids: string[]
          p_telephone: string
          p_user_id: string
        }
        Returns: Json
      }
      record_caisse_movement:
        | {
            Args: {
              p_beneficiaire_id?: string
              p_categorie: string
              p_date_operation?: string
              p_exercice_id?: string
              p_justificatif_url?: string
              p_libelle: string
              p_montant: number
              p_notes?: string
              p_reunion_id?: string
              p_source_id?: string
              p_source_table?: string
              p_type: string
            }
            Returns: string
          }
        | {
            Args: {
              p_beneficiaire_id?: string
              p_categorie: string
              p_date_operation?: string
              p_exercice_id?: string
              p_justificatif_url?: string
              p_libelle: string
              p_montant: number
              p_notes?: string
              p_operateur_id?: string
              p_reunion_id?: string
              p_source_id?: string
              p_source_table?: string
              p_type: string
            }
            Returns: string
          }
      refresh_caisse_soldes_snapshot: { Args: never; Returns: undefined }
      reject_loan_step: {
        Args: { _motif: string; _request_id: string }
        Returns: Json
      }
      reject_pret_reconduction_step: {
        Args: { _motif: string; _recon_id: string }
        Returns: Json
      }
      reorder_loan_validation_steps: {
        Args: { _ids: string[] }
        Returns: boolean
      }
      reorder_pret_reconduction_validation_steps: {
        Args: { _ids: string[] }
        Returns: boolean
      }
      reverse_caisse_movement: {
        Args: { _operation_id: string; _reason?: string }
        Returns: string
      }
      set_current_association: {
        Args: { _association_id: string }
        Returns: string
      }
      strip_secrets: { Args: { p_data: Json }; Returns: Json }
      unlock_cotisation: {
        Args: { _cotisation_id: string; _motif: string }
        Returns: boolean
      }
      upsert_loan_validation_step: {
        Args: {
          _actif: boolean
          _id: string
          _label: string
          _ordre: number
          _role: string
        }
        Returns: string
      }
      upsert_pret_reconduction_validation_step: {
        Args: {
          _actif: boolean
          _id: string
          _label: string
          _ordre: number
          _role: string
        }
        Returns: string
      }
      user_can_validate_loan_role: {
        Args: { _user_id: string; _workflow_role: string }
        Returns: boolean
      }
      validate_loan_step: {
        Args: { _commentaire?: string; _request_id: string }
        Returns: Json
      }
      validate_pret_reconduction_step: {
        Args: { _commentaire?: string; _recon_id: string }
        Returns: Json
      }
      valider_paiement_beneficiaire: {
        Args: {
          p_date_paiement?: string
          p_id: string
          p_mode?: string
          p_montant: number
          p_notes?: string
          p_reference?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "membre"
        | "admin"
        | "tresorier"
        | "secretaire"
        | "responsable_sportif"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "membre",
        "admin",
        "tresorier",
        "secretaire",
        "responsable_sportif",
      ],
    },
  },
} as const
