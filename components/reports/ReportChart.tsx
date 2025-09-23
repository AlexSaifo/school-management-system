'use client';

import React from 'react';
import { Box, Typography, Paper, useTheme, IconButton } from '@mui/material';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Cell, Area, AreaChart
} from 'recharts';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface ReportChartProps {
  title: string;
  data: ChartData[];
  type: 'bar' | 'pie' | 'line' | 'area';
  height?: number;
  subTitle?: string;
  showDownload?: boolean;
  onDownload?: () => void;
  showLegend?: boolean;
  trendDirection?: 'up' | 'down' | 'neutral';
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export default function ReportChart({ 
  title, 
  data, 
  type, 
  height = 300, 
  subTitle,
  showDownload = false,
  onDownload,
  showLegend = true,
  trendDirection,
  xAxisLabel,
  yAxisLabel
}: ReportChartProps) {
  const theme = useTheme();
  
  const getColorScheme = () => {
    return [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
      '#8884d8',
      '#82ca9d',
      '#ffc658',
      '#d0ed57'
    ];
  };

  const formatData = () => {
    return data.map(item => ({
      name: item.label,
      value: item.value,
      color: item.color
    }));
  };

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height - 60}>
      <BarChart
        data={formatData()}
        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value: number) => [value, 'Value']}
          labelFormatter={(label) => `${label}`}
        />
        {showLegend && <Legend verticalAlign="top" height={36} />}
        <Bar 
          dataKey="value" 
          name="Value" 
          radius={[5, 5, 0, 0]}
        >
          {formatData().map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || getColorScheme()[index % getColorScheme().length]} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height - 60}>
      <PieChart>
        <Pie
          data={formatData()}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          innerRadius={30}
          dataKey="value"
          label={({name, value, percent}) => `${name}: ${(percent as number * 100).toFixed(1)}%`}
        >
          {formatData().map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || getColorScheme()[index % getColorScheme().length]} 
            />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [value, 'Value']} />
        {showLegend && <Legend verticalAlign="bottom" height={36} />}
      </PieChart>
    </ResponsiveContainer>
  );
  
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height - 60}>
      <LineChart
        data={formatData()}
        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        {showLegend && <Legend verticalAlign="top" height={36} />}
        <Line 
          type="monotone" 
          dataKey="value" 
          name="Value"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
  
  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={height - 60}>
      <AreaChart
        data={formatData()}
        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        {showLegend && <Legend verticalAlign="top" height={36} />}
        <Area 
          type="monotone" 
          dataKey="value" 
          name="Value"
          stroke={theme.palette.primary.main}
          fill={theme.palette.primary.light}
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
  
  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <TrendingUpIcon sx={{ color: theme.palette.success.main }} />;
      case 'down':
        return <TrendingDownIcon sx={{ color: theme.palette.error.main }} />;
      case 'neutral':
        return <TrendingFlatIcon sx={{ color: theme.palette.info.main }} />;
      default:
        return null;
    }
  };
  
  return (
    <Paper sx={{ p: 2, height }}>
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {title}
            {trendDirection && getTrendIcon()}
          </Typography>
          {subTitle && (
            <Typography variant="body2" color="text.secondary">
              {subTitle}
            </Typography>
          )}
        </Box>
        {showDownload && (
          <IconButton onClick={onDownload} size="small" title="Download data">
            <FileDownloadIcon />
          </IconButton>
        )}
      </Box>

      {type === 'bar' && renderBarChart()}
      {type === 'pie' && renderPieChart()}
      {type === 'line' && renderLineChart()}
      {type === 'area' && renderAreaChart()}
    </Paper>
  );
}