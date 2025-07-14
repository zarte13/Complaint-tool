export interface Company {
  id: number;
  name: string;
  created_at: string;
}

export interface Part {
  id: number;
  part_number: string;
  description?: string;
  created_at: string;
}

export type IssueType = 'wrong_quantity' | 'wrong_part' | 'damaged' | 'other';
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Complaint {
  id: number;
  company: Company;
  part: Part;
  issue_type: IssueType;
  details: string;
  quantity_ordered?: number;
  quantity_received?: number;
  status: ComplaintStatus;
  has_attachments: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComplaintCreate {
  company_id: number;
  part_id: number;
  issue_type: IssueType;
  details: string;
  quantity_ordered?: number;
  quantity_received?: number;
}

export interface Attachment {
  id: number;
  original_filename: string;
  file_type: string;
  file_size: number;
  thumbnail_url?: string;
  created_at: string;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}