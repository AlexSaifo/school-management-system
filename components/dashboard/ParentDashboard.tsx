'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Avatar,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Badge,
  Divider,
} from '@mui/material';
import {
  FamilyRestroom,
  School,
  TrendingUp,
  CalendarToday,
  Message,
  Assignment,
  Quiz,
  Grade,
  AccessTime,
  CheckCircle,
  Warning,
  Send,
  Refresh,
  Schedule,
  Notifications,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import AnnouncementsWidget from '@/components/AnnouncementsWidget';
import EventsWidget from '@/components/EventsWidget';
import { useLanguage } from '@/contexts/LanguageContext';

interface Child {
  id: string;
  rollNumber: string;
  class: string;
  section: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Performance {
  subject: string;
  marks: number;
  totalMarks: number;
  examType: string;
  date: string;
  percentage: number;
  grade: string;
}

interface Attendance {
  date: string;
  status: string;
  teacher: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  class: {
    name: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'PENDING' | 'SUBMITTED' | 'LATE';
  marks?: number;
  totalMarks: number;
}

interface Communication {
  id: string;
  from: string;
  subject: string;
  message: string;
  date: string;
  type: 'TEACHER_MESSAGE' | 'SCHOOL_NOTICE' | 'FEE_REMINDER';
  isRead: boolean;
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

export default function ParentDashboard() {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const [tabValue, setTabValue] = useState(0);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [children, setChildren] = useState<Child[]>([]);
  const [performance, setPerformance] = useState<Performance[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({ to: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      if (tabValue === 0) fetchDashboardData();
      else if (tabValue === 1) fetchPerformance();
      else if (tabValue === 2) fetchAttendance();
      else if (tabValue === 3) fetchAssignments();
      else if (tabValue === 4) fetchCommunications();
      else if (tabValue === 5) fetchEvents();
    }
  }, [selectedChild, tabValue]);

  const fetchChildren = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/parent/children', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setChildren(data.children || []);
        if (data.children?.length > 0) {
          setSelectedChild(data.children[0].id);
        }
      }
    } catch (error) {
      setError('Failed to fetch children data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!token || !selectedChild) return;
    setLoading(true);
    try {
      // Mock data - would fetch from actual API
      setPerformance([
        { subject: 'Mathematics', marks: 85, totalMarks: 100, examType: 'Mid-term', date: '2024-01-15', percentage: 85, grade: 'A' },
        { subject: 'Science', marks: 92, totalMarks: 100, examType: 'Mid-term', date: '2024-01-15', percentage: 92, grade: 'A+' },
        { subject: 'English', marks: 78, totalMarks: 100, examType: 'Mid-term', date: '2024-01-15', percentage: 78, grade: 'B+' },
      ]);
      setAttendance([
        { 
          date: '2024-01-22', 
          status: 'PRESENT', 
          teacher: { user: { firstName: 'John', lastName: 'Smith' } },
          class: { name: 'Mathematics' }
        },
        { 
          date: '2024-01-21', 
          status: 'PRESENT', 
          teacher: { user: { firstName: 'Sarah', lastName: 'Johnson' } },
          class: { name: 'Science' }
        },
        { 
          date: '2024-01-20', 
          status: 'ABSENT', 
          teacher: { user: { firstName: 'Mike', lastName: 'Davis' } },
          class: { name: 'English' }
        },
      ]);
      setAssignments([
        { id: '1', title: 'Math Homework Chapter 5', subject: 'Mathematics', dueDate: '2024-01-25', status: 'PENDING', totalMarks: 20 },
        { id: '2', title: 'Science Project', subject: 'Science', dueDate: '2024-01-28', status: 'SUBMITTED', marks: 18, totalMarks: 20 },
      ]);
    } catch (error) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    // Mock implementation - would fetch actual performance data
    fetchDashboardData();
  };

  const fetchAttendance = async () => {
    // Mock implementation - would fetch actual attendance data
    fetchDashboardData();
  };

  const fetchAssignments = async () => {
    // Mock implementation - would fetch actual assignments data
    fetchDashboardData();
  };

  const fetchCommunications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Mock data - would fetch from actual API
      setCommunications([
        {
          id: '1',
          from: 'Ms. Johnson (Math Teacher)',
          subject: 'Mid-term Exam Results',
          message: 'Your child has performed excellently in the mid-term exam. Keep up the good work!',
          date: '2024-01-20',
          type: 'TEACHER_MESSAGE',
          isRead: false,
        },
        {
          id: '2',
          from: 'School Administration',
          subject: 'Parent-Teacher Meeting',
          message: 'Parent-teacher meeting is scheduled for January 30th. Please confirm your attendance.',
          date: '2024-01-18',
          type: 'SCHOOL_NOTICE',
          isRead: true,
        },
      ]);
    } catch (error) {
      setError('Failed to fetch communications');
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

  const sendMessage = async () => {
    if (!token) return;
    try {
      // Mock implementation - would send actual message
      setMessageDialogOpen(false);
      setNewMessage({ to: '', subject: '', message: '' });
      // Show success message
    } catch (error) {
      setError('Failed to send message');
    }
  };

  const calculateOverallPerformance = () => {
    if (performance.length === 0) return 0;
    return performance.reduce((sum, p) => sum + p.percentage, 0) / performance.length;
  };

  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return 0;
    const present = attendance.filter(a => a.status === 'PRESENT').length;
    return Math.round((present / attendance.length) * 100);
  };

  const getCurrentChild = () => {
    return children.find(child => child.id === selectedChild);
  };

  const StatsCard = ({ title, value, icon, color = 'primary', subtitle, onClick }: any) => (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s', 
        '&:hover': { transform: onClick ? 'translateY(-2px)' : 'none' } 
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="h2" color={`${color}.main`} fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
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
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Welcome, {user?.firstName}!
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Parent Portal - Monitoring Your Child's Progress
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
              {children.length} {children.length === 1 ? 'child' : 'children'} enrolled
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

      {/* Child Selection */}
      {children.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <FamilyRestroom color="primary" />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Select Child</InputLabel>
              <Select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                label="Select Child"
              >
                {children.map((child) => (
                  <MenuItem key={child.id} value={child.id}>
                    {child.user.firstName} {child.user.lastName} - {child.class}{child.section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {getCurrentChild() && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Roll No: {getCurrentChild()?.rollNumber}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {selectedChild && (
        <>
          {/* Stats Overview */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Overall Performance"
                value={`${calculateOverallPerformance().toFixed(1)}%`}
                icon={<TrendingUp />}
                color="success"
                subtitle="Average Grade: A-"
                onClick={() => setTabValue(1)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Attendance Rate"
                value={`${calculateAttendancePercentage()}%`}
                icon={<CalendarToday />}
                color="primary"
                subtitle="This month"
                onClick={() => setTabValue(2)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Pending Tasks"
                value={assignments.filter(a => a.status === 'PENDING').length}
                icon={<Assignment />}
                color="warning"
                subtitle="Assignments due"
                onClick={() => setTabValue(3)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="New Messages"
                value={communications.filter(c => !c.isRead).length}
                icon={<Message />}
                color="error"
                subtitle="Unread communications"
                onClick={() => setTabValue(4)}
              />
            </Grid>
          </Grid>

          {/* Main Content */}
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                <Tab label="Overview" />
                <Tab label="Performance" />
                <Tab label="Attendance" />
                <Tab label="Assignments" />
                <Tab label="Communications" />
                <Tab label="Events" />
              </Tabs>
              {tabValue === 4 && (
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={() => setMessageDialogOpen(true)}
                >
                  Send Message
                </Button>
              )}
            </Box>

            {/* Overview Tab */}
            {tabValue === 0 && (
              <Box sx={{ p: 3 }}>
                {/* Announcements Section */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12}>
                    <AnnouncementsWidget maxItems={3} />
                  </Grid>
                </Grid>

                {/* Events Section */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12}>
                    <EventsWidget maxItems={3} />
                  </Grid>
                </Grid>

                <Grid container spacing={3}>
                  {/* Recent Performance */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" fontWeight="bold" mb={2}>
                      Recent Performance
                    </Typography>
                    <Card>
                      <CardContent>
                        {performance.map((perf, index) => (
                          <Box key={index} mb={2}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {perf.subject}
                              </Typography>
                              <Chip 
                                label={perf.grade}
                                color={perf.percentage >= 80 ? 'success' : perf.percentage >= 60 ? 'warning' : 'error'}
                                size="small"
                              />
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <LinearProgress
                                variant="determinate"
                                value={perf.percentage}
                                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                                color={perf.percentage >= 80 ? 'success' : perf.percentage >= 60 ? 'warning' : 'error'}
                              />
                              <Typography variant="caption">
                                {perf.marks}/{perf.totalMarks}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Recent Activity */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" fontWeight="bold" mb={2}>
                      Recent Activity
                    </Typography>
                    <List>
                      {assignments.slice(0, 3).map((assignment) => (
                        <ListItem key={assignment.id} divider>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="subtitle2">
                                  {assignment.title}
                                </Typography>
                                <Chip 
                                  label={assignment.status}
                                  size="small"
                                  color={assignment.status === 'SUBMITTED' ? 'success' : 
                                         assignment.status === 'PENDING' ? 'warning' : 'error'}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  {assignment.subject} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </Typography>
                                {assignment.marks && (
                                  <Typography variant="caption" display="block">
                                    Score: {assignment.marks}/{assignment.totalMarks}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Performance Tab */}
            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="bold" mb={3}>
                  Academic Performance
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell>Exam Type</TableCell>
                        <TableCell>Marks</TableCell>
                        <TableCell>Percentage</TableCell>
                        <TableCell>Grade</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performance.map((perf, index) => (
                        <TableRow key={index}>
                          <TableCell>{perf.subject}</TableCell>
                          <TableCell>{perf.examType}</TableCell>
                          <TableCell>{perf.marks}/{perf.totalMarks}</TableCell>
                          <TableCell>{perf.percentage}%</TableCell>
                          <TableCell>
                            <Chip 
                              label={perf.grade}
                              color={perf.percentage >= 80 ? 'success' : perf.percentage >= 60 ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{new Date(perf.date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Attendance Tab */}
            {tabValue === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="bold" mb={3}>
                  Attendance Record
                </Typography>

                <Box mb={3}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main" fontWeight="bold">
                            {calculateAttendancePercentage()}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Overall Attendance
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary.main" fontWeight="bold">
                            {attendance.filter(a => a.status === 'PRESENT').length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Days Present
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="error.main" fontWeight="bold">
                            {attendance.filter(a => a.status === 'ABSENT').length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Days Absent
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>

                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Class/Teacher</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendance.slice().reverse().map((record, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>{record.class.name} - {record.teacher.user.firstName} {record.teacher.user.lastName}</TableCell>
                          <TableCell>
                            <Chip 
                              label={record.status}
                              color={record.status === 'PRESENT' ? 'success' : 'error'}
                              size="small"
                              icon={record.status === 'PRESENT' ? <CheckCircle /> : <Warning />}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Assignments Tab */}
            {tabValue === 3 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="bold" mb={3}>
                  Assignments & Tasks
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Assignment</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <Typography fontWeight="medium">{assignment.title}</Typography>
                          </TableCell>
                          <TableCell>{assignment.subject}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <AccessTime fontSize="small" color="action" />
                              {new Date(assignment.dueDate).toLocaleDateString()}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={assignment.status}
                              color={assignment.status === 'SUBMITTED' ? 'success' : 
                                     assignment.status === 'PENDING' ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {assignment.marks ? 
                              `${assignment.marks}/${assignment.totalMarks}` : 
                              `--/${assignment.totalMarks}`
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Communications Tab */}
            {tabValue === 4 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="bold" mb={3}>
                  Messages & Communications
                </Typography>
                
                <List>
                  {communications.map((comm) => (
                    <ListItem key={comm.id} divider sx={{ bgcolor: comm.isRead ? 'transparent' : 'action.hover' }}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Badge variant="dot" color="error" invisible={comm.isRead}>
                              <Typography variant="subtitle1" fontWeight={comm.isRead ? 'normal' : 'bold'}>
                                {comm.subject}
                              </Typography>
                            </Badge>
                            <Chip 
                              label={comm.type.replace('_', ' ')}
                              size="small"
                              color={comm.type === 'TEACHER_MESSAGE' ? 'primary' : 
                                     comm.type === 'SCHOOL_NOTICE' ? 'info' : 'warning'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              From: {comm.from}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {comm.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(comm.date).toLocaleDateString()} {new Date(comm.date).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <Button variant="outlined" size="small">
                        Reply
                      </Button>
                    </ListItem>
                  ))}
                </List>
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
        </>
      )}

      {/* Send Message Dialog */}
      <Dialog open={messageDialogOpen} onClose={() => setMessageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Message</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>To</InputLabel>
              <Select
                value={newMessage.to}
                onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
                label="To"
              >
                <MenuItem value="class_teacher">Class Teacher</MenuItem>
                <MenuItem value="subject_teacher">Subject Teacher</MenuItem>
                <MenuItem value="principal">Principal</MenuItem>
                <MenuItem value="admin">Administration</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              margin="normal"
              label="Subject"
              value={newMessage.subject}
              onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Message"
              multiline
              rows={4}
              value={newMessage.message}
              onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialogOpen(false)}>Cancel</Button>
          <Button onClick={sendMessage} variant="contained" startIcon={<Send />}>
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
