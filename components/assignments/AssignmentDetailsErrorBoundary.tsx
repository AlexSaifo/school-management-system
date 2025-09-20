'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class AssignmentDetailsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AssignmentDetails component error:', error, errorInfo);
    this.setState({
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            m: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 2
          }}
        >
          <ErrorOutline color="error" sx={{ fontSize: 48 }} />
          <Typography variant="h6" color="error">
            Something went wrong loading assignment details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {this.state.error?.message || 'Unknown error'}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default AssignmentDetailsErrorBoundary;