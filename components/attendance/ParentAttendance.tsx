'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Avatar,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface Child {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  classRoom: {
    name: string;
    nameAr: string;
    gradeLevel: {
      name: string;
      nameAr: string;
    } | null;
  } | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
  subject: {
    id: string;
    name: string;
    nameAr: string;
    code: string;
  } | null;
  timeSlot: {
    id: string;
    name: string;
    nameAr: string;
    startTime: string;
    endTime: string;
  } | null;
  teacher: {
    firstName: string;
    lastName: string;
  } | null;
}

interface AttendanceData {
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    classRoom: {
      name: string;
      nameAr: string;
      gradeLevel: {
        name: string;
        nameAr: string;
      } | null;
    } | null;
  };
  attendance: {
    records: AttendanceRecord[];
    statistics: {
      total: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
      attendanceRate: number;
    };
  };
}

export default function ParentAttendance() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(dayjs().subtract(30, 'days'));
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(dayjs());

  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Helper function to get the appropriate name based on current language
  const getLocalizedName = (item: { name: string; nameAr: string }) => {
    return language === 'ar' ? item.nameAr : item.name;
  };

  // Load children on component mount
  useEffect(() => {
    loadChildren();
  }, []);

  // Load attendance when filters change
  useEffect(() => {
    if (selectedChild) {
      loadAttendance();
    }
  }, [selectedChild, selectedSubject, startDate, endDate]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/parent/children');
      if (response.ok) {
        const data = await response.json();
        setChildren(data.children || []);
        if (data.children && data.children.length > 0) {
          setSelectedChild(data.children[0].id);
        }
      } else {
        setError('Failed to load children');
      }
    } catch (error) {
      setError('Failed to load children');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    if (!selectedChild) return;

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        studentId: selectedChild,
      });

      if (selectedSubject) {
        params.append('subjectId', selectedSubject);
      }

      if (startDate) {
        params.append('startDate', startDate.format('YYYY-MM-DD'));
      }

      if (endDate) {
        params.append('endDate', endDate.format('YYYY-MM-DD'));
      }

      const response = await fetch(`/api/parent/attendance?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load attendance');
      }
    } catch (error) {
      setError('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'success';
      case 'ABSENT':
        return 'error';
      case 'LATE':
        return 'warning';
      case 'EXCUSED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'Present';
      case 'ABSENT':
        return 'Absent';
      case 'LATE':
        return 'Late';
      case 'EXCUSED':
        return 'Excused';
      default:
        return 'Not Marked';
    }
  };

  const getUniqueSubjects = () => {
    if (!attendanceData) return [];
    const subjects = attendanceData.attendance.records
      .map(record => record.subject)
      .filter((subject, index, self) =>
        subject && self.findIndex(s => s?.id === subject.id) === index
      );
    return subjects;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{}}>


        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Select Child</InputLabel>
                <Select
                  value={selectedChild}
                  label="Select Child"
                  onChange={(e) => setSelectedChild(e.target.value)}
                >
                  {children.map((child) => (
                    <MenuItem key={child.id} value={child.id}>
                      {child.firstName} {child.lastName} - {child.classRoom ? getLocalizedName(child.classRoom) : 'No Class'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Subject (Optional)</InputLabel>
                <Select
                  value={selectedSubject}
                  label="Subject (Optional)"
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Subjects</em>
                  </MenuItem>
                  {getUniqueSubjects().map((subject) => (
                    <MenuItem key={subject?.id} value={subject?.id}>
                      {subject ? getLocalizedName(subject) : 'Unknown'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { sx: { minWidth: 150 } } }}
              />

              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { sx: { minWidth: 150 } } }}
              />

              <Button
                variant="outlined"
                onClick={loadAttendance}
                disabled={!selectedChild}
              >
                Refresh
              </Button>
            </Box>
          </CardContent>
        </Card>

        {attendanceData && (
          <>
            {/* Student Info and Statistics */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2 }}>
                        {attendanceData.student.firstName[0]}
                        {attendanceData.student.lastName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {attendanceData.student.firstName} {attendanceData.student.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Student ID: {attendanceData.student.studentId}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Class: {attendanceData.student.classRoom ? getLocalizedName(attendanceData.student.classRoom) : 'Not Assigned'}
                        </Typography>
                        {attendanceData.student.classRoom?.gradeLevel && (
                          <Typography variant="body2" color="text.secondary">
                            Grade: {getLocalizedName(attendanceData.student.classRoom.gradeLevel)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Attendance Statistics
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Chip
                        label={`Present: ${attendanceData.attendance.statistics.present}`}
                        color="success"
                        variant="outlined"
                      />
                      <Chip
                        label={`Absent: ${attendanceData.attendance.statistics.absent}`}
                        color="error"
                        variant="outlined"
                      />
                      <Chip
                        label={`Late: ${attendanceData.attendance.statistics.late}`}
                        color="warning"
                        variant="outlined"
                      />
                      <Chip
                        label={`Excused: ${attendanceData.attendance.statistics.excused}`}
                        color="info"
                        variant="outlined"
                      />
                      <Chip
                        label={`Rate: ${attendanceData.attendance.statistics.attendanceRate}%`}
                        color={attendanceData.attendance.statistics.attendanceRate >= 80 ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Attendance Records */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Attendance Records
                </Typography>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : attendanceData.attendance.records.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Subject</TableCell>
                          <TableCell>Time</TableCell>
                          <TableCell>Teacher</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Remarks</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {attendanceData.attendance.records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              {dayjs(record.date).format('MMM DD, YYYY')}
                            </TableCell>
                            <TableCell>
                              {record.subject ? `${getLocalizedName(record.subject)} (${record.subject.code})` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {record.timeSlot ? `${record.timeSlot.startTime} - ${record.timeSlot.endTime}` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {record.teacher ? `${record.teacher.firstName} ${record.teacher.lastName}` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusLabel(record.status)}
                                color={getStatusColor(record.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{record.remarks || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">
                    No attendance records found for the selected period.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {children.length === 0 && !loading && (
          <Alert severity="info">
            No children found. Please contact the school administration.
          </Alert>
        )}
      </Box>
    </LocalizationProvider>
  );
}
