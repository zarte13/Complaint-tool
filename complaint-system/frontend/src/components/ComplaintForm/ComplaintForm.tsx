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
  work_order_number: z.string().min(1, 'requiredField'),
  occurrence: z.string().optional(),
  part_received: z.string().optional(),
  human_factor: z.boolean().default(false),
}).refine((data) => {
  if (data.issue_type === 'wrong_quantity') {
    return data.quantity_ordered !== undefined && data.quantity_received !== undefined;
  }
  return true;
}, {
  message: 'Both quantity ordered and received are required for wrong quantity issues',
  path: ['quantity_received'],
}).refine((data) => {
  if (data.issue_type === 'wrong_part') {
    return data.part_received !== undefined && data.part_received.trim().length > 0;
  }
  return true;
}, {
  message: 'Part received is required for wrong part issues',
  path: ['part_received'],
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

      <div>
        <label htmlFor="occurrence" className="block text-sm font-medium text-gray-700 mb-1">
          <Tooltip content={t('tooltipOccurrence')}>
            <span>{t('occurrence')}</span>
          </Tooltip>
        </label>
        <input
          type="text"
          id="occurrence"
          {...register('occurrence')}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.occurrence ? 'border-red-300' : 'border-gray-300'
          }`}
        />
      </div>
      <div>
        <div className="flex items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">
            {t('issueType')}
          </label>
          <Tooltip content={t('tooltipIssueType')}>
            <span className="ml-1"></span>
          </Tooltip>
        </div>
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
            <label htmlFor="quantity_ordered" className="block text-sm font-medium text-gray-700 mb-1">
              <Tooltip content={t('tooltipQuantityOrdered')}>
                <span>{t('quantityOrdered')}</span>
              </Tooltip>
            </label>
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
            <label htmlFor="quantity_received" className="block text-sm font-medium text-gray-700 mb-1">
              <Tooltip content={t('tooltipQuantityReceived')}>
                <span>{t('quantityReceived')}</span>
              </Tooltip>
            </label>
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

      {issueType === 'wrong_part' && (
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