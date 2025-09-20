'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Checkbox,
  Chip,
  Avatar,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  Block,
  CheckCircle,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface Action {
  key: string;
  label: string | ((row: any) => string);
  icon: React.ReactNode | ((row: any) => React.ReactNode);
  onClick: (row: any) => void;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | ((row: any) => 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning');
  show?: (row: any) => boolean;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  actions?: Action[];
  loading?: boolean;
  emptyMessage?: string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: string, checked: boolean) => void;
  getRowId?: (row: any) => string;
  avatarIcon?: React.ReactNode;
  avatarField?: string;
  subtitleField?: string;
}

export default function DataTable({
  columns,
  data,
  actions = [],
  loading = false,
  emptyMessage = 'No data found',
  selectable = false,
  selectedIds = [],
  onSelectAll,
  onSelectOne,
  getRowId = (row) => row.id,
  avatarIcon,
  avatarField,
  subtitleField,
}: DataTableProps) {
  const { t } = useTranslation();

  const handleSelectAll = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (onSelectOne) {
      onSelectOne(id, checked);
    }
  };

  const renderCell = (column: Column, row: any) => {
    // Handle nested fields like "user.firstName"
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    const value = column.key.includes('.') ? getNestedValue(row, column.key) : row[column.key];

    if (column.render) {
      return column.render(value, row);
    }

    // Special handling for status fields - disabled to allow custom render functions
    // if (column.key === 'status' || column.key === 'user.status') {
    //   return (
    //     <Chip
    //       label={value === 'ACTIVE' ? t('common.active') : t('common.inactive')}
    //       color={value === 'ACTIVE' ? 'success' : 'error'}
    //       size="small"
    //     />
    //   );
    // }

    // Special handling for dates - disabled to allow custom render functions
    // if (column.key.includes('Date') || column.key.includes('At')) {
    //   return value ? new Date(value).toLocaleDateString() : '';
    // }

    return value || '';
  };

  const renderAvatarCell = (row: any) => {
    if (!avatarField) return null;

    const nameValue = row[avatarField];
    const subtitleValue = subtitleField ? row[subtitleField] : '';

    // Handle nested fields like "user.firstName"
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    const name = avatarField.includes('.') ? getNestedValue(row, avatarField) : nameValue;
    const subtitle = subtitleField && subtitleField.includes('.') ? getNestedValue(row, subtitleField) : subtitleValue;

    return (
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar>
          {avatarIcon}
        </Avatar>
        <Box>
          <Typography variant="subtitle2">
            {name}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedIds.length > 0 && selectedIds.length < data.length}
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell key={column.key} align={column.align || 'left'}>
                  {column.label}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell align="center">{t('common.actions')}</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} 
                  align="center"
                  sx={{ 
                    py: 8,
                    textAlign: 'center',
                    minHeight: '200px' // Ensure minimum height for visibility
                  }}
                >
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
                    <CircularProgress size={40} />
                  </Box>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} align="center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={getRowId(row)} hover>
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(getRowId(row))}
                        onChange={(e) => handleSelectOne(getRowId(row), e.target.checked)}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key} align={column.align || 'left'}>
                      {column.key === avatarField ? renderAvatarCell(row) : renderCell(column, row)}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell align="center">
                      {actions.map((action) => {
                        if (action.show && !action.show(row)) return null;
                        
                        const label = typeof action.label === 'function' ? action.label(row) : action.label;
                        const icon = typeof action.icon === 'function' ? action.icon(row) : action.icon;
                        const color = typeof action.color === 'function' ? action.color(row) : action.color;
                        
                        return (
                          <Tooltip key={action.key} title={label}>
                            <IconButton
                              size="small"
                              onClick={() => action.onClick(row)}
                              color={color}
                            >
                              {icon}
                            </IconButton>
                          </Tooltip>
                        );
                      })}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}