import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateMcfaChecklistPdf } from '@/lib/pdfMcfaChecklist';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const submissionId = searchParams.get('id') || searchParams.get('submission_id');

  try {
    let subData: Record<string, any> = {};
    let metadata: {
      technicianName?: string;
      supervisorName?: string;
      buildingManagerName?: string;
      submittedAt?: string | Date;
    } = {
      technicianName: currentUser.full_name || currentUser.username,
      submittedAt: new Date(),
    };

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
        subData = row.submission_data || {};
        metadata = {
          technicianName: row.technician_name || row.technician_username || subData.teknisi_nama,
          supervisorName: subData.spv_nama,
          buildingManagerName: subData.bm_nama,
          submittedAt: row.submitted_at || subData.tanggal,
        };
      }
    }

    const pdfBuffer = generateMcfaChecklistPdf(subData, metadata);

    const filename = submissionId
      ? `SGH_Cheklist_MCFA_Annunciator_${submissionId.slice(0, 8)}_${Date.now()}.pdf`
      : `SGH_Template_Cheklist_MCFA_Annunciator_${Date.now()}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('Error generating MCFA Checklist PDF:', err);
    return NextResponse.json(
      { error: 'Failed to generate MCFA Checklist PDF' },
      { status: 500 }
    );
  }
}
