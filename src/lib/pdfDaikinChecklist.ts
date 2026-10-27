import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DAIKIN_FLOOR_ITEMS } from './daikinConstants';

export interface DaikinPdfMetadata {
  technicianName?: string;
  supervisorName?: string;
  buildingManagerName?: string;
  submittedAt?: string | Date;
}

export function generateDaikinChecklistPdf(
  subData: Record<string, any> = {},
  metadata: DaikinPdfMetadata = {}
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
  doc.setFontSize(11);
  doc.text('DAILY LOGSHEET ENGINEERING DEPARTMENT', marginLeft, marginTop + 4);

  doc.setFontSize(16);
  doc.text('PANEL ITM DAIKIN', marginLeft, marginTop + 11.5);

  // Right Metadata: TANGGAL, GEDUNG
  const rightMetaX = 205;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);

  doc.text('TANGGAL :', rightMetaX, marginTop + 4);
  doc.text(String(dateText), rightMetaX + 22, marginTop + 4);

  doc.text('GEDUNG :', rightMetaX, marginTop + 10.5);
  doc.text('SGH TOWER', rightMetaX + 22, marginTop + 10.5);

  // 2. MAIN TABLE - 5 COLUMNS
  const tableStartY = marginTop + 16.5;

  const tableHead: any[] = [
    [
      {
        content: 'PANEL ITM DAIKIN',
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          fontStyle: 'bold' as const,
          fontSize: 11,
          textColor: [0, 0, 0],
        },
      },
      {
        content: 'STATUS ON/OFF',
        colSpan: 2,
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          fontStyle: 'bold' as const,
          fontSize: 11,
          textColor: [0, 0, 0],
        },
      },
      {
        content: 'KETERANGAN',
        colSpan: 2,
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          fontStyle: 'bold' as const,
          fontSize: 11,
          textColor: [0, 0, 0],
        },
      },
    ],
    [
      {
        content: 'CEK TEMPERATURE RUANG KANTOR',
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          fontStyle: 'bold' as const,
          fontSize: 10,
          textColor: [0, 0, 0],
        },
      },
      {
        content: 'ON',
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          fontStyle: 'bold' as const,
          fontSize: 10.5,
          textColor: [0, 0, 0],
        },
      },
      {
        content: 'OFF',
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          fontStyle: 'bold' as const,
          fontSize: 10.5,
          textColor: [0, 0, 0],
        },
      },
      {
        content: 'SUHU (°C)',
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          fontStyle: 'bold' as const,
          fontSize: 10,
          textColor: [0, 0, 0],
        },
      },
      {
        content: 'KETERANGAN / CATATAN',
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          fontStyle: 'bold' as const,
          fontSize: 10,
          textColor: [0, 0, 0],
        },
      },
    ],
  ];

  const tableBody: any[] = [];

  DAIKIN_FLOOR_ITEMS.forEach((floor) => {
    const rawStatus = subData[`${floor.id}_status`];
    const statusVal = rawStatus !== undefined && rawStatus !== null ? String(rawStatus).trim().toUpperCase() : '';
    const rawTemp = subData[`${floor.id}_temperature`];
    const tempVal = rawTemp !== undefined && rawTemp !== null ? String(rawTemp).trim() : '';
    const rawKet = subData[`${floor.id}_keterangan`];
    const ketVal = rawKet !== undefined && rawKet !== null ? String(rawKet).trim() : '';

    // If blank template (no status provided), show blank cells for ticking
    const isOn = statusVal === 'ON' || statusVal === 'TRUE' || statusVal === '1';
    const isOff = statusVal === 'OFF' || statusVal === 'FALSE' || statusVal === '0';

    const onCell = isOn ? 'CHECK' : '';
    const offCell = isOff ? 'CHECK' : '';
    const tempDisplay = tempVal ? (tempVal.endsWith('°C') ? tempVal : `${tempVal}°C`) : '';

    tableBody.push([
      {
        content: floor.name,
        styles: {
          halign: 'left' as const,
          valign: 'middle' as const,
          fontStyle: 'bold' as const,
          fontSize: 9.5,
          textColor: [0, 0, 0],
        },
      },
      {
        content: onCell,
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          fontStyle: 'bold' as const,
          fontSize: 10,
        },
      },
      {
        content: offCell,
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          fontStyle: 'bold' as const,
          fontSize: 10,
        },
      },
      {
        content: tempDisplay,
        styles: {
          halign: 'center' as const,
          valign: 'middle' as const,
          fontStyle: 'bold' as const,
          fontSize: 9.5,
          textColor: [0, 0, 0],
        },
      },
      {
        content: ketVal,
        styles: {
          halign: 'left' as const,
          valign: 'middle' as const,
          fontStyle: 'normal' as const,
          fontSize: 9,
          textColor: [0, 0, 0],
        },
      },
    ]);
  });

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: marginLeft, right: marginLeft },
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9.5,
      cellPadding: [2.3, 3],
      lineColor: [0, 0, 0],
      lineWidth: 0.35,
      textColor: [0, 0, 0],
      minCellHeight: 7.2,
    },
    headStyles: {
      fillColor: [242, 244, 247],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 10.5,
      halign: 'center',
      valign: 'middle',
      lineColor: [0, 0, 0],
      lineWidth: 0.35,
    },
    columnStyles: {
      0: { cellWidth: 73, halign: 'left' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 40, halign: 'center' },
      4: { cellWidth: 100, halign: 'left' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && (data.column.index === 1 || data.column.index === 2)) {
        const raw = typeof data.cell.raw === 'object' ? data.cell.raw?.content : data.cell.raw;
        if (raw === 'CHECK' || raw === '✓' || raw === 'V') {
          data.cell.text = [];
        }
      }
    },
    didDrawCell: (data: any) => {
      if (data.section === 'body' && (data.column.index === 1 || data.column.index === 2)) {
        const raw = typeof data.cell.raw === 'object' ? data.cell.raw?.content : data.cell.raw;
        if (raw === 'CHECK' || raw === '✓' || raw === 'V') {
          const cx = data.cell.x + data.cell.width / 2;
          const cy = data.cell.y + data.cell.height / 2;
          doc.saveGraphicsState();
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.65);
          // Draw crisp vector checkmark: short down-stroke, long up-stroke
          doc.line(cx - 2.8, cy + 0.1, cx - 0.7, cy + 2.3);
          doc.line(cx - 0.7, cy + 2.3, cx + 3.2, cy - 2.2);
          doc.restoreGraphicsState();
        }
      }
    },
  });

  const finalTableY = (doc as any).lastAutoTable.finalY || 130;

  // 3. SIGNATURE SECTION - 3 COLUMNS: TECHNICIAN, SUPERVISOR, BUILDING MANAGER
  const sigStartY = finalTableY + 6;
  const sigBoxW = 75;
  const sigBoxH = 32;
  const sigGap = (tableWidth - sigBoxW * 3) / 2; // (273 - 225) / 2 = 24mm

  const sigBoxes = [
    { title: 'Dibuat Oleh :', role: 'Teknisi', name: techName, colX: marginLeft },
    { title: 'Diperiksa Oleh :', role: 'Supervisor', name: spvName, colX: marginLeft + sigBoxW + sigGap },
    { title: 'Disetujui Oleh :', role: 'Building Manager', name: bmName, colX: marginLeft + (sigBoxW + sigGap) * 2 },
  ];

  sigBoxes.forEach((sig) => {
    // Outer border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.35);
    doc.rect(sig.colX, sigStartY, sigBoxW, sigBoxH);

    // Header inside box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.text(sig.title, sig.colX + 4, sigStartY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    doc.text(`(${sig.role})`, sig.colX + 4, sigStartY + 10);

    // Signature line
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.25);
    doc.line(sig.colX + 4, sigStartY + 22, sig.colX + sigBoxW - 4, sigStartY + 22);

    // Name & Date lines
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Nama: ${sig.name || '...........................................'}`, sig.colX + 4, sigStartY + 25.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Tanggal: ${dateText || '...........................................'}`, sig.colX + 4, sigStartY + 29.5);
  });

  // Footer Ownership Tag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text('DOKUMEN INI MILIK PT. MUTIARA PROKLAMASI SEJAHTERA - GEDUNG SGH TOWER', 148.5, 203, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}
