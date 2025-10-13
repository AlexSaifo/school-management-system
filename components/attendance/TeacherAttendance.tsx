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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Alert as MuiAlert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface Grade {
  id: string;
  name: string;
  nameAr: string;
  level: number;
}

interface Classroom {
  id: string;
  name: string;
  nameAr: string;
  section: string;
  sectionNumber: number;
  roomNumber: string;
  capacity: number;
  gradeLevel: {
    id: string;
    name: string;
    nameAr: string;
    level: number;
  };
  _count: {
    students: number;
  };
}

interface Subject {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  color?: string;
  timeSlots: Array<{
    dayOfWeek: number;
    timeSlot: {
      id: string;
      name: string;
      nameAr: string;
      startTime: string;
      endTime: string;
    };
  }>;
}

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  rollNumber?: string;
  attendance: {
    id: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    remarks?: string;
  } | null;
}

export default function TeacherAttendance() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(dayjs());

  const [loading, setLoading] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const [attendanceDialog, setAttendanceDialog] = useState<{
    open: boolean;
    student: Student | null;
  }>({ open: false, student: null });

  // Helper functions for snackbar
  const showSuccessSnackbar = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success',
    });
  };

  const showErrorSnackbar = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'error',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Helper function to get the appropriate name based on current language
  const getLocalizedName = (item: { name: string; nameAr: string }) => {
    return language === 'ar' ? item.nameAr : item.name;
  };

  // Load grades on component mount
  useEffect(() => {
    loadGrades();
  }, []);

  // Load classrooms when grade is selected
  useEffect(() => {
    if (selectedGrade) {
      loadClassrooms(selectedGrade);
      setSelectedClassroom('');
      setSelectedSubject('');
      setSubjects([]);
      setStudents([]);
    }
  }, [selectedGrade]);

  // Load subjects when classroom is selected
  useEffect(() => {
    if (selectedClassroom) {
      loadSubjects(selectedClassroom);
      setSelectedSubject('');
      setStudents([]);
    }
  }, [selectedClassroom]);

  // Load students when subject and date are selected
  useEffect(() => {
    if (selectedClassroom && selectedSubject && selectedDate) {
      loadStudents(selectedClassroom, selectedSubject, selectedDate.format('YYYY-MM-DD'));
    }
  }, [selectedClassroom, selectedSubject, selectedDate]);

  const loadGrades = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attendance');
      if (response.ok) {
        const data = await response.json();
        setGrades(data);
      } else {
        showErrorSnackbar(t('attendance.failedToLoadGrades', 'Failed to load grades'));
      }
    } catch (error) {
      showErrorSnackbar(t('attendance.failedToLoadGrades', 'Failed to load grades'));
    } finally {
      setLoading(false);
    }
  };

  const loadClassrooms = async (gradeId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendance/classrooms?gradeId=${gradeId}`);
      if (response.ok) {
        const data = await response.json();
        setClassrooms(data);
      } else {
        showErrorSnackbar(t('attendance.failedToLoadClassrooms', 'Failed to load classrooms'));
      }
    } catch (error) {
      showErrorSnackbar(t('attendance.failedToLoadClassrooms', 'Failed to load classrooms'));
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async (classroomId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendance/subjects?classroomId=${classroomId}&teacherId=current`);
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      } else {
        showErrorSnackbar(t('attendance.failedToLoadSubjects', 'Failed to load subjects'));
      }
    } catch (error) {
      showErrorSnackbar(t('attendance.failedToLoadSubjects', 'Failed to load subjects'));
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classroomId: string, subjectId: string, date: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendance/students?classroomId=${classroomId}&subjectId=${subjectId}&date=${date}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      } else {
        showErrorSnackbar(t('attendance.failedToLoadStudents', 'Failed to load students'));
      }
    } catch (error) {
      showErrorSnackbar(t('attendance.failedToLoadStudents', 'Failed to load students'));
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = async (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    if (!selectedClassroom || !selectedSubject || !selectedDate) {
      showErrorSnackbar(t('attendance.selectGradeClassroomSubjectDate', 'Please select grade, classroom, subject, and date'));
      return;
    }

    const previousStudent = students.find((student) => student.id === studentId);
    const previousAttendance = previousStudent?.attendance
      ? { ...previousStudent.attendance }
      : null;

    // Update local state immediately for UI responsiveness
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === studentId
          ? {
              ...student,
              attendance: {
                id: previousAttendance?.id || '',
                status,
                remarks: previousAttendance?.remarks || '',
              },
            }
          : student
      )
    );

    try {
      const response = await fetch('/api/attendance/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classroomId: selectedClassroom,
          subjectId: selectedSubject,
          date: selectedDate.format('YYYY-MM-DD'),
          attendanceRecords: [{
            studentId,
            status,
            remarks: students.find(s => s.id === studentId)?.attendance?.remarks || '',
          }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        showErrorSnackbar(errorData.error || t('attendance.attendanceUpdateFailed', 'Failed to update attendance'));
        // Revert the local state change on error
        setStudents(prevStudents =>
          prevStudents.map(student =>
            student.id === studentId
              ? {
                  ...student,
                  attendance: previousAttendance ? { ...previousAttendance } : null,
                }
              : student
          )
        );
      } else {
        showSuccessSnackbar(t('attendance.attendanceUpdated', 'Attendance updated successfully'));
      }
    } catch (error) {
      showErrorSnackbar(t('attendance.attendanceUpdateFailed', 'Failed to update attendance'));
      // Revert the local state change on error
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student.id === studentId
            ? {
                ...student,
                attendance: previousAttendance ? { ...previousAttendance } : null,
              }
            : student
        )
      );
    }
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === studentId
          ? {
              ...student,
              attendance: student.attendance
                ? {
                    ...student.attendance,
                    remarks,
                  }
                : null,
            }
          : student
      )
    );
  };

  const getStatusColor = (status?: string | null) => {
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

  const getStatusLabel = (status?: string | null) => {
    switch (status) {
      case 'PRESENT':
        return t('attendance.present', 'Present');
      case 'ABSENT':
        return t('attendance.absent', 'Absent');
      case 'LATE':
        return t('attendance.late', 'Late');
      case 'EXCUSED':
        return t('attendance.excused', 'Excused');
      default:
        return t('attendance.notMarked', 'Not Marked');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box >
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>{t('attendance.selectGrade', 'Grade')}</InputLabel>
                <Select
                  value={selectedGrade}
                  label={t('attendance.selectGrade', 'Grade')}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                >
                  {grades.map((grade) => (
                    <MenuItem key={grade.id} value={grade.id}>
                      {getLocalizedName(grade)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200 }} disabled={!selectedGrade}>
                <InputLabel>{t('attendance.selectClassroom', 'Classroom')}</InputLabel>
                <Select
                  value={selectedClassroom}
                  label={t('attendance.selectClassroom', 'Classroom')}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                >
                  {classrooms.map((classroom) => (
                    <MenuItem key={classroom.id} value={classroom.id}>
                      {getLocalizedName(classroom)} ({classroom._count.students} students)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200 }} disabled={!selectedClassroom}>
                <InputLabel>{t('attendance.selectSubject', 'Subject')}</InputLabel>
                <Select
                  value={selectedSubject}
                  label={t('attendance.selectSubject', 'Subject')}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {getLocalizedName(subject)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DatePicker
                label={t('attendance.selectDate', 'Date')}
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                slotProps={{ textField: { sx: { minWidth: 200 } } }}
              />
            </Box>
          </CardContent>
        </Card>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {students.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('attendance.studentAttendance', 'Student Attendance')}
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('attendance.rollNo', 'Roll No.')}</TableCell>
                      <TableCell>{t('attendance.studentName', 'Student Name')}</TableCell>
                      <TableCell>{t('attendance.status', 'Status')}</TableCell>
                      <TableCell>{t('attendance.remarks', 'Remarks')}</TableCell>
                      <TableCell>{t('attendance.actions', 'Actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.rollNumber || '-'}</TableCell>
                        <TableCell>
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(student.attendance?.status)}
                            color={getStatusColor(student.attendance?.status)}
                            size="small"
                            variant={student.attendance?.status ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell>{student.attendance?.remarks || '-'}</TableCell>
                        <TableCell>
                          <RadioGroup
                            row
                            value={student.attendance?.status ?? ''}
                            onChange={(e) => handleAttendanceChange(student.id, e.target.value as any)}
                          >
                            <FormControlLabel value="PRESENT" control={<Radio />} label={t('attendance.present', 'Present')} />
                            <FormControlLabel value="ABSENT" control={<Radio />} label={t('attendance.absent', 'Absent')} />
                            <FormControlLabel value="LATE" control={<Radio />} label={t('attendance.late', 'Late')} />
                            <FormControlLabel value="EXCUSED" control={<Radio />} label={t('attendance.excused', 'Excused')} />
                          </RadioGroup>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {students.length === 0 && !loading && selectedClassroom && selectedSubject && selectedDate && (
          <Alert severity="info">
            {t('attendance.noStudentsFound', 'No students found in this classroom.')}
          </Alert>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <MuiAlert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </MuiAlert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
