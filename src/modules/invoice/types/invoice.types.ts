export interface ProductRateForInvoiceResponse {
  id: string;
  oilType: string;
  packagingType: string;
  packageSize: number;

  rawOilAverageRatePerUnit: number;
  packagingAverageCost: number;
  profitPerUnit: number;

  finalOilRatePerUnit: number;
  finalProductRate: number;
}