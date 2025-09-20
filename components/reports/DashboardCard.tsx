'use client';

import React from 'react';
import { Box, Card, CardContent, CardHeader, Typography, IconButton, Divider, useTheme, Tooltip, LinearProgress } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, Cell, ResponsiveContainer } from 'recharts';

interface DashboardCardProps {
  title: string;
  subheader?: string;
  content?: React.ReactNode;
  chart?: 'bar' | 'pie' | 'line';
  chartData?: Array<{name: string; value: number}>;
  chartColors?: string[];
  footer?: React.ReactNode;
  showDownload?: boolean;
  onDownload?: () => void;
  loading?: boolean;
  height?: number;
}

export default function DashboardCard({
  title,
  subheader,
  content,
  chart,
  chartData = [],
  chartColors,
  footer,
  showDownload = false,
  onDownload,
  loading = false,
  height = 280
}: DashboardCardProps) {
  const theme = useTheme();

  const getDefaultColors = () => [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main
  ];

  const colors = chartColors || getDefaultColors();

  const renderChart = () => {
    if (!chart || chartData.length === 0) return null;

    switch (chart) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                fill={theme.palette.primary.main}
                dataKey="value"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Card sx={{ height, display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={<Typography variant="h6">{title}</Typography>}
        subheader={subheader && <Typography variant="caption" color="text.secondary">{subheader}</Typography>}
        action={
          <Box sx={{ display: 'flex' }}>
            {showDownload && (
              <Tooltip title="Download data">
                <IconButton size="small" onClick={onDownload}>
                  <FileDownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="More options">
              <IconButton size="small">
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      
      <CardContent sx={{ flex: 1, pt: 0, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box sx={{ width: '100%', py: 6 }}>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
              Loading data...
            </Typography>
            <LinearProgress />
          </Box>
        ) : (
          <>
            {content && <Box sx={{ mb: chart ? 2 : 0 }}>{content}</Box>}
            {chart && renderChart()}
          </>
        )}
      </CardContent>
      
      {footer && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            {footer}
          </Box>
        </>
      )}
    </Card>
  );
}