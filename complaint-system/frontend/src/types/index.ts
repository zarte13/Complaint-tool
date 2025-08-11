export interface Company {
  id: number;
  name: string;
  company_short?: string;
  created_at: string;
}

export interface Part {
  id: number;
  part_number: string;
  description?: string;
  created_at: string;
}

export type IssueType = 'wrong_quantity' | 'wrong_part' | 'damaged' | 'other';
export type IssueCategory = 'dimensional' | 'visual' | 'packaging' | 'other';
export type VisualSubtype = 'scratch' | 'nicks' | 'rust';
export type PackagingSubtype = 'wrong_box' | 'wrong_bag' | 'wrong_paper' | 'wrong_part' | 'wrong_quantity' | 'wrong_tags';
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved';

export interface Complaint {
  id: number;
  company: Company;
  part: Part;
  issue_type: IssueType;
  issue_category?: IssueCategory;
  issue_subtypes?: Array<VisualSubtype | PackagingSubtype>;
  packaging_received?: Record<string, string>;
  packaging_expected?: Record<string, string>;
  details: string;
  date_received: string;
  complaint_kind: 'official' | 'notification';
  ncr_number?: string;
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
  issue_type: IssueType; // kept for backend compatibility
  issue_category?: IssueCategory;
  issue_subtypes?: Array<VisualSubtype | PackagingSubtype>;
  packaging_received?: Record<string, string>;
  packaging_expected?: Record<string, string>;
  details: string;
  date_received: string; // YYYY-MM-DD
  complaint_kind: 'official' | 'notification';
  ncr_number?: string;
  quantity_ordered?: number;
  quantity_received?: number;
  work_order_number: string;
  // occurrence removed from form usage; kept here for legacy but not used
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

// DA-004: Follow-up Actions Types

export type ActionStatus = 'open' | 'in_progress' | 'blocked' | 'closed';
export type ActionPriority = 'low' | 'medium' | 'high' | 'critical';
export type DependencyType = 'sequential' | 'blocking' | 'optional';

export interface ResponsiblePerson {
  id: number;
  name: string;
  email?: string;
  department?: string;
  is_active: boolean;
  created_at: string;
}

export interface FollowUpAction {
  id: number;
  complaint_id: number;
  action_number: number;
  action_text: string;
  responsible_person: string;
  due_date?: string;  // ISO date string
  status: ActionStatus;
  priority: ActionPriority;
  notes?: string;
  completion_percentage: number; // retained for API compatibility; no longer edited in UI
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  is_overdue: boolean;
  can_start: boolean;
}

export interface FollowUpActionCreate {
  action_text: string;
  responsible_person: string;
  due_date?: string;  // ISO date string (YYYY-MM-DD)
  priority: ActionPriority;
  notes?: string;
}

export interface FollowUpActionUpdate {
  action_text?: string;
  responsible_person?: string;
  due_date?: string;  // ISO date string (YYYY-MM-DD)
  status?: ActionStatus;
  priority?: ActionPriority;
  notes?: string;
  completion_percentage?: number; // retained for API compatibility; no longer edited in UI
}

export interface ActionHistory {
  id: number;
  action_id: number;
  field_changed: string;
  old_value?: string;
  new_value?: string;
  changed_by: string;
  changed_at: string;
  change_reason?: string;
}

export interface ActionDependency {
  id: number;
  action_id: number;
  depends_on_action_id: number;
  dependency_type: DependencyType;
  created_at: string;
}

export interface ActionMetrics {
  total_actions: number;
  open_actions: number;
  overdue_actions: number;
  completion_rate: number;
  actions_by_status: Record<string, number>;
  actions_by_priority: Record<string, number>;
}

export interface BulkActionUpdate {
  action_ids: number[];
  updates: FollowUpActionUpdate;
}

export interface BulkActionResponse {
  updated_count: number;
  failed_updates: Array<{
    action_id: number;
    error: string;
  }>;
}

// Extended Complaint interface with actions
export interface ComplaintWithActions extends Complaint {
  follow_up_actions: FollowUpAction[];
}