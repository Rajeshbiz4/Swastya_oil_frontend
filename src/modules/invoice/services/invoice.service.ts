import api from '../../../services/api';
import {
  CreateInvoicePayload,
  Invoice,
  InvoiceStatus,
} from '../types/invoice.types';

export const invoiceService = {
  async getInvoices(): Promise<Invoice[]> {
    const response = await api.get('/invoices');
    return response.data.data || response.data;
  },

  async createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
    const response = await api.post('/invoices', payload);
    return response.data.data || response.data;
  },

  async updateInvoiceStatus(
    id: string,
    status: InvoiceStatus
  ): Promise<Invoice> {
    const response = await api.patch(`/invoices/${id}/status`, { status });
    return response.data.data || response.data;
  },

  async deleteInvoice(id: string): Promise<void> {
    await api.delete(`/invoices/${id}`);
  },
};