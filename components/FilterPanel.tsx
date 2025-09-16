'use client';

import React from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  InputAdornment,
  Paper,
} from '@mui/material';
import {
  Search,
  GetApp,
  FilterList,
  CheckCircle,
  Block,
  Delete,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export interface FilterOption {
  value: string;
  label: string;
}

export interface Filter {
  key: string;
  label: string;
  type: 'text' | 'select';
  options?: FilterOption[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export interface BulkAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit';
}

interface FilterPanelProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Filter[];
  onSearch?: () => void;
  onExport?: () => void;
  exportLabel?: string;
  bulkActions?: BulkAction[];
  selectedCount?: number;
  onClearFilters?: () => void;
}

export default function FilterPanel({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  onSearch,
  onExport,
  exportLabel = 'Export',
  bulkActions = [],
  selectedCount = 0,
  onClearFilters,
}: FilterPanelProps) {
  const { t } = useTranslation();

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
        <TextField
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        {filters.map((filter) => (
          <TextField
            key={filter.key}
            select={filter.type === 'select'}
            label={filter.label}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
            placeholder={filter.placeholder}
          >
            {filter.type === 'select' && filter.options?.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        ))}

        {onSearch && (
          <Button
            variant="outlined"
            startIcon={<Search />}
            onClick={onSearch}
          >
            {t('common.search')}
          </Button>
        )}

        {onExport && (
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={onExport}
          >
            {exportLabel}
          </Button>
        )}

        {onClearFilters && (
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={onClearFilters}
          >
            {t('common.clear')}
          </Button>
        )}

        {selectedCount > 0 && bulkActions.map((action) => (
          <Button
            key={action.key}
            variant="outlined"
            color={action.color || 'primary'}
            startIcon={action.icon}
            onClick={action.onClick}
          >
            {action.label} ({selectedCount})
          </Button>
        ))}
      </Box>
    </Paper>
  );
}