'use client';

import React from 'react';
import { 
  Box, 
  Button, 
  Paper, 
  Typography, 
  Menu, 
  MenuItem, 
  IconButton, 
  Tooltip,
  Divider
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon from '@mui/icons-material/Close';
import { downloadCSV } from '@/lib/export-utils';

interface ExportOption {
  label: string;
  format: 'csv' | 'excel' | 'pdf';
  handler?: () => void;
}

interface ReportHeaderProps {
  title: string;
  description?: string;
  onFilterToggle?: () => void;
  showFilters?: boolean;
  onClearFilters?: () => void;
  filterCount?: number;
  exportData?: {
    data: Record<string, any>[];
    columns: { key: string; label: string }[];
    filename: string;
  };
  exportOptions?: ExportOption[];
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function ReportHeader({
  title,
  description,
  onFilterToggle,
  showFilters = false,
  onClearFilters,
  filterCount = 0,
  exportData,
  exportOptions = [],
  children,
  actions
}: ReportHeaderProps) {
  const [exportMenu, setExportMenu] = React.useState<null | HTMLElement>(null);

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenu(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenu(null);
  };

  const handleExportFormat = (format: string) => {
    if (!exportData) return;
    
    if (format === 'csv') {
      downloadCSV(exportData.data, exportData.columns, exportData.filename);
    }
    
    // Find and execute custom handler if provided
    const option = exportOptions.find(opt => opt.format === format);
    if (option?.handler) {
      option.handler();
    }
    
    handleExportClose();
  };

  const defaultExportOptions: ExportOption[] = [
    { label: 'CSV', format: 'csv' },
    { label: 'Excel', format: 'excel' },
    { label: 'PDF', format: 'pdf' }
  ];

  const allExportOptions = exportOptions.length > 0 
    ? exportOptions 
    : defaultExportOptions;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {actions}

          {onFilterToggle && (
            <Tooltip title={showFilters ? "Hide filters" : "Show filters"}>
              <Button
                startIcon={<FilterListIcon />}
                onClick={onFilterToggle}
                color={filterCount > 0 ? "primary" : "inherit"}
                variant={filterCount > 0 ? "contained" : "outlined"}
              >
                Filters {filterCount > 0 && `(${filterCount})`}
              </Button>
            </Tooltip>
          )}

          {exportData && (
            <>
              <Button
                startIcon={<FileDownloadIcon />}
                onClick={handleExportClick}
                variant="outlined"
              >
                Export
              </Button>
              <Menu
                anchorEl={exportMenu}
                open={Boolean(exportMenu)}
                onClose={handleExportClose}
              >
                {allExportOptions.map((option) => (
                  <MenuItem 
                    key={option.format} 
                    onClick={() => handleExportFormat(option.format)}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Box>
      </Box>

      {showFilters && (
        <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1">Filters</Typography>
            {onClearFilters && filterCount > 0 && (
              <Button 
                startIcon={<CloseIcon />} 
                size="small" 
                onClick={onClearFilters}
              >
                Clear all filters
              </Button>
            )}
          </Box>
          {children}
        </Box>
      )}
    </Paper>
  );
}