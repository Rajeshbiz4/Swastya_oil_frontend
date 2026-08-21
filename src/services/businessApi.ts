import api from './api';

export const settingsApi={
  get:()=>api.get('/settings'),
  update:(data:any)=>api.put('/settings',data),
  getOilTypes:()=>api.get('/settings/oil-types'),
  getPackagingTypes:()=>api.get('/settings/packaging-types'),
  getPackagingSubtypes:()=>api.get('/settings/packaging-subtypes'),
  getPolytheneSubtypes:()=>api.get('/settings/polythene-subtypes'),
  getMaintenanceTypes:()=>api.get('/settings/maintenance-types'),
  getDashboardTiles:()=>api.get('/settings/dashboard-tiles')
};
export const customerApi={search:(q:string)=>api.get('/customers/search',{params:{q}}),list:(includeInactive=false)=>api.get('/customers',{params:{includeInactive}}),get:(id:string)=>api.get(`/customers/${id}`),create:(d:any)=>api.post('/customers',d),update:(id:string,d:any)=>api.put(`/customers/${id}`,d),remove:(id:string)=>api.delete(`/customers/${id}`)};
export const vendorApi={search:(q:string)=>api.get('/vendors/search',{params:{q}}),list:(includeInactive=false)=>api.get('/vendors',{params:{includeInactive}}),get:(id:string)=>api.get(`/vendors/${id}`),create:(d:any)=>api.post('/vendors',d),update:(id:string,d:any)=>api.put(`/vendors/${id}`,d),remove:(id:string)=>api.delete(`/vendors/${id}`)};
export const batchApi={options:()=>api.get('/oil-batches/options'),capacity:(d:any)=>api.post('/oil-batches/calculate-capacity',d),create:(d:any)=>api.post('/oil-batches',d),list:()=>api.get('/oil-batches')};
export const inventoryApi={rawSummary:()=>api.get('/inventory/raw-oil/summary'),packagingSummary:()=>api.get('/inventory/packaging/summary'),finishedSummary:()=>api.get('/inventory/finished-goods/summary'),raw:()=>api.get('/inventory/raw-oil'),packaging:()=>api.get('/inventory/packaging'),finished:()=>api.get('/inventory/finished-goods')};
export const invoiceApi={options:()=>api.get('/invoices/options'),calculate:(d:any)=>api.post('/invoices/calculate',d),create:(d:any)=>api.post('/invoices',d),list:()=>api.get('/invoices'),detail:(id:string)=>api.get(`/invoices/${id}`),complete:(id:string)=>api.patch(`/invoices/${id}/complete`),cancel:(id:string,reason:string)=>api.patch(`/invoices/${id}/cancel`,{reason}),createReturn:(id:string,d:any)=>api.post(`/invoices/${id}/returns`,d)};
export const maintenanceApi={configuration:()=>api.get('/maintenance/configuration'),inventoryOptions:(inventoryType:string)=>api.get('/maintenance/inventory-options',{params:{inventoryType}}),list:(params?:any)=>api.get('/maintenance',{params}),create:(data:FormData)=>api.post('/maintenance',data,{headers:{'Content-Type':'multipart/form-data'}}),reverse:(id:string,reason:string)=>api.post(`/maintenance/${id}/reverse`,{reason})};
