'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Room as RoomIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

interface TimeSlot {
  id: string;
  name: string;
  nameAr: string;
  startTime: string;
  endTime: string;
  slotOrder: number;
  slotType: string;
  duration: number;
}

interface Subject {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  color: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  nameAr: string;
  number: string;
}

interface TimetableEntry {
  id: string;
  subject: Subject | null;
  teacher: Teacher | null;
  room: Room | null;
  slotType: string;
  notes: string | null;
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

interface StudentInfo {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  classRoom: {
    id: string;
    name: string;
    nameAr: string;
    gradeLevel: {
      id: string;
      name: string;
      nameAr: string;
      level: number;
    };
  };
}

export default function StudentTimetable() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [timetable, setTimetable] = useState<DayTimetable[]>([]);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    fetchStudentTimetable();
  }, []);

  const fetchStudentTimetable = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get student info
      const studentResponse = await fetch('/api/auth/profile');
      if (!studentResponse.ok) {
        throw new Error(t('timetable.failedToFetchStudentInfo'));
      }

      const studentData = await studentResponse.json();
      const user = studentData.user;
      const student = user.student;

      if (!student || !student.classRoomId) {
        throw new Error(t('timetable.noClassroomAssigned'));
      }

      // Combine user and student data
      const studentInfo = {
        ...student,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      setStudentInfo(studentInfo);

      // Fetch time slots
      const timeSlotsResponse = await fetch('/api/timetable/time-slots');
      if (!timeSlotsResponse.ok) {
        throw new Error(t('timetable.failedToFetchTimeSlots'));
      }

      const timeSlotsData = await timeSlotsResponse.json();
      setTimeSlots(timeSlotsData.data || []);

      // Then get timetable for the student (automatically uses their class)
      const timetableResponse = await fetch('/api/timetable');
      if (!timetableResponse.ok) {
        throw new Error(t('timetable.failedToFetchTimetable'));
      }

      const timetableData = await timetableResponse.json();
      if (timetableData.success) {
        setTimetable(timetableData.data.timetable || []);
      } else {
        throw new Error(t('timetable.failedToLoadTimetableData'));
      }
    } catch (error) {
      console.error('Error fetching student timetable:', error);
      setError(error instanceof Error ? error.message : t('timetable.failedToLoadTimetable'));
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (day: number) => {
    const dayKeys = [
      'timetable.sunday',
      'timetable.monday', 
      'timetable.tuesday',
      'timetable.wednesday',
      'timetable.thursday',
      'timetable.friday',
      'timetable.saturday'
    ];
    return dayKeys[day] ? t(dayKeys[day]) : t('common.unknown');
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM format
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

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          {t('timetable.loadingTimetable')}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <ScheduleIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          {t('timetable.myTimetable')}
        </Typography>

        {studentInfo && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Chip
              icon={<SchoolIcon />}
              label={`${studentInfo.classRoom?.gradeLevel?.[language === 'ar' ? 'nameAr' : 'name'] || t('timetable.grade')} - ${studentInfo.classRoom?.[language === 'ar' ? 'nameAr' : 'name'] || t('timetable.class')}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<PersonIcon />}
              label={`${studentInfo.firstName} ${studentInfo.lastName}`}
              color="secondary"
              variant="outlined"
            />
          </Box>
        )}
      </Box>

      {timetable.length === 0 ? (
        <Alert severity="info">
          {t('timetable.noTimetableAvailable')}
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>{t('timetable.time')}</TableCell>
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
                        {slot.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {slot.nameAr}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {slot.startTime} - {slot.endTime}
                      </Typography>
                    </Box>
                  </TableCell>
                  {timetable.map(day => {
                    const slotData = day.slots.find(s => s.timeSlot.id === slot.id);
                    const entry = slotData?.entry;
                    
                    return (
                      <TableCell
                        key={`${day.day}-${slot.id}`}
                        sx={{ 
                          p: 1,
                          position: 'relative'
                        }}
                      >
                        {entry ? (
                          <Card 
                            sx={{ 
                              minHeight: 80,
                              bgcolor: entry.subject?.color || getSlotTypeColor(entry.slotType),
                              color: 'white',
                              '&:hover': { transform: 'scale(1.02)' },
                              border: 'none',
                              position: 'relative'
                            }}
                          >
                            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                              {entry.subject ? (
                                <>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                                    {entry.subject.name}
                                  </Typography>
                                  {entry.teacher && (
                                    <Typography variant="caption" display="block">
                                      {entry.teacher.name}
                                    </Typography>
                                  )}
                                  {entry.room && (
                                    <Typography variant="caption" display="block">
                                      {entry.room.name}
                                    </Typography>
                                  )}
                                </>
                              ) : (
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {slot.slotType === 'BREAK' ? t('timetable.break') : 
                                   slot.slotType === 'LUNCH' ? t('timetable.lunch') : 
                                   slot.slotType === 'ASSEMBLY' ? t('timetable.assembly') : t('timetable.free')}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        ) : (
                          <Box
                            sx={{
                              minHeight: 80,
                              border: '2px dashed #ccc',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              {t('timetable.noClassScheduled')}
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
    </Box>
  );
}