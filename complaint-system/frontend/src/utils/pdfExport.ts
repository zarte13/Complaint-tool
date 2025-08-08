import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr as frLocale, enUS as enLocale } from 'date-fns/locale';
import type { Attachment, Complaint, FollowUpAction } from '../types';
import { get as apiGet } from '../services/api';

// Vite will resolve this to a URL at build time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import abipaLogoUrl from '../../logo/logo_abipa_international.webp';

type ExportArgs = {
  complaint: Complaint;
  attachments?: Attachment[];
  actions?: FollowUpAction[];
  language?: 'en' | 'fr';
  labels?: Partial<{
    reportTitle: string;
    generated: string;
    summary: string;
    description: string;
    images: string;
    actions: string;
    noDescription: string;
    noActions: string;
    complaintId: string;
    company: string;
    part: string;
    issueType: string;
    category: string;
    subtypes: string;
    status: string;
    workOrder: string;
    occurrence: string;
    partReceived: string;
    createdUpdated: string;
    due: string;
    responsible: string;
    priority: string;
    packagingDetails: string;
    received: string;
    expected: string;
  }>;
};

const PAGE_MARGIN = 16; // pt
const SECTION_SPACING = 10; // pt
const LINE_HEIGHT = 6; // pt for body text

async function fetchActions(complaintId: number): Promise<FollowUpAction[]> {
  try {
    const { data } = await apiGet(`/api/complaints/${complaintId}/actions` as any);
    return (data as FollowUpAction[]) || [];
  } catch {
    return [];
  }
}

async function fetchAttachments(complaintId: number): Promise<Attachment[]> {
  try {
    const { data } = await apiGet(`/api/complaints/${complaintId}/attachments` as any);
    return (data as Attachment[]) || [];
  } catch {
    return [];
  }
}

// removed unused formatIso helper (date-fns is used directly with locale)

async function urlToDataUrl(url: string, toType: 'image/png' | 'image/jpeg' = 'image/png'): Promise<{ dataUrl: string; width?: number; height?: number; }>
{
  const response = await fetch(url, { cache: 'no-cache' });
  const blob = await response.blob();
  // If already the right type and browser can read it directly, use FileReader
  if (blob.type === toType) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
    return { dataUrl };
  }

  // Convert via canvas to desired type and capture dimensions
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Failed to load image'));
    i.src = URL.createObjectURL(blob);
  });
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL(toType);
  URL.revokeObjectURL(img.src);
  return { dataUrl, width: img.naturalWidth, height: img.naturalHeight };
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title, PAGE_MARGIN, y);
  return y + 6;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - PAGE_MARGIN) {
    doc.addPage();
    return PAGE_MARGIN;
  }
  return y;
}

