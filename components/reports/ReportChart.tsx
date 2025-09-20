'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface ReportChartProps {
  title: string;
  data: ChartData[];
  type: 'bar' | 'pie' | 'line';
  height?: number;
}

export default function ReportChart({ title, data, type, height = 300 }: ReportChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  const getBarColor = (index: number) => {
    const colors = ['#1976d2', '#dc004e', '#388e3c', '#f57c00', '#7b1fa2', '#0097a7', '#c21807'];
    return colors[index % colors.length];
  };

  const renderBarChart = () => (
    <Box sx={{ display: 'flex', alignItems: 'end', gap: 2, height: height - 60 }}>
      {data.map((item, index) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              gap: 1
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center' }}>
              {item.value}
            </Typography>
            <Box
              sx={{
                width: '100%',
                maxWidth: '40px',
                height: `${percentage}%`,
                backgroundColor: item.color || getBarColor(index),
                borderRadius: '4px 4px 0 0',
                minHeight: '4px',
                transition: 'all 0.3s ease'
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.6rem',
                textAlign: 'center',
                transform: 'rotate(-45deg)',
                transformOrigin: 'center',
                whiteSpace: 'nowrap',
                maxWidth: '60px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {item.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height - 60 }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;

            // Convert angles to radians
            const startAngleRad = (startAngle * Math.PI) / 180;
            const endAngleRad = (endAngle * Math.PI) / 180;

            // Calculate path
            const x1 = 100 + 80 * Math.cos(startAngleRad);
            const y1 = 100 + 80 * Math.sin(startAngleRad);
            const x2 = 100 + 80 * Math.cos(endAngleRad);
            const y2 = 100 + 80 * Math.sin(endAngleRad);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const pathData = [
              `M 100 100`,
              `L ${x1} ${y1}`,
              `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');

            currentAngle = endAngle;

            return (
              <path
                key={index}
                d={pathData}
                fill={item.color || getBarColor(index)}
                stroke="#fff"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        <Box sx={{ ml: 3 }}>
          {data.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: item.color || getBarColor(index),
                  mr: 1,
                  borderRadius: '2px'
                }}
              />
              <Typography variant="body2">
                {item.label}: {item.value} ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 2, height: height }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {type === 'bar' && renderBarChart()}
      {type === 'pie' && renderPieChart()}
      {type === 'line' && renderBarChart()} {/* Placeholder for line chart */}
    </Paper>
  );
}