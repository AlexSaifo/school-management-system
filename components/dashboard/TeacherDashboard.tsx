'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Assignment as AssignmentIcon,
  Quiz,
  Schedule,
  People,
  CheckCircle,
  Cancel,
  CalendarToday,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import AnnouncementsWidget from '@/components/AnnouncementsWidget';
import EventsWidget from '@/components/EventsWidget';
import { useLanguage } from '@/contexts/LanguageContext';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  totalMarks: number;
  classId: string;
  subjectId: string;
  isActive: boolean;
  createdAt: string;
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  examDate: string;
  duration: number;
  totalMarks: number;
  classId: string;
  subjectId: string;
  isActive: boolean;
}

interface Student {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  studentId: string;
  rollNumber?: string;
}

interface Event {
  id: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  eventDate: string;
  eventTime: string;
  location?: string;
  locationAr?: string;
  type: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export default function TeacherDashboard() {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [tabValue, setTabValue] = useState(0);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dialog states
  const [assignmentDialog, setAssignmentDialog] = useState(false);
  const [examDialog, setExamDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Form states
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    totalMarks: 100,
    instructions: '',
    classId: '',
    subjectId: '',
  });

  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    examDate: '',
    duration: 60,
    totalMarks: 100,
    instructions: '',
    classId: '',
    subjectId: '',
  });

  useEffect(() => {
    if (tabValue === 0) fetchAssignments();
    else if (tabValue === 1) fetchExams();
    else if (tabValue === 2) fetchStudents();
    else if (tabValue === 3) fetchTimetable();
    else if (tabValue === 5) fetchEvents();
  }, [tabValue]);

  const fetchAssignments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/assignments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      setError(t('dashboard.teacher.errors.fetchAssignments'));
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/exams', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setExams(data.exams || []);
      }
    } catch (error) {
      setError(t('dashboard.teacher.errors.fetchExams'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/teacher/students', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      setError(t('dashboard.teacher.errors.fetchStudents'));
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      setError(t('dashboard.teacher.errors.fetchEvents'));
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // First get teacher profile to get teacher ID
      const profileResponse = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch teacher profile');
      }

      const profileData = await profileResponse.json();
      const teacher = profileData.user.teacher;

      if (!teacher) {
        throw new Error('Teacher profile not found');
      }

      // Get time slots
      const timeSlotsResponse = await fetch('/api/timetable/time-slots', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (timeSlotsResponse.ok) {
        const timeSlotsData = await timeSlotsResponse.json();
        setTimeSlots(timeSlotsData.data || []);
      }

      // Get teacher's timetable
      const response = await fetch(`/api/timetable/teachers/${teacher.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTimetable(data.data.timetable || []);
        }
      }
    } catch (error) {
      setError('Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assignmentForm),
      });

      if (response.ok) {
        setAssignmentDialog(false);
        resetAssignmentForm();
        fetchAssignments();
      } else {
        setError(t('dashboard.teacher.errors.createAssignment'));
      }
    } catch (error) {
      setError(t('dashboard.teacher.errors.createAssignment'));
    }
  };

  const handleCreateExam = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(examForm),
      });

      if (response.ok) {
        setExamDialog(false);
        resetExamForm();
        fetchExams();
      } else {
        setError(t('dashboard.teacher.errors.createExam'));
      }
    } catch (error) {
      setError(t('dashboard.teacher.errors.createExam'));
    }
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({
      title: '',
      description: '',
      dueDate: '',
      totalMarks: 100,
      instructions: '',
      classId: '',
      subjectId: '',
    });
    setSelectedAssignment(null);
  };

  const resetExamForm = () => {
    setExamForm({
      title: '',
      description: '',
      examDate: '',
      duration: 60,
      totalMarks: 100,
      instructions: '',
      classId: '',
      subjectId: '',
    });
    setSelectedExam(null);
  };

  const StatsCard = ({ title, value, icon, color = 'primary' }: any) => (
    <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="h2" color={`${color}.main`} fontWeight="bold">
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Welcome Section */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)', color: 'white' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {t('dashboard.teacher.welcome', { name: user?.firstName })}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {t('dashboard.teacher.departmentTitle', { department: 'Mathematics Department' })}
            </Typography>
          </Box>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: '2rem',
              fontWeight: 'bold'
            }}
          >
            {user?.firstName[0]}{user?.lastName[0]}
          </Avatar>
        </Box>
      </Paper>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title={t('dashboard.teacher.stats.activeAssignments')}
            value={assignments.filter(a => a.isActive).length}
            icon={<AssignmentIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title={t('dashboard.teacher.stats.upcomingExams')}
            value={exams.filter(e => e.isActive && new Date(e.examDate) > new Date()).length}
            icon={<Quiz />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title={t('dashboard.teacher.stats.myStudents')}
            value={students.length}
            icon={<People />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title={t('dashboard.teacher.stats.classesToday')}
            value={4}
            icon={<Schedule />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Recent Widgets */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <AnnouncementsWidget maxItems={3} />
        </Grid>
        <Grid item xs={12} md={6}>
          <EventsWidget maxItems={3} />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('dashboard.teacher.tabs.assignments')} />
          <Tab label={t('dashboard.teacher.tabs.exams')} />
          <Tab label={t('dashboard.teacher.tabs.myStudents')} />
          <Tab label={t('dashboard.teacher.tabs.schedule')} />
          <Tab label={t('dashboard.teacher.tabs.announcements')} />
          <Tab label={t('dashboard.teacher.tabs.events')} />
        </Tabs>

        {/* Assignments Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight="bold">
                {t('dashboard.teacher.assignments.management')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAssignmentDialog(true)}
              >
                {t('dashboard.teacher.assignments.create')}
              </Button>
            </Box>

            <Grid container spacing={2}>
              {assignments.map((assignment) => (
                <Grid item xs={12} md={6} lg={4} key={assignment.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                        <Typography variant="h6" gutterBottom>
                          {assignment.title}
                        </Typography>
                        <Chip
                          label={assignment.isActive ? t('dashboard.teacher.assignments.active') : t('dashboard.teacher.assignments.inactive')}
                          color={assignment.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {assignment.description}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2">
                        📅 {t('dashboard.teacher.assignments.due', { date: new Date(assignment.dueDate).toLocaleDateString() })}
                      </Typography>
                      <Typography variant="body2">
                        📊 {t('dashboard.teacher.assignments.marks', { marks: assignment.totalMarks })}
                      </Typography>
                      <Box mt={2} display="flex" gap={1}>
                        <IconButton size="small" onClick={() => {
                          setSelectedAssignment(assignment);
                          setAssignmentForm({
                            title: assignment.title,
                            description: assignment.description || '',
                            dueDate: assignment.dueDate.split('T')[0],
                            totalMarks: assignment.totalMarks,
                            instructions: '',
                            classId: assignment.classId,
                            subjectId: assignment.subjectId,
                          });
                          setAssignmentDialog(true);
                        }}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small">
                          <Delete />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Exams Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight="bold">
                {t('dashboard.teacher.exams.management')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setExamDialog(true)}
              >
                {t('dashboard.teacher.exams.schedule')}
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('dashboard.teacher.exams.title')}</TableCell>
                    <TableCell>{t('dashboard.teacher.exams.date')}</TableCell>
                    <TableCell>{t('dashboard.teacher.exams.duration')}</TableCell>
                    <TableCell>{t('dashboard.teacher.assignments.totalMarks')}</TableCell>
                    <TableCell>{t('common.status')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell>
                        <Typography fontWeight="medium">{exam.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {exam.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(exam.examDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{exam.duration} {t('common.minutes')}</TableCell>
                      <TableCell>{exam.totalMarks}</TableCell>
                      <TableCell>
                        <Chip
                          label={exam.isActive ? t('dashboard.teacher.exams.scheduled') : t('dashboard.teacher.assignments.inactive')}
                          color={exam.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                        <IconButton size="small">
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Students Tab */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" mb={3}>
              {t('dashboard.teacher.students.title')}
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('dashboard.teacher.students.name')}</TableCell>
                    <TableCell>{t('dashboard.teacher.students.id')}</TableCell>
                    <TableCell>{t('dashboard.teacher.students.rollNumber')}</TableCell>
                    <TableCell>{t('dashboard.teacher.students.email')}</TableCell>
                    <TableCell>{t('dashboard.teacher.students.attendance')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar>
                            {student.user?.firstName?.[0] || t('dashboard.teacher.placeholders.noData')}{student.user?.lastName?.[0] || t('dashboard.teacher.placeholders.noData')}
                          </Avatar>
                          {`${student.user?.firstName || t('dashboard.teacher.placeholders.unknown')} ${student.user?.lastName || t('dashboard.teacher.placeholders.student')}`}
                        </Box>
                      </TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>{student.rollNumber || t('dashboard.teacher.placeholders.notAvailable')}</TableCell>
                      <TableCell>{student.user?.email || t('dashboard.teacher.placeholders.notAvailable')}</TableCell>
                      <TableCell>
                        <Chip label="95%" color="success" size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="outlined">
                          {t('dashboard.teacher.students.viewProfile')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Schedule Tab */}
        {tabValue === 3 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" mb={3}>
              {t('dashboard.teacher.schedule.title')}
            </Typography>

            {loading ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '200px',
                  gap: 2,
                }}
              >
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary">
                  Loading timetable...
                </Typography>
              </Box>
            ) : timetable.length === 0 ? (
              <Alert severity="info">
                {t('dashboard.teacher.schedule.noTimetable', 'No timetable available')}
              </Alert>
            ) : (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>
                        {t('timetable.time', 'Time')}
                      </TableCell>
                      {timetable.map(day => (
                        <TableCell key={day.day} sx={{ fontWeight: 'bold', textAlign: 'center', minWidth: 150 }}>
                          <Box>
                            <Typography variant="body2">{day.dayName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {day.dayNameAr}
                            </Typography>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {timeSlots.map(slot => (
                      <TableRow key={slot.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {language === 'ar' ? slot.nameAr : slot.name}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {slot.startTime} - {slot.endTime}
                            </Typography>
                          </Box>
                        </TableCell>
                        {timetable.map(day => {
                          const slotData = day.slots.find((s: any) => s.timeSlot.id === slot.id);
                          const entry = slotData?.entry;

                          return (
                            <TableCell
                              key={`${day.day}-${slot.id}`}
                              sx={{
                                p: 1,
                                textAlign: 'center',
                                backgroundColor: entry ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
                              }}
                            >
                              {entry ? (
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {language === 'ar' ? entry.subject?.nameAr : entry.subject?.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {language === 'ar' ? entry.class?.nameAr : entry.class?.name}
                                  </Typography>
                                  {entry.class && (
                                    <Chip
                                      label={`${entry.class.gradeLevel?.[language === 'ar' ? 'nameAr' : 'name']} - ${entry.class.section}`}
                                      size="small"
                                      sx={{ mt: 0.5, fontSize: '0.7rem' }}
                                    />
                                  )}
                                </Box>
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Announcements Tab */}
        {tabValue === 4 && (
          <Box sx={{ p: 3 }}>
            <AnnouncementsWidget showAll={true} />
          </Box>
        )}

        {/* Events Tab */}
        {tabValue === 5 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" mb={3}>
              {t('dashboard.teacher.events.title')}
            </Typography>

            {events.length === 0 ? (
              <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                {t('dashboard.teacher.events.noEvents')}
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {events.map((event) => (
                  <Grid item xs={12} md={6} lg={4} key={event.id}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                          <Typography variant="h6" gutterBottom>
                            {language === 'ar' && event.titleAr ? event.titleAr : event.title}
                          </Typography>
                          <Chip
                            label={event.type}
                            color="primary"
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {language === 'ar' && event.descriptionAr ? event.descriptionAr : event.description}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2">
                          📅 {t('dashboard.teacher.events.date', { date: new Date(event.eventDate).toLocaleDateString() })}
                        </Typography>
                        <Typography variant="body2">
                          🕐 {t('dashboard.teacher.events.time', { time: event.eventTime })}
                        </Typography>
                        {event.location && (
                          <Typography variant="body2">
                            📍 {t('dashboard.teacher.events.location', { location: language === 'ar' && event.locationAr ? event.locationAr : event.location })}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          👤 {t('dashboard.teacher.events.createdBy', { name: event.createdBy?.firstName || 'Unknown' + ' ' + (event.createdBy?.lastName || 'User') })}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Paper>

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialog} onClose={() => setAssignmentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedAssignment ? t('dashboard.teacher.dialogs.editAssignment') : t('dashboard.teacher.dialogs.createAssignment')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('dashboard.teacher.assignments.title')}
                value={assignmentForm.title}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('dashboard.teacher.assignments.description')}
                multiline
                rows={3}
                value={assignmentForm.description}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('dashboard.teacher.assignments.dueDate')}
                type="date"
                InputLabelProps={{ shrink: true }}
                value={assignmentForm.dueDate}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('dashboard.teacher.assignments.totalMarks')}
                type="number"
                value={assignmentForm.totalMarks}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, totalMarks: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('dashboard.teacher.assignments.instructions')}
                multiline
                rows={4}
                value={assignmentForm.instructions}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialog(false)}>{t('dashboard.teacher.dialogs.cancel')}</Button>
          <Button variant="contained" onClick={handleCreateAssignment}>
            {selectedAssignment ? t('dashboard.teacher.dialogs.update') : t('dashboard.teacher.dialogs.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Exam Dialog */}
      <Dialog open={examDialog} onClose={() => setExamDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedExam ? t('dashboard.teacher.dialogs.editExam') : t('dashboard.teacher.dialogs.createExam')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('dashboard.teacher.exams.title')}
                value={examForm.title}
                onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('dashboard.teacher.assignments.description')}
                multiline
                rows={3}
                value={examForm.description}
                onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('dashboard.teacher.exams.examDate')}
                type="date"
                InputLabelProps={{ shrink: true }}
                value={examForm.examDate}
                onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('dashboard.teacher.exams.duration')}
                type="number"
                value={examForm.duration}
                onChange={(e) => setExamForm({ ...examForm, duration: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('dashboard.teacher.assignments.totalMarks')}
                type="number"
                value={examForm.totalMarks}
                onChange={(e) => setExamForm({ ...examForm, totalMarks: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('dashboard.teacher.assignments.instructions')}
                multiline
                rows={4}
                value={examForm.instructions}
                onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExamDialog(false)}>{t('dashboard.teacher.dialogs.cancel')}</Button>
          <Button variant="contained" onClick={handleCreateExam}>
            {selectedExam ? t('dashboard.teacher.dialogs.update') : t('dashboard.teacher.dialogs.schedule')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
