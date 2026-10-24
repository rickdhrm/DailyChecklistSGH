import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const submissionId = searchParams.get('id') || searchParams.get('submission_id');

  try {
    let subData: any = {};
    let technicianName = currentUser.full_name || currentUser.username || 'Ricky Dharmawan';
    let submissionDateObj = new Date();
    let isFromSubmission = false;
    let submittedDate = '-';
    let submittedTime = '-';
    let temuan = '-';
    let tindakanKoreksi = '-';
    let statusInspection = 'Normal';

    if (submissionId) {
      const res = await query(
        `SELECT s.*, u.full_name as technician_name, u.username as technician_username, l.name as location_name 
         FROM form_submissions s 
         JOIN users u ON s.technician_id = u.id 
         JOIN locations l ON s.location_id = l.id 
         WHERE s.id = $1`,
        [submissionId]
      );
      if (res.rowCount && res.rowCount > 0) {
        const row = res.rows[0];
        isFromSubmission = true;
        subData = row.submission_data || {};
        technicianName = row.technician_name || row.technician_username || technicianName;
        if (row.submitted_at) {
          submissionDateObj = new Date(row.submitted_at);
        } else if (subData.tanggal) {
          const parsed = new Date(subData.tanggal);
          if (!isNaN(parsed.getTime())) submissionDateObj = parsed;
        }
        submittedDate = submissionDateObj.toLocaleDateString('id-ID');
        submittedTime = submissionDateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        temuan = subData.temuan || row.technician_notes || '-';
        tindakanKoreksi = subData.tindakan_koreksi || '-';
        statusInspection = subData.status_inspeksi || (row.has_abnormal_reading ? 'Perlu Perbaikan' : 'Normal');
      }
    }

    // Initialize Landscape A4 Document: 297mm x 210mm
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // 1. Top Header Box (Right) - Document Control Meta
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.rect(230, 6, 57, 16);
    doc.line(248, 6, 248, 22);
    doc.line(230, 10, 287, 10);
    doc.line(230, 14, 287, 14);
    doc.line(230, 18, 287, 18);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('No. Form', 232, 9.2);
    doc.setFont('helvetica', 'normal');
    doc.text(': FR-LO-005', 250, 9.2);

    doc.setFont('helvetica', 'bold');
    doc.text('Revisi', 232, 13.2);
    doc.setFont('helvetica', 'normal');
    doc.text(': 00', 250, 13.2);

    // Auto-generate Tanggal from submission date (or current date if blank template)
    const docControlDate = isFromSubmission
      ? submissionDateObj.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

    doc.setFont('helvetica', 'bold');
    doc.text('Tanggal', 232, 17.2);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${docControlDate}`, 250, 17.2);

    doc.setFont('helvetica', 'bold');
    doc.text('Halaman', 232, 21.2);
    doc.setFont('helvetica', 'normal');
    doc.text(': 1 dari 1', 250, 21.2);

    // 2. Title Section (Center) - Centered, Bigger, Bold
    doc.setFontSize(12.5);
    doc.setFont('helvetica', 'bold');
    doc.text('FORMULIR', 148.5, 9.5, { align: 'center' });
    doc.setFontSize(14);
    doc.text('CHECKLIST INSPEKSI GAS LPG SENTRAL', 148.5, 15.5, { align: 'center' });

    // 3. Metadata Header Line
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Tanggal  :', 10, 22);
    doc.text('Jam        :', 10, 25.5);
    doc.setFont('helvetica', 'normal');
    doc.text(isFromSubmission ? submittedDate : '-', 25, 22);
    doc.text(isFromSubmission ? submittedTime : '-', 25, 25.5);

    doc.setFont('helvetica', 'bold');
    doc.text('Petugas                                :', 151, 22);
    doc.text('Kondisi Normal / Tidak Normal :', 151, 25.5);
    doc.setFont('helvetica', 'normal');
    doc.text(submissionId ? technicianName : '-', 202, 22);
    doc.text(submissionId ? statusInspection.toUpperCase() : '-', 202, 25.5);

    // 4. Tables Definition (Left and Right)
    const leftSections = [
      {
        header: 'A. AREA TABUNG LPG',
        items: [
          'Tabung dalam kondisi baik.',
          'Tidak terdapat penyok/kerusakan berat.',
          'Tidak terdapat korosi berlebihan.',
          'Tidak terdapat indikasi kebocoran.',
          'Valve tabung dalam kondisi baik.',
          'Tabung berdiri/terpasang sesuai sistem penempatannya.',
          'Tabung terlindung dari benturan.',
          'Area bebas sumber api.',
          'Area bebas rokok.',
          'Tidak ada barang yang tidak berkaitan dengan LPG.',
          'Ventilasi area baik.',
          'Akses menuju tabung tidak terhalang.'
        ],
        code: 'a'
      },
      {
        header: 'B. MANIFOLD DAN VALVE',
        items: [
          'Manifold tidak mengalami kerusakan.',
          'Sambungan tidak menunjukkan indikasi kebocoran.',
          'Valve dapat dioperasikan.',
          'Valve diberi identifikasi.',
          'Tidak terdapat korosi berat.',
          'Tidak terdapat modifikasi tidak resmi.',
          'Kondisi fitting baik.'
        ],
        code: 'b'
      },
      {
        header: 'C. VAPORIZER',
        items: [
          'Kondisi fisik baik.',
          'Tidak terdapat kebocoran.',
          'Tidak terdapat suara/getaran abnormal.',
          'Sambungan baik.',
          'Pressure/indikator dalam kondisi normal sesuai spesifikasi.',
          'Tidak terdapat kerusakan komponen.',
          'Area sekitar vaporizer bersih.',
          'Tidak ada sumber api.',
          'Sistem pengaman vaporizer dalam kondisi baik.'
        ],
        code: 'c'
      },
      {
        header: 'E. PIPA DAN FITTING',
        items: [
          'Pipa tidak rusak.',
          'Tidak terdapat korosi berat.',
          'Tidak terdapat kebocoran.',
          'Support pipa dalam kondisi baik.',
          'Fitting tidak longgar.',
          'Tidak ada modifikasi tanpa izin.',
          'Jalur pipa tidak terhalang.'
        ],
        code: 'e'
      }
    ];

    const rightSections = [
      {
        header: 'F. SISTEM KESELAMATAN',
        items: [
          'APAR tersedia.',
          'APAR mudah diakses.',
          'APAR tidak terhalang.',
          'APAR masih dalam masa pemeriksaan.',
          'Rambu DILARANG MEROKOK tersedia.',
          'Rambu BAHAYA GAS tersedia.',
          'Emergency contact tersedia.',
          'Gas detector berfungsi.',
          'Alarm berfungsi.',
          'Ventilasi baik.'
        ],
        code: 'f'
      },
      {
        header: 'G. AREA KITCHEN TENANT',
        items: [
          'Tidak terdapat bau gas.',
          'Seluruh peralatan gas dalam kondisi baik.',
          'Burner berfungsi normal.',
          'Valve peralatan berfungsi.',
          'Tidak terdapat selang/fitting rusak.',
          'Tidak terdapat grease berlebihan.',
          'Tidak ada api terbuka yang tidak diperlukan.',
          'Peralatan gas tidak ditinggalkan tanpa pengawasan.',
          'Valve ditutup setelah operasional.'
        ],
        code: 'g'
      },
      {
        header: 'H. ADMINISTRASI',
        items: [
          'Checklist sebelumnya tersedia.',
          'Maintenance terakhir tercatat.',
          'Laporan gangguan telah ditindaklanjuti.',
          'Dokumen vendor tersedia.',
          'Dokumen pemeriksaan tersedia.',
          'Personel pengguna telah mendapatkan briefing.',
          'Tidak terdapat pekerjaan/modifikasi tanpa izin.'
        ],
        code: 'h'
      }
    ];

    const formatTableRows = (sections: any[], targetTotalRows: number = 0) => {
      const rows: any[] = [];
      sections.forEach(sec => {
        // Section Header Row: Centered, Bold, Bigger Font
        rows.push([
          {
            content: sec.header,
            colSpan: 6,
            styles: {
              halign: 'center',
              valign: 'middle',
              fontStyle: 'bold',
              fontSize: 7.5,
              fillColor: [230, 235, 240],
              textColor: [0, 0, 0],
              minCellHeight: 3.4
            }
          }
        ]);
        // Items
        sec.items.forEach((item: string, i: number) => {
          const itemNo = i + 1;
          const fieldId = `gas_${sec.code}_${itemNo}`;
          const rawVal = subData[fieldId] !== undefined ? String(subData[fieldId]).trim().toUpperCase() : '';
          const isGood = rawVal === 'GOOD' || rawVal === 'OK' || rawVal === 'NORMAL';
          const isBad = rawVal === 'BAD' || rawVal === 'NOT OK' || rawVal === 'RUSAK' || rawVal === 'ABNORMAL';
          const totalVal = subData[`${fieldId}_total`] || '';
          const remarksVal = subData[`${fieldId}_remarks`] || '';

          rows.push([
            itemNo,
            item,
            totalVal,
            isGood ? 'CHECK' : '',
            isBad ? 'CHECK' : '',
            remarksVal
          ]);
        });
      });

      // Pad remaining empty rows to match the other table exactly
      while (rows.length < targetTotalRows) {
        rows.push(['', '', '', '', '', '']);
      }

      return rows;
    };

    const leftUnpadded = formatTableRows(leftSections);
    const rightUnpadded = formatTableRows(rightSections);
    const maxRows = Math.max(leftUnpadded.length, rightUnpadded.length);

    const leftRows = formatTableRows(leftSections, maxRows);
    const rightRows = formatTableRows(rightSections, maxRows);

    const tableHead: any[] = [
      [
        { content: 'NO', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'ITEMS', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'TOTAL', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'CONDITION', colSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'REMARKS', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } }
      ],
      [
        { content: 'GOOD', styles: { halign: 'center', valign: 'middle' } },
        { content: 'BAD', styles: { halign: 'center', valign: 'middle' } }
      ]
    ];

    const tableStyles: any = {
      fontSize: 6.2,
      cellPadding: [0.35, 0.5],
      lineColor: [40, 40, 40],
      lineWidth: 0.18,
      minCellHeight: 3.1,
      textColor: [0, 0, 0],
      valign: 'middle'
    };

    const headStyles: any = {
      fillColor: [225, 230, 238],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      valign: 'middle',
      cellPadding: [0.6, 0.5],
      lineWidth: 0.18,
      lineColor: [40, 40, 40]
    };

    const columnStyles: any = {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 71, halign: 'left' },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 11, halign: 'center' },
      4: { cellWidth: 11, halign: 'center' },
      5: { cellWidth: 24, halign: 'left' }
    };

    const checkmarkHooks = {
      didParseCell: (data: any) => {
        if (data.section === 'body' && (data.column.index === 3 || data.column.index === 4)) {
          if (data.cell.raw === 'CHECK') {
            data.cell.text = []; // Suppress raw text rendering
          }
        }
      },
      didDrawCell: (data: any) => {
        if (data.section === 'body' && (data.column.index === 3 || data.column.index === 4)) {
          if (data.cell.raw === 'CHECK') {
            const cx = data.cell.x + data.cell.width / 2;
            const cy = data.cell.y + data.cell.height / 2;
            doc.saveGraphicsState();
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.4);
            // Crisp vector check mark: short stem down, long stem up
            doc.line(cx - 1.5, cy, cx - 0.4, cy + 1.2);
            doc.line(cx - 0.4, cy + 1.2, cx + 1.8, cy - 1.2);
            doc.restoreGraphicsState();
          }
        }
      }
    };

    // Render Left Table
    autoTable(doc, {
      startY: 28,
      margin: { left: 10 },
      tableWidth: 136,
      head: tableHead,
      body: leftRows,
      theme: 'grid',
      styles: tableStyles,
      headStyles: headStyles,
      columnStyles: columnStyles,
      ...checkmarkHooks
    });

    const leftFinalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 130;

    // Render Right Table
    autoTable(doc, {
      startY: 28,
      margin: { left: 151 },
      tableWidth: 136,
      head: tableHead,
      body: rightRows,
      theme: 'grid',
      styles: tableStyles,
      headStyles: headStyles,
      columnStyles: columnStyles,
      ...checkmarkHooks
    });

    const rightFinalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 130;

    // 5. Bottom Section: Temuan, Status & TTD Matrix
    const finalY = Math.max(leftFinalY, rightFinalY) + 2.5;

    // Temuan Box (Left)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.rect(10, finalY, 100, 30);

    doc.setFillColor(230, 235, 240);
    doc.rect(10, finalY, 100, 5, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TEMUAN & TINDAKAN KOREKSI', 60, finalY + 3.8, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Temuan:', 12, finalY + 9.5);
    doc.setFont('helvetica', 'normal');
    doc.text(temuan, 26, finalY + 9.5);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.line(12, finalY + 11.5, 108, finalY + 11.5);
    doc.line(12, finalY + 16, 108, finalY + 16);

    doc.setFont('helvetica', 'bold');
    doc.text('Tindakan Koreksi:', 12, finalY + 20.5);
    doc.setFont('helvetica', 'normal');
    doc.text(tindakanKoreksi, 38, finalY + 20.5);
    doc.line(12, finalY + 22.5, 108, finalY + 22.5);
    doc.line(12, finalY + 27, 108, finalY + 27);

    // Status Box (Middle)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.rect(112, finalY, 75, 30);

    doc.setFillColor(230, 235, 240);
    doc.rect(112, finalY, 75, 5, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('STATUS INSPEKSI', 112 + 37.5, finalY + 3.8, { align: 'center' });

    const isNormal = submissionId ? statusInspection.toLowerCase() === 'normal' : false;
    const isPerlu = submissionId ? statusInspection.toLowerCase().includes('perbaikan') : false;
    const isCritical = submissionId ? (statusInspection.toLowerCase().includes('critical') || statusInspection.toLowerCase().includes('isolasi')) : false;

    const drawCheckboxItem = (yPos: number, isChecked: boolean, label: string) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.25);
      doc.rect(116, yPos, 3.2, 3.2);
      if (isChecked) {
        doc.saveGraphicsState();
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.line(116 + 0.6, yPos + 1.6, 116 + 1.3, yPos + 2.5);
        doc.line(116 + 1.3, yPos + 2.5, 116 + 2.7, yPos + 0.8);
        doc.restoreGraphicsState();
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(label, 122, yPos + 2.5);
    };

    drawCheckboxItem(finalY + 9, isNormal, 'Normal');
    drawCheckboxItem(finalY + 15.5, isPerlu, 'Perlu Perbaikan');
    drawCheckboxItem(finalY + 22, isCritical, 'Critical – Gas Harus Diisolasi');

    // TTD Table (Right)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.rect(190, finalY, 97, 30);

    doc.setFillColor(230, 235, 240);
    doc.rect(190, finalY, 97, 5, 'FD');

    doc.line(222, finalY, 222, finalY + 30);
    doc.line(248, finalY, 248, finalY + 30);

    doc.line(190, finalY + 5, 287, finalY + 5);
    doc.line(190, finalY + 11.25, 287, finalY + 11.25);
    doc.line(190, finalY + 17.5, 287, finalY + 17.5);
    doc.line(190, finalY + 23.75, 287, finalY + 23.75);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text('JABATAN', 206, finalY + 3.8, { align: 'center' });
    doc.text('TTD', 235, finalY + 3.8, { align: 'center' });
    doc.text('NAMA', 267.5, finalY + 3.8, { align: 'center' });

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.text('Petugas', 192, finalY + 9.5);
    doc.text('Engineering', 192, finalY + 15.5);
    doc.text('HSE', 192, finalY + 21.5);
    doc.text('Building Manager', 192, finalY + 27.5);

    doc.setFont('helvetica', 'normal');
    doc.text(submissionId ? technicianName : '', 250, finalY + 9.5);
    doc.text(submissionId ? (subData.engineering_nama || 'Andi (SPV)') : '', 250, finalY + 15.5);
    doc.text(submissionId ? (subData.hse_nama || 'HSE Officer') : '', 250, finalY + 21.5);
    doc.text(submissionId ? (subData.building_manager_nama || 'Lead BM') : '', 250, finalY + 27.5);

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="FR-LO-005_Checklist_Gas_${Date.now()}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('Error generating Gas PDF:', err);
    return NextResponse.json({ error: 'Failed to generate official Gas checklist PDF' }, { status: 500 });
  }
}
