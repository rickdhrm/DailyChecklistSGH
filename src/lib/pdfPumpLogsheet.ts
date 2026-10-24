import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PUMP_LOGSHEET_ITEMS } from './pumpLogsheetConstants';

interface PumpPdfMetadata {
  technicianName?: string;
  locationName?: string;
  submittedAt?: string | Date;
}

export function generatePumpLogsheetPdf(
  subData: Record<string, any> = {},
  metadata: PumpPdfMetadata = {}
): Buffer {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // A4 Landscape is 297mm x 210mm
  // Margins: Left 10mm, Right 10mm -> Table width: 277mm
  const marginLeft = 10;
  const marginTop = 7;

  // 1. TOP HEADER SECTION
  doc.setTextColor(0, 0, 0);

  // Top-Left: SGH TOWER & Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SGH TOWER', marginLeft, marginTop + 4);

  doc.setFontSize(8.5);
  doc.text('DAILY LOGSHEET POMPA-POMPA GEDUNG', marginLeft, marginTop + 8.5);

  // Room Temperature Box
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('ROOM TEMPERATURE', marginLeft, marginTop + 13.5);

  // Draw Room Temperature input box
  const roomTempBoxX = marginLeft + 35;
  const roomTempBoxY = marginTop + 10.2;
  const roomTempBoxW = 16;
  const roomTempBoxH = 4.5;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(roomTempBoxX, roomTempBoxY, roomTempBoxW, roomTempBoxH);

  // Value inside room temp box
  const roomTemp = subData.room_temperature || '';
  if (roomTemp) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(String(roomTemp), roomTempBoxX + roomTempBoxW / 2, roomTempBoxY + 3.2, { align: 'center' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('C', roomTempBoxX + roomTempBoxW + 2, marginTop + 13.5);

  // Top-Right: Tanggal & Jam Periksa
  let dateText = subData.tanggal || '';
  let timeText = subData.jam_periksa || '';

  if (!dateText && metadata.submittedAt) {
    const d = new Date(metadata.submittedAt);
    dateText = d.toLocaleDateString('id-ID');
    timeText = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  const rightColX = 220;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('TANGGAL', rightColX, marginTop + 4);
  doc.text(':', rightColX + 25, marginTop + 4);
  if (dateText) {
    doc.setFont('helvetica', 'bold');
    doc.text(String(dateText), rightColX + 28, marginTop + 4);
  }

  doc.setFont('helvetica', 'normal');
  doc.text('JAM PERIKSA', rightColX, marginTop + 8.5);
  doc.text(':', rightColX + 25, marginTop + 8.5);
  if (timeText) {
    doc.setFont('helvetica', 'bold');
    doc.text(String(timeText), rightColX + 28, marginTop + 8.5);
  }

  // 2. MAIN TABLE DEFINITIONS
  // Total Width = 277mm
  // Column breakdown matching the original uploaded template:
  // Col 0: DESCRIPTION (67mm)
  // Col 1-3: ARUS STANDBY R, S, T (12mm each = 36mm)
  // Col 4-6: VOLT-STANDBY R, S, T (12mm each = 36mm)
  // Col 7-9: SWITCH POSITION MANUAL, AUTO, OFF (14mm each = 42mm)
  // Col 10-11: PRESURE SUCTION, DISCHARGE (19mm each = 38mm)
  // Col 12: BODY TEMPERATURE (25mm)
  // Col 13-14: GATE VALVE OPEN, CLOSE (16.5mm each = 33mm)
  // Sum = 67 + 36 + 36 + 42 + 38 + 25 + 33 = 277mm.

  const head = [
    [
      { content: 'DESCRIPTION', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
      { content: 'ARUS STANDBY', colSpan: 3, styles: { halign: 'center' as const, valign: 'middle' as const } },
      { content: 'VOLT-STANDBY', colSpan: 3, styles: { halign: 'center' as const, valign: 'middle' as const } },
      { content: 'SWITCH POSITION', colSpan: 3, styles: { halign: 'center' as const, valign: 'middle' as const } },
      { content: 'PRESURE', colSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
      { content: 'BODY\nTEMPERATURE', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
      { content: 'GATE VALVE', colSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
    ],
    [
      { content: 'R', styles: { halign: 'center' as const } },
      { content: 'S', styles: { halign: 'center' as const } },
      { content: 'T', styles: { halign: 'center' as const } },
      { content: 'R', styles: { halign: 'center' as const } },
      { content: 'S', styles: { halign: 'center' as const } },
      { content: 'T', styles: { halign: 'center' as const } },
      { content: 'MANUAL', styles: { halign: 'center' as const } },
      { content: 'AUTO', styles: { halign: 'center' as const } },
      { content: 'OFF', styles: { halign: 'center' as const } },
      { content: 'SUCTION', styles: { halign: 'center' as const } },
      { content: 'DISCHARGE', styles: { halign: 'center' as const } },
      { content: 'OPEN', styles: { halign: 'center' as const } },
      { content: 'CLOSE', styles: { halign: 'center' as const } },
    ],
  ];

  const body: any[] = [];

  for (const item of PUMP_LOGSHEET_ITEMS) {
    const id = item.id;

    if (item.type === 'battery_volt') {
      // Row 4: BATTERY ACCU
      // Col 0: BATTERY ACCU
      // Col 1-3: Arus merged empty
      // Col 4-5: Volt merged value
      // Col 6: 'Volt'
      // Col 7-9: Switch merged empty outlined box (no switch input on accu)
      // Col 10-14: Blank
      const voltVal = subData['battery_accu_volt'] ?? subData[`${id}_volt`] ?? subData[`${id}_volt_r`] ?? '';

      body.push([
        { content: item.name, styles: { halign: 'left', fontStyle: 'bold' } },
        { content: '', colSpan: 3 },
        { content: voltVal !== '' ? String(voltVal) : '', colSpan: 2, styles: { halign: 'center' } },
        { content: 'Volt', styles: { halign: 'center', fontStyle: 'bold' } },
        { content: '', colSpan: 3, styles: { halign: 'center' } },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
      ]);
    } else if (item.type === 'battery_amp') {
      // Row 5: AMPER ACCU
      // Col 0: AMPER ACCU
      // Col 1-3: Arus merged empty
      // Col 4-5: Amp merged value
      // Col 6: 'A'
      // Col 7-9: Switch merged empty outlined box (no switch input on accu)
      // Col 10-14: Blank
      const currentVal = subData['amper_accu'] ?? subData[`${id}_current`] ?? subData[`${id}_arus_r`] ?? '';

      body.push([
        { content: item.name, styles: { halign: 'left', fontStyle: 'bold' } },
        { content: '', colSpan: 3 },
        { content: currentVal !== '' ? String(currentVal) : '', colSpan: 2, styles: { halign: 'center' } },
        { content: 'A', styles: { halign: 'center', fontStyle: 'bold' } },
        { content: '', colSpan: 3, styles: { halign: 'center' } },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
      ]);
    } else if (item.type === 'clean_water_pressure') {
      // Row 10: TEKANAN AIR BERSIH RUANG POMPA
      // Col 0: TEKANAN AIR BERSIH RUANG POMPA
      // Col 1-9: Blank
      // Col 10-11: Presure merged (Suction & Discharge) with value
      // Col 12-14: Blank
      const pressVal =
        subData['tekanan_air_bersih'] ??
        subData[`${id}_pressure`] ??
        subData[`${id}_discharge`] ??
        subData[`${id}_pres_discharge`] ??
        subData[`${id}_suction`] ??
        '';

      body.push([
        { content: item.name, styles: { halign: 'left', fontStyle: 'bold' } },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: pressVal !== '' ? String(pressVal) : '', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: '' },
        { content: '' },
        { content: '' },
      ]);
    } else if (item.type === 'percentage') {
      // Row 24 & 25: KAPASITAS AIR GROUND TANK (%) & KAPASITAS AIR ROOF TANK (%)
      const levelVal = subData[id] ?? subData[`${id}_level`];
      const displayVal = levelVal !== undefined && levelVal !== '' ? `${levelVal} %` : '';

      body.push([
        { content: item.name, styles: { halign: 'left', fontStyle: 'bold' } },
        { content: displayVal, colSpan: 3, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
      ]);
    } else if (item.type === 'wlc_position') {
      // Row 26: POSISI WLC GROUND TANK
      // In original image, columns 10-14 have no borders (cut off after OFF)
      const wlcVal = (
        subData['posisi_wlc_ground'] ??
        subData[`${id}_switch`] ??
        subData[`${id}_position`] ??
        ''
      ).toUpperCase();

      body.push([
        { content: item.name, styles: { halign: 'left', fontStyle: 'bold' } },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
        { content: wlcVal === 'MANUAL' ? 'V' : '', styles: { halign: 'center', fontStyle: 'bold' } },
        { content: wlcVal === 'AUTO' ? 'V' : '', styles: { halign: 'center', fontStyle: 'bold' } },
        { content: wlcVal === 'OFF' ? 'V' : '', styles: { halign: 'center', fontStyle: 'bold' } },
        { content: '', styles: { lineWidth: 0 } },
        { content: '', styles: { lineWidth: 0 } },
        { content: '', styles: { lineWidth: 0 } },
        { content: '', styles: { lineWidth: 0 } },
        { content: '', styles: { lineWidth: 0 } },
      ]);
    } else if (item.type === 'roof_fire_pressure') {
      // Row 27: TEKANAN AIR PEMADAM DI ROOF
      // In original image: Col 1-9 no border, Col 10-11 merged bordered box, Col 12-14 no border
      const roofPress =
        subData['tekanan_pemadam_roof'] ??
        subData[`${id}_pressure`] ??
        subData[`${id}_discharge`] ??
        subData[`${id}_pres_discharge`] ??
        subData[`${id}_suction`] ??
        '';

      body.push([
        { content: item.name, styles: { halign: 'left', fontStyle: 'bold' } },
        { content: '', styles: { lineWidth: 0 } },
        { content: '', styles: { lineWidth: 0 } },
        { content: '', styles: { lineWidth: 0 } },
        { content: '', styles: { lineWidth: 0 } },
        { content: '', styles: { lineWidth: 0 } },
        { content: '', styles: { lineWidth: 0 } },
        { content: '', styles: { lineWidth: 0 } },
        { content: '', styles: { lineWidth: 0 } },
        { content: '', styles: { lineWidth: 0 } },
        {
          content: roofPress !== '' ? String(roofPress) : '',
          colSpan: 2,
          styles: { halign: 'center', fontStyle: 'bold', lineWidth: 0.25 },
        },
        { content: '', styles: { lineWidth: 0 } },
        { content: '', styles: { lineWidth: 0 } },
        { content: '', styles: { lineWidth: 0 } },
      ]);
    } else {
      // Standard rows (Pumps, Exhaust Fans, etc.)
      const arusR = subData[`${id}_arus_r`] ?? '';
      const arusS = subData[`${id}_arus_s`] ?? '';
      const arusT = subData[`${id}_arus_t`] ?? '';

      const voltR = subData[`${id}_volt_r`] ?? '';
      const voltS = subData[`${id}_volt_s`] ?? '';
      const voltT = subData[`${id}_volt_t`] ?? '';

      const sw = (subData[`${id}_switch`] ?? '').toUpperCase();
      const swManual = sw === 'MANUAL' ? 'V' : '';
      const swAuto = sw === 'AUTO' ? 'V' : '';
      const swOff = sw === 'OFF' ? 'V' : '';

      const suction = subData[`${id}_pres_suction`] ?? subData[`${id}_suction`] ?? '';
      const discharge = subData[`${id}_pres_discharge`] ?? subData[`${id}_discharge`] ?? '';
      const bodyTemp = subData[`${id}_body_temp`] ?? '';

      const gv = (subData[`${id}_gate_valve`] ?? '').toUpperCase();
      const gvOpen = gv === 'OPEN' ? 'V' : '';
      const gvClose = gv === 'CLOSE' || gv === 'CLOSED' ? 'V' : '';

      body.push([
        { content: item.name, styles: { halign: 'left', fontStyle: 'bold' } },
        { content: String(arusR), styles: { halign: 'center' } },
        { content: String(arusS), styles: { halign: 'center' } },
        { content: String(arusT), styles: { halign: 'center' } },
        { content: String(voltR), styles: { halign: 'center' } },
        { content: String(voltS), styles: { halign: 'center' } },
        { content: String(voltT), styles: { halign: 'center' } },
        { content: swManual, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: swAuto, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: swOff, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: String(suction), styles: { halign: 'center' } },
        { content: String(discharge), styles: { halign: 'center' } },
        { content: String(bodyTemp), styles: { halign: 'center' } },
        { content: gvOpen, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: gvClose, styles: { halign: 'center', fontStyle: 'bold' } },
      ]);
    }
  }

  // Draw table with AutoTable
  autoTable(doc, {
    startY: marginTop + 15,
    margin: { left: marginLeft, right: marginLeft },
    head: head,
    body: body,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 5.8,
      cellPadding: 0.8,
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      textColor: [0, 0, 0],
      valign: 'middle',
    },
    headStyles: {
      fontStyle: 'bold',
      fontSize: 6.2,
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    columnStyles: {
      0: { cellWidth: 67 }, // DESCRIPTION
      1: { cellWidth: 12 }, // ARUS R
      2: { cellWidth: 12 }, // ARUS S
      3: { cellWidth: 12 }, // ARUS T
      4: { cellWidth: 12 }, // VOLT R
      5: { cellWidth: 12 }, // VOLT S
      6: { cellWidth: 12 }, // VOLT T
      7: { cellWidth: 14 }, // MANUAL
      8: { cellWidth: 14 }, // AUTO
      9: { cellWidth: 14 }, // OFF
      10: { cellWidth: 19 }, // SUCTION
      11: { cellWidth: 19 }, // DISCHARGE
      12: { cellWidth: 25 }, // BODY TEMP
      13: { cellWidth: 16.5 }, // OPEN
      14: { cellWidth: 16.5 }, // CLOSE
    },
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 144;

  // 3. BOTTOM SECTION: KONDISI RUANG POMPA & KETERANGAN
  const rowKondisiY = finalY + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('KONDISI RUANG POMPA', marginLeft, rowKondisiY);

  const kondisi = (subData.kondisi_ruang_pompa || '').toUpperCase();
  const isBerdebu = kondisi === 'BERDEBU';
  const isBersih = kondisi === 'BERSIH';

  // Checkbox: BERDEBU
  const box1X = marginLeft + 50;
  const box1Y = rowKondisiY - 3.8;
  const box1W = 20;
  const box1H = 5;
  doc.setLineWidth(0.25);
  doc.rect(box1X, box1Y, box1W, box1H);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text(isBerdebu ? '[V] BERDEBU' : '   BERDEBU', box1X + 2, rowKondisiY - 0.5);

  // Checkbox: BERSIH (In original document spelled BESIH or BERSIH)
  const box2X = box1X + box1W + 4;
  doc.rect(box2X, box1Y, box1W, box1H);
  doc.text(isBersih ? '[V] BERSIH' : '   BERSIH', box2X + 3, rowKondisiY - 0.5);

  // KETERANGAN
  const ketX = box2X + box1W + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('KETERANGAN:', ketX, rowKondisiY);

  // Underline for KETERANGAN
  const lineStartX = ketX + 24;
  const lineEndX = 287; // Right margin
  doc.setLineWidth(0.25);
  doc.line(lineStartX, rowKondisiY, lineEndX, rowKondisiY);

  const keteranganText = subData.keterangan || subData.technician_notes || '';
  if (keteranganText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(String(keteranganText), lineStartX + 2, rowKondisiY - 0.8, { maxWidth: lineEndX - lineStartX - 4 });
  }

  // 4. SIGNATURE MATRIX & LEGAL OWNERSHIP BOX
  const sigStartY = rowKondisiY + 7;

  // Col 1: Dicek Oleh - Teknisi 1
  const sig1X = marginLeft;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Dicek Oleh:', sig1X, sigStartY);
  doc.text('Nama :', sig1X, sigStartY + 14);
  const teknisi1Name = subData.teknisi_1_nama || metadata.technicianName || '';
  if (teknisi1Name) {
    doc.setFont('helvetica', 'bold');
    doc.text(String(teknisi1Name), sig1X + 11, sigStartY + 14);
    doc.setFont('helvetica', 'normal');
  }
  doc.text('Teknisi 1', sig1X, sigStartY + 18);

  // Col 2: Teknisi 2
  const sig2X = marginLeft + 35;
  doc.text('Nama :', sig2X, sigStartY + 14);
  const teknisi2Name = subData.teknisi_2_nama || '';
  if (teknisi2Name) {
    doc.setFont('helvetica', 'bold');
    doc.text(String(teknisi2Name), sig2X + 11, sigStartY + 14);
    doc.setFont('helvetica', 'normal');
  }
  doc.text('Teknisi 2', sig2X, sigStartY + 18);

  // Col 3: Diperiksa Oleh - SPV Engineering
  const sig3X = marginLeft + 68;
  doc.text('Diperiksa Oleh', sig3X, sigStartY);
  doc.text('Nama :', sig3X, sigStartY + 14);
  const spvName = subData.spv_engineering_nama || '';
  if (spvName) {
    doc.setFont('helvetica', 'bold');
    doc.text(String(spvName), sig3X + 11, sigStartY + 14);
    doc.setFont('helvetica', 'normal');
  }
  doc.text('SPV Engineerig', sig3X, sigStartY + 18);

  // Col 4: Mengetahui - Building Manager
  const sig4X = marginLeft + 115;
  doc.text('Mengetahui', sig4X, sigStartY);
  doc.text('Nama :', sig4X, sigStartY + 14);
  const bmName = subData.building_manager_nama || '';
  if (bmName) {
    doc.setFont('helvetica', 'bold');
    doc.text(String(bmName), sig4X + 11, sigStartY + 14);
    doc.setFont('helvetica', 'normal');
  }
  doc.text('Building Manager', sig4X, sigStartY + 18);

  // Col 5: Right Legal Ownership Box
  // In original image: Bordered rectangular box containing:
  // DOKUMEN INI MILIK PT.MUTIARA PROKLAMASI SEJAHTERA
  // GEDUNG SGH TOWER
  const legalBoxX = 195;
  const legalBoxY = sigStartY - 1;
  const legalBoxW = 92;
  const legalBoxH = 10;
  doc.setLineWidth(0.25);
  doc.rect(legalBoxX, legalBoxY, legalBoxW, legalBoxH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('DOKUMEN INI MILIK PT.MUTIARA PROKLAMASI SEJAHTERA', legalBoxX + 2, legalBoxY + 4);
  doc.text('GEDUNG SGH TOWER', legalBoxX + 2, legalBoxY + 8);

  return Buffer.from(doc.output('arraybuffer'));
}
