'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Paper, Divider, Skeleton, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default';
  loading?: boolean;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  trendValue,
  color = 'primary',
  loading = false
}: StatCardProps) {
  const theme = useTheme();
  
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return theme.palette.success.main;
      case 'down': return theme.palette.error.main;
      case 'neutral': return theme.palette.info.main;
      default: return theme.palette.text.secondary;
    }
  };
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUpIcon fontSize="small" sx={{ color: getTrendColor() }} />;
      case 'down': return <TrendingDownIcon fontSize="small" sx={{ color: getTrendColor() }} />;
      case 'neutral': return <TrendingFlatIcon fontSize="small" sx={{ color: getTrendColor() }} />;
      default: return null;
    }
  };
  
  const getColorByName = () => {
    return theme.palette[color].main;
  };
  
  if (loading) {
    return (
      <Card elevation={1} sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="80%" height={40} sx={{ my: 1 }} />
          <Skeleton variant="text" width="40%" height={20} />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card elevation={1} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          {icon && (
            <Box sx={{ color: getColorByName() }}>
              {icon}
            </Box>
          )}
        </Box>
        
        <Typography variant="h4" component="div" sx={{ mt: 1, color: getColorByName() }}>
          {value}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          {trend && getTrendIcon()}
          {trendValue && (
            <Typography variant="caption" sx={{ ml: 0.5, color: getTrendColor() }}>
              {trendValue}
            </Typography>
          )}
          {description && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ ml: trend || trendValue ? 1 : 0 }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

interface StatisticsSummaryProps {
  stats: StatCardProps[];
  title?: string;
  loading?: boolean;
  cols?: 1 | 2 | 3 | 4;
}

export default function StatisticsSummary({ 
  stats, 
  title,
  loading = false,
  cols = 4
}: StatisticsSummaryProps) {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      {title && (
        <>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </>
      )}
      
      <Grid container spacing={3}>
        {loading ? (
          Array.from({ length: cols }).map((_, index) => (
            <Grid item xs={12} sm={6} md={12/cols} key={index}>
              <StatCard
                title=""
                value=""
                loading={true}
              />
            </Grid>
          ))
        ) : (
          stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={12/cols} key={index}>
              <StatCard {...stat} />
            </Grid>
          ))
        )}
      </Grid>
    </Paper>
  );
}