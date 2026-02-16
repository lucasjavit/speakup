import { ReactNode } from 'react';
import { Card } from '../Card';
import styles from './DataTable.module.css';

export interface Column<T> {
  /** Unique key for the column */
  key: string;
  /** Column header label */
  label: string;
  /** Custom render function for cell content */
  render: (item: T) => ReactNode;
  /** Optional CSS class for header */
  headerClassName?: string;
  /** Optional CSS class for cells */
  cellClassName?: string;
}

export interface DataTableProps<T> {
  /** Array of data to display */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Function to extract unique key from each item */
  getRowKey: (item: T) => string;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Show pagination controls */
  showPagination?: boolean;
  /** Current page (0-indexed) */
  currentPage?: number;
  /** Page size */
  pageSize?: number;
  /** Total number of pages */
  totalPages?: number;
  /** Total number of elements */
  totalElements?: number;
  /** Page change handler */
  onPageChange?: (page: number) => void;
  /** Page size change handler */
  onPageSizeChange?: (size: number) => void;
  /** Available page sizes */
  pageSizes?: number[];
  /** Optional checkbox selection */
  selectable?: boolean;
  /** Selected item keys */
  selectedKeys?: Set<string>;
  /** Selection change handler */
  onSelectionChange?: (keys: Set<string>) => void;
  /** Custom CSS class for table container */
  className?: string;
  /** Label for pagination info (e.g., "users", "feedbacks") */
  paginationLabel?: string;
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  loading = false,
  emptyMessage = 'No data found',
  showPagination = true,
  currentPage = 0,
  pageSize = 20,
  totalPages = 0,
  totalElements = 0,
  onPageChange,
  onPageSizeChange,
  pageSizes = [10, 20, 50, 100],
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  className,
  paginationLabel = 'items',
}: DataTableProps<T>) {
  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (selectedKeys.size === data.length && data.length > 0) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map(getRowKey)));
    }
  };

  const handleSelectItem = (key: string) => {
    if (!onSelectionChange) return;
    
    const newSelection = new Set(selectedKeys);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    onSelectionChange(newSelection);
  };

  const goToPage = (page: number) => {
    if (onPageChange && page >= 0 && page < totalPages) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (size: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(size);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <div className={styles.loading}>Loading...</div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <div className={styles.empty}>{emptyMessage}</div>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {selectable && (
                  <th className={styles.checkboxCol}>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedKeys.size === data.length && data.length > 0}
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th key={column.key} className={column.headerClassName}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const rowKey = getRowKey(item);
                return (
                  <tr key={rowKey}>
                    {selectable && (
                      <td className={styles.checkboxCol}>
                        <input
                          type="checkbox"
                          checked={selectedKeys.has(rowKey)}
                          onChange={() => handleSelectItem(rowKey)}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className={column.cellClassName}>
                        {column.render(item)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {showPagination && totalPages > 0 && (
          <div className={styles.paginationContainer}>
            <div className={styles.paginationInfo}>
              <span>
                Showing {currentPage * pageSize + 1} to{' '}
                {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements}{' '}
                {paginationLabel}
              </span>
              <div className={styles.pageSizeSelector}>
                <label>Rows per page:</label>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className={styles.pageSizeSelect}
                >
                  {pageSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageButton}
                  onClick={() => goToPage(0)}
                  disabled={currentPage === 0}
                  title="First page"
                >
                  ««
                </button>
                <button
                  className={styles.pageButton}
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  Previous
                </button>

                <div className={styles.pageNumbers}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`${styles.pageButton} ${
                          currentPage === pageNum ? styles.active : ''
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  className={styles.pageButton}
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                </button>
                <button
                  className={styles.pageButton}
                  onClick={() => goToPage(totalPages - 1)}
                  disabled={currentPage === totalPages - 1}
                  title="Last page"
                >
                  »»
                </button>
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
