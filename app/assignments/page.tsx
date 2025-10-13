'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/layout/SidebarLayout';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Fab,
  TextField,
  MenuItem,
  InputAdornment,
  Chip,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import AssignmentList from '@/components/assignments/AssignmentList';
import AssignmentForm from '@/components/assignments/AssignmentForm';
import AssignmentDetails from '@/components/assignments/AssignmentDetails';
import AssignmentDetailsErrorBoundary from '@/components/assignments/AssignmentDetailsErrorBoundary';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  totalMarks: number;
  instructions?: string;
  attachments?: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subject: {
    name: string;
    nameAr: string;
    code: string;
  };
  teacher: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  classRoom: {
    name: string;
    nameAr: string;
    section?: string;
  };
  submissions?: any[];
  _count?: {
    submissions: number;
  };
}

export default function AssignmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  // State management
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Load assignments
  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch('/api/assignments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }

      const data = await response.json();
      setAssignments(data.assignments);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setError(t('assignments.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  // Load assignments on component mount
  useEffect(() => {
    if (user && ['STUDENT', 'TEACHER', 'ADMIN'].includes(user.role)) {
      loadAssignments();
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    // Skip if user is not available
    if (!user) return false;
    
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.subject.nameAr.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;

    const now = new Date();
    const dueDate = new Date(assignment.dueDate);

    switch (filterStatus) {
      case 'active':
        return matchesSearch && assignment.isActive && now <= dueDate;
      case 'overdue':
        return matchesSearch && now > dueDate;
      case 'completed':
        if (user.role === 'STUDENT') {
          const submission = assignment.submissions?.[0];
          return matchesSearch && submission?.marksObtained !== null;
        }
        return matchesSearch && assignment.isActive === false;
      case 'pending':
        if (user.role === 'STUDENT') {
          const submission = assignment.submissions?.[0];
          return matchesSearch && !submission && now <= dueDate;
        }
        return matchesSearch && assignment.isActive;
      default:
        return matchesSearch;
    }
  });

  // Handle assignment creation/editing
  const handleSubmitAssignment = async (assignmentData: any) => {
    try {
      setFormLoading(true);
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const url = editingAssignment 
        ? `/api/assignments/${editingAssignment.id}`
        : '/api/assignments';
      
      const method = editingAssignment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assignmentData)
      });

      if (!response.ok) {
        throw new Error('Failed to save assignment');
      }

      await loadAssignments();
      setShowForm(false);
      setEditingAssignment(null);
    } catch (error) {
      console.error('Error saving assignment:', error);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle assignment submission (for students)
  const handleSubmitWork = async (assignment: Assignment, submissionData: any) => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];

    const response = await fetch(`/api/assignments/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(submissionData),
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit assignment');
    }

    // Check if the response contains an error even with 200 status
    if (data.error) {
      throw new Error(data.error);
    }

    await loadAssignments();
    
    // Refresh the selected assignment details if it's the same assignment
    if (selectedAssignment && selectedAssignment.id === assignment.id) {
      try {
        const detailsResponse = await fetch(`/api/assignments/${assignment.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          setSelectedAssignment(detailsData.assignment);
        }
      } catch (error) {
        console.error('Error refreshing assignment details:', error);
      }
    }
  };

  // Handle grading (for teachers/admins)
  const handleGradeSubmission = async (submissionId: string, gradeData: any) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch(`/api/assignments/submissions/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gradeData),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to grade submission');
      }

      await loadAssignments();
      
      // Refresh assignment details
      if (selectedAssignment) {
        const updatedAssignment = assignments.find(a => a.id === selectedAssignment.id);
        if (updatedAssignment) {
          setSelectedAssignment(updatedAssignment);
        }
      }
    } catch (error) {
      console.error('Error grading submission:', error);
    }
  };

  // Handle assignment deletion
  const handleDeleteAssignment = async (assignment: Assignment) => {
    if (!window.confirm(t('assignments.confirmDelete'))) return;

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch(`/api/assignments/${assignment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }

      await loadAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  const getStatusFilterOptions = () => {
    const commonOptions = [
      { value: 'all', label: t('assignments.filter.all') },
      { value: 'active', label: t('assignments.filter.active') },
      { value: 'overdue', label: t('assignments.filter.overdue') }
    ];

    if (user?.role === 'STUDENT') {
      return [
        ...commonOptions,
        { value: 'pending', label: t('assignments.filter.pending') },
        { value: 'completed', label: t('assignments.filter.graded') }
      ];
    }

    return [
      ...commonOptions,
      { value: 'pending', label: t('assignments.filter.pending') }
    ];
  };

  const getPageTitle = () => {
    switch (user?.role) {
      case 'STUDENT':
        return t('assignments.myAssignments');
      case 'TEACHER':
        return t('assignments.teacherAssignments');
      case 'ADMIN':
        return t('assignments.allAssignments');
      default:
        return t('navigation.assignments');
    }
  };

  const getPageDescription = () => {
    switch (user?.role) {
      case 'STUDENT':
        return t('assignments.studentDescription');
      case 'TEACHER':
        return t('assignments.teacherDescription');
      case 'ADMIN':
        return t('assignments.adminDescription');
      default:
        return '';
    }
  };

  // Auth checks - now moved to the render section
  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(user.role)) {
    return (
      <SidebarLayout>
        <Alert severity="warning">
          {t('assignments.noPermission')}
        </Alert>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <Box sx={{ p: 3 }}>
        {/* Page Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {getPageTitle()}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {getPageDescription()}
            </Typography>
          </Box>

          {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingAssignment(null);
                setShowForm(true);
              }}
              size="large"
            >
              {t('assignments.createNew')}
            </Button>
          )}
        </Box>

        {/* Filters and Search */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder={t('assignments.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label={t('assignments.filterByStatus')}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                {getStatusFilterOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <FilterIcon />
                <Typography variant="body2" color="text.secondary">
                  {filteredAssignments.length} {t('assignments.results')}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Assignments List */}
        <AssignmentList
          assignments={filteredAssignments}
          userRole={user.role}
          loading={loading}
          onView={(assignment) => {
            setSelectedAssignment(assignment);
            setShowDetails(true);
          }}
          onEdit={user.role !== 'STUDENT' ? (assignment) => {
            setEditingAssignment(assignment);
            setShowForm(true);
          } : undefined}
          onDelete={user.role !== 'STUDENT' ? handleDeleteAssignment : undefined}
          onSubmit={user.role === 'STUDENT' ? (assignment) => {
            setSelectedAssignment(assignment);
            setShowDetails(true);
          } : undefined}
          onGrade={user.role !== 'STUDENT' ? (assignment) => {
            setSelectedAssignment(assignment);
            setShowDetails(true);
          } : undefined}
        />

        {/* Assignment Form Dialog */}
        <AssignmentForm
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingAssignment(null);
          }}
          onSubmit={handleSubmitAssignment}
          assignment={editingAssignment}
          loading={formLoading}
        />

        {/* Assignment Details Dialog */}
        <AssignmentDetailsErrorBoundary>
          <AssignmentDetails
            open={showDetails}
            onClose={() => {
              setShowDetails(false);
              setSelectedAssignment(null);
            }}
            assignment={selectedAssignment}
            userRole={user.role}
            onSubmit={user.role === 'STUDENT' ? 
              (submissionData: any) => {
                if (selectedAssignment) {
                  return handleSubmitWork(selectedAssignment, submissionData);
                }
                return Promise.resolve();
              }
              : undefined
            }
            onGrade={user.role !== 'STUDENT' ? handleGradeSubmission : undefined}
          />
        </AssignmentDetailsErrorBoundary>

        {/* Floating Action Button for Mobile */}
        {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
          <Fab
            color="primary"
            aria-label="add"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              display: { xs: 'flex', md: 'none' }
            }}
            onClick={() => {
              setEditingAssignment(null);
              setShowForm(true);
            }}
          >
            <AddIcon />
          </Fab>
        )}
      </Box>
    </SidebarLayout>
  );
}
