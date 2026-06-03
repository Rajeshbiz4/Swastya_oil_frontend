import api from '../../../services/api';
import {
  CreateInvoicePayload,
  Invoice,
  InvoiceProductRateResponse,
  InvoiceStatus,
  RawOilAverageRateResponse,
  FinishedGoodsQuantityResponse,
  PackagingRateResponse,
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

  async getInvoiceProductRate(
    oilType: string,
    packagingType: string
  ): Promise<InvoiceProductRateResponse> {
    const response = await api.get(
      `/invoice-pricing/product-rate/${encodeURIComponent(oilType)}/${encodeURIComponent(packagingType)}`
    );

    return response.data.data;
  },
  async getRawOilAverageRate(
    oilType: string
  ): Promise<RawOilAverageRateResponse> {
    const response = await api.get(
      `/invoice/raw-oil-average-rate/${encodeURIComponent(oilType)}`
    );

    return response.data.data;
  },

  async getOilAverageRate(
    oilType: string
  ): Promise<any> {
    const response = await api.get(
      `/raw-oil/average-rate/${oilType}`
    );

    return response.data.data;
  },

  async getFinishedGoodsQuantity(
    oilType: string,
    packagingType: string
  ): Promise<FinishedGoodsQuantityResponse> {
    const response = await api.get(
      `/invoice-pricing/finished-goods-quantity/${encodeURIComponent(oilType)}/${encodeURIComponent(packagingType)}`
    );

    return response.data.data;
  },

  async getPackagingRate(
    packagingType: string
  ): Promise<PackagingRateResponse> {
    const response = await api.get(
      `/invoice-pricing/packaging-rate/${encodeURIComponent(packagingType)}`
    );

    return response.data.data;
  },
};

