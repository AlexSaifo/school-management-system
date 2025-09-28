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
  Divider
} from '@mui/material';
import {
  Close,
  Send,
  Assignment,
  AttachFile
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import FileUpload from './FileUpload';

import { AttachmentFile } from '@/types/attachments';
import { useSnackbar } from '@/contexts/SnackbarContext';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate: string;
  totalMarks: number;
  attachments?: AttachmentFile[];
  subject: {
    name: string;
    nameAr: string;
  };
  teacher: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface Submission {
  id: string;
  content?: string;
  attachments?: AttachmentFile[];
  submittedAt: string;
  marksObtained?: number;
  feedback?: string;
}

interface SubmissionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (submissionData: any) => Promise<void>;
  assignment: Assignment;
  existingSubmission?: Submission | null;
  loading?: boolean;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({
  open,
  onClose,
  onSubmit,
  assignment,
  existingSubmission,
  loading = false
}) => {
  const { t } = useTranslation();
  const { showSnackbar } = useSnackbar();
  
  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return `0 ${t('common.fileSize.B')}`;
    const k = 1024;
    const sizes = [t('common.fileSize.B'), t('common.fileSize.KB'), t('common.fileSize.MB'), t('common.fileSize.GB')];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };
  
  const [formData, setFormData] = useState({
    submissionText: existingSubmission?.content || '',
    attachments: (existingSubmission?.attachments as AttachmentFile[]) || [] as AttachmentFile[]
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setFormData({
      submissionText: existingSubmission?.content || '',
      attachments: (existingSubmission?.attachments as AttachmentFile[]) || []
    });
    setErrors({});
    onClose();
  };

  const isOverdue = new Date() > new Date(assignment.dueDate);
  const isGraded = existingSubmission?.marksObtained !== undefined && existingSubmission?.marksObtained !== null;

  // If student has already submitted, show read-only view (regardless of grading status)
  if (existingSubmission) {
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
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment color="primary" />
            <Typography variant="h6">
              {t('assignments.submission.viewSubmission')} - {assignment.title}
            </Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            {t('assignments.submission.alreadySubmitted')}
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('assignments.details.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {assignment.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('assignments.details.subject')}: {assignment.subject.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('assignments.details.teacher')}: {assignment.teacher.user.firstName} {assignment.teacher.user.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('assignments.details.dueDate')}: {new Date(assignment.dueDate).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('assignments.details.totalMarks')}: {assignment.totalMarks}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('assignments.submission.yourSubmission')}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>{t('assignments.submission.submittedAt')}:</strong> {new Date(existingSubmission.submittedAt).toLocaleString()}
              </Typography>
              {existingSubmission.marksObtained !== null && existingSubmission.marksObtained !== undefined && (
                <Typography variant="body2" color="text.secondary">
                  <strong>{t('assignments.submission.marksObtained')}:</strong> {existingSubmission.marksObtained}/{assignment.totalMarks}
                </Typography>
              )}
              {existingSubmission.feedback && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t('assignments.submission.feedback')}:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    {existingSubmission.feedback}
                  </Typography>
                </Box>
              )}
            </Box>

            {existingSubmission.content && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('assignments.submission.submissionText')}:
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'grey.200'
                }}>
                  <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                    {existingSubmission.content}
                  </Typography>
                </Box>
              </Box>
            )}

            {existingSubmission.attachments && existingSubmission.attachments.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('assignments.submission.attachments')}:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {existingSubmission.attachments.map((file, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        border: 1,
                        borderColor: 'grey.200',
                        borderRadius: 1,
                        bgcolor: 'grey.50'
                      }}
                    >
                      <AttachFile color="action" />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">
                          {file.originalName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(file.size)}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('common.download')}
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} color="inherit">
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.submissionText.trim() && formData.attachments.length === 0) {
      newErrors.general = t('assignments.submission.textOrAttachmentRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        assignmentId: assignment.id,
        submissionText: formData.submissionText.trim() || null,
        attachments: formData.attachments
      });
      
      // Show success message and close modal after a short delay
      showSnackbar(t('assignments.submission.submittedSuccessfully'), 'success');
      setTimeout(() => {
        handleClose();
      }, 500);
      
    } catch (error: any) {
      console.error('Submission error:', error);
      // Show error message
      showSnackbar(error.message || t('assignments.submission.submitError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachmentsChange = (attachments: AttachmentFile[]) => {
    setFormData(prev => ({
      ...prev,
      attachments
    }));
  };

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
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Send color="primary" />
          <Typography variant="h6">
            {t('assignments.submission.submitAssignment')} - {assignment.title}
          </Typography>
        </Box>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {isOverdue && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {t('assignments.submission.overdue')}
          </Alert>
        )}

        {errors.general && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.general}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('assignments.details.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {assignment.title}
          </Typography>
          {assignment.description && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {assignment.description}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            {t('assignments.details.subject')}: {assignment.subject.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('assignments.details.teacher')}: {assignment.teacher.user.firstName} {assignment.teacher.user.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('assignments.details.dueDate')}: {new Date(assignment.dueDate).toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('assignments.details.totalMarks')}: {assignment.totalMarks}
          </Typography>
        </Box>

        {assignment.instructions && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('assignments.details.instructions')}
            </Typography>
            <Typography variant="body2" color="text.secondary" style={{ whiteSpace: 'pre-wrap' }}>
              {assignment.instructions}
            </Typography>
          </Box>
        )}

        {assignment.attachments && assignment.attachments.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('assignments.details.attachments')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {assignment.attachments.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    border: 1,
                    borderColor: 'grey.200',
                    borderRadius: 1,
                    bgcolor: 'grey.50'
                  }}
                >
                  <AttachFile color="action" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">
                      {file.originalName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('common.download')}
                  </Button>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('assignments.submission.yourSubmission')}
          </Typography>
          
          <TextField
            label={t('assignments.submission.submissionText')}
            multiline
            rows={6}
            fullWidth
            value={formData.submissionText}
            onChange={(e) => setFormData(prev => ({ ...prev, submissionText: e.target.value }))}
            sx={{ mb: 3 }}
            placeholder={t('assignments.submission.enterText')}
          />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('assignments.submission.attachments')} ({t('common.optional')})
            </Typography>
            <FileUpload
              attachments={formData.attachments}
              onAttachmentsChange={handleAttachmentsChange}
              maxFiles={5}
              maxFileSize={10} // 10MB
              acceptedTypes={['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png']}
              label={t('assignments.fileUpload.uploadFiles')}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || loading}
          startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
        >
          {submitting ? t('common.submitting') : t('assignments.submission.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubmissionForm;