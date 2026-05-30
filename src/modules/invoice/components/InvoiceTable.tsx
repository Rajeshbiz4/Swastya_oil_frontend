import React from 'react';
import DataTable from '../../../components/UI/DataTable';
import { Invoice } from '../types/invoice.types';
import { mapInvoiceToPdfData } from '../utils/invoiceCalculations';

interface InvoiceTableProps {
  invoices: Invoice[];
  loading: boolean;
  onView: (invoice: Invoice) => void;
  onSettle: (invoice: Invoice) => void;
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  loading,
  onView,
  onSettle,
}) => {
  const columns = [
    {
      key: 'invoiceNumber',
      title: 'Invoice Number',
    },
    {
      key: 'date',
      title: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'customerName',
      title: 'Customer',
    },
    {
      key: 'products',
      title: 'Total',
      render: (products: any[]) => {
        if (!products || products.length === 0) return '0';

        const total = products.reduce((sum, product) => {
          const rate = Number(product.rate) || 0;
          const qty = Number(product.qty) || 0;
          return sum + rate * qty;
        }, 0);

        return `${total}`;
      },
    },
    {
      key: 'status',
      title: 'Status',
      render: (status: string) => {
        const value = status || 'pending';

        return (
          <span className={`invoice-status invoice-status-${value.toLowerCase()}`}>
            {value}
          </span>
        );
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, row: Invoice) => (
        <>
          <button
            className="primary-button"
            onClick={() => onView(row)}
          >
            View
          </button>

          {row.status?.toLowerCase() === 'completed' ? (
            <span
              style={{
                marginLeft: '10px',
                color: 'green',
                fontWeight: 'bold',
              }}
            >
              Settled
            </span>
          ) : (
            <button
              className="settle-button"
              onClick={() => onSettle(row)}
            >
              Settle
            </button>
          )}
        </>
      ),
    },
  ];

  return (
    <DataTable
      data={invoices}
      columns={columns}
      loading={loading}
      rowKey="_id"
      expandable={(invoice: Invoice) => (
        <div
          style={{
            padding: '12px 20px',
            background: '#f9f9f9',
            border: '1px solid #ddd',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>
              Products
            </h4>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#eee', textAlign: 'left' }}>
                  <th style={{ padding: '6px', border: '1px solid #ccc' }}>Oil Type</th>
                  <th style={{ padding: '6px', border: '1px solid #ccc' }}>Packaging Type</th>
                  <th style={{ padding: '6px', border: '1px solid #ccc' }}>Qty</th>
                  <th style={{ padding: '6px', border: '1px solid #ccc' }}>Rate</th>
                  <th style={{ padding: '6px', border: '1px solid #ccc' }}>Total</th>
                </tr>
              </thead>

              <tbody>
                {invoice.products.map((product, index) => (
                  <tr key={index}>
                    <td style={{ padding: '6px', border: '1px solid #ccc' }}>
                      {product.oilType}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ccc' }}>
                      {product.type}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ccc' }}>
                      {product.qty}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ccc' }}>
                      ₹{product.rate}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ccc' }}>
                      ₹{Number(product.qty) * Number(product.rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(invoice.note || invoice.remarks) && (
            <div
              style={{
                padding: '8px',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#555',
              }}
            >
              <strong>Note:</strong> {invoice.note || invoice.remarks}
            </div>
          )}
        </div>
      )}
    />
  );
};

export default InvoiceTable;