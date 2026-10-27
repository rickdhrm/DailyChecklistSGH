import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MONTH_NAMES_ID, MONTH_NAMES_EN, calculateTotalKwh } from './electricalConstants';

export interface ElectricalPdfMetadata {
  technicianName?: string;
  supervisorName?: string;
  buildingManagerName?: string;
  submittedAt?: string | Date;
  period?: string; // Format 'YYYY-MM', e.g., '2026-10'
  month?: number;  // 1-12
  year?: number;   // e.g., 2026
}

export function generateElectricalLogsheetPdf(
  subData: Record<string, any> = {},
  metadata: ElectricalPdfMetadata = {}
): Buffer {
  // A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const marginLeft = 8;
  const marginTop = 8;
  const tableWidth = 281; // 297 - 16

  // Resolve Period (Month & Year)
  let periodText = '';
  let targetYear = metadata.year || new Date().getFullYear();
  let targetMonth = metadata.month || (new Date().getMonth() + 1);

  if (metadata.period) {
    const parts = metadata.period.split('-');
    if (parts.length === 2) {
      targetYear = parseInt(parts[0], 10);
      targetMonth = parseInt(parts[1], 10);
    }
  } else if (subData.period) {
    const parts = String(subData.period).split('-');
    if (parts.length === 2) {
      targetYear = parseInt(parts[0], 10);
      targetMonth = parseInt(parts[1], 10);
    }
  }

  const monthIdx = Math.max(0, Math.min(11, targetMonth - 1));
  periodText = `${MONTH_NAMES_ID[monthIdx]} ${targetYear}`;

  const techName = metadata.technicianName || subData.teknisi_nama || 'Admin Engineering';
  const spvName = metadata.supervisorName || subData.spv_nama || 'Supervisor Engineering';
  const bmName = metadata.buildingManagerName || subData.bm_nama || 'Building Manager';

  // 1. TOP HEADER SECTION
  doc.setTextColor(0, 0, 0);

  // Left Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SGH TOWER PROKLAMASI', marginLeft, marginTop + 3.5);

  doc.setFontSize(13);
  doc.text('LOG SHEET ELECTRICAL', marginLeft, marginTop + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`PERIODE   :  ${periodText.toUpperCase()}`, marginLeft, marginTop + 14.5);

  // 2. MAIN TABLE - 16 COLUMNS, 31 DAYS
  const tableStartY = marginTop + 17;

  const tableHead: any[] = [
    [
      {
        content: 'TGL',
        rowSpan: 2,
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 8 },
      },
      {
        content: 'Jam',
        rowSpan: 2,
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 8 },
      },
      {
        content: 'METER LISTRIK DEPAN GARDU PLN',
        colSpan: 6,
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 8.5 },
      },
      {
        content: 'KWH\n(GENSET)',
        rowSpan: 2,
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 7.5 },
      },
      {
        content: 'PDAM\n(M3)',
        rowSpan: 2,
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 7.5 },
      },
      {
        content: 'ATS\nMANUAL /AUTO',
        rowSpan: 2,
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 7 },
      },
      {
        content: 'STEP\nCAP.BANK',
        rowSpan: 2,
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 7 },
      },
      {
        content: 'COS PI\nCAP.BANK',
        rowSpan: 2,
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 7 },
      },
      {
        content: 'STEP\nTRAFO',
        rowSpan: 2,
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 7 },
      },
      {
        content: 'LEVEL OLI\nTRAFO H/M/L',
        rowSpan: 2,
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 6.5 },
      },
      {
        content: 'DICEK OLEH',
        rowSpan: 2,
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 8 },
      },
    ],
    [
      {
        content: 'Power faktor\n(Cos phi)',
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 7 },
      },
      {
        content: 'KV',
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 7.5 },
      },
      {
        content: 'Kwh WBP',
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 7.5 },
      },
      {
        content: 'KWH\nLWBP 1',
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 7 },
      },
      {
        content: 'Total KWH\n(WBP+LWBP)',
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 7 },
      },
      {
        content: 'Total\nKVArh',
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 7 },
      },
    ],
  ];

  const tableBody: any[] = [];

  // Extract daily data either from subData.days object, or direct keyed format: day_{d}_{field}
  const daysData = subData.days || {};

  for (let day = 1; day <= 31; day++) {
    const dayEntry = daysData[day] || daysData[String(day)] || {};

    const jam = dayEntry.jam ?? subData[`day_${day}_jam`] ?? '';
    const pf = dayEntry.power_faktor ?? subData[`day_${day}_power_faktor`] ?? '';
    const kv = dayEntry.kv ?? subData[`day_${day}_kv`] ?? '';
    const wbp = dayEntry.kwh_wbp ?? subData[`day_${day}_kwh_wbp`] ?? '';
    const lwbp = dayEntry.kwh_lwbp_1 ?? subData[`day_${day}_kwh_lwbp_1`] ?? '';

    // Calculate or retrieve Total KWH
    let totalKwh = dayEntry.total_kwh ?? subData[`day_${day}_total_kwh`];
    if (!totalKwh && (wbp || lwbp)) {
      totalKwh = calculateTotalKwh(wbp, lwbp);
    }
    totalKwh = totalKwh ?? '';

    const kvarh = dayEntry.total_kvarh ?? subData[`day_${day}_total_kvarh`] ?? '';
    const genset = dayEntry.kwh_genset ?? subData[`day_${day}_kwh_genset`] ?? '';
    const pdam = dayEntry.pdam ?? subData[`day_${day}_pdam`] ?? '';
    const ats = dayEntry.ats_status ?? subData[`day_${day}_ats_status`] ?? '';
    const stepCap = dayEntry.step_cap_bank ?? subData[`day_${day}_step_cap_bank`] ?? '';
    const cosPiCap = dayEntry.cos_pi_cap_bank ?? subData[`day_${day}_cos_pi_cap_bank`] ?? '';
    const stepTrafo = dayEntry.step_trafo ?? subData[`day_${day}_step_trafo`] ?? '';
    const oliTrafo = dayEntry.level_oli_trafo ?? subData[`day_${day}_level_oli_trafo`] ?? '';
    const dicek = dayEntry.dicek_oleh ?? subData[`day_${day}_dicek_oleh`] ?? '';

    tableBody.push([
      {
        content: String(day),
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 7.5 },
      },
      { content: String(jam), styles: { halign: 'center', valign: 'middle', fontSize: 7 } },
      { content: String(pf), styles: { halign: 'center', valign: 'middle', fontSize: 7 } },
      { content: String(kv), styles: { halign: 'center', valign: 'middle', fontSize: 7 } },
      { content: String(wbp), styles: { halign: 'right', valign: 'middle', fontSize: 7 } },
      { content: String(lwbp), styles: { halign: 'right', valign: 'middle', fontSize: 7 } },
      { content: String(totalKwh), styles: { halign: 'right', valign: 'middle', fontStyle: 'bold', fontSize: 7 } },
      { content: String(kvarh), styles: { halign: 'right', valign: 'middle', fontSize: 7 } },
      { content: String(genset), styles: { halign: 'right', valign: 'middle', fontSize: 7 } },
      { content: String(pdam), styles: { halign: 'right', valign: 'middle', fontSize: 7 } },
      { content: String(ats), styles: { halign: 'center', valign: 'middle', fontSize: 6.5, fontStyle: 'bold' } },
      { content: String(stepCap), styles: { halign: 'center', valign: 'middle', fontSize: 7 } },
      { content: String(cosPiCap), styles: { halign: 'center', valign: 'middle', fontSize: 7 } },
      { content: String(stepTrafo), styles: { halign: 'center', valign: 'middle', fontSize: 7 } },
      { content: String(oliTrafo), styles: { halign: 'center', valign: 'middle', fontSize: 7, fontStyle: 'bold' } },
      { content: String(dicek), styles: { halign: 'center', valign: 'middle', fontSize: 7 } },
    ]);
  }

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: marginLeft, right: marginLeft },
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: [0.55, 0.8],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      textColor: [0, 0, 0],
      minCellHeight: 3.3,
    },
    headStyles: {
      fillColor: [242, 244, 247],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      valign: 'middle',
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },   // TGL
      1: { cellWidth: 13, halign: 'center' },  // Jam
      2: { cellWidth: 17, halign: 'center' },  // Power faktor
      3: { cellWidth: 12, halign: 'center' },  // KV
      4: { cellWidth: 18, halign: 'right' },   // Kwh WBP
      5: { cellWidth: 18, halign: 'right' },   // KWH LWBP 1
      6: { cellWidth: 22, halign: 'right' },   // Total KWH
      7: { cellWidth: 18, halign: 'right' },   // Total KVArh
      8: { cellWidth: 19, halign: 'right' },   // KWH GENSET
      9: { cellWidth: 16, halign: 'right' },   // PDAM
      10: { cellWidth: 17, halign: 'center' }, // ATS
      11: { cellWidth: 17, halign: 'center' }, // STEP CAP
      12: { cellWidth: 17, halign: 'center' }, // COS PI CAP
      13: { cellWidth: 16, halign: 'center' }, // STEP TRAFO
      14: { cellWidth: 18, halign: 'center' }, // LEVEL OLI TRAFO
      15: { cellWidth: 25, halign: 'center' }, // DICEK OLEH
    },
  });

  const finalTableY = (doc as any).lastAutoTable.finalY || 142;

  // 3. SIGNATURE SECTION - 3 COLUMNS: TECHNICIAN, SUPERVISOR, BUILDING MANAGER
  const sigStartY = finalTableY + 4;
  const sigBoxW = 84;
  const sigBoxH = 24;
  const sigGap = (tableWidth - sigBoxW * 3) / 2; // (281 - 252) / 2 = 14.5mm

  const sigBoxes = [
    { title: 'Dibuat Oleh :', role: 'Teknisi', name: techName, colX: marginLeft },
    { title: 'Diperiksa Oleh :', role: 'Supervisor', name: spvName, colX: marginLeft + sigBoxW + sigGap },
    { title: 'Disetujui Oleh :', role: 'Building Manager', name: bmName, colX: marginLeft + (sigBoxW + sigGap) * 2 },
  ];

  sigBoxes.forEach((sig) => {
    // Outer border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(sig.colX, sigStartY, sigBoxW, sigBoxH);

    // Header inside box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(sig.title, sig.colX + 3.5, sigStartY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);
    doc.text(`(${sig.role})`, sig.colX + 3.5, sigStartY + 8);

    // Signature line
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.2);
    doc.line(sig.colX + 3.5, sigStartY + 16.5, sig.colX + sigBoxW - 3.5, sigStartY + 16.5);

    // Name & Date lines
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Nama: ${sig.name || '...........................................'}`, sig.colX + 3.5, sigStartY + 19.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(0, 0, 0);
    doc.text(`Tanggal: ${periodText || '...........................................'}`, sig.colX + 3.5, sigStartY + 22.5);
  });

  // Footer Ownership Tag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(70, 70, 70);
  doc.text('DOKUMEN INI MILIK PT. MUTIARA PROKLAMASI SEJAHTERA - GEDUNG SGH TOWER', 148.5, 203, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}
