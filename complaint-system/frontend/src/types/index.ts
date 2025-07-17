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
  work_order_number: string;
  occurrence?: string;
  part_received?: string;
  human_factor: boolean;
  status: ComplaintStatus;
  has_attachments: boolean;
  created_at: string;
  updated_at: string;
  last_edit?: string;
}

export interface ComplaintCreate {
  company_id: number;
  part_id: number;
  issue_type: IssueType;
  details: string;
  quantity_ordered?: number;
  quantity_received?: number;
  work_order_number: string;
  occurrence?: string;
  part_received?: string;
  human_factor: boolean;
}

export interface Attachment {
  id: number;
  complaint_id: number;
  filename: string;  // Generated unique filename
  original_filename: string;  // Original uploaded filename
  file_size: number;
  mime_type: string;
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