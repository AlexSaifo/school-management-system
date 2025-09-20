'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import ReportFilters, { ReportFilters as FilterType } from './ReportFilters';
import ReportChart from './ReportChart';
import ReportTable, { createStatusChip, formatPercentage } from './ReportTable';

interface StudentReportsProps {
  studentId?: string;
}

interface AttendanceData {
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendanceRate: number;
  };
  details: Array<{
    id: string;
    date: string;
    status: string;
    timetable?: {
      subject?: {
        name: string;
      };
    };
    classRoom: {
      name: string;
    };
    teacher: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
  }>;
}

interface GradesData {
  overallAverage: number;
  subjectStats: Record<string, {
    subjectName: string;
    grades: Array<{
      marks: number;
      examType: string;
      examDate: string;
    }>;
    average: number;
  }>;
  grades: Array<{
    id: string;
    marks: number;
    examType: string;
    examDate: string;
    subject: {
      name: string;
    };
  }>;
}

export default function StudentReports({ studentId }: StudentReportsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<FilterType>({
    startDate: null,
    endDate: null,
  });
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [gradesData, setGradesData] = useState<GradesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendanceReport = async () => {
    const targetStudentId = studentId || filters.studentId;
    if (!targetStudentId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'student-attendance',
        studentId: targetStudentId,
        ...(filters.startDate && { startDate: filters.startDate.format('YYYY-MM-DD') }),
        ...(filters.endDate && { endDate: filters.endDate.format('YYYY-MM-DD') }),
      });

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error('Failed to fetch attendance data');

      const data = await response.json();
      setAttendanceData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchGradesReport = async () => {
    const targetStudentId = studentId || filters.studentId;
    if (!targetStudentId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'student-grades',
        studentId: targetStudentId,
        ...(filters.startDate && { startDate: filters.startDate.format('YYYY-MM-DD') }),
        ...(filters.endDate && { endDate: filters.endDate.format('YYYY-MM-DD') }),
      });

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error('Failed to fetch grades data');

      const data = await response.json();
      setGradesData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grades data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 0) {
      fetchAttendanceReport();
    } else {
      fetchGradesReport();
    }
  }, [activeTab, filters, studentId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const attendanceColumns = [
    { key: 'date', label: 'Date', format: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'status', label: 'Status', format: createStatusChip },
    { key: 'subject', label: 'Subject', format: (value: any, row: any) => row.timetable?.subject?.name || 'N/A' },
    { key: 'classRoom', label: 'Class', format: (value: any) => value.name },
    { key: 'teacher', label: 'Teacher', format: (value: any) => `${value.user.firstName} ${value.user.lastName}` },
  ];

  const gradesColumns = [
    { key: 'examDate', label: 'Date', format: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'subject', label: 'Subject', format: (value: any) => value.name },
    { key: 'examType', label: 'Exam Type' },
    { key: 'marks', label: 'Marks', align: 'right' as const },
  ];

  return (
    <Box>
      <ReportFilters
        onFiltersChange={setFilters}
        showStudentFilter={!studentId}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Attendance Report" />
          <Tab label="Grades Report" />
        </Tabs>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          {activeTab === 0 && attendanceData && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Attendance Summary
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {formatPercentage(attendanceData.summary.attendanceRate)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overall Attendance Rate
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Total Days: {attendanceData.summary.totalDays}
                      </Typography>
                      <Typography variant="body2">
                        Present: {attendanceData.summary.presentDays}
                      </Typography>
                      <Typography variant="body2">
                        Absent: {attendanceData.summary.absentDays}
                      </Typography>
                      <Typography variant="body2">
                        Late: {attendanceData.summary.lateDays}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <ReportChart
                  title="Attendance Overview"
                  data={[
                    { label: 'Present', value: attendanceData.summary.presentDays, color: '#4caf50' },
                    { label: 'Absent', value: attendanceData.summary.absentDays, color: '#f44336' },
                    { label: 'Late', value: attendanceData.summary.lateDays, color: '#ff9800' },
                  ]}
                  type="pie"
                />
              </Grid>

              <Grid item xs={12}>
                <ReportTable
                  title="Attendance Details"
                  columns={attendanceColumns}
                  data={attendanceData.details}
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && gradesData && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Overall Performance
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {gradesData.overallAverage.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Grade
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <ReportChart
                  title="Subject-wise Performance"
                  data={Object.values(gradesData.subjectStats).map(stat => ({
                    label: stat.subjectName,
                    value: stat.average,
                  }))}
                  type="bar"
                />
              </Grid>

              <Grid item xs={12}>
                <ReportTable
                  title="Grades Details"
                  columns={gradesColumns}
                  data={gradesData.grades}
                />
              </Grid>
            </Grid>
          )}
        </>
      )}
    </Box>
  );
}