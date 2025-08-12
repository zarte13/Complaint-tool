import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Send } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import CompanySearch from '../CompanySearch/CompanySearch';
import PartAutocomplete from '../PartAutocomplete/PartAutocomplete';
import Tooltip from '../Tooltip/Tooltip';
import { Company, Part, IssueCategory, PackagingSubtype, VisualSubtype, ComplaintCreate } from '../../types';
import { post } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const IssueCategoryEnum = z.enum(['dimensional', 'visual', 'packaging', 'other']);
// Allow user-defined visual sub-categories as free-form strings
const VisualSubtypeEnum = z.string();
const PackagingSubtypeEnum = z.enum(['wrong_box', 'wrong_bag', 'wrong_paper', 'wrong_part', 'wrong_quantity', 'wrong_tags']);

const complaintSchema = z.object({
  company_id: z.number().min(1, 'selectCompany'),
  part_id: z.number().min(1, 'selectPart'),
  complaint_kind: z.enum(['official','notification']),
  date_received: z.string().min(1, 'requiredField'),
  issue_category: IssueCategoryEnum,
  ncr_number: z.string().optional(),
  issue_subtypes: z.array(z.union([VisualSubtypeEnum, PackagingSubtypeEnum])).optional(),
  packaging_received: z.record(z.string()).optional(),
  packaging_expected: z.record(z.string()).optional(),
  // legacy field retained for backend compatibility; derived on submit
  issue_type: z.enum(['wrong_quantity', 'wrong_part', 'damaged', 'other']).optional(),
  details: z.string().min(10, 'minCharacters'),
  quantity_ordered: z.number().optional(),
  quantity_received: z.number().optional(),
  work_order_number: z.string().min(1, 'requiredField'),
  // occurrence removed per spec
  part_received: z.string().optional(),
  human_factor: z.boolean().default(false),
}).refine((data) => {
  if (data.issue_category === 'packaging' && data.issue_subtypes?.includes('wrong_part')) {
    return data.part_received !== undefined && data.part_received.trim().length > 0;
  }
  return true;
}, {
  message: 'Part received is required for wrong part issues',
  path: ['part_received'],
}).refine((data) => {
  if (data.issue_category === 'packaging' && data.issue_subtypes) {
    const required: PackagingSubtype[] = ['wrong_box', 'wrong_bag', 'wrong_paper', 'wrong_quantity'];
    const recv = data.packaging_received || {};
    const exp = data.packaging_expected || {};
    for (const subtype of required) {
      if (data.issue_subtypes.includes(subtype)) {
        if (!recv[subtype] || !exp[subtype]) {
          return false;
        }
      }
    }
  }
  return true;
}, {
  message: 'Received and Expected values are required for selected packaging subtypes',
  path: ['packaging_expected'],
}).refine((data) => {
  // If wrong_quantity is among selected packaging subtypes, quantities must be provided and valid
  if (data.issue_category === 'packaging' && data.issue_subtypes?.includes('wrong_quantity')) {
    const qo = data.quantity_ordered;
    const qr = data.quantity_received;
    if (qo === undefined || qo === null || Number.isNaN(qo) || qo < 1) return false;
    if (qr === undefined || qr === null || Number.isNaN(qr) || qr < 0) return false;
  }
  return true;
}, {
  message: 'Quantities are required for wrong quantity issues',
  path: ['quantity_ordered'],
}).refine((data) => {
  // NCR required only for official complaints
  if (data.complaint_kind === 'official') {
    return !!(data.ncr_number && data.ncr_number.trim().length > 0);
  }
  return true;
}, {
  message: 'NCR number is required for official complaints',
  path: ['ncr_number'],
});

type ComplaintFormData = z.infer<typeof complaintSchema>;

interface ComplaintFormProps {
  onSuccess?: () => void;
}

