'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  Grid,
  Tooltip,
  IconButton,
  LinearProgress,
  Divider,
  Stack,
  Alert
} from '@mui/material';
import AssignmentErrorBoundary from './AssignmentErrorBoundary';
import {
  Assignment as AssignmentIcon,
  DateRange,
  Schedule,
  Person,
  Class,
  Subject,
  CheckCircle,
  Warning,
  Error,
  Description,
  AttachFile,
  Grade,
  Visibility,
  Edit,
  Delete
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

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

interface AssignmentCardProps {
  assignment: Assignment;
  userRole: string;
  onView?: (assignment: Assignment) => void;
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignment: Assignment) => void;
  onSubmit?: (assignment: Assignment) => void;
  onGrade?: (assignment: Assignment) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  userRole,
  onView,
  onEdit,
  onDelete,
  onSubmit,
  onGrade
}) => {
  const { t } = useTranslation();
  
  const dueDate = new Date(assignment.dueDate);
  const now = new Date();
  const isOverdue = now > dueDate;
  const timeUntilDue = dueDate.getTime() - now.getTime();
  const daysUntilDue = Math.ceil(timeUntilDue / (1000 * 60 * 60 * 24));
  
  // Get submission status for students
  const submission = assignment.submissions?.[0];
  const hasSubmitted = !!submission;
  const isGraded = submission?.marksObtained !== null;
  
  // Get submission count for teachers/admins
  const submissionCount = assignment._count?.submissions || assignment.submissions?.length || 0;
  
  const getStatusColor = () => {
    if (userRole === 'STUDENT') {
      if (isGraded) return 'success';
      if (hasSubmitted) return 'info';
      if (isOverdue) return 'error';
      if (daysUntilDue <= 1) return 'warning';
      return 'default';
    } else {
      if (!assignment.isActive) return 'error';
      if (isOverdue) return 'warning';
      return 'primary';
    }
  };
  
  const getStatusText = () => {
    if (userRole === 'STUDENT') {
      if (isGraded) return t('assignments.graded');
      if (hasSubmitted) return t('assignments.submitted');
      if (isOverdue) return t('assignments.overdue');
      if (daysUntilDue <= 1) return t('assignments.dueSoon');
      return t('assignments.pending');
    } else {
      if (!assignment.isActive) return t('assignments.inactive');
      if (isOverdue) return t('assignments.overdue');
      return t('assignments.active');
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          boxShadow: 3
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <AssignmentIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="h6" component="h3" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {assignment.title}
              </Typography>
              <Chip 
                label={getStatusText()} 
                size="small" 
                color={getStatusColor() as any}
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>
          {onView && (
            <IconButton size="small" onClick={() => onView(assignment)}>
              <Visibility fontSize="small" />
            </IconButton>
          )}
        </Box>

        <Stack spacing={1} mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Subject fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {assignment.subject.nameAr || assignment.subject.name} ({assignment.subject.code})
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Person fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {assignment.teacher && assignment.teacher.user ? 
                `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}` : 
                'Unknown Teacher'}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Class fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {assignment.classRoom ? 
                <>
                  {assignment.classRoom.nameAr || assignment.classRoom.name}
                  {assignment.classRoom.section && ` - ${assignment.classRoom.section}`}
                </> : 
                'Unknown Class'}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <DateRange fontSize="small" color="action" />
            <Typography variant="body2" color={isOverdue ? 'error' : 'text.secondary'}>
              {t('assignments.dueDate')}: {dueDate.toLocaleDateString()}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Grade fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {t('assignments.totalMarks')}: {assignment.totalMarks}
            </Typography>
          </Box>
        </Stack>

        {assignment.description && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" sx={{ 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {assignment.description}
            </Typography>
          </Box>
        )}

        {userRole === 'STUDENT' && submission && isGraded && (
          <Alert severity="success" sx={{ mt: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">
                {t('assignments.grade')}: {submission.marksObtained}/{assignment.totalMarks}
              </Typography>
              <Typography variant="body2" color="success.main">
                {((submission.marksObtained / assignment.totalMarks) * 100).toFixed(1)}%
              </Typography>
            </Box>
          </Alert>
        )}

        {(userRole === 'TEACHER' || userRole === 'ADMIN') && (
          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <Typography variant="body2" color="text.secondary">
              {t('assignments.submissions')}: {submissionCount}
            </Typography>
          </Box>
        )}

        {assignment.attachments && assignment.attachments.length > 0 && (
          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <AttachFile fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {assignment.attachments.length} {t('assignments.attachments')}
            </Typography>
          </Box>
        )}
      </CardContent>

      <Divider />
      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
        <Box display="flex" gap={1}>
          {onView && (
            <Button size="small" startIcon={<Visibility />} onClick={() => onView(assignment)}>
              {t('common.view')}
            </Button>
          )}
          
          {userRole === 'STUDENT' && !hasSubmitted && !isOverdue && onSubmit && (
            <Button 
              size="small" 
              color="primary" 
              variant="contained"
              onClick={() => onSubmit(assignment)}
            >
              {t('assignments.submit')}
            </Button>
          )}
        </Box>

        {(userRole === 'TEACHER' || userRole === 'ADMIN') && (
          <Box display="flex" gap={1}>
            {onGrade && (
              <Tooltip title={t('assignments.gradeSubmissions')}>
                <IconButton size="small" onClick={() => onGrade(assignment)}>
                  <Grade fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onEdit && (
              <Tooltip title={t('common.edit')}>
                <IconButton size="small" onClick={() => onEdit(assignment)}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title={t('common.delete')}>
                <IconButton size="small" color="error" onClick={() => onDelete(assignment)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </CardActions>
    </Card>
  );
};

interface AssignmentListProps {
  assignments: Assignment[];
  userRole: string;
  loading?: boolean;
  onView?: (assignment: Assignment) => void;
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignment: Assignment) => void;
  onSubmit?: (assignment: Assignment) => void;
  onGrade?: (assignment: Assignment) => void;
}

export const AssignmentList: React.FC<AssignmentListProps> = ({
  assignments,
  userRole,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onSubmit,
  onGrade
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  if (assignments.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {t('assignments.noAssignments')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {userRole === 'STUDENT' 
            ? t('assignments.noAssignmentsStudent')
            : t('assignments.noAssignmentsTeacher')
          }
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {assignments.map((assignment) => (
        <Grid item xs={12} md={6} lg={4} key={assignment.id}>
          <AssignmentErrorBoundary>
            <AssignmentCard
              assignment={assignment}
              userRole={userRole}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onSubmit={onSubmit}
              onGrade={onGrade}
            />
          </AssignmentErrorBoundary>
        </Grid>
      ))}
    </Grid>
  );
};

export default AssignmentList;