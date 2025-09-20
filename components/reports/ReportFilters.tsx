'use client';

import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  Typography,
  SelectChangeEvent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

interface ReportFiltersProps {
  onFiltersChange: (filters: ReportFilters) => void;
  showClassFilter?: boolean;
  showStudentFilter?: boolean;
  showTeacherFilter?: boolean;
  showSubjectFilter?: boolean;
  classes?: Array<{ id: string; name: string }>;
  students?: Array<{ id: string; firstName: string; lastName: string }>;
  teachers?: Array<{ id: string; firstName: string; lastName: string }>;
  subjects?: Array<{ id: string; name: string }>;
}

export interface ReportFilters {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  classRoomId?: string;
  studentId?: string;
  teacherId?: string;
  subjectId?: string;
}

export default function ReportFilters({
  onFiltersChange,
  showClassFilter = false,
  showStudentFilter = false,
  showTeacherFilter = false,
  showSubjectFilter = false,
  classes = [],
  students = [],
  teachers = [],
  subjects = []
}: ReportFiltersProps) {
  const [filters, setFilters] = React.useState<ReportFilters>({
    startDate: dayjs().subtract(30, 'days'),
    endDate: dayjs(),
  });

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSelectChange = (key: keyof ReportFilters) => (event: SelectChangeEvent) => {
    handleFilterChange(key, event.target.value);
  };

  const handleDateChange = (key: 'startDate' | 'endDate') => (date: Dayjs | null) => {
    handleFilterChange(key, date);
  };

  const resetFilters = () => {
    const defaultFilters = {
      startDate: dayjs().subtract(30, 'days'),
      endDate: dayjs(),
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Report Filters
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={handleDateChange('startDate')}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="End Date"
              value={filters.endDate}
              onChange={handleDateChange('endDate')}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>

          {showClassFilter && (
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  value={filters.classRoomId || ''}
                  onChange={handleSelectChange('classRoomId')}
                  label="Class"
                >
                  <MenuItem value="">
                    <em>All Classes</em>
                  </MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {showStudentFilter && (
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Student</InputLabel>
                <Select
                  value={filters.studentId || ''}
                  onChange={handleSelectChange('studentId')}
                  label="Student"
                >
                  <MenuItem value="">
                    <em>All Students</em>
                  </MenuItem>
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {showTeacherFilter && (
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Teacher</InputLabel>
                <Select
                  value={filters.teacherId || ''}
                  onChange={handleSelectChange('teacherId')}
                  label="Teacher"
                >
                  <MenuItem value="">
                    <em>All Teachers</em>
                  </MenuItem>
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {showSubjectFilter && (
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={filters.subjectId || ''}
                  onChange={handleSelectChange('subjectId')}
                  label="Subject"
                >
                  <MenuItem value="">
                    <em>All Subjects</em>
                  </MenuItem>
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              onClick={resetFilters}
              fullWidth
              sx={{ height: '56px' }}
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
}