export default function ComplaintForm({ onSuccess }: ComplaintFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const { t } = useLanguage();
  const [isVisualDropdownOpen, setIsVisualDropdownOpen] = useState(false);
  const [newVisualSubtype, setNewVisualSubtype] = useState('');
  const [visualOptions, setVisualOptions] = useState<string[]>(['scratch', 'nicks', 'rust']);
  const isAdmin = useAuthStore.getState().isAdmin();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const DRAFT_KEY = 'complaintFormDraft';
  const [isPackagingDropdownOpen, setIsPackagingDropdownOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
  });
  const kind = watch('complaint_kind');

  const issueCategory = watch('issue_category');
  const issueSubtypes = watch('issue_subtypes') || [];
  const packagingReceived = watch('packaging_received') || {};
  const packagingExpected = watch('packaging_expected') || {};

  // Autosave draft to localStorage to prevent data loss on logout/refresh
  const isRestoringRef = useRef(false);

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<ComplaintFormData>;
      isRestoringRef.current = true;
      Object.entries(draft).forEach(([key, value]) => {
        // Safety: only set known keys
        setValue(key as any, value as any, { shouldValidate: false, shouldDirty: true });
      });
    } catch {
      // ignore
    } finally {
      // allow next renders to save again
      setTimeout(() => { isRestoringRef.current = false; }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on any form value change
  const allValues = watch();
  useEffect(() => {
    if (isRestoringRef.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(allValues ?? {}));
    } catch {
      // ignore quota errors
    }
  }, [allValues]);

  // Clear irrelevant fields when category changes
  // - Switching to 'visual' should drop any packaging-only subtypes/fields
  // - Switching to 'packaging' should drop visual-only subtypes
  // - Switching away from 'packaging' clears packaging_received/expected and part_received/quantities
  const handleCategoryChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const next = e.target.value as IssueCategory;
    setValue('issue_category', next as any, { shouldValidate: true });

    const currentSubtypes: string[] = (issueSubtypes as string[]) || [];
    if (next === 'visual') {
      const filtered = currentSubtypes.filter((s) => visualOptions.includes(s));
      setValue('issue_subtypes' as any, filtered, { shouldValidate: true });
      setValue('packaging_received' as any, {}, { shouldValidate: true });
      setValue('packaging_expected' as any, {}, { shouldValidate: true });
      setValue('part_received' as any, '', { shouldValidate: true });
      setValue('quantity_ordered' as any, undefined, { shouldValidate: true });
      setValue('quantity_received' as any, undefined, { shouldValidate: true });
    } else if (next === 'packaging') {
      const filtered = currentSubtypes.filter((s) => s === 'wrong_box' || s === 'wrong_bag' || s === 'wrong_paper' || s === 'wrong_part' || s === 'wrong_quantity' || s === 'wrong_tags');
      setValue('issue_subtypes' as any, filtered, { shouldValidate: true });
    } else {
      // dimensional/other: clear all subtypes and packaging-specific fields
      setValue('issue_subtypes' as any, [], { shouldValidate: true });
      setValue('packaging_received' as any, {}, { shouldValidate: true });
      setValue('packaging_expected' as any, {}, { shouldValidate: true });
      setValue('part_received' as any, '', { shouldValidate: true });
      setValue('quantity_ordered' as any, undefined, { shouldValidate: true });
      setValue('quantity_received' as any, undefined, { shouldValidate: true });
    }
  };

  const handleCompanyChange = (company: Company) => {
    setSelectedCompany(company);
    setValue('company_id', company.id);
  };

  const handlePartChange = (part: Part | null) => {
    if (!part) {
      setSelectedPart(null);
      setValue('part_id' as any, undefined, { shouldValidate: true });
      return;
    }
    setSelectedPart(part);
    setValue('part_id', part.id, { shouldValidate: true });
  };

  const deriveIssueType = (category: IssueCategory, subtypes: Array<VisualSubtype | PackagingSubtype> | undefined): 'wrong_quantity' | 'wrong_part' | 'damaged' | 'other' => {
    if (category === 'packaging') {
      // If both are selected, prefer wrong_quantity to enforce required quantities
      if (subtypes?.includes('wrong_quantity')) return 'wrong_quantity';
      if (subtypes?.includes('wrong_part')) return 'wrong_part';
      return 'other';
    }
    if (category === 'visual') return 'damaged';
    return 'other';
  };

  // Ghost legacy fields guard: if wrong_quantity is selected under packaging,
  // explicitly nullify any hidden legacy blockers and ensure numeric defaults are valid.
  const normalizeForWrongQuantity = (data: ComplaintFormData): ComplaintFormData => {
    const subtypes = data.issue_subtypes || [];
    if (data.issue_category === 'packaging' && subtypes.includes('wrong_quantity')) {
      // Ensure numbers are actually numbers (not undefined or NaN)
      // Leave them as-is if provided; backend schema allows nulls when packaging is used
      // but we set explicit undefined to avoid React Hook Form keeping hidden stale values
      const patch: Partial<ComplaintFormData> = {};
      if (data.quantity_ordered === null as any) patch.quantity_ordered = undefined;
      if (data.quantity_received === null as any) patch.quantity_received = undefined;
      return { ...data, ...patch } as ComplaintFormData;
    }
    return data;
  };

  const onSubmit = async (incoming: ComplaintFormData) => {
    setSubmitting(true);
    setError(null);

    try {
      const data = normalizeForWrongQuantity(incoming);
      const payload: ComplaintCreate = {
        company_id: data.company_id,
        part_id: data.part_id,
        complaint_kind: data.complaint_kind,
        date_received: data.date_received,
        issue_category: data.issue_category as IssueCategory,
        issue_subtypes: data.issue_subtypes as any,
        ncr_number: data.complaint_kind === 'official' ? (data.ncr_number || '') : undefined,
        packaging_received: data.packaging_received,
        packaging_expected: data.packaging_expected,
        issue_type: deriveIssueType(data.issue_category as IssueCategory, data.issue_subtypes as any),
        details: data.details,
        quantity_ordered: data.quantity_ordered,
        quantity_received: data.quantity_received,
        work_order_number: data.work_order_number,
        // occurrence removed
        part_received: data.part_received,
        human_factor: data.human_factor ?? false,
      };

      // Ensure user is authenticated before submitting; if not, preserve draft
      if (!isAuthenticated) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(incoming));
        setError(t('pleaseLoginToSubmit') || 'Please log in to submit. Your draft was saved.');
        return;
      }

      const response = await post('/api/complaints/', payload);
      const newComplaint = response.data as { id: number };

      // Upload files if any
      if (files.length > 0) {
        await uploadFiles(newComplaint.id);
      }

      reset();
      setSelectedCompany(null);
      setSelectedPart(null);
      setFiles([]);
      // Clear saved draft on successful submission
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadFiles = async (complaintId: number) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      for (const file of files) {
        const fileFormData = new FormData();
        fileFormData.append('file', file);
        
        await post(`/api/complaints/${complaintId}/attachments`, fileFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          // progress callback intentionally unused
          onUploadProgress: () => {},
        });
      }
    } catch (err) {
      console.error('Failed to upload files:', err);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Kind selector buttons */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="block text-sm font-medium text-gray-700">{t('complaintKind') || 'Type'}</span>
        </div>
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setValue('complaint_kind' as any, 'notification', { shouldValidate: true })}
            className={`px-3 py-1.5 text-sm border ${kind === 'notification' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'} rounded-l-md`}
          >
            {t('notificationComplaint') || 'Notification'}
          </button>
          <button
            type="button"
            onClick={() => setValue('complaint_kind' as any, 'official', { shouldValidate: true })}
            className={`px-3 py-1.5 text-sm border ${kind === 'official' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'} rounded-r-md`}
          >
            {t('officialComplaint') || 'Official Complaint'}
          </button>
        </div>
      </div>

      {/* Date received */}
      <div>
        <label htmlFor="date_received" className="block text-sm font-medium text-gray-700 mb-1">
          <Tooltip content={t('tooltipDateReceived') || ''}>
            <span>{t('dateReceived') || 'Date Received'} *</span>
          </Tooltip>
        </label>
        <input
          type="date"
          id="date_received"
          {...register('date_received')}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            (errors as any).date_received ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {(errors as any).date_received && (
          <p className="mt-1 text-sm text-red-600">{(errors as any).date_received.message as any}</p>
        )}
      </div>

      {/* NCR number moved below Work Order Number */}

      {error && (
        <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <div className="flex items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">
            {t('customerCompany')}
          </label>
          <Tooltip content={t('tooltipCompany')}>
            <span className="ml-1"></span>
          </Tooltip>
        </div>
        <CompanySearch
          value={selectedCompany}
          onChange={handleCompanyChange}
          error={errors.company_id?.message}
        />
      </div>

      <div>
        <div className="flex items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">
            {t('partNumber')}
          </label>
          <Tooltip content={t('tooltipPart')}>
            <span className="ml-1"></span>
          </Tooltip>
        </div>
        <PartAutocomplete
          value={selectedPart}
          onChange={handlePartChange}
          error={errors.part_id?.message}
        />
      </div>

      <div>
        <label htmlFor="work_order_number" className="block text-sm font-medium text-gray-700 mb-1">
          <Tooltip content={t('tooltipWorkOrderNumber')}>
            <span>{t('workOrderNumber')}</span>
          </Tooltip>
        </label>
        <input
          type="text"
          id="work_order_number"
          {...register('work_order_number')}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.work_order_number ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.work_order_number && (
          <p className="mt-1 text-sm text-red-600">{errors.work_order_number.message}</p>
        )}
      </div>

      {/* NCR number (conditional) under Work Order Number */}
      <div>
        <label htmlFor="ncr_number" className="block text-sm font-medium text-gray-700 mb-1">
          <span>{t('ncrNumber') || 'NCR Number'}{kind === 'official' ? ' *' : ''}</span>
        </label>
        <input
          type="text"
          id="ncr_number"
          {...register('ncr_number')}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            (errors as any).ncr_number ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {(errors as any).ncr_number && (
          <p className="mt-1 text-sm text-red-600">{(errors as any).ncr_number.message as any}</p>
        )}
      </div>

      {/* Occurrence removed per spec */}
      <div>
        <div className="flex items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">
            {t('issueCategory') || 'Issue Category'}
          </label>
          <Tooltip content={t('tooltipIssueType')}>
            <span className="ml-1"></span>
          </Tooltip>
        </div>
        <select
          id="issue_category"
          {...register('issue_category')}
          onChange={handleCategoryChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            (errors as any).issue_category ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">{t('selectIssueCategory') || 'Select category'}</option>
          <option value="dimensional">{t('categoryDimensional') || 'Dimensional'}</option>
          <option value="visual">{t('categoryVisual') || 'Visual'}</option>
          <option value="packaging">{t('categoryPackaging') || 'Packaging'}</option>
          <option value="other">{t('other') || 'Other'}</option>
        </select>
      </div>

      {issueCategory === 'visual' && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('issueSubtypes') || 'Issue Sub-categories'}</label>
          <button
            type="button"
            onClick={() => setIsVisualDropdownOpen((v) => !v)}
            className="w-full px-3 py-2 border rounded-md text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {issueSubtypes.length > 0
              ? (issueSubtypes as string[]).map((s) => ({
                  scratch: t('visualScratch') || 'Scratch',
                  nicks: t('visualNicks') || 'Nicks',
                  rust: t('visualRust') || 'Rust',
                } as Record<string,string>)[s] || s).join(', ')
              : (t('selectSubtypes') || 'Select sub-categories')}
          </button>
          {isVisualDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg p-2 max-h-56 overflow-auto">
              {visualOptions.map((opt) => {
                const key = opt;
                const label = ({
                  scratch: t('visualScratch') || 'Scratch',
                  nicks: t('visualNicks') || 'Nicks',
                  rust: t('visualRust') || 'Rust',
                } as Record<string,string>)[opt] || opt;
                const checked = (issueSubtypes as any[]).includes(key);
                return (
                  <label key={key} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(issueSubtypes as string[]);
                        if (e.target.checked) next.add(key);
                        else next.delete(key);
                        setValue('issue_subtypes' as any, Array.from(next), { shouldValidate: true });
                      }}
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                );
              })}
              {isAdmin && (
                <div className="mt-2 flex items-center gap-2 border-t pt-2">
                  <input
                    type="text"
                    value={newVisualSubtype}
                    onChange={(e) => setNewVisualSubtype(e.target.value)}
                    placeholder={t('newSubtypePlaceholder') || 'New sub-category...'}
                    className="flex-1 px-2 py-1 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = newVisualSubtype.trim();
                      if (!v) return;
                      if (!visualOptions.includes(v)) setVisualOptions((opts) => [...opts, v]);
                      const next = new Set(issueSubtypes as string[]);
                      next.add(v);
                      setValue('issue_subtypes' as any, Array.from(next), { shouldValidate: true });
                      setNewVisualSubtype('');
                    }}
                    className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {t('addSubtype') || 'Add'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {issueCategory === 'packaging' && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('issueSubtypes') || 'Issue Subtypes'}</label>
          <button
            type="button"
            onClick={() => setIsPackagingDropdownOpen((v) => !v)}
            className="w-full px-3 py-2 border rounded-md text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {issueSubtypes.length > 0
              ? (issueSubtypes as string[]).map((s) => ({
                  wrong_box: t('packagingWrongBox') || 'Wrong Box',
                  wrong_bag: t('packagingWrongBag') || 'Wrong Bag',
                  wrong_paper: t('packagingWrongPaper') || 'Wrong Paper',
                  wrong_part: t('wrongPart') || 'Wrong Part',
                  wrong_quantity: t('wrongQuantity') || 'Wrong Quantity',
                  wrong_tags: t('packagingWrongTags') || 'Wrong Tags',
                } as Record<string,string>)[s] || s).join(', ')
              : (t('selectSubtypes') || 'Select subtypes')}
          </button>
          {isPackagingDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg p-2 max-h-64 overflow-auto">
              {([
                { value: 'wrong_box', label: t('packagingWrongBox') || 'Wrong Box' },
                { value: 'wrong_bag', label: t('packagingWrongBag') || 'Wrong Bag' },
                { value: 'wrong_paper', label: t('packagingWrongPaper') || 'Wrong Paper' },
                { value: 'wrong_part', label: t('wrongPart') || 'Wrong Part' },
                { value: 'wrong_quantity', label: t('wrongQuantity') || 'Wrong Quantity' },
                { value: 'wrong_tags', label: t('packagingWrongTags') || 'Wrong Tags' },
              ] as {value: PackagingSubtype, label: string}[]).map((opt) => {
                const checked = (issueSubtypes as any[]).includes(opt.value);
                return (
                  <label key={opt.value} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(issueSubtypes as string[]);
                        if (e.target.checked) next.add(opt.value);
                        else next.delete(opt.value);
                        setValue('issue_subtypes' as any, Array.from(next), { shouldValidate: true });
                      }}
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {issueCategory === 'packaging' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['wrong_box','wrong_bag','wrong_paper','wrong_quantity'] as const).map((sub) => (
            issueSubtypes.includes(sub) ? (
              <div key={sub} className="space-y-2">
                <div className="text-sm font-medium text-gray-700">{{
                  wrong_box: t('packagingWrongBox') || 'Wrong Box',
                  wrong_bag: t('packagingWrongBag') || 'Wrong Bag',
                  wrong_paper: t('packagingWrongPaper') || 'Wrong Paper',
                  wrong_quantity: t('wrongQuantity') || 'Wrong Quantity',
                }[sub as 'wrong_box'|'wrong_bag'|'wrong_paper'|'wrong_quantity']}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={t('packagingReceivedLabel') || 'Received'}
                    value={packagingReceived[sub] || ''}
                    onChange={(e) => setValue(`packaging_received.${sub}` as any, e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder={t('packagingExpectedLabel') || 'Expected'}
                    value={packagingExpected[sub] || ''}
                    onChange={(e) => setValue(`packaging_expected.${sub}` as any, e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : null
          ))}
        </div>
      )}

      {issueCategory === 'packaging' && issueSubtypes.includes('wrong_part') && (
        <div>
          <label htmlFor="part_received" className="block text-sm font-medium text-gray-700 mb-1">
            <Tooltip content={t('tooltipPartReceived')}>
              <span>{t('partReceived')} *</span>
            </Tooltip>
          </label>
          <input
            type="text"
            id="part_received"
            {...register('part_received')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.part_received ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.part_received && (
            <p className="mt-1 text-sm text-red-600">{errors.part_received.message}</p>
          )}
        </div>
      )}

      <div className="flex items-center">
        <input
          type="checkbox"
          id="human_factor"
          {...register('human_factor')}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="human_factor" className="ml-2 block text-sm text-gray-900">
          <Tooltip content={t('tooltipHumanFactor')}>
            <span>{t('humanFactor')}</span>
          </Tooltip>
        </label>
      </div>

      <div>
        <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">
          <Tooltip content={t('tooltipDetails')}>
            <span>{t('details')}</span>
          </Tooltip>
        </label>
        <textarea
          id="details"
          {...register('details')}
          rows={4}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.details ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={t('tooltipDetails')}
        />
        {errors.details && (
          <p className="mt-1 text-sm text-red-600">{errors.details.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Tooltip content={t('tooltipFileUpload')}>
            <span>{t('attachFiles')}</span>
          </Tooltip>
        </label>
        <div className="space-y-2">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(file.name)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4 mr-2" />
          {submitting ? t('submitting') : t('submitButton')}
        </button>
      </div>
    </form>
  );
}