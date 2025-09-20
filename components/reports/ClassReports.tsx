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
import ReportTable, { formatPercentage } from './ReportTable';

interface ClassReportsProps {
  classRoomId?: string;
}

interface ClassAttendanceData {
  classSummary: {
    totalRecords: number;
    presentRecords: number;
    attendanceRate: number;
  };
  studentStats: Array<{
    studentId: string;
    studentName: string;
    totalDays: number;
    presentDays: number;
    attendanceRate: number;
  }>;
}

interface ClassGradesData {
  totalGrades: number;
  averageGrade: number;
  gradeDistribution: Record<string, number>;
  grades: Array<{
    id: string;
    marks: number;
    examType: string;
    examDate: string;
    student: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
    subject: {
      name: string;
    };
  }>;
}

export default function ClassReports({ classRoomId }: ClassReportsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<FilterType>({
    startDate: null,
    endDate: null,
  });
  const [attendanceData, setAttendanceData] = useState<ClassAttendanceData | null>(null);
  const [gradesData, setGradesData] = useState<ClassGradesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendanceReport = async () => {
    if (!classRoomId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'class-attendance',
        classRoomId,
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
    if (!classRoomId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'class-grades',
        classRoomId,
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
  }, [activeTab, filters, classRoomId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const attendanceColumns = [
    { key: 'studentName', label: 'Student Name' },
    { key: 'totalDays', label: 'Total Days', align: 'right' as const },
    { key: 'presentDays', label: 'Present Days', align: 'right' as const },
    { key: 'attendanceRate', label: 'Attendance Rate', align: 'right' as const, format: formatPercentage },
  ];

  const gradesColumns = [
    { key: 'examDate', label: 'Date', format: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'student', label: 'Student', format: (value: any) => `${value.user.firstName} ${value.user.lastName}` },
    { key: 'subject', label: 'Subject', format: (value: any) => value.name },
    { key: 'examType', label: 'Exam Type' },
    { key: 'marks', label: 'Marks', align: 'right' as const },
  ];

  return (
    <Box>
      <ReportFilters
        onFiltersChange={setFilters}
        showClassFilter={!classRoomId}
        showSubjectFilter={activeTab === 1}
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
                      Class Attendance Summary
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {formatPercentage(attendanceData.classSummary.attendanceRate)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overall Attendance Rate
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Total Records: {attendanceData.classSummary.totalRecords}
                      </Typography>
                      <Typography variant="body2">
                        Present: {attendanceData.classSummary.presentRecords}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <ReportChart
                  title="Student Attendance Distribution"
                  data={attendanceData.studentStats.map(stat => ({
                    label: stat.studentName.split(' ')[0], // First name only for chart
                    value: stat.attendanceRate,
                  }))}
                  type="bar"
                />
              </Grid>

              <Grid item xs={12}>
                <ReportTable
                  title="Student Attendance Details"
                  columns={attendanceColumns}
                  data={attendanceData.studentStats}
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
                      Class Performance
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {gradesData.averageGrade.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Grade
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Total Grades: {gradesData.totalGrades}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <ReportChart
                  title="Grade Distribution"
                  data={Object.entries(gradesData.gradeDistribution).map(([range, count]) => ({
                    label: range,
                    value: count,
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