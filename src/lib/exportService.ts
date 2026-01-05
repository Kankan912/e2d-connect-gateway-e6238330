import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from "@/integrations/supabase/client";

// Logo E2D en base64 (bleu simplifié pour PDF)
const LOGO_E2D_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAoCAYAAAAIeF9DAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4B//79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwb25tbGtqaWhnZmVkY2JhYF9eXVxbWllYV1ZVVFNSUVBPTk1MS0pJSEdGRURDQkFAPz49PDs6OTg3NjU0MzIxMC8uLSwrKikoJyYlJCMiISAfHh0cGxoZGBcWFRQTEhEQDw4NDAsKCQgHBgUEAwIBAAAh+QQAAAAAACwAAAAAZAAoAAAG/sCScEgsGo/IpHLJbDqf0Kh0Sq1ar9isdsvter/gsHhMLpvP6LR6zW673/C4fE6v2+/4vH7P7/v/gIGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8AAwocSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rcyLGjx48gQ4ocSbKkyZMoU6pcybKly5cwY8qcSbOmzZs4c+rcybOnz59AgwodSrSo0aNIkypdyrSp06dQo0qdSrWq1atYs2rdyrWr169gw4odS7as2bNo06pdy7at27dw48qdS7eu3bt48+rdy7ev37+AAwseTLiw4cOIEytezLix48eQI0ueTLmy5cuYM2vezLmz58+gQ4seTbq06dOoU6tezbq169ewY8ueTbu27du4c+vezbu379/AgwsfTry48ePIkytfzry58+fQo0ufTr269evYs2vfzr279+/gw4sfT768+fPo06tfz769+/fw48ufT7++/fv48+vfz7+///8ABijggAQWaOCBCCao4IIMNujggxBGKOGEFFZo4YUYZqjhhhx26OGHIIYo4ogklmjiiSimqOKKLLbo4oswxijjjDTWaOONOOao44489ujjj0AGKeSQRBZp5JFIJqnkkkw26eSTUEYp5ZRUVmnllVhmqeWWXHbp5ZdghilmmLgEAQA7';

