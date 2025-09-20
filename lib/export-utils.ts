'use client';

/**
 * Utility functions for exporting data in various formats
 */

/**
 * Convert array of objects to CSV format
 * @param data - Array of objects to convert
 * @param columns - Column configuration with headers
 * @returns CSV string
 */
export function convertToCSV(
  data: Record<string, any>[],
  columns: { key: string; label: string }[]
): string {
  // Create header row
  const headerRow = columns.map(col => `"${col.label}"`).join(',');
  
  // Create data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      // Handle different data types
      if (value === null || value === undefined) {
        return '""';
      }
      if (typeof value === 'string') {
        // Escape quotes in strings
        return `"${value.replace(/"/g, '""')}"`;
      }
      if (typeof value === 'number') {
        return value;
      }
      if (typeof value === 'boolean') {
        return value ? '"Yes"' : '"No"';
      }
      if (value instanceof Date) {
        return `"${value.toLocaleDateString()}"`;
      }
      // Handle complex objects by JSON stringifying
      return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  // Combine header and rows
  return [headerRow, ...rows].join('\n');
}

/**
 * Download data as a CSV file
 * @param data - Array of objects to download
 * @param columns - Column configuration with headers
 * @param filename - Name of the file to download
 */
export function downloadCSV(
  data: Record<string, any>[],
  columns: { key: string; label: string }[],
  filename: string
): void {
  const csvContent = convertToCSV(data, columns);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format data for PDF export
 * @param data - Array of objects to format
 * @param columns - Column configuration with headers
 * @returns Formatted data for PDF
 */
export function formatDataForPDF(
  data: Record<string, any>[],
  columns: { key: string; label: string }[]
): { headers: string[]; rows: any[][] } {
  const headers = columns.map(col => col.label);
  
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      return value;
    });
  });
  
  return { headers, rows };
}

/**
 * Convert data for Excel export
 * @param data - Array of objects to convert
 * @param worksheetName - Name of the worksheet
 * @returns Workbook object ready for export
 */
export function prepareExcelData(
  data: Record<string, any>[],
  columns: { key: string; label: string }[],
  worksheetName: string = 'Report Data'
): any {
  // This is a simplified version that returns the formatted data
  // In a real implementation, you would use a library like xlsx or exceljs
  
  const headers = columns.map(col => col.label);
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      if (value === null || value === undefined) {
        return '';
      }
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      return value;
    });
  });
  
  return {
    worksheetName,
    headers,
    rows
  };
}

/**
 * Generate filename with date
 * @param prefix - Prefix for the filename
 * @returns Formatted filename with date
 */
export function generateFilename(prefix: string): string {
  const date = new Date();
  const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `${prefix}_${formattedDate}`;
}