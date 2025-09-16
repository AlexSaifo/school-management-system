'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SidebarLayout from '@/components/layout/SidebarLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageHeader from '@/components/PageHeader';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
  Button
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

interface Teacher {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  subjects: Array<{
    id: string;
    name: string;
    nameAr: string;
    code: string;
    color: string;
  }>;
}

interface TimeSlot {
  id: string;
  name: string;
  nameAr: string;
  startTime: string;
  endTime: string;
  slotOrder: number;
  slotType: string;
}

interface TimetableEntry {
  id: string;
  subject: {
    name: string;
    nameAr: string;
    code: string;
    color: string;
  } | null;
  class: {
    name: string;
    nameAr: string;
    section: string;
    gradeLevel: {
      name: string;
      nameAr: string;
    };
  } | null;
  room: {
    name: string;
    nameAr: string;
  } | null;
  slotType: string;
}

interface DayTimetable {
  day: number;
  dayName: string;
  dayNameAr: string;
  slots: Array<{
    timeSlot: TimeSlot;
    entry: TimetableEntry | null;
  }>;
}

const TeachersTimetablePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [timetable, setTimetable] = useState<DayTimetable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTeachers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTeacher) {
      fetchTeacherTimetable(selectedTeacher);
    }
  }, [selectedTeacher]);

  if (authLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading teachers...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/timetable/teachers');
      const data = await response.json();
      if (data.success) {
        setTeachers(data.data);
      }
    } catch (error) {
      setError('Failed to fetch teachers');
    }
  };

  const fetchTeacherTimetable = async (teacherId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/timetable/teachers/${teacherId}`);
      const data = await response.json();
      if (data.success) {
        setTimetable(data.data.timetable);
      }
    } catch (error) {
      setError('Failed to fetch teacher timetable');
    } finally {
      setLoading(false);
    }
  };

  const getSlotTypeColor = (slotType: string) => {
    switch (slotType) {
      case 'LESSON': return '#4CAF50';
      case 'BREAK': return '#FF9800';
      case 'LUNCH': return '#2196F3';
      case 'ASSEMBLY': return '#9C27B0';
      case 'FREE': return '#9E9E9E';
      default: return '#607D8B';
    }
  };

  const selectedTeacherData = teachers.find(t => t.id === selectedTeacher);

  return (
    <ErrorBoundary>
      <SidebarLayout>
        <Box sx={{ p: 3 }}>
          {/* Page Header */}
          <PageHeader
            title="جداول المعلمين"
            subtitle="عرض وإدارة جداول المعلمين"
            actionLabel="العودة إلى الجدول الرئيسي"
            actionIcon={<ArrowBackIcon />}
            onAction={() => router.push('/timetable')}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Teacher Selection */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>اختر المعلم</InputLabel>
                  <Select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    label="اختر المعلم"
                  >
                    {teachers.map(teacher => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body1">{teacher.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {teacher.employeeId} - {teacher.department}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {selectedTeacherData && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="h6">{selectedTeacherData.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedTeacherData.email}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedTeacherData.subjects.map(subject => (
                        <Chip
                          key={subject.id}
                          label={subject.nameAr}
                          size="small"
                          sx={{ 
                            bgcolor: subject.color,
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>

      {/* Timetable Grid */}
      {timetable.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>الوقت</TableCell>
                {timetable.map(day => (
                  <TableCell key={day.day} sx={{ fontWeight: 'bold', textAlign: 'center', minWidth: 150 }}>
                    <Box>
                      <Typography variant="body2">{day.dayNameAr}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {day.dayName}
                      </Typography>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {timetable[0]?.slots.map((_, slotIndex) => (
                <TableRow key={slotIndex}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {timetable[0].slots[slotIndex].timeSlot.nameAr}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {timetable[0].slots[slotIndex].timeSlot.name}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {timetable[0].slots[slotIndex].timeSlot.startTime} - {timetable[0].slots[slotIndex].timeSlot.endTime}
                      </Typography>
                    </Box>
                  </TableCell>
                  {timetable.map(day => {
                    const slotData = day.slots[slotIndex];
                    const entry = slotData?.entry;
                    
                    return (
                      <TableCell key={`${day.day}-${slotIndex}`} sx={{ p: 1 }}>
                        {entry ? (
                          <Card 
                            sx={{ 
                              minHeight: 80,
                              bgcolor: entry.subject?.color || getSlotTypeColor(entry.slotType),
                              color: 'white'
                            }}
                          >
                            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                              {entry.subject ? (
                                <>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                                    {entry.subject.nameAr}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {entry.subject.code}
                                  </Typography>
                                  {entry.class && (
                                    <Typography variant="caption" display="block">
                                      {entry.class.nameAr} - {entry.class.section}
                                    </Typography>
                                  )}
                                  {entry.room && (
                                    <Typography variant="caption" display="block">
                                      {entry.room.nameAr}
                                    </Typography>
                                  )}
                                </>
                              ) : (
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {entry.slotType === 'BREAK' ? 'راحة' : 
                                   entry.slotType === 'LUNCH' ? 'غداء' : 
                                   entry.slotType === 'ASSEMBLY' ? 'طابور' : 'حرة'}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        ) : (
                          <Box
                            sx={{
                              minHeight: 80,
                              border: '1px solid #e0e0e0',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: '#f5f5f5'
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              فارغ
                            </Typography>
                          </Box>
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

      {!selectedTeacher && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            اختر معلماً لعرض جدوله
          </Typography>
        </Box>
      )}
        </Box>
      </SidebarLayout>
    </ErrorBoundary>
  );
};

export default TeachersTimetablePage;
