'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip
} from '@mui/material';

interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row?: any) => string | React.ReactNode;
}

interface ReportTableProps {
  title: string;
  columns: TableColumn[];
  data: Record<string, any>[];
  height?: number;
}

export default function ReportTable({ title, columns, data, height = 400 }: ReportTableProps) {
  const formatCellValue = (column: TableColumn, value: any, row: any) => {
    if (column.format) {
      return column.format(value, row);
    }

    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    return String(value);
  };

  return (
    <Paper sx={{ height: height }}>
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6">
          {title}
        </Typography>
      </Box>

      <TableContainer sx={{ maxHeight: height - 80 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align || 'left'}
                  sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No data available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow key={index} hover>
                  {columns.map((column) => (
                    <TableCell key={column.key} align={column.align || 'left'}>
                      {formatCellValue(column, row[column.key], row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

// Utility function to create status chips
export const createStatusChip = (status: string) => {
  const getColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      case 'excused':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Chip
      label={status}
      color={getColor(status) as any}
      size="small"
      variant="outlined"
    />
  );
};

// Utility function to format percentages
export const formatPercentage = (value: number, decimals: number = 1) => {
  return `${value.toFixed(decimals)}%`;
};

// Utility function to format dates
export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString();
};