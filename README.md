# Swasthya Shakti Gold - Frontend

React/Vite UI updated to use the specification-driven backend while keeping the existing application visual style.

## Setup
```bash
cp .env.example .env
npm install
npm run build
npm run dev
```

Default local API through Vite proxy:
```env
VITE_API_BASE_URL=/api
```
For a deployed backend, set for example:
```env
VITE_API_BASE_URL=https://your-backend.example.com/api
```

## Updated UI
- Dashboard uses Settings tile visibility
- Booking uses Settings oil types
- Oil Purchase creates tanker/raw-oil batch inventory
- Packaging Purchase uses Settings packaging/subtype configuration
- Batch Processing uses tanker batch number + database product profiles
- Inventory has Raw Oil / Packaging / Finished Goods tabs
- Invoice has customer autocomplete, batch-wise stock, PP Box conversion and tax-inclusive GST
- Maintenance supports inventory loss and general expenses
- Application Settings manages company, oil, packaging, maintenance and dashboard configuration

## Vendor / Customer Masters
Admin sidebar now includes **Masters → Vendor Management** and **Customer Management**. Booking selects an active Vendor. Invoice Customer Name is autocomplete and provides **+ Quick Add** to create/select a Customer without closing the invoice.
