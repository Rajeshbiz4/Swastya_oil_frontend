import React, { useState } from 'react';
import './UI.css';

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "20px auto",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    fontFamily: "Arial"
  },
  row: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px"
  },
  input: {
    flex: 1,
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px"
  },
  th: {
    background: "#f5f5f5",
    padding: "10px",
    border: "1px solid #ddd"
  },
  td: {
    padding: "8px",
    border: "1px solid #ddd"
  },
  button: {
    padding: "8px 14px",
    marginRight: "10px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  },
  primaryBtn: {
    background: "#007bff",
    color: "white"
  },
  dangerBtn: {
    background: "#dc3545",
    color: "white"
  },
  successBtn: {
    background: "#28a745",
    color: "white"
  }
};
interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowKey?: keyof T | ((record: T) => string);
  onRowClick?: (record: T) => void;
  className?: string;
  expandable?: (record: T) => React.ReactNode; // <-- Add this
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  rowKey = '_id' as keyof T,
  onRowClick,
  className = '',
  expandable,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') return rowKey(record);
    return record[rowKey]?.toString() || index.toString();
  };

  const handleSort = (columnKey: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: columnKey, direction });
  };

  const sortedData = React.useMemo(() => {
    const dataArray = Array.isArray(data) ? data : [];
    if (!sortConfig) return dataArray;
    return [...dataArray].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const renderCell = (column: Column<T>, record: T) => {
    const value = record[column.key as keyof T];
    return column.render ? column.render(value, record) : value?.toString() || '';
  };

  const toggleExpand = (key: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setExpandedRows(newSet);
  };

  if (loading) {
    return (
      <div className="data-table-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`data-table-container ${className}`}>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key.toString()}
                  style={{ width: column.width }}
                  className={column.sortable ? 'sortable' : ''}
                  onClick={() => column.sortable && handleSort(column.key.toString())}
                >
                  <div className="th-content">
                    {column.title}
                    {column.sortable && (
                      <span className="sort-indicator">
                        {sortConfig?.key === column.key
                          ? sortConfig.direction === 'asc'
                            ? '↑'
                            : '↓'
                          : '↕'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {expandable && <th>Expand</th>}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (expandable ? 1 : 0)} className="no-data">
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((record, index) => {
                const key = getRowKey(record, index);
                const isExpanded = expandedRows.has(key);

                return (
                  <React.Fragment key={key}>
                    <tr className={onRowClick ? 'clickable' : ''} onClick={() => onRowClick?.(record)}>
                      {columns.map((column) => (
                        <td key={column.key.toString()}>{renderCell(column, record)}</td>
                      ))}

                      {expandable && (
                        <td>
                          <button style={{ ...styles.button, ...styles.successBtn }} onClick={() => toggleExpand(key)}>
                            {isExpanded ? 'Hide details' : 'Show details'}
                          </button>
                        </td>
                      )}
                    </tr>

                    {expandable && isExpanded && (
                      <tr className="expanded-row">
                        <td colSpan={columns.length + 1}>{expandable(record)}</td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="data-table-pagination">
          <div className="pagination-info">
            Showing {Math.min((pagination.current - 1) * pagination.pageSize + 1, pagination.total)} to{' '}
            {Math.min(pagination.current * pagination.pageSize, pagination.total)} of {pagination.total} entries
          </div>
          <div className="pagination-controls">
            <button
              disabled={pagination.current <= 1}
              onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
            >
              Previous
            </button>
            <span className="page-info">
              Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;