'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  showAction?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon,
  onAction,
  showAction = true,
}: PageHeaderProps) {
  const { t } = useTranslation();

  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {showAction && actionLabel && onAction && (
        <Button
          variant="contained"
          startIcon={actionIcon}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}