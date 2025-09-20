'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Alert,
  LinearProgress,
  Tab,
  Tabs,
  TextField,
  Rating,
  CircularProgress
} from '@mui/material';
import {
  Close,
  Assignment as AssignmentIcon,
  DateRange,
  Person,
  Class,
  Subject,
  Grade,
  Description,
  ListAlt,
  AttachFile,
  CheckCircle,
  Warning,
  Error,
  Upload,
  Download,
  Visibility
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import SubmissionForm from './SubmissionForm';
import GradingForm from './GradingForm';
import FileUpload from './FileUpload';

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
  submissions?: {
    id: string;
    content?: string;
    attachments?: any[];
    submittedAt: string;
    marksObtained?: number;
    feedback?: string;
    student: {
      id: string;
      user: {
        firstName: string;
        lastName: string;
      };
    };
  }[];
}

interface AssignmentDetailsProps {
  open: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  onSubmit?: (submissionData: any) => Promise<void>;
  onGrade?: (submissionId: string, gradeData: any) => Promise<void>;
  userRole: string;
  loading?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`assignment-tabpanel-${index}`}
      aria-labelledby={`assignment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({
  open,
  onClose,
  assignment,
  onSubmit,
  onGrade,
  userRole,
  loading = false
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [grading, setGrading] = useState<{ [key: string]: { marks: string; feedback: string } }>({});
  
  // Detailed assignment data with submissions
  const [detailedAssignment, setDetailedAssignment] = useState<Assignment | null>(assignment);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  
  // Form dialogs
  const [submissionFormOpen, setSubmissionFormOpen] = useState(false);
  const [gradingFormOpen, setGradingFormOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  // Fetch detailed assignment data when component opens
  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      if (!open || !assignment?.id) return;

      try {
        setFetchingDetails(true);
        
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth_token='))
          ?.split('=')[1];

        const response = await fetch(`/api/assignments/${assignment.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setDetailedAssignment(data.assignment);
        } else {
          console.error('Failed to fetch assignment details:', response.statusText);
          // Fallback to the passed assignment if fetch fails
          setDetailedAssignment(assignment);
        }
      } catch (error) {
        console.error('Error fetching assignment details:', error);
        // Fallback to the passed assignment if fetch fails
        setDetailedAssignment(assignment);
      } finally {
        setFetchingDetails(false);
      }
    };

    fetchAssignmentDetails();
  }, [open, assignment?.id]);

  // Use detailed assignment data instead of the passed assignment
  const currentAssignment = detailedAssignment || assignment;

  if (!currentAssignment) return null;

  const dueDate = new Date(currentAssignment.dueDate);
  const now = new Date();
  const isOverdue = now > dueDate;
  const timeUntilDue = dueDate.getTime() - now.getTime();
  const daysUntilDue = Math.ceil(timeUntilDue / (1000 * 60 * 60 * 24));

  // Get student's submission if they are a student
  type SubmissionType = {
    id: string;
    content?: string;
    attachments?: any[];
    submittedAt: string;
    marksObtained?: number;
    feedback?: string;
    student: {
      id: string;
      user: {
        firstName: string;
        lastName: string;
      };
    };
  };

  const studentSubmission: SubmissionType | null = userRole === 'STUDENT' ? currentAssignment.submissions?.[0] || null : null;
  const hasSubmitted = !!studentSubmission;
  const isGraded = studentSubmission?.marksObtained !== null;

  // Get status info
  const getStatusColor = () => {
    if (userRole === 'STUDENT') {
      if (isGraded) return 'success';
      if (hasSubmitted) return 'info';
      if (isOverdue) return 'error';
      if (daysUntilDue <= 1) return 'warning';
      return 'default';
    } else {
      if (!currentAssignment.isActive) return 'error';
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
      if (!currentAssignment.isActive) return t('assignments.inactive');
      if (isOverdue) return t('assignments.overdue');
      return t('assignments.active');
    }
  };

  const handleSubmitAssignment = async () => {
    if (!onSubmit) return;

    try {
      await onSubmit({
        content: submissionText,
        attachments: submissionFiles // This would need file upload handling
      });
      setSubmissionText('');
      setSubmissionFiles([]);
    } catch (error) {
      console.error('Error submitting assignment:', error);
    }
  };

  const handleGradeSubmission = async (submissionId: string) => {
    if (!onGrade) return;

    const gradeData = grading[submissionId];
    if (!gradeData || !gradeData.marks) return;

    try {
      await onGrade(submissionId, {
        marksObtained: Number(gradeData.marks),
        feedback: gradeData.feedback
      });
      
      // Reset grading form
      setGrading(prev => ({
        ...prev,
        [submissionId]: { marks: '', feedback: '' }
      }));
    } catch (error) {
      console.error('Error grading submission:', error);
    }
  };

  const updateGrading = (submissionId: string, field: 'marks' | 'feedback', value: string) => {
    setGrading(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value
      }
    }));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh', maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <AssignmentIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{currentAssignment.title}</Typography>
              <Chip 
                label={getStatusText()} 
                size="small" 
                color={getStatusColor() as any}
              />
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {fetchingDetails ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : (
          <>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            aria-label="assignment tabs"
          >
            <Tab label={t('assignments.details')} />
            {userRole === 'STUDENT' && (
              <Tab label={t('assignments.mySubmission')} />
            )}
            {(userRole === 'TEACHER' || userRole === 'ADMIN') && currentAssignment.submissions && (
              <Tab label={`${t('assignments.submissions')} (${currentAssignment.submissions.length || 0})`} />
            )}
          </Tabs>
        </Box>

        {/* Assignment Details Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Description />
                    <Typography variant="h6">
                      {t('assignments.assignmentDetails')}
                    </Typography>
                  </Box>
                  
                  <Box mb={3}>
                    <Typography variant="body1" paragraph>
                      {currentAssignment.description || t('assignments.noDescription')}
                    </Typography>
                  </Box>

                  {currentAssignment.instructions && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <ListAlt />
                        <Typography variant="h6">
                          {t('assignments.instructions')}
                        </Typography>
                      </Box>
                      <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                        {currentAssignment.instructions}
                      </Typography>
                    </>
                  )}

                  {currentAssignment.attachments && currentAssignment.attachments.length > 0 && (
                    <Box>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachFile />
                        {t('assignments.attachments')}
                      </Typography>
                      <FileUpload
                        attachments={currentAssignment.attachments}
                        onAttachmentsChange={() => {}} // Read-only
                        disabled={true}
                        label=""
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('assignments.assignmentInfo')}
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          <Subject />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={t('assignments.subject')}
                        secondary={
                          currentAssignment.subject
                            ? `${currentAssignment.subject.nameAr || currentAssignment.subject.name} (${currentAssignment.subject.code})`
                            : t('common.unknownSubject', 'Unknown Subject')
                        }
                      />
                    </ListItem>

                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.light' }}>
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={t('assignments.teacher')}
                        secondary={
                          currentAssignment.teacher && currentAssignment.teacher.user
                            ? `${currentAssignment.teacher.user.firstName} ${currentAssignment.teacher.user.lastName}`
                            : t('common.unknownTeacher', 'Unknown Teacher')
                        }
                      />
                    </ListItem>

                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.light' }}>
                          <Class />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={t('assignments.class')}
                        secondary={
                          currentAssignment.classRoom 
                            ? `${currentAssignment.classRoom.nameAr || currentAssignment.classRoom.name}${currentAssignment.classRoom.section ? ` - ${currentAssignment.classRoom.section}` : ''}`
                            : t('common.unknownClass', 'Unknown Class')
                        }
                      />
                    </ListItem>

                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: isOverdue ? 'error.light' : 'warning.light' }}>
                          <DateRange />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={t('assignments.dueDate')}
                        secondary={dueDate.toLocaleString()}
                      />
                    </ListItem>

                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.light' }}>
                          <Grade />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={t('assignments.totalMarks')}
                        secondary={currentAssignment.totalMarks}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Student Submission Tab */}
        {userRole === 'STUDENT' && (
          <TabPanel value={tabValue} index={1}>
            {studentSubmission ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('assignments.yourSubmission')}
                  </Typography>
                  
                  {isGraded && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {t('assignments.grade')}: {studentSubmission!.marksObtained}/{currentAssignment.totalMarks}
                        </Typography>
                        <Typography variant="body2">
                          {t('assignments.percentage')}: {((studentSubmission!.marksObtained! / currentAssignment.totalMarks) * 100).toFixed(1)}%
                        </Typography>
                        {studentSubmission!.feedback && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>{t('assignments.feedback')}:</strong> {studentSubmission!.feedback}
                          </Typography>
                        )}
                      </Box>
                    </Alert>
                  )}

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('assignments.submittedAt')}: {new Date(studentSubmission!.submittedAt).toLocaleString()}
                  </Typography>

                  <Typography variant="body1" paragraph>
                    {studentSubmission!.content || t('assignments.noContentSubmitted')}
                  </Typography>

                  {/* Show student's submission attachments */}
                  {studentSubmission!.attachments && studentSubmission!.attachments.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="body2" gutterBottom>
                        <strong>{t('assignments.submission.submissionFiles')}:</strong>
                      </Typography>
                      <FileUpload
                        attachments={studentSubmission!.attachments}
                        onAttachmentsChange={() => {}} // Read-only
                        disabled={true}
                        label=""
                      />
                    </Box>
                  )}

            
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('assignments.submitAssignment')}
                  </Typography>
                  
                  {isOverdue ? (
                    <Alert severity="error">
                      {t('assignments.submissionClosed')}
                    </Alert>
                  ) : (
                    <>
                      {hasSubmitted && studentSubmission ? (() => {
                        const submission: SubmissionType = studentSubmission;
                        return (
                        <Alert severity="success" sx={{ mb: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            <strong>{t('assignments.submission.submissionCompleted')}</strong>
                          </Typography>
                          <Typography variant="body2">
                            {t('assignments.submittedAt')}: {new Date(submission.submittedAt).toLocaleString()}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {submission.content || t('assignments.noContentSubmitted')}
                          </Typography>
                          {submission.attachments && submission.attachments.length > 0 && (
                            <Box mt={2}>
                              <Typography variant="body2" gutterBottom>
                                <strong>{t('assignments.submission.submissionFiles')}:</strong>
                              </Typography>
                              <FileUpload
                                attachments={submission.attachments}
                                onAttachmentsChange={() => {}} // Read-only
                                disabled={true}
                                label=""
                              />
                            </Box>
                          )}
                          {submission.marksObtained !== null && submission.marksObtained !== undefined && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 1 }}>
                              <Typography variant="h6">
                                {t('assignments.grading.grade')}: {submission.marksObtained}/{currentAssignment.totalMarks}
                                ({((submission.marksObtained / currentAssignment.totalMarks) * 100).toFixed(1)}%)
                              </Typography>
                              {submission.feedback && (
                                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                                  <strong>{t('assignments.feedback')}:</strong> {submission.feedback}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Alert>
                        );
                      })() : (
                        <Box sx={{ textAlign: 'center' }}>
                          <Button
                            variant="contained"
                            size="large"
                            startIcon={<Upload />}
                            onClick={() => setSubmissionFormOpen(true)}
                            disabled={loading || isOverdue}
                          >
                            {t('assignments.submission.submitAssignment')}
                          </Button>
                          {isOverdue && (
                            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                              {t('assignments.submission.overdue')}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabPanel>
        )}

        {/* Submissions Tab for Teachers/Admins */}
        {(userRole === 'TEACHER' || userRole === 'ADMIN') && currentAssignment.submissions && (
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              {t('assignments.studentSubmissions')}
            </Typography>
            
            {(() => {
              const validSubmissions = currentAssignment.submissions?.filter(submission => 
                submission.student && submission.student.user
              ) || [];
              
              return validSubmissions.length === 0 ? (
                <Alert severity="info">
                  {t('assignments.noSubmissionsYet')}
                </Alert>
              ) : (
                validSubmissions.map((submission) => (
                <Card key={submission.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6">
                          {`${submission.student.user.firstName} ${submission.student.user.lastName}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('assignments.submittedAt')}: {new Date(submission.submittedAt).toLocaleString()}
                        </Typography>
                      </Box>
                      {submission.marksObtained !== null && (
                        <Chip
                          label={`${submission.marksObtained}/${currentAssignment.totalMarks}`}
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    <Typography variant="body1" paragraph>
                      {submission.content || t('assignments.noContentSubmitted')}
                    </Typography>

                    {/* Show submission attachments */}
                    {submission.attachments && submission.attachments.length > 0 && (
                      <Box mb={2}>
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

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        {submission.marksObtained !== null && (
                          <Chip
                            label={`${submission.marksObtained}/${currentAssignment.totalMarks}`}
                            color="success"
                            variant="filled"
                          />
                        )}
                      </Box>
                      
                      <Button
                        variant={submission.marksObtained !== null ? "outlined" : "contained"}
                        startIcon={<Grade />}
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setGradingFormOpen(true);
                        }}
                      >
                        {submission.marksObtained !== null 
                          ? t('assignments.grading.viewGrade') 
                          : t('assignments.grading.gradeSubmission')
                        }
                      </Button>
                    </Box>

                    {submission.marksObtained !== null && submission.feedback && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <strong>{t('assignments.feedback')}:</strong> {submission.feedback}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))
              );
            })()}
          </TabPanel>
        )}
        </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {t('common.close')}
        </Button>
      </DialogActions>

      {/* Submission Form for Students */}
      {userRole === 'STUDENT' && assignment && (
        <SubmissionForm
          open={submissionFormOpen}
          onClose={() => setSubmissionFormOpen(false)}
          onSubmit={onSubmit || (() => Promise.resolve())}
          assignment={assignment}
          existingSubmission={studentSubmission}
          loading={loading}
        />
      )}

      {/* Grading Form for Teachers */}
      {(userRole === 'TEACHER' || userRole === 'ADMIN') && selectedSubmission && (
        <GradingForm
          open={gradingFormOpen}
          onClose={() => {
            setGradingFormOpen(false);
            setSelectedSubmission(null);
          }}
          onSubmit={async (gradingData) => {
            if (onGrade && selectedSubmission) {
              await onGrade(selectedSubmission.id, gradingData);
              setSelectedSubmission(null);
            }
          }}
          submission={{
            ...selectedSubmission,
            assignment: currentAssignment,
            student: {
              ...selectedSubmission.student,
              classRoom: currentAssignment.classRoom
            }
          }}
          loading={loading}
        />
      )}
    </Dialog>
  );
};

export default AssignmentDetails;