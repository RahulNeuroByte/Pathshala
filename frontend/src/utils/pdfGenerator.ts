import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDFReport = (
  reportTitle: string,
  metaDetails: Record<string, string>,
  headers: string[][],
  rows: any[][],
  filename: string
) => {
  const doc = new jsPDF();

  // Branding Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(67, 56, 202); // indigo-700
  doc.text('PATHSHALA ACADEMIC ERP', 14, 20);

  // Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(14, 24, 196, 24);

  // Report Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(reportTitle, 14, 33);

  // Metadata block
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  
  let currentY = 40;
  Object.entries(metaDetails).forEach(([key, val]) => {
    doc.text(`${key}: ${val}`, 14, currentY);
    currentY += 5;
  });

  // Timestamp
  doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, currentY);
  currentY += 8;

  // Render Table
  autoTable(doc, {
    startY: currentY,
    head: headers,
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [67, 56, 202], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 8.5 },
    columnStyles: { text: { overflow: 'visible' } },
  });

  doc.save(filename);
};
