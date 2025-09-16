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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

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
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(dayjs());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [attendanceDialog, setAttendanceDialog] = useState<{
    open: boolean;
    student: Student | null;
  }>({ open: false, student: null });

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
        setError('Failed to load grades');
      }
    } catch (error) {
      setError('Failed to load grades');
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
        setError('Failed to load classrooms');
      }
    } catch (error) {
      setError('Failed to load classrooms');
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
        setError('Failed to load subjects');
      }
    } catch (error) {
      setError('Failed to load subjects');
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
        setError('Failed to load students');
      }
    } catch (error) {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === studentId
          ? {
              ...student,
              attendance: {
                id: student.attendance?.id || '',
                status,
                remarks: student.attendance?.remarks || '',
              },
            }
          : student
      )
    );
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === studentId
          ? {
              ...student,
              attendance: {
                id: student.attendance?.id || '',
                status: student.attendance?.status || 'PRESENT',
                remarks,
              },
            }
          : student
      )
    );
  };

  const saveAttendance = async () => {
    if (!selectedClassroom || !selectedSubject || !selectedDate) {
      setError('Please select grade, classroom, subject, and date');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const attendanceRecords = students.map(student => ({
        studentId: student.id,
        status: student.attendance?.status || 'PRESENT',
        remarks: student.attendance?.remarks || '',
      }));

      const response = await fetch('/api/attendance/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classroomId: selectedClassroom,
          subjectId: selectedSubject,
          date: selectedDate.format('YYYY-MM-DD'),
          attendanceRecords,
        }),
      });

      if (response.ok) {
        setSuccess('Attendance saved successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save attendance');
      }
    } catch (error) {
      setError('Failed to save attendance');
    } finally {
      setSaving(false);
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={selectedGrade}
                  label="Grade"
                  onChange={(e) => setSelectedGrade(e.target.value)}
                >
                  {grades.map((grade) => (
                    <MenuItem key={grade.id} value={grade.id}>
                      {grade.name} ({grade.nameAr})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200 }} disabled={!selectedGrade}>
                <InputLabel>Classroom</InputLabel>
                <Select
                  value={selectedClassroom}
                  label="Classroom"
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                >
                  {classrooms.map((classroom) => (
                    <MenuItem key={classroom.id} value={classroom.id}>
                      {classroom.name} ({classroom._count.students} students)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200 }} disabled={!selectedClassroom}>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={selectedSubject}
                  label="Subject"
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.nameAr})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DatePicker
                label="Date"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                slotProps={{ textField: { sx: { minWidth: 200 } } }}
              />

              <Button
                variant="contained"
                onClick={saveAttendance}
                disabled={saving || !selectedClassroom || !selectedSubject || !selectedDate}
                sx={{ minWidth: 120 }}
              >
                {saving ? <CircularProgress size={20} /> : 'Save Attendance'}
              </Button>
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
                Student Attendance
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Roll No.</TableCell>
                      <TableCell>Student Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Remarks</TableCell>
                      <TableCell>Actions</TableCell>
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
                            label={getStatusLabel(student.attendance?.status || 'PRESENT')}
                            color={getStatusColor(student.attendance?.status || 'PRESENT')}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{student.attendance?.remarks || '-'}</TableCell>
                        <TableCell>
                          <RadioGroup
                            row
                            value={student.attendance?.status || 'PRESENT'}
                            onChange={(e) => handleAttendanceChange(student.id, e.target.value as any)}
                          >
                            <FormControlLabel value="PRESENT" control={<Radio />} label="Present" />
                            <FormControlLabel value="ABSENT" control={<Radio />} label="Absent" />
                            <FormControlLabel value="LATE" control={<Radio />} label="Late" />
                            <FormControlLabel value="EXCUSED" control={<Radio />} label="Excused" />
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
            No students found in this classroom.
          </Alert>
        )}
      </Box>
    </LocalizationProvider>
  );
}
