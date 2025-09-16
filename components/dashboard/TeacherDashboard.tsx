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
  const { language } = useLanguage();
  const [tabValue, setTabValue] = useState(0);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
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
      setError('Failed to fetch assignments');
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
      setError('Failed to fetch exams');
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
      setError('Failed to fetch students');
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
      setError('Failed to fetch events');
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
        setError('Failed to create assignment');
      }
    } catch (error) {
      setError('Failed to create assignment');
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
        setError('Failed to create exam');
      }
    } catch (error) {
      setError('Failed to create exam');
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
              Welcome, {user?.firstName}!
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Teacher Dashboard - Mathematics Department
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
            title="Active Assignments"
            value={assignments.filter(a => a.isActive).length}
            icon={<AssignmentIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Upcoming Exams"
            value={exams.filter(e => e.isActive && new Date(e.examDate) > new Date()).length}
            icon={<Quiz />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="My Students"
            value={students.length}
            icon={<People />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Classes Today"
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
          <Tab label="Assignments" />
          <Tab label="Exams" />
          <Tab label="My Students" />
          <Tab label="Schedule" />
          <Tab label="Announcements" />
          <Tab label="Events" />
        </Tabs>

        {/* Assignments Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight="bold">
                Assignments Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAssignmentDialog(true)}
              >
                Create Assignment
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
                          label={assignment.isActive ? 'Active' : 'Inactive'}
                          color={assignment.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {assignment.description}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2">
                        📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        📊 Total Marks: {assignment.totalMarks}
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
                Exams Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setExamDialog(true)}
              >
                Schedule Exam
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Exam Title</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Total Marks</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
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
                      <TableCell>{exam.duration} min</TableCell>
                      <TableCell>{exam.totalMarks}</TableCell>
                      <TableCell>
                        <Chip
                          label={exam.isActive ? 'Scheduled' : 'Inactive'}
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
              My Students
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Roll Number</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Attendance</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar>
                            {student.user.firstName[0]}{student.user.lastName[0]}
                          </Avatar>
                          {`${student.user.firstName} ${student.user.lastName}`}
                        </Box>
                      </TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>{student.rollNumber || 'N/A'}</TableCell>
                      <TableCell>{student.user.email}</TableCell>
                      <TableCell>
                        <Chip label="95%" color="success" size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="outlined">
                          View Profile
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
              Class Schedule
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your class schedule and timetable will be displayed here.
            </Typography>
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
              School Events
            </Typography>

            {events.length === 0 ? (
              <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                No events found.
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
                          📅 Date: {new Date(event.eventDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2">
                          🕐 Time: {event.eventTime}
                        </Typography>
                        {event.location && (
                          <Typography variant="body2">
                            📍 Location: {language === 'ar' && event.locationAr ? event.locationAr : event.location}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          👤 Created by: {event.createdBy.firstName} {event.createdBy.lastName}
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
        <DialogTitle>{selectedAssignment ? 'Edit Assignment' : 'Create New Assignment'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Assignment Title"
                value={assignmentForm.title}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={assignmentForm.description}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={assignmentForm.dueDate}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Marks"
                type="number"
                value={assignmentForm.totalMarks}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, totalMarks: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                multiline
                rows={4}
                value={assignmentForm.instructions}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateAssignment}>
            {selectedAssignment ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Exam Dialog */}
      <Dialog open={examDialog} onClose={() => setExamDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedExam ? 'Edit Exam' : 'Schedule New Exam'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Exam Title"
                value={examForm.title}
                onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={examForm.description}
                onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Exam Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={examForm.examDate}
                onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={examForm.duration}
                onChange={(e) => setExamForm({ ...examForm, duration: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Marks"
                type="number"
                value={examForm.totalMarks}
                onChange={(e) => setExamForm({ ...examForm, totalMarks: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                multiline
                rows={4}
                value={examForm.instructions}
                onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExamDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateExam}>
            {selectedExam ? 'Update' : 'Schedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
