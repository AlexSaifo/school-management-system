'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Box,
  IconButton,
  Divider,
  Grid
} from '@mui/material';
import {
  Close,
  Save,
  Grade,
  AttachFile
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import FileUpload from './FileUpload';

import { AttachmentFile } from '@/types/attachments';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate: string;
  totalMarks: number;
  subject: {
    name: string;
    nameAr: string;
  };
}

interface Student {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
  classRoom: {
    name: string;
    nameAr: string;
  };
}

interface Submission {
  id: string;
  content?: string;
  attachments?: AttachmentFile[];
  submittedAt: string;
  marksObtained?: number;
  feedback?: string;
  assignment: Assignment;
  student: Student;
}

interface GradingFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (gradingData: any) => Promise<void>;
  submission: Submission;
  loading?: boolean;
}

export const GradingForm: React.FC<GradingFormProps> = ({
  open,
  onClose,
  onSubmit,
  submission,
  loading = false
}) => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    marksObtained: submission.marksObtained?.toString() || '',
    feedback: submission.feedback || ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [grading, setGrading] = useState(false);

  // Check if submission is already graded
  const isAlreadyGraded = submission.marksObtained !== null && submission.marksObtained !== undefined;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.marksObtained.trim()) {
      newErrors.marksObtained = t('assignments.grading.marksRequired');
    } else {
      const marks = parseFloat(formData.marksObtained);
      if (isNaN(marks) || marks < 0 || marks > submission.assignment.totalMarks) {
        newErrors.marksObtained = `${t('assignments.grading.marksRange')} 0-${submission.assignment.totalMarks}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setGrading(true);
    try {
      await onSubmit({
        marksObtained: parseFloat(formData.marksObtained),
        feedback: formData.feedback.trim() || null
      });
      
      handleClose();
    } catch (error) {
      console.error('Error grading submission:', error);
      setErrors({ general: t('common.error') });
    } finally {
      setGrading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      marksObtained: submission.marksObtained?.toString() || '',
      feedback: submission.feedback || ''
    });
    setErrors({});
    onClose();
  };

  const isLateSubmission = new Date(submission.submittedAt) > new Date(submission.assignment.dueDate);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 2
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Grade color="primary" />
          <Box>
            <Typography variant="h6">
              {t('assignments.grading.gradeSubmission')}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {submission.assignment.title}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Already Graded Warning */}
        {isAlreadyGraded && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('assignments.grading.alreadyGraded')} 
            {t('assignments.grading.viewOnlyMode')}
          </Alert>
        )}

        {/* Assignment & Student Details */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom color="primary">
              {t('assignments.assignmentDetails')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>{t('assignments.subject')}:</strong> {submission.assignment.subject.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>{t('assignments.dueDate')}:</strong> {new Date(submission.assignment.dueDate).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>{t('assignments.totalMarks')}:</strong> {submission.assignment.totalMarks}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom color="primary">
              {t('assignments.studentDetails')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>{t('assignments.student')}:</strong> {submission.student.user.firstName} {submission.student.user.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>{t('assignments.class')}:</strong> {submission.student.classRoom.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>{t('assignments.submittedAt')}:</strong> {new Date(submission.submittedAt).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>

        {/* Late submission warning */}
        {isLateSubmission && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('assignments.grading.lateSubmission')}
          </Alert>
        )}

        {/* Error Alert */}
        {errors.general && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.general}
          </Alert>
        )}

        {/* Assignment Description */}
        {submission.assignment.description && (
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              {t('assignments.description')}:
            </Typography>
            <Typography variant="body2" sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
              {submission.assignment.description}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Student Submission */}
        <Typography variant="subtitle1" gutterBottom color="primary">
          {t('assignments.submission.studentSubmission')}
        </Typography>

        {/* Submission Text */}
        {submission.content && (
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              {t('assignments.submission.submissionText')}:
            </Typography>
            <Box sx={{ 
              bgcolor: 'background.default', 
              p: 2, 
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
              minHeight: 100,
              whiteSpace: 'pre-wrap'
            }}>
              <Typography variant="body2">
                {submission.content}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Submission Attachments */}
        {submission.attachments && submission.attachments.length > 0 && (
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              {t('assignments.submission.submissionFiles')}:
            </Typography>
            <FileUpload
              attachments={submission.attachments}
              onAttachmentsChange={() => {}} // Read-only
              disabled={true}
              label=""
            />
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Grading Form */}
        <Typography variant="subtitle1" gutterBottom color="primary">
          {t('assignments.grading.grading')}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label={t('assignments.grading.marksObtained')}
              value={formData.marksObtained}
              onChange={(e) => setFormData(prev => ({ ...prev, marksObtained: e.target.value }))}
              error={!!errors.marksObtained}
              helperText={errors.marksObtained || `${t('assignments.grading.outOf')} ${submission.assignment.totalMarks}`}
              inputProps={{
                min: 0,
                max: submission.assignment.totalMarks,
                step: 0.1
              }}
              disabled={loading || grading || isAlreadyGraded}
              InputProps={{
                readOnly: isAlreadyGraded
              }}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label={t('assignments.grading.feedback')}
              value={formData.feedback}
              onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
              placeholder={t('assignments.grading.feedbackPlaceholder')}
              disabled={loading || grading || isAlreadyGraded}
              helperText={isAlreadyGraded ? t('assignments.grading.readOnlyFeedback') : t('assignments.grading.feedbackHelper')}
              InputProps={{
                readOnly: isAlreadyGraded
              }}
            />
          </Grid>
        </Grid>

        {/* Current Grade Display */}
        {submission.marksObtained !== null && submission.marksObtained !== undefined && (
          <Box mt={3} p={2} bgcolor="primary.main" color="primary.contrastText" borderRadius={1}>
            <Typography variant="h6">
              {t('assignments.grading.currentGrade')}: {submission.marksObtained}/{submission.assignment.totalMarks} 
              ({((submission.marksObtained / submission.assignment.totalMarks) * 100).toFixed(1)}%)
            </Typography>
            {submission.feedback && (
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                <strong>{t('assignments.grading.currentFeedback')}:</strong> {submission.feedback}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} color="inherit">
          {t('common.close')}
        </Button>
        {!isAlreadyGraded && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={grading ? <CircularProgress size={16} /> : <Save />}
            disabled={loading || grading}
          >
            {t('assignments.grading.saveGrade')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GradingForm;