export class ExportService {
  static async export(options: {
    type: string;
    format: string;
    nom: string;
    configuration?: any;
  }) {
    try {
      let data: any[] = [];
      let columns: string[] = [];

      // Récupérer les données selon le type
      switch (options.type) {
        case 'presences_reunion':
          const { data: presencesReunion } = await supabase
            .from('reunions_presences')
            .select(`
              *,
              membre:membres!inner(nom, prenom, est_membre_e2d)
            `)
            .eq('reunion_id', options.configuration?.reunion_id || '')
            .eq('membre.est_membre_e2d', true);
          data = presencesReunion?.map(p => ({
            membre: `${p.membre?.prenom} ${p.membre?.nom}`,
            statut: this.formatStatut(p.statut_presence),
            statut_raw: p.statut_presence,
            heure_arrivee: p.heure_arrivee || '-',
            observations: p.observations || '-'
          })) || [];
          columns = ['Membre', 'Statut', 'Heure d\'arrivée', 'Observations'];
          break;

        case 'presences_etat':
          // Export de l'état global des absences - membres E2D uniquement
          const { data: membresEtat } = await supabase
            .from('membres')
            .select('id, nom, prenom')
            .eq('statut', 'actif')
            .eq('est_membre_e2d', true);
          const { data: presencesEtat } = await supabase
            .from('reunions_presences')
            .select('*');
          const { data: reunionsEtat } = await supabase
            .from('reunions')
            .select('id');
          
          data = membresEtat?.map(m => {
            const presencesMembre = presencesEtat?.filter(p => p.membre_id === m.id) || [];
            const totalPresences = presencesMembre.filter(p => p.statut_presence === 'present').length;
            const totalAbsences = presencesMembre.filter(p => p.statut_presence !== 'present').length;
            const absencesExcusees = presencesMembre.filter(p => p.statut_presence === 'absent_excuse').length;
            const absencesNonExcusees = presencesMembre.filter(p => p.statut_presence === 'absent_non_excuse').length;
            const taux = reunionsEtat?.length ? (totalPresences / reunionsEtat.length * 100).toFixed(1) : 0;
            return {
              membre: `${m.prenom} ${m.nom}`,
              totalPresences,
              totalAbsences,
              absencesExcusees,
              absencesNonExcusees,
              taux: `${taux}%`
            };
          }) || [];
          columns = ['Membre', 'Total Présences', 'Total Absences', 'Abs. Excusées', 'Abs. Non Excusées', 'Taux'];
          break;

        case 'presences_mensuel':
          // Export des présences sur un mois donné
          const targetMonth = options.configuration?.mois || new Date().getMonth() + 1;
          const targetYear = options.configuration?.annee || new Date().getFullYear();
          const startOfMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
          const endOfMonth = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];
          
          const { data: reunionsMensuel } = await supabase
            .from('reunions')
            .select('id, date_reunion, ordre_du_jour')
            .gte('date_reunion', startOfMonth)
            .lte('date_reunion', endOfMonth)
            .order('date_reunion');
          
          const { data: presencesMensuel } = await supabase
            .from('reunions_presences')
            .select(`
              *,
              membre:membres!inner(nom, prenom, est_membre_e2d),
              reunion:reunions!inner(date_reunion)
            `)
            .eq('membre.est_membre_e2d', true)
            .gte('reunion.date_reunion', startOfMonth)
            .lte('reunion.date_reunion', endOfMonth);
          
          data = presencesMensuel?.map(p => ({
            date: p.reunion?.date_reunion,
            membre: `${p.membre?.prenom} ${p.membre?.nom}`,
            statut: this.formatStatut(p.statut_presence),
            statut_raw: p.statut_presence,
            heure_arrivee: p.heure_arrivee || '-',
            observations: p.observations || '-'
          })) || [];
          columns = ['Date', 'Membre', 'Statut', 'Heure d\'arrivée', 'Observations'];
          break;

        case 'presences_annuel':
          // Export récapitulatif annuel des présences par membre
          const annee = options.configuration?.annee || new Date().getFullYear();
          const startOfYear = `${annee}-01-01`;
          const endOfYear = `${annee}-12-31`;
          
          const { data: membresAnnuel } = await supabase
            .from('membres')
            .select('id, nom, prenom')
            .eq('statut', 'actif')
            .eq('est_membre_e2d', true);
          
          const { data: reunionsAnnuel } = await supabase
            .from('reunions')
            .select('id')
            .gte('date_reunion', startOfYear)
            .lte('date_reunion', endOfYear)
            .in('statut', ['cloturee', 'validee']);
          
          const { data: presencesAnnuel } = await supabase
            .from('reunions_presences')
            .select('membre_id, statut_presence, reunion:reunions!inner(date_reunion)')
            .gte('reunion.date_reunion', startOfYear)
            .lte('reunion.date_reunion', endOfYear);
          
          const totalReunionsAnnuel = reunionsAnnuel?.length || 1;
          
          data = membresAnnuel?.map(m => {
            const presencesMembre = presencesAnnuel?.filter(p => p.membre_id === m.id) || [];
            const presents = presencesMembre.filter(p => p.statut_presence === 'present').length;
            const absentsExcuses = presencesMembre.filter(p => p.statut_presence === 'absent_excuse').length;
            const absentsNonExcuses = presencesMembre.filter(p => p.statut_presence === 'absent_non_excuse').length;
            const taux = ((presents / totalReunionsAnnuel) * 100).toFixed(1);
            return {
              membre: `${m.prenom} ${m.nom}`,
              presents,
              absents_excuses: absentsExcuses,
              absents_non_excuses: absentsNonExcuses,
              total_reunions: totalReunionsAnnuel,
              taux: `${taux}%`
            };
          }).sort((a, b) => parseFloat(b.taux) - parseFloat(a.taux)) || [];
          columns = ['Membre', 'Présences', 'Abs. Excusées', 'Abs. Non Excusées', 'Total Réunions', 'Taux'];
          break;

        case 'presences_membre':
          // Export détaillé pour un membre spécifique
          const membreId = options.configuration?.membre_id;
          if (!membreId) {
            throw new Error('membre_id requis pour cet export');
          }
          
          const { data: membreInfo } = await supabase
            .from('membres')
            .select('nom, prenom')
            .eq('id', membreId)
            .single();
          
          const { data: presencesMembre } = await supabase
            .from('reunions_presences')
            .select(`
              *,
              reunion:reunions!inner(date_reunion, ordre_du_jour, lieu_description)
            `)
            .eq('membre_id', membreId)
            .order('reunion(date_reunion)', { ascending: false });
          
          data = presencesMembre?.map(p => ({
            date: p.reunion?.date_reunion,
            sujet: p.reunion?.ordre_du_jour || p.reunion?.lieu_description || '-',
            statut: this.formatStatut(p.statut_presence),
            statut_raw: p.statut_presence,
            heure_arrivee: p.heure_arrivee || '-',
            observations: p.observations || '-'
          })) || [];
          columns = ['Date', 'Sujet', 'Statut', 'Heure d\'arrivée', 'Observations'];
          
          // Ajouter le nom du membre dans le nom du fichier
          if (membreInfo) {
            options.nom = `${options.nom}_${membreInfo.prenom}_${membreInfo.nom}`;
          }
          break;

        case 'membres':
          const { data: membres } = await supabase
            .from('membres')
            .select('nom, prenom, email, telephone, statut, date_inscription');
          data = membres || [];
          columns = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Statut', 'Date inscription'];
          break;

        case 'cotisations':
          const { data: cotisations } = await supabase
            .from('cotisations')
            .select(`
              montant,
              date_paiement,
              statut,
              membre:membres(nom, prenom),
              type:cotisations_types(nom)
            `);
          data = cotisations?.map(c => ({
            membre: `${c.membre?.nom} ${c.membre?.prenom}`,
            type: c.type?.nom,
            montant: c.montant,
            date: c.date_paiement,
            statut: c.statut
          })) || [];
          columns = ['Membre', 'Type', 'Montant', 'Date', 'Statut'];
          break;

        case 'matchs':
          const { data: matchs } = await supabase
            .from('sport_phoenix_matchs')
            .select('date_match, adversaire, lieu, score_equipe, score_adversaire, resultat');
          data = matchs || [];
          columns = ['Date', 'Adversaire', 'Lieu', 'Score équipe', 'Score adversaire', 'Résultat'];
          break;

        case 'finances':
          const { data: cotis } = await supabase
            .from('cotisations')
            .select('montant, date_paiement, statut');
          const { data: epargnes } = await supabase
            .from('epargnes')
            .select('montant, date_depot, statut');
          
          data = [
            ...(cotis?.map(c => ({ type: 'Cotisation', montant: c.montant, date: c.date_paiement, statut: c.statut })) || []),
            ...(epargnes?.map(e => ({ type: 'Épargne', montant: e.montant, date: e.date_depot, statut: e.statut })) || [])
          ];
          columns = ['Type', 'Montant', 'Date', 'Statut'];
          break;

        default:
          throw new Error('Type d\'export non supporté');
      }

      // Exporter selon le format
      if (options.format === 'excel') {
        await this.exportToExcel(data, columns, options.nom, options.configuration);
      } else if (options.format === 'pdf') {
        await this.exportToPDF(data, columns, options.nom, options.configuration);
      } else if (options.format === 'csv') {
        await this.exportToCSV(data, columns, options.nom);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      throw error;
    }
  }

