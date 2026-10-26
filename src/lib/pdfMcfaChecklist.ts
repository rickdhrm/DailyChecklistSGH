import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MCFA_SECTIONS } from './mcfaConstants';

export interface McfaPdfMetadata {
  technicianName?: string;
  supervisorName?: string;
  buildingManagerName?: string;
  submittedAt?: string | Date;
}

export function generateMcfaChecklistPdf(
  subData: Record<string, any> = {},
  metadata: McfaPdfMetadata = {}
): Buffer {
  // A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const marginLeft = 12;
  const marginTop = 10;
  const tableWidth = 273; // 297 - 24

  // Date formatting (prioritizing submission date)
  let dateText = '';
  if (metadata.submittedAt) {
    const d = new Date(metadata.submittedAt);
    if (!isNaN(d.getTime())) {
      dateText = d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
  }
  if (!dateText && subData.tanggal) {
    const d = new Date(subData.tanggal);
    if (!isNaN(d.getTime())) {
      dateText = d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } else {
      dateText = subData.tanggal;
    }
  }
  if (!dateText) {
    dateText = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  const techName = metadata.technicianName || subData.teknisi_nama || 'Admin Engineering';
  const spvName = metadata.supervisorName || subData.spv_nama || 'Supervisor Engineering';
  const bmName = metadata.buildingManagerName || subData.bm_nama || 'Building Manager';

  // 1. TOP HEADER SECTION
  doc.setTextColor(0, 0, 0);

  // Left Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('DAILY LOGSHEET ENGINEERING DEPARTMENT', marginLeft, marginTop + 4);

  doc.setFontSize(14);
  doc.text('CHEKLIST OPERASIONAL MCFA & ANNUNCIATOR', marginLeft, marginTop + 11);

  // Right Metadata: TANGGAL & NAMA
  const rightMetaX = 210;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  doc.text('TANGGAL :', rightMetaX, marginTop + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(String(dateText), rightMetaX + 22, marginTop + 4);

  doc.setFont('helvetica', 'bold');
  doc.text('NAMA :', rightMetaX, marginTop + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.text(String(techName), rightMetaX + 22, marginTop + 10.5);

  // 2. MAIN TABLE - MCFA, LANTAI/ZONE, PENYEBAB TROUBLE/FIRE, PENANGANAN, STATUS
  const tableStartY = marginTop + 16;

  const tableHead = [
    [
      { content: 'MCFA', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const, fontSize: 9.5 } },
      { content: 'LANTAI', styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const, fontSize: 8.5 } },
      { content: 'PENYEBAB TROUBLE/FIRE', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const, fontSize: 9.5 } },
      { content: 'PENANGANAN', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const, fontSize: 9.5 } },
      { content: 'STATUS', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const, fontSize: 9.5 } },
    ],
    [
      { content: 'ZONE', styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const, fontSize: 8.5 } },
    ],
  ];

  const tableBody: any[] = [];

  MCFA_SECTIONS.forEach((section) => {
    for (let i = 0; i < section.rowCount; i++) {
      const rowNum = i + 1;
      const keyPrefix = `mcfa_${section.id}_${rowNum}`;

      const lantaiVal = subData[`${keyPrefix}_lantai`] || '';
      const zoneVal = subData[`${keyPrefix}_zone`] || '';
      const penyebabVal = subData[`${keyPrefix}_penyebab`] || '';
      const penangananVal = subData[`${keyPrefix}_penanganan`] || '';
      const statusVal = subData[`${keyPrefix}_status`] || '';

      // Format floor and zone
      let locationCell = '';
      if (lantaiVal && zoneVal) {
        locationCell = `${lantaiVal}\n${zoneVal}`;
      } else if (lantaiVal) {
        locationCell = lantaiVal;
      } else if (zoneVal) {
        locationCell = zoneVal;
      }

      const row: any[] = [];

      if (i === 0) {
        row.push({
          content: section.title,
          rowSpan: section.rowCount,
          styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const, fontSize: 9 },
        });
      }

      row.push({
        content: locationCell,
        styles: { halign: 'center' as const, valign: 'middle' as const, fontSize: 8 },
      });

      row.push({
        content: String(penyebabVal),
        styles: { halign: 'left' as const, valign: 'middle' as const, fontSize: 8 },
      });

      row.push({
        content: String(penangananVal),
        styles: { halign: 'left' as const, valign: 'middle' as const, fontSize: 8 },
      });

      row.push({
        content: String(statusVal),
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          fontStyle: 'bold' as const,
          fontSize: 8,
          textColor: (statusVal === 'TROUBLE' || statusVal === 'FAULT' || statusVal === 'ALARM') ? [200, 0, 0] : [0, 0, 0],
        },
      });

      tableBody.push(row);
    }
  });

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: marginLeft, right: marginLeft },
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: [1.8, 2],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      textColor: [0, 0, 0],
      minCellHeight: 7.2,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    columnStyles: {
      0: { cellWidth: 46, halign: 'center' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 95, halign: 'left' },
      3: { cellWidth: 74, halign: 'left' },
      4: { cellWidth: 28, halign: 'center' },
    },
  });

  const finalTableY = (doc as any).lastAutoTable.finalY || 135;

  // 3. SIGNATURE SECTION - TECHNICIAN, SUPERVISOR, BUILDING MANAGER
  const sigStartY = finalTableY + 7;
  const sigBoxW = 72;
  const sigBoxH = 30;
  const sigGap = (tableWidth - sigBoxW * 3) / 2; // ~28.5mm

  const sigBoxes = [
    { title: 'Dibuat Oleh :', role: 'Teknisi', name: techName, colX: marginLeft },
    { title: 'Diperiksa Oleh :', role: 'Supervisor', name: spvName, colX: marginLeft + sigBoxW + sigGap },
    { title: 'Disetujui Oleh :', role: 'Building Manager', name: bmName, colX: marginLeft + (sigBoxW + sigGap) * 2 },
  ];

  sigBoxes.forEach((sig) => {
    // Outer border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.rect(sig.colX, sigStartY, sigBoxW, sigBoxH);

    // Header inside box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(sig.title, sig.colX + 3.5, sigStartY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`(${sig.role})`, sig.colX + 3.5, sigStartY + 9.5);

    // Signature line
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.15);
    doc.line(sig.colX + 3.5, sigStartY + 21, sig.colX + sigBoxW - 3.5, sigStartY + 21);

    // Name & Date lines
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`Nama: ${sig.name || '...........................................'}`, sig.colX + 3.5, sigStartY + 24.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Tanggal: ${dateText || '...........................................'}`, sig.colX + 3.5, sigStartY + 28);
  });

  // Footer Ownership Tag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('DOKUMEN INI MILIK PT. MUTIARA PROKLAMASI SEJAHTERA - GEDUNG SGH TOWER', 148.5, 203, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}