export async function exportComplaintToPDF({ complaint, attachments, actions, language = 'en', labels = {} }: ExportArgs): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  const isFR = language === 'fr';
  const dfLocale = isFR ? frLocale : enLocale;

  const L = {
    reportTitle: isFR ? 'Rapport de réclamation' : 'Complaint Report',
    generated: isFR ? 'Généré le' : 'Generated',
    summary: isFR ? 'Résumé' : 'Summary',
    description: isFR ? 'Description' : 'Description',
    images: isFR ? 'Images' : 'Images',
    actions: isFR ? 'Actions de suivi' : 'Follow-up Actions',
    noDescription: isFR ? 'Aucune description fournie.' : 'No description provided.',
    noActions: isFR ? 'Aucune action enregistrée.' : 'No actions recorded.',
    complaintId: isFR ? 'ID de réclamation' : 'Complaint ID',
    company: isFR ? 'Client' : 'Company',
    part: isFR ? 'Pièce' : 'Part',
    issueType: isFR ? "Type d'anomalie" : 'Issue Type',
    category: isFR ? 'Catégorie' : 'Category',
    subtypes: isFR ? 'Sous-types' : 'Subtypes',
    status: isFR ? 'Statut' : 'Status',
    workOrder: isFR ? 'Bon de travail #' : 'Work Order #',
    occurrence: isFR ? 'Occurrence' : 'Occurrence',
    partReceived: isFR ? 'Pièce reçue' : 'Part Received',
    createdUpdated: isFR ? 'Créé / Mis à jour' : 'Created / Updated',
    due: isFR ? 'Échéance' : 'Due',
    responsible: isFR ? 'Responsable' : 'Responsible',
    priority: isFR ? 'Priorité' : 'Priority',
    packagingDetails: isFR ? "Détails d'emballage" : 'Packaging Details',
    received: isFR ? 'Reçu' : 'Received',
    expected: isFR ? 'Attendu' : 'Expected',
    ...labels,
  };

  // Localized display helpers for values
  const mapStatus = (raw?: string) => {
    if (!raw) return '';
    const m = isFR
      ? { open: 'ouvert', in_progress: 'en cours', resolved: 'résolu', closed: 'fermé', in_planning: 'plans établis' }
      : { open: 'open', in_progress: 'in progress', resolved: 'resolved', closed: 'closed', in_planning: 'in planning' };
    return (m as any)[raw] || raw;
  };
  const mapIssueType = (raw?: string) => {
    if (!raw) return '';
    const m = isFR
      ? { wrong_quantity: 'Mauvaise quantité', wrong_part: 'Mauvaise pièce', damaged: 'Endommagé', other: 'Autre' }
      : { wrong_quantity: 'Wrong Quantity', wrong_part: 'Wrong Part', damaged: 'Damaged', other: 'Other' };
    return (m as any)[raw] || raw;
  };
  const mapCategory = (raw?: string) => {
    if (!raw) return '';
    const m = isFR
      ? { dimensional: 'Dimensionnel', visual: 'Visuel', packaging: 'Emballage', other: 'Autre' }
      : { dimensional: 'Dimensional', visual: 'Visual', packaging: 'Packaging', other: 'Other' };
    return (m as any)[raw] || raw;
  };
  const mapSubtype = (raw?: string) => {
    if (!raw) return '';
    const m = isFR
      ? { scratch: 'Éraflure', nicks: 'Coches', rust: 'Rouille', wrong_box: 'Mauvaise boîte', wrong_bag: 'Mauvais sac', wrong_paper: 'Mauvais papier', wrong_part: 'Mauvaise pièce', wrong_quantity: 'Mauvaise quantité', wrong_tags: 'Mauvaises étiquettes' }
      : { scratch: 'Scratch', nicks: 'Nicks', rust: 'Rust', wrong_box: 'Wrong Box', wrong_bag: 'Wrong Bag', wrong_paper: 'Wrong Paper', wrong_part: 'Wrong Part', wrong_quantity: 'Wrong Quantity', wrong_tags: 'Wrong Tags' };
    return (m as any)[raw] || raw;
  };

  // Header with logo and title
  let y = PAGE_MARGIN;
  try {
    const { dataUrl, width, height } = await urlToDataUrl(abipaLogoUrl, 'image/png');
    const maxLogoW = 110;
    const maxLogoH = 36;
    const naturalW = width || 400;
    const naturalH = height || 120;
    const scale = Math.min(maxLogoW / naturalW, maxLogoH / naturalH);
    const logoW = Math.max(1, naturalW * scale);
    const logoH = Math.max(1, naturalH * scale);
    doc.addImage(dataUrl, 'PNG', PAGE_MARGIN, y, logoW, logoH);
    // Adjust title baseline relative to logo height
    y = y + Math.max(0, (logoH - 30) / 2);
    // Shift following text to the right of the logo
    (doc as any)._titleOffsetX = PAGE_MARGIN + logoW + 12;
  } catch {
    // Logo optional; continue if it fails
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const titleX = (doc as any)._titleOffsetX || (PAGE_MARGIN + 100);
  doc.text(L.reportTitle, titleX, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${L.generated}: ${format(new Date(), 'yyyy-MM-dd HH:mm', { locale: dfLocale })}`, titleX, y + 34);

  y += 50;

  // Basic metadata using a 4-column table: Label, Value, Label, Value
  y = addSectionTitle(doc, L.summary, y);
  y += 2;
  const partLabel = `${complaint.part?.part_number || ''} ${complaint.part?.description ? `— ${complaint.part.description}` : ''}`.trim();
  const subtypesArray: string[] = Array.isArray((complaint as any).issue_subtypes) ? (complaint as any).issue_subtypes : [];
  const localizedSubtypes = subtypesArray.map(mapSubtype).join(', ');

  const leftPairs: Array<[string, string]> = [
    [L.complaintId, `#${complaint.id}`],
    [L.company, complaint.company?.name || ''],
    [L.part, partLabel],
    [L.issueType, mapIssueType((complaint.issue_type as any) || '')],
    [L.category, mapCategory((complaint as any).issue_category || '')],
    [L.subtypes, localizedSubtypes],
  ];

  const rightPairs: Array<[string, string]> = [
    [L.status, mapStatus(complaint.status as any)],
    [L.workOrder, complaint.work_order_number || ''],
    [L.occurrence, complaint.occurrence || ''],
  ];
  // Conditional Part Received
  const hasWrongPart = subtypesArray.includes('wrong_part') || !!complaint.part_received;
  if (hasWrongPart) {
    rightPairs.push([L.partReceived, complaint.part_received || '']);
  }
  rightPairs.push([L.createdUpdated, `${format(new Date(complaint.created_at), 'yyyy-MM-dd HH:mm', { locale: dfLocale })} / ${format(new Date(complaint.updated_at), 'yyyy-MM-dd HH:mm', { locale: dfLocale })}`]);

  // Zip into rows of 4 columns
  const maxLen = Math.max(leftPairs.length, rightPairs.length);
  const summaryRows: Array<[string, string, string, string]> = [];
  for (let i = 0; i < maxLen; i++) {
    const [lk, lv] = leftPairs[i] || ['', ''];
    const [rk, rv] = rightPairs[i] || ['', ''];
    summaryRows.push([lk, lv, rk, rv]);
  }

  autoTable(doc, {
    startY: y + 4,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 11, cellPadding: 2 },
    body: summaryRows as unknown as any[],
    didParseCell: (data) => {
      // Make label columns bold (0 and 2)
      if (data.section === 'body' && (data.column.index === 0 || data.column.index === 2)) {
        data.cell.styles.fontStyle = 'bold';
      }
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.18, halign: 'right' },
      1: { cellWidth: contentWidth * 0.32, halign: 'left' },
      2: { cellWidth: contentWidth * 0.18, halign: 'right' },
      3: { cellWidth: contentWidth * 0.32, halign: 'left' },
    },
  });
  y = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + SECTION_SPACING : y + 80;

  // Description
  y = ensureSpace(doc, y, 28);
  y = addSectionTitle(doc, L.description, y);
  y += 6;
  const details = (complaint.details || '').trim();
  if (details) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const wrapped = doc.splitTextToSize(details, contentWidth);
    for (const line of wrapped) {
      y = ensureSpace(doc, y, LINE_HEIGHT);
      doc.text(line, PAGE_MARGIN, y);
      y += LINE_HEIGHT;
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text(L.noDescription, PAGE_MARGIN, y);
    y += LINE_HEIGHT;
  }
  y += SECTION_SPACING + 8;

  // Packaging details table (received vs expected) if applicable
  const pkgRecv: Record<string, string> | undefined = (complaint as any).packaging_received;
  const pkgExp: Record<string, string> | undefined = (complaint as any).packaging_expected;
  const packagingSubtypes = ['wrong_box','wrong_bag','wrong_paper','wrong_quantity','wrong_tags'];
  const selectedPackaging = packagingSubtypes.filter(s => subtypesArray.includes(s));
  if (selectedPackaging.length > 0) {
    y = ensureSpace(doc, y, 24);
    y = addSectionTitle(doc, L.packagingDetails, y);
    const rows = selectedPackaging.map(sub => [mapSubtype(sub), (pkgRecv?.[sub] ?? ''), (pkgExp?.[sub] ?? '')]);
    autoTable(doc, {
      head: [[L.subtypes, L.received, L.expected]],
      body: rows,
      startY: y + 4,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [107, 114, 128], textColor: 255 },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.40 },
        1: { cellWidth: contentWidth * 0.30 },
        2: { cellWidth: contentWidth * 0.30 },
      },
    });
    y = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + SECTION_SPACING : y + 60;
  }

  // Images (attachments)
  const atts = attachments ?? await fetchAttachments(complaint.id);
  const imageAtts = atts.filter(a => (a.mime_type || '').startsWith('image/'));
  if (imageAtts.length > 0) {
    y = ensureSpace(doc, y, 24);
    y = addSectionTitle(doc, L.images, y);
    const maxImageWidth = contentWidth;

    for (const a of imageAtts) {
      const url = `/uploads/complaints/${a.complaint_id}/${a.filename}`;
      try {
        const { dataUrl, width, height } = await urlToDataUrl(url, 'image/png');
        // Compute display size maintaining aspect ratio
        const naturalW = width || 800;
        const naturalH = height || 600;
        const scale = Math.min(maxImageWidth / naturalW, 1);
        const displayW = naturalW * scale;
        const displayH = naturalH * scale;

        y = ensureSpace(doc, y, displayH + 8);
        doc.addImage(dataUrl, 'PNG', PAGE_MARGIN, y, displayW, displayH);
        y += displayH + 8;
      } catch {
        // Skip problematic images
        y = ensureSpace(doc, y, LINE_HEIGHT);
        doc.setFont('helvetica', 'italic');
        const msg = isFR ? `(Impossible d'intégrer l'image : ${a.original_filename})` : `(Unable to embed image: ${a.original_filename})`;
        doc.text(msg, PAGE_MARGIN, y);
        y += LINE_HEIGHT;
      }
    }
    y += SECTION_SPACING;
  }

  // Actions table
  const acts = actions ?? await fetchActions(complaint.id);
  y = ensureSpace(doc, y, 24);
  y = addSectionTitle(doc, L.actions, y);

  if (acts.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.text(L.noActions, PAGE_MARGIN, y);
  } else {
    const rows = acts
      .sort((a, b) => (a.action_number || 0) - (b.action_number || 0))
      .map(a => [
        String(a.action_number ?? ''),
        a.action_text || '',
        a.responsible_person || '',
        a.due_date ? format(new Date(a.due_date), 'yyyy-MM-dd HH:mm', { locale: dfLocale }) : '',
        a.status || '',
        a.priority || '',
      ]);

    // Start table slightly below current y
    autoTable(doc, {
      head: [['#', isFR ? 'Action' : 'Action', L.responsible, L.due, L.status, L.priority]],
      body: rows,
      startY: y + 4,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: contentWidth * 0.44 },
        2: { cellWidth: contentWidth * 0.18 },
        3: { cellWidth: 70 },
        4: { cellWidth: 70 },
        5: { cellWidth: 70 },
      },
    });
  }

  // Filename
  const today = format(new Date(), 'yyyy-MM-dd', { locale: dfLocale });
  const fileName = isFR ? `reclamation-${complaint.id}-${today}.pdf` : `complaint-${complaint.id}-${today}.pdf`;
  doc.save(fileName);
}

export default exportComplaintToPDF;