  private static formatStatut(statut: string): string {
    switch (statut) {
      case 'present': return 'Présent';
      case 'absent_excuse': return 'Absent (excusé)';
      case 'absent_non_excuse': return 'Absent (non excusé)';
      default: return 'Non marqué';
    }
  }

  private static async exportToExcel(data: any[], columns: string[], filename: string, config?: any) {
    // Créer les données avec en-tête personnalisé
    const headerRows = [
      ['ASSOCIATION E2D'],
      ['FEUILLE DE PRÉSENCE'],
      [`Réunion du ${config?.date ? new Date(config.date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}`],
      [config?.type ? `Type: ${config.type}` : ''],
      [''],
      columns
    ];

    // Préparer les données du tableau (exclure statut_raw)
    const tableData = data.map(row => {
      const { statut_raw, ...rest } = row;
      return Object.values(rest);
    });

    const wsData = [...headerRows, ...tableData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Largeur des colonnes
    ws['!cols'] = [
      { wch: 30 }, // Membre
      { wch: 20 }, // Statut
      { wch: 18 }, // Heure
      { wch: 35 }  // Observations
    ];

    // Fusionner les cellules d'en-tête
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // E2D
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Feuille de présence
      { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, // Date
      { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, // Type
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Présences');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  private static async exportToPDF(data: any[], columns: string[], filename: string, config?: any) {
    const doc = new jsPDF();
    
    // Logo E2D en haut à droite
    try {
      doc.addImage(LOGO_E2D_BASE64, 'PNG', 155, 8, 40, 20);
    } catch (e) {
      console.log('Logo non chargé, continuation sans logo');
    }

    // En-tête avec style
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175); // Bleu E2D
    doc.text('FEUILLE DE PRÉSENCE', 14, 18);
    
    // Sous-titre
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    const dateReunion = config?.date ? new Date(config.date).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : new Date().toLocaleDateString('fr-FR');
    doc.text(`Réunion du ${dateReunion}`, 14, 26);
    
    if (config?.type) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Type: ${config.type}`, 14, 32);
    }

    // Ligne de séparation
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.5);
    doc.line(14, 36, 196, 36);

    // Statistiques rapides
    const presents = data.filter(d => d.statut_raw === 'present').length;
    const absentsExcuses = data.filter(d => d.statut_raw === 'absent_excuse').length;
    const absentsNonExcuses = data.filter(d => d.statut_raw === 'absent_non_excuse').length;
    const total = data.length;
    const taux = total > 0 ? ((presents / total) * 100).toFixed(1) : '0';

    doc.setFontSize(9);
    doc.setTextColor(22, 163, 74); // Vert
    doc.text(`Présents: ${presents}`, 14, 43);
    doc.setTextColor(234, 88, 12); // Orange
    doc.text(`Abs. excusées: ${absentsExcuses}`, 60, 43);
    doc.setTextColor(220, 38, 38); // Rouge
    doc.text(`Abs. non excusées: ${absentsNonExcuses}`, 106, 43);
    doc.setTextColor(30, 64, 175); // Bleu
    doc.text(`Total: ${total} | Taux: ${taux}%`, 160, 43);

    // Préparer les données du tableau (exclure statut_raw)
    const tableData = data.map((row, index) => {
      const { statut_raw, ...rest } = row;
      return [index + 1, ...Object.values(rest)];
    });
    
    autoTable(doc, {
      head: [['N°', ...columns]],
      body: tableData,
      startY: 48,
      theme: 'striped',
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [30, 64, 175],  // Bleu E2D
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { 
        fillColor: [245, 247, 250] 
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { cellWidth: 50 },
        2: { halign: 'center', cellWidth: 40 },
        3: { halign: 'center', cellWidth: 30 },
        4: { cellWidth: 'auto' }
      },
      didParseCell: (hookData) => {
        // Couleurs selon le statut dans la colonne "Statut"
        if (hookData.section === 'body' && hookData.column.index === 2) {
          const rowIndex = hookData.row.index;
          const statut = data[rowIndex]?.statut_raw;
          if (statut === 'present') {
            hookData.cell.styles.textColor = [22, 163, 74]; // Vert
            hookData.cell.styles.fontStyle = 'bold';
          } else if (statut === 'absent_non_excuse') {
            hookData.cell.styles.textColor = [220, 38, 38]; // Rouge
            hookData.cell.styles.fontStyle = 'bold';
          } else if (statut === 'absent_excuse') {
            hookData.cell.styles.textColor = [234, 88, 12]; // Orange
            hookData.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Association E2D - Exporté le ${new Date().toLocaleDateString('fr-FR')} - Page ${i}/${pageCount}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  private static async exportToCSV(data: any[], columns: string[], filename: string) {
    // Exclure statut_raw des exports CSV
    const cleanData = data.map(row => {
      const { statut_raw, ...rest } = row;
      return rest;
    });

    const csv = [
      columns.join(','),
      ...cleanData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
}