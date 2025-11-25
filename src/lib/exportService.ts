import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from "@/integrations/supabase/client";

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
        await this.exportToExcel(data, columns, options.nom);
      } else if (options.format === 'pdf') {
        await this.exportToPDF(data, columns, options.nom);
      } else if (options.format === 'csv') {
        await this.exportToCSV(data, columns, options.nom);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      throw error;
    }
  }

  private static async exportToExcel(data: any[], columns: string[], filename: string) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Export');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  private static async exportToPDF(data: any[], columns: string[], filename: string) {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(filename, 14, 15);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = data.map(row => Object.values(row));
    
    autoTable(doc, {
      head: [columns],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  private static async exportToCSV(data: any[], columns: string[], filename: string) {
    const csv = [
      columns.join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
}
