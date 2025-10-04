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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [children, setChildren] = useState<Child[]>([]);
  const [performance, setPerformance] = useState<Performance[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  // Communications removed per requirements
  const [events, setEvents] = useState<Event[]>([]);
  // Messaging removed
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      if (tabValue === 0) {
        // Overview: load all key datasets in parallel
        fetchOverviewData();
      } else if (tabValue === 1) fetchPerformance();
      else if (tabValue === 2) fetchAttendance();
      else if (tabValue === 3) fetchAssignments();
      else if (tabValue === 4) fetchEvents(); // Events tab index shifted after removing communications
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
  setError(t('parentDashboard.errors.fetchChildren'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    if (!token || !selectedChild) return;
    try {
      const res = await fetch(`/api/parent/grades?studentId=${selectedChild}` , { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setPerformance(data.performance || []);
      }
    } catch (e) {
      setError(t('parentDashboard.errors.fetchDashboard'));
    }
  };

  const fetchAttendance = async () => {
    if (!token || !selectedChild) return;
    try {
      const res = await fetch(`/api/parent/attendance?studentId=${selectedChild}` , { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const records = data.attendance?.records || [];
        // Map API records to component shape
        setAttendance(records.map((r: any) => ({
          date: r.date,
          status: r.status,
          teacher: { user: { firstName: r.teacher?.firstName || '', lastName: r.teacher?.lastName || '' } },
          class: { name: r.subject?.name || r.timeSlot?.name || 'Class' }
        })));
      }
    } catch (e) {
      setError(t('parentDashboard.errors.fetchDashboard'));
    }
  };

  const fetchAssignments = async () => {
    if (!token || !selectedChild) return;
    try {
      const res = await fetch(`/api/parent/assignments?studentId=${selectedChild}` , { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (e) {
      setError(t('parentDashboard.errors.fetchDashboard'));
    }
  };

  const fetchEvents = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/events', { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      setError(t('parentDashboard.errors.fetchEvents'));
    } finally {
      setLoading(false);
    }
  };

  const fetchOverviewData = async () => {
    setLoading(true);
    await Promise.all([
      fetchPerformance(),
      fetchAttendance(),
      fetchAssignments(),
      fetchEvents()
    ]);
    setLoading(false);
  };
  // Communications & messaging removed

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
              {t('parentDashboard.welcome', { name: user?.firstName })}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {t('parentDashboard.portalSubtitle')}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
              {t('parentDashboard.childrenEnrolled', { count: children.length })}
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
              <InputLabel>{t('parentDashboard.selectChild')}</InputLabel>
              <Select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                label={t('parentDashboard.selectChild')}
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
                  {t('parentDashboard.rollNo')}: {getCurrentChild()?.rollNumber}
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
            <Grid item xs={12} sm={6} md={4}>
              <StatsCard
                title={t('parentDashboard.overallPerformance')}
                value={`${calculateOverallPerformance().toFixed(1)}%`}
                icon={<TrendingUp />}
                color="success"
                subtitle={t('parentDashboard.averageGrade', { grade: 'A-' })}
                onClick={() => setTabValue(1)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatsCard
                title={t('parentDashboard.attendanceRate')}
                value={`${calculateAttendancePercentage()}%`}
                icon={<CalendarToday />}
                color="primary"
                subtitle={t('parentDashboard.thisMonth')}
                onClick={() => setTabValue(2)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatsCard
                title={t('parentDashboard.pendingTasks')}
                value={assignments.filter(a => a.status === 'PENDING').length}
                icon={<Assignment />}
                color="warning"
                subtitle={t('parentDashboard.assignmentsDue')}
                onClick={() => setTabValue(3)}
              />
            </Grid>
          </Grid>

          {/* Main Content */}
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                <Tab label={t('parentDashboard.tabs.overview')} />
                <Tab label={t('parentDashboard.tabs.performance')} />
                <Tab label={t('parentDashboard.tabs.attendance')} />
                <Tab label={t('parentDashboard.tabs.assignments')} />
                <Tab label={t('parentDashboard.tabs.events')} />
              </Tabs>
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
                      {t('parentDashboard.recentPerformance')}
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
                      {t('parentDashboard.recentActivity')}
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
                                  {assignment.subject} • {t('parentDashboard.due')}: {new Date(assignment.dueDate).toLocaleDateString()}
                                </Typography>
                                {assignment.marks && (
                                  <Typography variant="caption" display="block">
                                    {t('parentDashboard.score')}: {assignment.marks}/{assignment.totalMarks}
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
                  {t('parentDashboard.academicPerformance')}
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('parentDashboard.subject')}</TableCell>
                        <TableCell>{t('parentDashboard.examType')}</TableCell>
                        <TableCell>{t('parentDashboard.marks')}</TableCell>
                        <TableCell>{t('parentDashboard.percentage')}</TableCell>
                        <TableCell>{t('parentDashboard.grade')}</TableCell>
                        <TableCell>{t('parentDashboard.date')}</TableCell>
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
                  {t('parentDashboard.attendanceRecord')}
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
                            {t('parentDashboard.overallAttendance')}
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
                            {t('parentDashboard.daysPresent')}
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
                            {t('parentDashboard.daysAbsent')}
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
                        <TableCell>{t('parentDashboard.date')}</TableCell>
                        <TableCell>{t('parentDashboard.classTeacher')}</TableCell>
                        <TableCell>{t('parentDashboard.status')}</TableCell>
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
                  {t('parentDashboard.assignmentsTasks')}
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('parentDashboard.assignment')}</TableCell>
                        <TableCell>{t('parentDashboard.subject')}</TableCell>
                        <TableCell>{t('parentDashboard.dueDate')}</TableCell>
                        <TableCell>{t('parentDashboard.status')}</TableCell>
                        <TableCell>{t('parentDashboard.score')}</TableCell>
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
                              label={t(`parentDashboard.assignmentStatus.${assignment.status}`)}
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

            {/* Events Tab */}
            {tabValue === 4 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="bold" mb={3}>
                  {t('parentDashboard.schoolEvents')}
                </Typography>

                {events.length === 0 ? (
                  <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                    {t('parentDashboard.noEvents')}
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
                              📅 {t('parentDashboard.eventDate')}: {new Date(event.eventDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2">
                              🕐 {t('parentDashboard.eventTime')}: {event.eventTime}
                            </Typography>
                            {event.location && (
                              <Typography variant="body2">
                                📍 {t('parentDashboard.eventLocation')}: {language === 'ar' && event.locationAr ? event.locationAr : event.location}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                              👤 {t('parentDashboard.createdBy')}: {event.createdBy.firstName} {event.createdBy.lastName}
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

      {/* Messaging removed */}
    </Box>
  );
}
