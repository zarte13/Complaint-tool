import axios from 'axios';
import { Company, Part, Complaint, ComplaintCreate, Attachment } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Companies API
export const companiesApi = {
  search: async (query: string, limit: number = 10): Promise<Company[]> => {
    const response = await api.get('/companies/', { params: { search: query, limit } });
    return response.data;
  },
  
  create: async (name: string): Promise<Company> => {
    const response = await api.post('/companies/', { name });
    return response.data;
  },
};

// Parts API
export const partsApi = {
  search: async (query: string, limit: number = 10): Promise<Part[]> => {
    const response = await api.get('/parts/', { params: { search: query, limit } });
    return response.data;
  },
  
  create: async (part_number: string, description?: string): Promise<Part> => {
    const response = await api.post('/parts/', { part_number, description });
    return response.data;
  },
};

// Complaints API
export const complaintsApi = {
  create: async (complaint: ComplaintCreate): Promise<Complaint> => {
    const response = await api.post('/complaints/', complaint);
    return response.data;
  },
  
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
    company_id?: number;
  }): Promise<Complaint[]> => {
    const response = await api.get('/complaints/', { params });
    return response.data.items || response.data;
  },
  
  getById: async (id: number): Promise<Complaint> => {
    const response = await api.get(`/complaints/${id}/`);
    return response.data;
  },
  
  update: async (id: number, update: Partial<Complaint>): Promise<Complaint> => {
    const response = await api.put(`/complaints/${id}/`, update);
    return response.data;
  },
  
  // Attachments
  uploadAttachment: async (complaintId: number, file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/complaints/${complaintId}/attachments/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  getAttachments: async (complaintId: number): Promise<Attachment[]> => {
    const response = await api.get(`/complaints/${complaintId}/attachments/`);
    return response.data;
  },
  
  deleteAttachment: async (attachmentId: number): Promise<void> => {
    await api.delete(`/complaints/attachments/${attachmentId}/`);
  },
};

export default api;