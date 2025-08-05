import { useCallback, useState } from 'react';
import { Upload, X, FileText, Image, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { post, del } from '../../services/api';

interface FileUploadProps {
  complaintId: number;
  onUploadComplete: () => void;
  // Optional: force a one-shot list refresh without causing loops
  refreshTrigger?: number;
}

interface UploadedFile {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  thumbnail_url?: string;
}

export default function FileUpload({ complaintId, onUploadComplete, refreshTrigger = 0 }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Track last refreshTrigger we used to avoid rapid repeat refreshes
  const lastRefreshRef = useState<number>(refreshTrigger)[0];

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    setError(null);

    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await post(
          `/api/complaints/${complaintId}/attachments`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        setUploadedFiles(prev => [...prev, response.data as UploadedFile]);
      }

      // One-shot refresh: call parent completion handler to bump refreshTrigger upstream.
      // Parent (e.g., ComplaintList consumer) should increment a state number and pass as prop.
      onUploadComplete();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [complaintId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.csv', '.json'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleRemove = async (fileId: number) => {
    try {
      await del(`/api/complaints/${complaintId}/attachments/${fileId}`);
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));

      // Trigger the same one-shot refresh path
      onUploadComplete();
    } catch (err) {
      setError('Failed to remove file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType?: string) => {
    const safeType = (fileType || '').toLowerCase();
    if (safeType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-gray-400" />;
    }
    // Default generic file icon for unknown/undefined types
    return <FileText className="h-5 w-5 text-gray-400" />;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Attach Files
        </label>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">
            {isDragActive
              ? 'Drop files here...'
              : 'Drag & drop files here, or click to select'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports images, PDFs, and text files up to 10MB
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}

      {uploading && (
        <div className="text-sm text-gray-600">Uploading files...</div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-3">
                {getFileIcon(file.file_type)}
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.filename || file.id}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(Number(file.file_size) || 0)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(file.id)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}