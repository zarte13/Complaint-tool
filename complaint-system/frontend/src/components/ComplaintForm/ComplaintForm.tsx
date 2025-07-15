import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Send, Upload } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import CompanySearch from '../CompanySearch/CompanySearch';
import PartAutocomplete from '../PartAutocomplete/PartAutocomplete';
import Tooltip from '../Tooltip/Tooltip';
import { Company, Part } from '../../types';
import api from '../../services/api';

const complaintSchema = z.object({
  company_id: z.number().min(1, 'selectCompany'),
  part_id: z.number().min(1, 'selectPart'),
  issue_type: z.enum(['wrong_quantity', 'wrong_part', 'damaged', 'other']),
  details: z.string().min(10, 'minCharacters'),
  quantity_ordered: z.number().optional(),
  quantity_received: z.number().optional(),
}).refine((data) => {
  if (data.issue_type === 'wrong_quantity') {
    return data.quantity_ordered !== undefined && data.quantity_received !== undefined;
  }
  return true;
}, {
  message: 'Both quantity ordered and received are required for wrong quantity issues',
  path: ['quantity_received'],
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
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [complaintId, setComplaintId] = useState<number | null>(null);
  const { t } = useLanguage();

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

  const issueType = watch('issue_type');

  const handleCompanyChange = (company: Company) => {
    setSelectedCompany(company);
    setValue('company_id', company.id);
  };

  const handlePartChange = (part: Part) => {
    setSelectedPart(part);
    setValue('part_id', part.id);
  };

  const onSubmit = async (data: ComplaintFormData) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await api.post('/complaints/', data);
      const newComplaint = response.data;
      setComplaintId(newComplaint.id);

      // Upload files if any
      if (files.length > 0) {
        await uploadFiles(newComplaint.id);
      }

      reset();
      setSelectedCompany(null);
      setSelectedPart(null);
      setFiles([]);
      setComplaintId(null);
      
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
        
        await api.post(`/complaints/${complaintId}/attachments`, fileFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadProgress(prev => ({ ...prev, [file.name]: percentCompleted }));
          },
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
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('submitComplaint')}</h2>
      </div>

      {error && (
        <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <Tooltip content={t('tooltipCompany')}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('customerCompany')}
          </label>
        </Tooltip>
        <CompanySearch
          value={selectedCompany}
          onChange={handleCompanyChange}
          error={errors.company_id?.message}
        />
      </div>

      <div>
        <Tooltip content={t('tooltipPart')}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('partNumber')}
          </label>
        </Tooltip>
        <PartAutocomplete
          value={selectedPart}
          onChange={handlePartChange}
          error={errors.part_id?.message}
        />
      </div>

      <div>
        <Tooltip content={t('tooltipIssueType')}>
          <label htmlFor="issue_type" className="block text-sm font-medium text-gray-700 mb-1">
            {t('issueType')}
          </label>
        </Tooltip>
        <select
          id="issue_type"
          {...register('issue_type')}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.issue_type ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">{t('selectIssueType')}</option>
          <option value="wrong_quantity">{t('wrongQuantity')}</option>
          <option value="wrong_part">{t('wrongPart')}</option>
          <option value="damaged">{t('damaged')}</option>
          <option value="other">{t('other')}</option>
        </select>
        {errors.issue_type && (
          <p className="mt-1 text-sm text-red-600">{errors.issue_type.message}</p>
        )}
      </div>

      {issueType === 'wrong_quantity' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Tooltip content={t('tooltipQuantityOrdered')}>
              <label htmlFor="quantity_ordered" className="block text-sm font-medium text-gray-700 mb-1">
                {t('quantityOrdered')}
              </label>
            </Tooltip>
            <input
              type="number"
              id="quantity_ordered"
              {...register('quantity_ordered', { valueAsNumber: true })}
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.quantity_ordered ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>
          <div>
            <Tooltip content={t('tooltipQuantityReceived')}>
              <label htmlFor="quantity_received" className="block text-sm font-medium text-gray-700 mb-1">
                {t('quantityReceived')}
              </label>
            </Tooltip>
            <input
              type="number"
              id="quantity_received"
              {...register('quantity_received', { valueAsNumber: true })}
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.quantity_received ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>
        </div>
      )}

      <div>
        <Tooltip content={t('tooltipDetails')}>
          <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">
            {t('details')}
          </label>
        </Tooltip>
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
        <Tooltip content={t('tooltipFileUpload')}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('attachFiles')}
          </label>
        </Tooltip>
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