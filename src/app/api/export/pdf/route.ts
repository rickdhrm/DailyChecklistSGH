import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generatePumpLogsheetPdf } from '@/lib/pdfPumpLogsheet';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const submissionId = searchParams.get('id') || searchParams.get('submission_id');
  const locationId = searchParams.get('location_id');
  const templateId = searchParams.get('template_id');
  const dateFrom = searchParams.get('date_from') || searchParams.get('from');
  const dateTo = searchParams.get('date_to') || searchParams.get('to');

  try {
    // If specific submission requested, check if it's pump logsheet
    if (submissionId) {
      const singleRes = await query(
        `SELECT s.*, t.code, t.title as template_title, u.full_name as technician_name, u.username as technician_username, l.name as location_name
         FROM form_submissions s
         JOIN form_templates t ON s.template_id = t.id
         JOIN users u ON s.technician_id = u.id
         JOIN locations l ON s.location_id = l.id
         WHERE s.id = $1`,
        [submissionId]
      );

      if (singleRes.rowCount && singleRes.rowCount > 0) {
        const subRow = singleRes.rows[0];
        const isPump =
          subRow.code === 'SGH-LOG-POMPA' ||
          (subRow.template_title && subRow.template_title.toLowerCase().includes('pompa'));

        if (isPump) {
          const pdfBuffer = generatePumpLogsheetPdf(subRow.submission_data || {}, {
            technicianName: subRow.technician_name || subRow.technician_username,
            locationName: subRow.location_name,
            submittedAt: subRow.submitted_at,
          });

          return new NextResponse(pdfBuffer as any, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="SGH_Logsheet_Pompa_${submissionId.slice(0, 8)}_${Date.now()}.pdf"`,
            },
          });
        }

        const isGas =
          subRow.code === 'FR-LO-005' ||
          subRow.code === 'CHK-GAS' ||
          (subRow.template_title && subRow.template_title.toLowerCase().includes('gas'));

        if (isGas) {
          const gasUrl = new URL('/api/export/gas-pdf', request.url);
          gasUrl.searchParams.set('id', submissionId);
          return NextResponse.redirect(gasUrl);
        }
      }
    }

    let sql = `
      SELECT s.id, t.title AS checklist_name, t.category,
             l.name AS location_name, l.building, l.floor,
             u.full_name AS technician_name,
             s.status, s.has_abnormal_reading, s.technician_notes,
             s.submitted_at
      FROM form_submissions s
      JOIN form_templates t ON s.template_id = t.id
      JOIN users u ON s.technician_id = u.id
      JOIN locations l ON s.location_id = l.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let pIdx = 1;

    if (currentUser.role === 'TECHNICIAN') {
      sql += ` AND s.technician_id = $${pIdx++}`;
      params.push(currentUser.id);
    } else if (currentUser.role === 'SPV') {
      if (currentUser.department_id) {
        sql += ` AND (
          u.department_id = $${pIdx}
          OR s.technician_id = $${pIdx + 1}
          OR s.template_id IN (SELECT template_id FROM department_forms WHERE department_id = $${pIdx})
        )`;
        params.push(currentUser.department_id, currentUser.id);
        pIdx += 2;
      } else {
        sql += ` AND s.technician_id = $${pIdx++}`;
        params.push(currentUser.id);
      }
    }

    if (locationId) {
      sql += ` AND s.location_id = $${pIdx++}`;
      params.push(locationId);
    }
    if (templateId) {
      sql += ` AND s.template_id = $${pIdx++}`;
      params.push(templateId);
    }
    if (dateFrom) {
      sql += ` AND s.submitted_at >= $${pIdx++}::timestamptz`;
      params.push(dateFrom);
    }
    if (dateTo) {
      const formattedDateTo = dateTo.length === 10 ? `${dateTo}T23:59:59.999Z` : dateTo;
      sql += ` AND s.submitted_at <= $${pIdx++}::timestamptz`;
      params.push(formattedDateTo);
    }

    sql += ` ORDER BY s.submitted_at DESC LIMIT 100`;

    const res = await query(sql, params);

    const doc = new jsPDF({ orientation: 'landscape' });

    // Header Branding
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text('SGH FACILITY MANAGEMENT - DAILY INSPECTION REPORT', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString('id-ID')} | Requested by: ${currentUser.full_name} (${currentUser.role})`, 14, 28);

    const tableRows = res.rows.map((r: any, i: number) => [
      i + 1,
      r.checklist_name,
      r.location_name,
      r.technician_name,
      r.has_abnormal_reading ? 'ABNORMAL' : 'NORMAL',
      r.status,
      new Date(r.submitted_at).toLocaleString('id-ID'),
      r.technician_notes || '-'
    ]);

    autoTable(doc, {
      startY: 34,
      head: [['#', 'Checklist', 'Location', 'Technician', 'Condition', 'Status', 'Date/Time', 'Notes']],
      body: tableRows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="sgh_inspection_report_${Date.now()}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF export:', error);
    return NextResponse.json({ error: 'Failed to generate PDF export' }, { status: 500 });
  }
}
