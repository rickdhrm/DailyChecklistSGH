import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LIFT_GROUPS, COMPUTER_LIFT_ITEMS } from './liftChecklistConstants';

export interface LiftPdfMetadata {
  technicianName?: string;
  supervisorName?: string;
  buildingManagerName?: string;
  submittedAt?: string | Date;
}

export function generateLiftChecklistPdf(
  subData: Record<string, any> = {},
  metadata: LiftPdfMetadata = {}
): Buffer {
  // A4 Portrait: 210mm x 297mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const marginLeft = 12;
  const marginTop = 10;
  const tableWidth = 186; // 210 - 24

  // Format Date & Time
  let dateText = subData.tanggal || '';
  if (!dateText && metadata.submittedAt) {
    const d = new Date(metadata.submittedAt);
    dateText = d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } else if (!dateText) {
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
  doc.setFontSize(13);
  doc.text('SGH TOWER', marginLeft, marginTop + 4);

  doc.setFontSize(9.5);
  doc.text('DAILY LOGSHEET ENGINEERING DEPARTMENT', marginLeft, marginTop + 9);

  doc.setFontSize(13);
  doc.text('CHEKLIST OPERASIONAL LIFT', marginLeft, marginTop + 15);

  // Right Metadata: TANGGAL & NAMA
  const rightMetaX = 142;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  doc.text('TANGGAL :', rightMetaX, marginTop + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(String(dateText), rightMetaX + 19, marginTop + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('NAMA :', rightMetaX, marginTop + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(String(techName), rightMetaX + 19, marginTop + 12);

  // 2. MAIN TABLE - LIFT, CEKLIST, STATUS (OK/TDK), TEST HOMING, BATTERY ARD
  const table1StartY = marginTop + 18;

  const table1Head = [
    [
      { content: 'LIFT', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const } },
      { content: 'CEKLIST', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const } },
      { content: 'STATUS', colSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const } },
      { content: 'TEST', colSpan: 1, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const } },
      { content: 'BATTERY ARD\n(HARI SABTU) / VOLT', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const } },
    ],
    [
      { content: 'OK', styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const } },
      { content: 'TDK', styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const } },
      { content: 'HOMING (SABTU)', styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const } },
    ],
  ];

  const table1Body: any[] = [];

  LIFT_GROUPS.forEach((group) => {
    group.items.forEach((item, idx) => {
      const statusVal = subData[`${item.id}_status`] !== undefined ? String(subData[`${item.id}_status`]).trim().toUpperCase() : 'OK';
      const isOk = statusVal === 'OK' || statusVal === 'GOOD' || statusVal === 'NORMAL' || statusVal === 'TRUE';
      const isTdk = statusVal === 'TDK' || statusVal === 'BAD' || statusVal === 'NOT OK' || statusVal === 'RUSAK';

      const homingVal = subData[`${item.id}_homing`] || subData[`${group.id}_homing`] || '';
      const batteryVal = subData[`${item.id}_battery_ard`] || subData[`${group.id}_battery_ard`] || '';

      const row: any[] = [];

      if (idx === 0) {
        row.push({
          content: group.label,
          rowSpan: group.items.length,
          styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const, fontSize: 8.5 },
        });
      }

      row.push({
        content: item.name,
        styles: { halign: 'left' as const, valign: 'middle' as const, fontSize: 8 },
      });

      row.push({
        content: isOk ? 'CHECK' : '',
        styles: { halign: 'center' as const, valign: 'middle' as const },
      });

      row.push({
        content: isTdk ? 'CHECK' : '',
        styles: { halign: 'center' as const, valign: 'middle' as const },
      });

      row.push({
        content: homingVal ? String(homingVal) : '',
        styles: { halign: 'center' as const, valign: 'middle' as const, fontSize: 7.5 },
      });

      row.push({
        content: batteryVal ? String(batteryVal) : '',
        styles: { halign: 'center' as const, valign: 'middle' as const, fontSize: 7.5 },
      });

      table1Body.push(row);
    });
  });

  autoTable(doc, {
    startY: table1StartY,
    margin: { left: marginLeft, right: marginLeft },
    head: table1Head,
    body: table1Body,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: [1.3, 1.2],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      textColor: [0, 0, 0],
      minCellHeight: 4.8,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    columnStyles: {
      0: { cellWidth: 32, halign: 'center' },
      1: { cellWidth: 38, halign: 'left' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 42, halign: 'center' },
      5: { cellWidth: 46, halign: 'center' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && (data.column.index === 2 || data.column.index === 3)) {
        const raw = typeof data.cell.raw === 'object' ? data.cell.raw?.content : data.cell.raw;
        if (raw === 'CHECK') {
          data.cell.text = [];
        }
      }
    },
    didDrawCell: (data: any) => {
      if (data.section === 'body' && (data.column.index === 2 || data.column.index === 3)) {
        const raw = typeof data.cell.raw === 'object' ? data.cell.raw?.content : data.cell.raw;
        if (raw === 'CHECK') {
          const cx = data.cell.x + data.cell.width / 2;
          const cy = data.cell.y + data.cell.height / 2;
          doc.saveGraphicsState();
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.4);
          doc.line(cx - 1.8, cy - 0.2, cx - 0.5, cy + 1.2);
          doc.line(cx - 0.5, cy + 1.2, cx + 2.0, cy - 1.5);
          doc.restoreGraphicsState();
        }
      }
    },
  });

  const finalY1 = (doc as any).lastAutoTable.finalY || 155;

  // 3. TABLE 2: KOMPUTER LIFT - CEK POSISI/KOMUNIKASI LIFT
  const table2StartY = finalY1 + 1.5;

  const table2Head = [
    [
      { content: 'Komputer Lift', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const, fontSize: 8.5 } },
      { content: 'CEK POSISI/KOMUNIKASI LIFT', colSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const, fontSize: 8.5 } },
    ],
    [
      { content: 'STATUS', styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const, fontSize: 8 } },
      { content: 'KETERANGAN', styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'bold' as const, fontSize: 8 } },
    ],
  ];

  const table2Body: any[] = [];

  COMPUTER_LIFT_ITEMS.forEach((comp) => {
    const rawStatus = subData[`${comp.id}_status`] !== undefined ? String(subData[`${comp.id}_status`]).trim().toUpperCase() : 'OK';
    const rawKet = subData[`${comp.id}_keterangan`] || '';

    table2Body.push([
      { content: comp.name, styles: { halign: 'left' as const, valign: 'middle' as const, fontSize: 8 } },
      { content: rawStatus || 'OK', styles: { halign: 'center' as const, valign: 'middle' as const, fontSize: 8, fontStyle: 'bold' as const } },
      { content: String(rawKet), styles: { halign: 'left' as const, valign: 'middle' as const, fontSize: 8 } },
    ]);
  });

  autoTable(doc, {
    startY: table2StartY,
    margin: { left: marginLeft, right: marginLeft },
    head: table2Head,
    body: table2Body,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: [1.3, 1.2],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      textColor: [0, 0, 0],
      minCellHeight: 4.8,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    columnStyles: {
      0: { cellWidth: 70, halign: 'left' },
      1: { cellWidth: 28, halign: 'center' },
      2: { cellWidth: 88, halign: 'left' },
    },
  });

  const finalY2 = (doc as any).lastAutoTable.finalY || 195;

  // 4. SIGNATURE COLUMNS - TECHNICIAN, SUPERVISOR, BUILDING MANAGER
  const sigStartY = finalY2 + 5;
  const sigBoxW = 56;
  const sigBoxH = 28;
  const sigGap = (tableWidth - sigBoxW * 3) / 2; // ~9mm

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
    doc.setFontSize(8);
    doc.text(sig.title, sig.colX + 3, sigStartY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`(${sig.role})`, sig.colX + 3, sigStartY + 8.5);

    // Signature space divider line
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.15);
    doc.line(sig.colX + 3, sigStartY + 20, sig.colX + sigBoxW - 3, sigStartY + 20);

    // Name & Date lines
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`Nama: ${sig.name || '................................'}`, sig.colX + 3, sigStartY + 23.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Tanggal: ${dateText || '................................'}`, sig.colX + 3, sigStartY + 26.5);
  });

  // Footer Ownership Tag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('DOKUMEN INI MILIK PT. MUTIARA PROKLAMASI SEJAHTERA - GEDUNG SGH TOWER', 105, 290, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}
