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
  Divider,
  Button,
  Badge,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Quiz,
  Schedule,
  TrendingUp,
  CalendarToday,
  Notifications,
  CheckCircle,
  AccessTime,
  School,
  Grade,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import AnnouncementsWidget from '@/components/AnnouncementsWidget';
import EventsWidget from '@/components/EventsWidget';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  totalMarks: number;
  subject: {
    name: string;
    code: string;
  };
  teacher: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  isActive: boolean;
}

interface Event {
  id: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  locationAr?: string;
  type: string;
  creator: {
    firstName: string;
    lastName: string;
  };
}

interface Grade {
  id: string;
  marks: number;
  totalMarks: number;
  examType: string;
  examDate: string;
  subject: {
    name: string;
    code: string;
  };
}

interface TimetableEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  subject: {
    name: string;
    code: string;
  };
  teacher: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface Attendance {
  id: string;
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

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [tabValue, setTabValue] = useState(0);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tabValue === 0) fetchDashboardData();
    else if (tabValue === 1) fetchTimetable();
    else if (tabValue === 2) fetchGrades();
    else if (tabValue === 3) fetchAttendance();
  }, [tabValue]);

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Fetch assignments
      const assignmentsResponse = await fetch('/api/student/assignments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (assignmentsResponse.ok) {
        const data = await assignmentsResponse.json();
        setAssignments(data.assignments || []);
      }

      // Fetch upcoming events
      const eventsResponse = await fetch('/api/events?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (eventsResponse.ok) {
        const data = await eventsResponse.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      setError(t('studentDashboard.messages.failedToFetchData', 'Failed to fetch dashboard data'));
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/student/timetable', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTimetable(data.timetable || []);
      }
    } catch (error) {
      setError(t('studentDashboard.messages.failedToFetchTimetable', 'Failed to fetch timetable'));
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/student/grades', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setGrades(data.grades || []);
      }
    } catch (error) {
      setError(t('studentDashboard.messages.failedToFetchGrades', 'Failed to fetch grades'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/student/attendance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance || []);
      }
    } catch (error) {
      setError(t('studentDashboard.messages.failedToFetchAttendance', 'Failed to fetch attendance'));
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallGrade = () => {
    if (grades.length === 0) return 'N/A';
    const totalMarks = grades.reduce((sum, grade) => sum + grade.marks, 0);
    const totalPossible = grades.reduce((sum, grade) => sum + grade.totalMarks, 0);
    const percentage = (totalMarks / totalPossible) * 100;
    
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    return 'F';
  };

  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return 0;
    const present = attendance.filter(a => a.status === 'PRESENT').length;
    return Math.round((present / attendance.length) * 100);
  };

  const getDayName = (dayNum: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum];
  };

  const getUpcomingAssignments = () => {
    const today = new Date();
    return assignments
      .filter(a => new Date(a.dueDate) > today && a.isActive)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  };

  const StatsCard = ({ title, value, icon, color = 'primary', subtitle }: any) => (
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
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {t('studentDashboard.welcome', 'Welcome, {{name}}!', { name: user?.firstName })}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {t('studentDashboard.dashboardTitle', 'Student Dashboard')} - {t('studentDashboard.grade', 'Grade {{grade}}', { grade: '10-A' })}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
              {t('studentDashboard.studentId', 'Student ID')}: STU001 | {t('studentDashboard.rollNumber', 'Roll Number')}: 001
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
            title={t('studentDashboard.stats.overallGrade', 'Overall Grade')}
            value={calculateOverallGrade()}
            icon={<Grade />}
            color="success"
            subtitle="Current GPA: 3.7"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title={t('studentDashboard.stats.attendance', 'Attendance')}
            value={`${calculateAttendancePercentage()}%`}
            icon={<CalendarToday />}
            color="primary"
            subtitle={t('studentDashboard.stats.thisSemester', 'This semester')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title={t('studentDashboard.stats.pendingAssignments', 'Pending Assignments')}
            value={getUpcomingAssignments().length}
            icon={<AssignmentIcon />}
            color="warning"
            subtitle={t('studentDashboard.stats.dueThisWeek', 'Due this week')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title={t('studentDashboard.stats.notifications', 'Notifications')}
            value="5"
            icon={<Notifications />}
            color="error"
            subtitle={t('studentDashboard.stats.unreadMessages', 'Unread messages')}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('studentDashboard.tabs.dashboard', 'Dashboard')} />
          <Tab label={t('studentDashboard.tabs.timetable', 'Timetable')} />
          <Tab label={t('studentDashboard.tabs.grades', 'Grades')} />
          <Tab label={t('studentDashboard.tabs.attendance', 'Attendance')} />
        </Tabs>

        {/* Dashboard Tab */}
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
              {/* Upcoming Assignments */}
              <Grid item xs={12} md={8}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  {t('studentDashboard.sections.upcomingAssignments', 'Upcoming Assignments')}
                </Typography>
                <List>
                  {getUpcomingAssignments().map((assignment) => (
                    <ListItem key={assignment.id} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {assignment.title}
                            </Typography>
                            <Chip label={assignment.subject.name} size="small" color="primary" />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {assignment.description}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2} mt={1}>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <AccessTime fontSize="small" color="action" />
                                <Typography variant="caption">
                                  {t('studentDashboard.assignments.due', 'Due: {{date}}', { date: new Date(assignment.dueDate).toLocaleDateString() })}
                                </Typography>
                              </Box>
                              <Typography variant="caption">
                                {t('studentDashboard.assignments.marks', '📊 {{marks}} marks', { marks: assignment.totalMarks })}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <Button variant="outlined" size="small">
                        {t('studentDashboard.actions.viewDetails', 'View Details')}
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </Grid>

              {/* Quick Stats */}
              <Grid item xs={12} md={4}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  {t('studentDashboard.sections.quickOverview', 'Quick Overview')}
                </Typography>
                
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('studentDashboard.sections.attendanceThisMonth', 'Attendance This Month')}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculateAttendancePercentage()} 
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                        color="success"
                      />
                      <Typography variant="body2" fontWeight="bold">
                        {calculateAttendancePercentage()}%
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('studentDashboard.sections.excellentAttendance', 'Excellent attendance record!')}
                    </Typography>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('studentDashboard.sections.recentPerformance', 'Recent Performance')}
                    </Typography>
                    {grades.slice(0, 3).map((grade) => (
                      <Box key={grade.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2">{grade.subject.name}</Typography>
                        <Chip 
                          label={`${grade.marks}/${grade.totalMarks}`}
                          size="small"
                          color={grade.marks >= grade.totalMarks * 0.8 ? 'success' : 
                                 grade.marks >= grade.totalMarks * 0.6 ? 'warning' : 'error'}
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Upcoming Events */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  {t('events.upcomingEvents', 'Upcoming Events')}
                </Typography>
                {events.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    {t('events.noEvents', 'No events found')}
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {events.slice(0, 3).map((event) => (
                      <Grid item xs={12} md={4} key={event.id}>
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
                              📅 {new Date(event.eventDate).toLocaleDateString()}
                            </Typography>
                            {event.eventTime && (
                              <Typography variant="body2">
                                🕐 {event.eventTime}
                              </Typography>
                            )}
                            {event.location && (
                              <Typography variant="body2">
                                📍 {language === 'ar' && event.locationAr ? event.locationAr : event.location}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Timetable Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" mb={3}>
              Class Timetable
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Day</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Teacher</TableCell>
                    <TableCell>Room</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timetable.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{getDayName(entry.dayOfWeek)}</TableCell>
                      <TableCell>{entry.startTime} - {entry.endTime}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography fontWeight="medium">{entry.subject.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {entry.subject.code}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {entry.teacher.user.firstName} {entry.teacher.user.lastName}
                      </TableCell>
                      <TableCell>{entry.room || 'TBA'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Grades Tab */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" mb={3}>
              Academic Performance
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('common.subject', 'Subject')}</TableCell>
                    <TableCell>{t('studentDashboard.grades.examType', 'Exam Type')}</TableCell>
                    <TableCell>{t('studentDashboard.grades.marksObtained', 'Marks Obtained')}</TableCell>
                    <TableCell>{t('studentDashboard.grades.totalMarks', 'Total Marks')}</TableCell>
                    <TableCell>{t('common.percentage', 'Percentage')}</TableCell>
                    <TableCell>{t('common.grade', 'Grade')}</TableCell>
                    <TableCell>{t('common.date', 'Date')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grades.map((grade) => {
                    const percentage = (grade.marks / grade.totalMarks) * 100;
                    const letterGrade = percentage >= 90 ? 'A+' : 
                                       percentage >= 80 ? 'A' : 
                                       percentage >= 70 ? 'B+' : 
                                       percentage >= 60 ? 'B' : 
                                       percentage >= 50 ? 'C' : 'F';
                    
                    return (
                      <TableRow key={grade.id}>
                        <TableCell>
                          <Box>
                            <Typography fontWeight="medium">{grade.subject.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {grade.subject.code}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{grade.examType}</TableCell>
                        <TableCell>{grade.marks}</TableCell>
                        <TableCell>{grade.totalMarks}</TableCell>
                        <TableCell>{percentage.toFixed(1)}%</TableCell>
                        <TableCell>
                          <Chip 
                            label={letterGrade}
                            color={percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(grade.examDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Attendance Tab */}
        {tabValue === 3 && (
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
                  {attendance.slice().reverse().map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{record.class.name} - {record.teacher.user.firstName} {record.teacher.user.lastName}</TableCell>
                      <TableCell>
                        <Chip 
                          label={record.status}
                          color={record.status === 'PRESENT' ? 'success' : 
                                 record.status === 'LATE' ? 'warning' : 'error'}
                          size="small"
                          icon={record.status === 'PRESENT' ? <CheckCircle /> : undefined}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
