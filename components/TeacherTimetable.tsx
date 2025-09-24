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

interface ClassRoom {
  id: string;
  name: string;
  nameAr: string;
  section: string;
  gradeLevel: {
    name: string;
    nameAr: string;
    level: number;
  };
}

interface TimetableEntry {
  id: string;
  subject: Subject | null;
  class: ClassRoom | null;
  room: any | null;
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

interface TeacherInfo {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  subjects: Subject[];
}

export default function TeacherTimetable() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [timetable, setTimetable] = useState<DayTimetable[]>([]);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeacherTimetable();
  }, []);

  const fetchTeacherTimetable = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get teacher info
      const profileResponse = await fetch('/api/auth/profile');
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch teacher profile');
      }

      const profileData = await profileResponse.json();
      const user = profileData.user;
      const teacher = user.teacher;

      if (!teacher) {
        throw new Error('Teacher profile not found');
      }

      // Set teacher info
      const teacherInfo = {
        ...teacher,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        subjects: teacher.teacherSubjects?.map((ts: any) => ts.subject) || []
      };

      setTeacherInfo(teacherInfo);

      // Fetch teacher's timetable
      const timetableResponse = await fetch(`/api/timetable/teachers/${teacher.id}`);
      if (!timetableResponse.ok) {
        throw new Error('Failed to fetch teacher timetable');
      }

      const timetableData = await timetableResponse.json();
      if (timetableData.success) {
        setTimetable(timetableData.data.timetable || []);
      } else {
        throw new Error('Failed to load timetable data');
      }
    } catch (error) {
      console.error('Error fetching teacher timetable:', error);
      setError(error instanceof Error ? error.message : 'Failed to load timetable');
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
    return dayKeys[day] ? t(dayKeys[day]) : 'Unknown';
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
          Loading timetable...
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
          My Timetable
        </Typography>

        {teacherInfo && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Chip
              icon={<PersonIcon />}
              label={`${teacherInfo.firstName} ${teacherInfo.lastName}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<SchoolIcon />}
              label={`Employee ID: ${teacherInfo.employeeId}`}
              color="secondary"
              variant="outlined"
            />
            {teacherInfo.subjects.map(subject => (
              <Chip
                key={subject.id}
                label={language === 'ar' ? subject.nameAr : subject.name}
                sx={{
                  backgroundColor: subject.color + '20',
                  color: subject.color,
                  borderColor: subject.color
                }}
                variant="outlined"
              />
            ))}
          </Box>
        )}
      </Box>

      {timetable.length > 0 ? (
        <Grid container spacing={2}>
          {timetable.map((day) => (
            <Grid item xs={12} md={6} lg={4} key={day.day}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {language === 'ar' ? day.dayNameAr : day.dayName}
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Time</TableCell>
                          <TableCell>Subject</TableCell>
                          <TableCell>Class</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {day.slots.map((slot, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2">
                                {formatTime(slot.timeSlot.startTime)} - {formatTime(slot.timeSlot.endTime)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {slot.entry?.subject ? (
                                <Chip
                                  label={language === 'ar' ? slot.entry.subject.nameAr : slot.entry.subject.name}
                                  size="small"
                                  sx={{
                                    backgroundColor: slot.entry.subject.color + '20',
                                    color: slot.entry.subject.color,
                                    fontSize: '0.75rem'
                                  }}
                                />
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  {slot.timeSlot.slotType === 'BREAK' ? 'Break' :
                                   slot.timeSlot.slotType === 'LUNCH' ? 'Lunch' : 'Free'}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {slot.entry?.class ? (
                                <Typography variant="body2">
                                  {language === 'ar' ? slot.entry.class.nameAr : slot.entry.class.name}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info">
          No timetable entries found for this teacher.
        </Alert>
      )}
    </Box>
  );
}