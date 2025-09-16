'use client';

import React from 'react';
import {
  Box,
  Typography,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface PaginationControlsProps {
  current: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export default function PaginationControls({
  current,
  total,
  limit,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50, 100],
}: PaginationControlsProps) {
  const { t } = useTranslation();

  const totalPages = Math.ceil(total / limit);
  const startItem = (current - 1) * limit + 1;
  const endItem = Math.min(current * limit, total);

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            {t('pagination.showing', 'Showing')} {startItem} {t('pagination.to', 'to')} {endItem} {t('pagination.of', 'of')} {total} {t('pagination.items', 'items')}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <InputLabel>{t('pagination.perPage', 'Per page')}</InputLabel>
            <Select
              value={limit}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              label={t('pagination.perPage', 'Per page')}
            >
              {pageSizeOptions.map((size) => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Pagination
          count={totalPages}
          page={current}
          onChange={(_, page) => onPageChange(page)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
          siblingCount={2}
          boundaryCount={1}
        />
      </Box>
    </Paper>
  );
}