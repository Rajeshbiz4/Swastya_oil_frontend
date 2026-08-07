import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchCustomerLedger } from "../../store/slices/invoiceSlice";
import {fetchCustomerLedgerDetails} from "../../store/slices/invoiceSlice";

    const CustomerLedger = () => {
    const dispatch = useAppDispatch();

    const {customerLedger, customerLedgerDetails,loading,} = useAppSelector((state) => state.invoice);

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState("");

    useEffect(() => {
    dispatch(fetchCustomerLedger());
      }, [dispatch]);

    const filteredData = customerLedger.filter((item) =>
    item.customerName.toLowerCase().includes(search.toLowerCase())
    );    
    const handleView = async (customerName: string) => {
    setSelectedCustomer(customerName);

    await dispatch(fetchCustomerLedgerDetails(customerName));

    setShowModal(true);
    };

    return (
    <div className="customer-ledger-container">
      {/* Search */}
      <div className="customer-ledger-search">
        <input
          type="text"
          placeholder="Search Customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="employee-search-input"
        />
      </div>

      {/* Table */}
      <div className="table-section customer-ledger-table">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Total Invoice</th>
                <th>Paid Amount</th>
                <th>Outstanding</th>
                <th>View</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                 <td colSpan={5} className="no-data">
                Loading...
                </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={index}>
                    <td className="customer-name">
                {item.customerName}
                </td>

                <td className="invoice-count">
                {item.totalInvoices}
                </td>

                <td className="paid-amount">
                ₹{item.paidAmount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                })}
                </td>

                <td className="outstanding-amount">
                ₹{item.outstanding.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                })}
                </td>
                <td>
                <button
                className="btn btn-primary btn-sm"
                onClick={() => handleView(item.customerName)}
                >
                👁 View
                </button>
                </td>
                  </tr>
                ))
                ) : (
                <tr>
                 <td colSpan={5} className="no-data">
                No Data Available
                </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
  <div className="modal-overlay">
    <div className="modal-content">

      <div className="modal-header">
        <h3>{selectedCustomer} - Invoices</h3>

        <button
          className="btn btn-danger"
          onClick={() => setShowModal(false)}
        >
          ✖
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Date</th>
            <th>Status</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>

          {customerLedgerDetails.map((invoice) => (

            <tr key={invoice._id}>

              <td>{invoice.invoiceNumber}</td>

              <td>
                {new Date(invoice.date).toLocaleDateString()}
              </td>

              <td>{invoice.status}</td>

              <td>
                ₹{invoice.amount.toLocaleString("en-IN")}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  </div>
)}
    </div>
  );
};

export default CustomerLedger;