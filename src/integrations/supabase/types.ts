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
    PostgrestVersion: "13.0.4"
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
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      adhesions: {
        Row: {
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
          beneficiaire_id: string
          contexte_aide: string
          created_at: string
          date_allocation: string
          id: string
          justificatif_url: string | null
          montant: number
          notes: string | null
          statut: string
          type_aide_id: string
        }
        Insert: {
          beneficiaire_id: string
          contexte_aide?: string
          created_at?: string
          date_allocation?: string
          id?: string
          justificatif_url?: string | null
          montant: number
          notes?: string | null
          statut?: string
          type_aide_id: string
        }
        Update: {
          beneficiaire_id?: string
          contexte_aide?: string
          created_at?: string
          date_allocation?: string
          id?: string
          justificatif_url?: string | null
          montant?: number
          notes?: string | null
          statut?: string
          type_aide_id?: string
        }
        Relationships: [
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
          created_at: string
          delai_remboursement: number | null
          description: string | null
          id: string
          mode_repartition: string
          montant_defaut: number | null
          nom: string
        }
        Insert: {
          created_at?: string
          delai_remboursement?: number | null
          description?: string | null
          id?: string
          mode_repartition?: string
          montant_defaut?: number | null
          nom: string
        }
        Update: {
          created_at?: string
          delai_remboursement?: number | null
          description?: string | null
          id?: string
          mode_repartition?: string
          montant_defaut?: number | null
          nom?: string
        }
        Relationships: []
      }
      alertes_budgetaires: {
        Row: {
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
        Relationships: []
      }
      beneficiaires_config: {
        Row: {
          actif: boolean
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
          created_at?: string
          description?: string | null
          id?: string
          mode_calcul?: string
          montant_fixe?: number | null
          nom?: string
          pourcentage_cotisations?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      cms_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          location: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_gallery: {
        Row: {
          album_name: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          is_active: boolean | null
          order_index: number | null
          thumbnail_url: string | null
          title: string | null
        }
        Insert: {
          album_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string | null
        }
        Update: {
          album_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string | null
        }
        Relationships: []
      }
      cms_hero_slides: {
        Row: {
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
        Relationships: []
      }
      cms_pages: {
        Row: {
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
          content?: string | null
          created_at?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          page_key?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_partners: {
        Row: {
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
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string
          name?: string
          order_index?: number | null
          website_url?: string | null
        }
        Relationships: []
      }
      cms_sections: {
        Row: {
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
        Relationships: []
      }
      cms_settings: {
        Row: {
          description: string | null
          key: string
          label: string | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          key: string
          label?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          key?: string
          label?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
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
        }
        Insert: {
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
        }
        Update: {
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
        }
        Relationships: [
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
          created_at: string | null
          description: string | null
          id: string
          montant_defaut: number | null
          nom: string
          obligatoire: boolean | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          montant_defaut?: number | null
          nom: string
          obligatoire?: boolean | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          montant_defaut?: number | null
          nom?: string
          obligatoire?: boolean | null
        }
        Relationships: []
      }
      demandes_adhesion: {
        Row: {
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
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
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
        Relationships: []
      }
      epargnes: {
        Row: {
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
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      exercices: {
        Row: {
          created_at: string
          croissance_fond_caisse: number | null
          date_debut: string
          date_fin: string
          id: string
          nom: string
          plafond_fond_caisse: number | null
          statut: string
        }
        Insert: {
          created_at?: string
          croissance_fond_caisse?: number | null
          date_debut: string
          date_fin: string
          id?: string
          nom: string
          plafond_fond_caisse?: number | null
          statut?: string
        }
        Update: {
          created_at?: string
          croissance_fond_caisse?: number | null
          date_debut?: string
          date_fin?: string
          id?: string
          nom?: string
          plafond_fond_caisse?: number | null
          statut?: string
        }
        Relationships: []
      }
      exports_programmes: {
        Row: {
          actif: boolean | null
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
        Relationships: []
      }
      fichiers_joint: {
        Row: {
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
        Relationships: []
      }
      fond_caisse_clotures: {
        Row: {
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
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      fond_caisse_operations: {
        Row: {
          beneficiaire_id: string | null
          created_at: string
          date_operation: string
          id: string
          justificatif_url: string | null
          libelle: string
          montant: number
          notes: string | null
          operateur_id: string
          type_operation: string
          updated_at: string
        }
        Insert: {
          beneficiaire_id?: string | null
          created_at?: string
          date_operation?: string
          id?: string
          justificatif_url?: string | null
          libelle: string
          montant: number
          notes?: string | null
          operateur_id: string
          type_operation: string
          updated_at?: string
        }
        Update: {
          beneficiaire_id?: string | null
          created_at?: string
          date_operation?: string
          id?: string
          justificatif_url?: string | null
          libelle?: string
          montant?: number
          notes?: string | null
          operateur_id?: string
          type_operation?: string
          updated_at?: string
        }
        Relationships: [
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
            referencedRelation: "membres"
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
      match_gala_config: {
        Row: {
          actif: boolean | null
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
          created_at?: string | null
          id?: string
          nombre_matchs_minimum?: number | null
          pourcentage_presence_minimum?: number | null
          sanctions_max?: number | null
          taux_cotisation_minimum?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
            referencedRelation: "membres"
            referencedColumns: ["id"]
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
          created_at: string
          goals: number
          id: string
          man_of_match: boolean
          match_id: string
          match_type: string
          player_name: string
          red_cards: number
          updated_at: string
          yellow_cards: number
        }
        Insert: {
          assists?: number
          created_at?: string
          goals?: number
          id?: string
          man_of_match?: boolean
          match_id: string
          match_type: string
          player_name: string
          red_cards?: number
          updated_at?: string
          yellow_cards?: number
        }
        Update: {
          assists?: number
          created_at?: string
          goals?: number
          id?: string
          man_of_match?: boolean
          match_id?: string
          match_type?: string
          player_name?: string
          red_cards?: number
          updated_at?: string
          yellow_cards?: number
        }
        Relationships: []
      }
      membres: {
        Row: {
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
        Relationships: []
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
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          nom?: string
          objet?: string
          statut?: string | null
          telephone?: string | null
        }
        Relationships: []
      }
      notifications_campagnes: {
        Row: {
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
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_config: {
        Row: {
          actif: boolean
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
          created_at?: string
          delai_jours?: number
          id?: string
          template_contenu?: string | null
          template_sujet?: string | null
          type_notification?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications_envois: {
        Row: {
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
            referencedRelation: "membres"
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
        Relationships: []
      }
      notifications_templates: {
        Row: {
          actif: boolean | null
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
        Relationships: []
      }
      payment_configs: {
        Row: {
          config_data: Json
          created_at: string
          id: string
          is_active: boolean
          provider: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config_data?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          provider: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
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
          created_at: string | null
          date_adhesion: string | null
          date_limite_paiement: string | null
          id: string
          membre_id: string | null
          montant_adhesion: number | null
        }
        Insert: {
          adhesion_payee?: boolean | null
          created_at?: string | null
          date_adhesion?: string | null
          date_limite_paiement?: string | null
          id?: string
          membre_id?: string | null
          montant_adhesion?: number | null
        }
        Update: {
          adhesion_payee?: boolean | null
          created_at?: string | null
          date_adhesion?: string | null
          date_limite_paiement?: string | null
          id?: string
          membre_id?: string | null
          montant_adhesion?: number | null
        }
        Relationships: [
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
          created_at: string
          equipe_nom: string
          est_capitaine: boolean | null
          id: string
          match_id: string
          membre_id: string
          poste: string | null
        }
        Insert: {
          created_at?: string
          equipe_nom: string
          est_capitaine?: boolean | null
          id?: string
          match_id: string
          membre_id: string
          poste?: string | null
        }
        Update: {
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
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_cotisations_annuelles: {
        Row: {
          annee: number
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
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_entrainements: {
        Row: {
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
          created_at?: string
          date_entrainement?: string
          heure_debut?: string | null
          heure_fin?: string | null
          id?: string
          lieu?: string | null
          notes?: string | null
          type_entrainement?: string | null
        }
        Relationships: []
      }
      phoenix_entrainements_internes: {
        Row: {
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
        Relationships: []
      }
      phoenix_equipes: {
        Row: {
          couleur_hex: string | null
          created_at: string
          id: string
          nom: string
          updated_at: string
        }
        Insert: {
          couleur_hex?: string | null
          created_at?: string
          id?: string
          nom: string
          updated_at?: string
        }
        Update: {
          couleur_hex?: string | null
          created_at?: string
          id?: string
          nom?: string
          updated_at?: string
        }
        Relationships: []
      }
      phoenix_evenements_match: {
        Row: {
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
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_presences: {
        Row: {
          adherent_id: string | null
          created_at: string | null
          date_entrainement: string
          id: string
          present: boolean | null
        }
        Insert: {
          adherent_id?: string | null
          created_at?: string | null
          date_entrainement: string
          id?: string
          present?: boolean | null
        }
        Update: {
          adherent_id?: string | null
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
        ]
      }
      phoenix_presences_entrainement: {
        Row: {
          created_at: string
          entrainement_id: string
          excuse: string | null
          id: string
          membre_id: string
          present: boolean | null
          retard_minutes: number | null
        }
        Insert: {
          created_at?: string
          entrainement_id: string
          excuse?: string | null
          id?: string
          membre_id: string
          present?: boolean | null
          retard_minutes?: number | null
        }
        Update: {
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
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_statistiques_annuelles: {
        Row: {
          annee: number
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
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
        ]
      }
      phoenix_stats_jaune_rouge: {
        Row: {
          annee: number
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
        Relationships: []
      }
      prets: {
        Row: {
          avaliste_id: string | null
          created_at: string
          date_pret: string
          echeance: string
          exercice_id: string | null
          id: string
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
          avaliste_id?: string | null
          created_at?: string
          date_pret?: string
          echeance: string
          exercice_id?: string | null
          id?: string
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
          avaliste_id?: string | null
          created_at?: string
          date_pret?: string
          echeance?: string
          exercice_id?: string | null
          id?: string
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
            referencedRelation: "membres"
            referencedColumns: ["id"]
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
      prets_paiements: {
        Row: {
          created_at: string
          date_paiement: string
          id: string
          mode_paiement: string
          montant_paye: number
          notes: string | null
          pret_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_paiement?: string
          id?: string
          mode_paiement?: string
          montant_paye: number
          notes?: string | null
          pret_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_paiement?: string
          id?: string
          mode_paiement?: string
          montant_paye?: number
          notes?: string | null
          pret_id?: string
          updated_at?: string
        }
        Relationships: [
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
          created_at: string | null
          date_reconduction: string
          id: string
          interet_mois: number
          notes: string | null
          pret_id: string
        }
        Insert: {
          created_at?: string | null
          date_reconduction?: string
          id?: string
          interet_mois: number
          notes?: string | null
          pret_id: string
        }
        Update: {
          created_at?: string | null
          date_reconduction?: string
          id?: string
          interet_mois?: number
          notes?: string | null
          pret_id?: string
        }
        Relationships: [
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
          created_at: string | null
          date_inscription: string | null
          est_adherent_phoenix: boolean | null
          est_membre_e2d: boolean | null
          id: string
          nom: string
          photo_url: string | null
          prenom: string
          statut: string | null
          telephone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_inscription?: string | null
          est_adherent_phoenix?: boolean | null
          est_membre_e2d?: boolean | null
          id: string
          nom: string
          photo_url?: string | null
          prenom: string
          statut?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_inscription?: string | null
          est_adherent_phoenix?: boolean | null
          est_membre_e2d?: boolean | null
          id?: string
          nom?: string
          photo_url?: string | null
          prenom?: string
          statut?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rapports_seances: {
        Row: {
          created_at: string
          id: string
          numero_ordre: number | null
          resolution: string | null
          reunion_id: string
          sujet: string
        }
        Insert: {
          created_at?: string
          id?: string
          numero_ordre?: number | null
          resolution?: string | null
          reunion_id: string
          sujet: string
        }
        Update: {
          created_at?: string
          id?: string
          numero_ordre?: number | null
          resolution?: string | null
          reunion_id?: string
          sujet?: string
        }
        Relationships: []
      }
      recurring_donations: {
        Row: {
          amount: number
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
          config_id: string | null
          created_at: string
          date_benefice_prevue: string
          id: string
          membre_id: string
          montant_benefice: number
          reunion_id: string
          statut: string
          updated_at: string
        }
        Insert: {
          config_id?: string | null
          created_at?: string
          date_benefice_prevue: string
          id?: string
          membre_id: string
          montant_benefice?: number
          reunion_id: string
          statut?: string
          updated_at?: string
        }
        Update: {
          config_id?: string | null
          created_at?: string
          date_benefice_prevue?: string
          id?: string
          membre_id?: string
          montant_benefice?: number
          reunion_id?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
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
      reunion_presences: {
        Row: {
          created_at: string
          date_presence: string
          id: string
          membre_id: string
          notes: string | null
          present: boolean
          reunion_id: string
        }
        Insert: {
          created_at?: string
          date_presence?: string
          id?: string
          membre_id: string
          notes?: string | null
          present?: boolean
          reunion_id: string
        }
        Update: {
          created_at?: string
          date_presence?: string
          id?: string
          membre_id?: string
          notes?: string | null
          present?: boolean
          reunion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reunion_presences_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunion_presences_reunion_id_fkey"
            columns: ["reunion_id"]
            isOneToOne: false
            referencedRelation: "reunions"
            referencedColumns: ["id"]
          },
        ]
      }
      reunions: {
        Row: {
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
          type_reunion: string | null
        }
        Insert: {
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
          type_reunion?: string | null
        }
        Update: {
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
          type_reunion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_reunions_lieu_membre"
            columns: ["lieu_membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
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
      reunions_presences: {
        Row: {
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
          created_at: string
          granted: boolean
          id: string
          permission: string
          resource: string
          role_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          id?: string
          permission: string
          resource: string
          role_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          permission?: string
          resource?: string
          role_id?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      sanctions: {
        Row: {
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
        ]
      }
      sanctions_tarifs: {
        Row: {
          actif: boolean
          categorie_membre: string
          created_at: string
          id: string
          montant: number
          type_sanction_id: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          categorie_membre?: string
          created_at?: string
          id?: string
          montant: number
          type_sanction_id: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          categorie_membre?: string
          created_at?: string
          id?: string
          montant?: number
          type_sanction_id?: string
          updated_at?: string
        }
        Relationships: [
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
          categorie: string
          created_at: string
          description: string | null
          id: string
          montant: number
          nom: string
        }
        Insert: {
          categorie: string
          created_at?: string
          description?: string | null
          id?: string
          montant: number
          nom: string
        }
        Update: {
          categorie?: string
          created_at?: string
          description?: string | null
          id?: string
          montant?: number
          nom?: string
        }
        Relationships: []
      }
      site_about: {
        Row: {
          actif: boolean
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
          created_at?: string
          histoire_contenu?: string
          histoire_titre?: string
          id?: string
          sous_titre?: string
          titre?: string
          updated_at?: string
          valeurs?: Json
        }
        Relationships: []
      }
      site_activities: {
        Row: {
          actif: boolean
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
          created_at?: string
          description?: string
          features?: Json
          icon?: string
          id?: string
          ordre?: number
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_config: {
        Row: {
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
          categorie?: string
          cle?: string
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          updated_at?: string
          valeur?: string
        }
        Relationships: []
      }
      site_events: {
        Row: {
          actif: boolean
          created_at: string
          date: string
          description: string | null
          heure: string | null
          id: string
          image_url: string | null
          lieu: string
          media_source: string | null
          ordre: number
          titre: string
          type: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          date: string
          description?: string | null
          heure?: string | null
          id?: string
          image_url?: string | null
          lieu: string
          media_source?: string | null
          ordre?: number
          titre: string
          type: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          date?: string
          description?: string | null
          heure?: string | null
          id?: string
          image_url?: string | null
          lieu?: string
          media_source?: string | null
          ordre?: number
          titre?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_events_carousel_config: {
        Row: {
          actif: boolean | null
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
          auto_play?: boolean | null
          created_at?: string | null
          id?: string
          interval?: number | null
          show_arrows?: boolean | null
          show_indicators?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_gallery: {
        Row: {
          actif: boolean
          album_id: string | null
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
        ]
      }
      site_gallery_albums: {
        Row: {
          actif: boolean | null
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
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ordre?: number
          titre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      site_hero: {
        Row: {
          actif: boolean
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
        Relationships: []
      }
      site_hero_images: {
        Row: {
          actif: boolean | null
          created_at: string | null
          hero_id: string
          id: string
          image_url: string
          ordre: number
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          created_at?: string | null
          hero_id: string
          id?: string
          image_url: string
          ordre?: number
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          created_at?: string | null
          hero_id?: string
          id?: string
          image_url?: string
          ordre?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_hero_images_hero_id_fkey"
            columns: ["hero_id"]
            isOneToOne: false
            referencedRelation: "site_hero"
            referencedColumns: ["id"]
          },
        ]
      }
      site_partners: {
        Row: {
          actif: boolean
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
        Relationships: []
      }
      smtp_config: {
        Row: {
          actif: boolean | null
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
          created_at?: string | null
          encryption_type?: string | null
          id?: string
          mot_de_passe_smtp?: string
          port_smtp?: number | null
          serveur_smtp?: string
          updated_at?: string | null
          utilisateur_smtp?: string
        }
        Relationships: []
      }
      sport_e2d_activites: {
        Row: {
          created_at: string
          date_activite: string
          id: string
          lieu: string | null
          notes: string | null
          participants_count: number | null
        }
        Insert: {
          created_at?: string
          date_activite: string
          id?: string
          lieu?: string | null
          notes?: string | null
          participants_count?: number | null
        }
        Update: {
          created_at?: string
          date_activite?: string
          id?: string
          lieu?: string | null
          notes?: string | null
          participants_count?: number | null
        }
        Relationships: []
      }
      sport_e2d_config: {
        Row: {
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
          couleur_maillot?: string | null
          created_at?: string
          entraineur?: string | null
          horaire_entrainement?: string | null
          id?: string
          lieu_entrainement?: string | null
          nom_equipe?: string
          updated_at?: string
        }
        Relationships: []
      }
      sport_e2d_depenses: {
        Row: {
          created_at: string
          date_depense: string
          id: string
          justificatif_url: string | null
          libelle: string
          montant: number
        }
        Insert: {
          created_at?: string
          date_depense?: string
          id?: string
          justificatif_url?: string | null
          libelle: string
          montant: number
        }
        Update: {
          created_at?: string
          date_depense?: string
          id?: string
          justificatif_url?: string | null
          libelle?: string
          montant?: number
        }
        Relationships: []
      }
      sport_e2d_matchs: {
        Row: {
          created_at: string
          date_match: string
          equipe_adverse: string
          heure_match: string | null
          id: string
          lieu: string | null
          logo_equipe_adverse: string | null
          nom_complet_equipe_adverse: string | null
          notes: string | null
          score_adverse: number | null
          score_e2d: number | null
          statut: string
          type_match: string
        }
        Insert: {
          created_at?: string
          date_match?: string
          equipe_adverse: string
          heure_match?: string | null
          id?: string
          lieu?: string | null
          logo_equipe_adverse?: string | null
          nom_complet_equipe_adverse?: string | null
          notes?: string | null
          score_adverse?: number | null
          score_e2d?: number | null
          statut?: string
          type_match?: string
        }
        Update: {
          created_at?: string
          date_match?: string
          equipe_adverse?: string
          heure_match?: string | null
          id?: string
          lieu?: string | null
          logo_equipe_adverse?: string | null
          nom_complet_equipe_adverse?: string | null
          notes?: string | null
          score_adverse?: number | null
          score_e2d?: number | null
          statut?: string
          type_match?: string
        }
        Relationships: []
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
          created_at: string
          date_recette: string
          id: string
          libelle: string
          montant: number
          notes: string | null
        }
        Insert: {
          created_at?: string
          date_recette?: string
          id?: string
          libelle: string
          montant: number
          notes?: string | null
        }
        Update: {
          created_at?: string
          date_recette?: string
          id?: string
          libelle?: string
          montant?: number
          notes?: string | null
        }
        Relationships: []
      }
      sport_phoenix_config: {
        Row: {
          created_at: string
          duree_adhesion_mois: number | null
          id: string
          montant_adhesion: number | null
          nom_club: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duree_adhesion_mois?: number | null
          id?: string
          montant_adhesion?: number | null
          nom_club?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duree_adhesion_mois?: number | null
          id?: string
          montant_adhesion?: number | null
          nom_club?: string
          updated_at?: string
        }
        Relationships: []
      }
      sport_phoenix_depenses: {
        Row: {
          created_at: string | null
          date_depense: string
          id: string
          justificatif_url: string | null
          libelle: string
          montant: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_depense?: string
          id?: string
          justificatif_url?: string | null
          libelle: string
          montant?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_depense?: string
          id?: string
          justificatif_url?: string | null
          libelle?: string
          montant?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      sport_phoenix_matchs: {
        Row: {
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
        Relationships: []
      }
      sport_phoenix_recettes: {
        Row: {
          created_at: string | null
          date_recette: string
          id: string
          libelle: string
          montant: number
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_recette?: string
          id?: string
          libelle: string
          montant?: number
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_recette?: string
          id?: string
          libelle?: string
          montant?: number
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          categorie?: string | null
          cle?: string
          created_at?: string | null
          description?: string | null
          id?: string
          type_valeur?: string | null
          updated_at?: string | null
          valeur?: string
        }
        Relationships: []
      }
      types_sanctions: {
        Row: {
          categorie: string | null
          contexte: string | null
          created_at: string
          description: string | null
          id: string
          nom: string
          updated_at: string
        }
        Insert: {
          categorie?: string | null
          contexte?: string | null
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          updated_at?: string
        }
        Update: {
          categorie?: string | null
          contexte?: string | null
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_new_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_total_pret_amount: {
        Args: {
          montant_initial: number
          reconductions?: number
          taux_interet: number
        }
        Returns: number
      }
      get_current_user_role: { Args: never; Returns: string }
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { role_name: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
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
