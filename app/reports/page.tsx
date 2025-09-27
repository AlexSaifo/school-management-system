'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Container,
  Grid,
  Paper,
  Button,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Avatar,
  AvatarGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import dayjs, { Dayjs } from 'dayjs';

import SidebarLayout from '@/components/layout/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import ReportHeader from '@/components/reports/ReportHeader';
import StatisticsSummary, { StatCard } from '@/components/reports/StatisticsSummary';
import DashboardCard from '@/components/reports/DashboardCard';
import ReportChart from '@/components/reports/ReportChart';
import { downloadCSV } from '@/lib/export-utils';
import { useTranslation } from 'react-i18next';// Define interfaces for the data structures
interface Student {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  grade?: string;
  gradeLevel?: { name: string };
  averageGrade?: number;
  academicRecord?: { averageGrade: number };
  attendance?: number;
  attendanceRate?: number;
  dateOfBirth?: string;
  gender?: string;
  contact?: string;
  contactNumber?: string;
  email?: string;
  gradesData?: any;
  attendanceData?: any;
}

interface Teacher {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  departmentName?: string;
  performance?: number;
  performanceRating?: number;
  subjects?: string[];
  subjectsTaught?: { name: string }[];
  email?: string;
  contact?: string;
  contactNumber?: string;
  qualification?: string;
  joiningDate?: string;
  createdAt?: string;
  performanceData?: any;
  classes?: any[];
}

interface ClassItem {
  id: string;
  name: string;
  gradeLevel: {
    id: string;
    level: number;
    nameAr: string;
  };
}

interface Subject {
  id: string;
  name: string;
}

interface AttendanceItem {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

interface GradeDistributionItem {
  gradeRange: string;
  count: number;
  percentage: number;
}

interface MonthlyAttendanceItem {
  month: string;
  attendance: number;
}

interface SubjectPerformanceItem {
  subject: string;
  average: number;
}



export default function ReportsPage() {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('term');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<{
    start: dayjs.Dayjs;
    end: dayjs.Dayjs;
  }>({
    start: dayjs().subtract(3, 'month'),
    end: dayjs()
  });
  
  // Helper function to handle DatePicker changes safely
  const handleDateChange = (type: 'start' | 'end', newValue: dayjs.Dayjs | null): void => {
    setDateRange(prev => {
      if (newValue === null) {
        // If the value is null, use a default value
        const defaultValue = type === 'start' ? dayjs().subtract(3, 'month') : dayjs();
        return { ...prev, [type]: defaultValue };
      }
      return { ...prev, [type]: newValue };
    });
  };
  
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceItem[]>([]);
  const [showAllAttendanceRecords, setShowAllAttendanceRecords] = useState(false);
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistributionItem[]>([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<MonthlyAttendanceItem[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for detail views
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [showTeacherDetails, setShowTeacherDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Load data from API
  useEffect(() => {
    if (!token) return;
    
    const fetchReportData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch academic years
        const academicYearsResponse = await fetch('/api/academic/academic-years', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (academicYearsResponse.ok) {
          const academicYearsData = await academicYearsResponse.json();
          console.log('Academic Years API response:', academicYearsData);
          const years = academicYearsData.data || academicYearsData.academicYears || [];
          console.log('Academic years array:', years);
          console.log('Number of academic years:', years.length);
          setAcademicYears(years);
          
          // Set default academic year if not set and years are available
          if (selectedAcademicYear === 'all' && years.length > 0) {
            // Find the active academic year or use the first one
            const activeYear = years.find((year: any) => year.isActive) || years[0];
            console.log('Setting default academic year to:', activeYear);
            setSelectedAcademicYear(activeYear.id);
          }
        } else {
          console.error('Academic Years API failed:', academicYearsResponse.status, await academicYearsResponse.text());
          // Don't use fallback data - keep empty array
          setAcademicYears([]);
        }

        // Fetch students
        const studentsResponse = await fetch('/api/users/students', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          console.log('Students API response:', studentsData);
          // Flatten the nested user data and prepare for merging with performance data
          const flattenedStudents = (studentsData.data?.students || []).map((student: any) => ({
            ...student,
            name: `${student.user.firstName} ${student.user.lastName}`,
            firstName: student.user.firstName,
            lastName: student.user.lastName,
            email: student.user.email,
            phone: student.user.phone,
            // Extract grade information properly
            grade: student.grade || student.gradeLevelData?.name || 'N/A',
            gradeLevel: student.gradeLevelData,
            // These will be populated from attendance/grades APIs
            averageGrade: null,
            attendance: null
          }));
          console.log('Flattened students:', flattenedStudents.slice(0, 3)); // Log first 3 students
          console.log('Sample student structure:', flattenedStudents[0]); // Log detailed structure of first student
          setStudents(flattenedStudents);
        } else {
          console.error('Students API failed:', studentsResponse.status, await studentsResponse.text());
        }
        
        // Fetch classes
        const classesResponse = await fetch('/api/academic/classes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (classesResponse.ok) {
          const classesData = await classesResponse.json();
          console.log('Classes API response:', classesData);
          setClasses(classesData.data || classesData.classRooms || []);
        } else {
          console.error('Classes API failed:', classesResponse.status, await classesResponse.text());
        }
        
        // Fetch teachers
        const teachersResponse = await fetch('/api/users/teachers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (teachersResponse.ok) {
          const teachersData = await teachersResponse.json();
          console.log('Teachers API response:', teachersData);
          // Flatten the nested user data
          const flattenedTeachers = (teachersData.data?.teachers || []).map((teacher: any) => ({
            ...teacher,
            name: `${teacher.user.firstName} ${teacher.user.lastName}`,
            firstName: teacher.user.firstName,
            lastName: teacher.user.lastName,
            email: teacher.user.email,
            phone: teacher.user.phoneNumber,
            subjects: teacher.subjects?.map((s: any) => s.name) || [],
            // This will be populated from performance data
            performance: null
          }));
          setTeachers(flattenedTeachers);
        } else {
          console.error('Teachers API failed:', teachersResponse.status, await teachersResponse.text());
        }
        
        // Fetch subjects
        const subjectsResponse = await fetch('/api/academic/subjects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (subjectsResponse.ok) {
          const subjectsData = await subjectsResponse.json();
          console.log('Subjects API response:', subjectsData);
          setSubjects(subjectsData.data || []);
        } else {
          console.error('Subjects API failed:', subjectsResponse.status, await subjectsResponse.text());
        }
        
        // Fetch attendance data
        const startDateStr = dateRange.start.format('YYYY-MM-DD');
        const endDateStr = dateRange.end.format('YYYY-MM-DD');
        
        const attendanceResponse = await fetch(`/api/reports?type=class-attendance&startDate=${startDateStr}&endDate=${endDateStr}${selectedClass !== 'all' ? `&classRoomId=${selectedClass}` : ''}${selectedAcademicYear !== 'all' ? `&academicYearId=${selectedAcademicYear}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          console.log('Attendance API response:', attendanceData);
          
          // Process attendance details to group by date and calculate daily counts
          const rawAttendances = attendanceData.details || [];
          console.log('Raw attendance records:', rawAttendances.slice(0, 5)); // Log first 5 records for debugging
          
          const dailyAttendanceMap = new Map();
          
          rawAttendances.forEach((record: any) => {
            // Handle different date formats from the API
            let dateStr = record.date;
            if (dateStr && dateStr.includes('T')) {
              dateStr = dateStr.split('T')[0]; // Extract date part if it's a full ISO string
            } else if (dateStr) {
              // If it's already just a date, use it as is
              dateStr = new Date(record.date).toISOString().split('T')[0];
            }
            
            if (!dailyAttendanceMap.has(dateStr)) {
              dailyAttendanceMap.set(dateStr, {
                date: dateStr,
                present: 0,
                absent: 0,
                late: 0,
                excused: 0,
                total: 0
              });
            }
            
            const dayData = dailyAttendanceMap.get(dateStr);
            dayData.total += 1;
            
            switch (record.status || record.attendanceStatus) {
              case 'PRESENT':
              case 'present':
                dayData.present += 1;
                break;
              case 'ABSENT':
              case 'absent':
                dayData.absent += 1;
                break;
              case 'LATE':
              case 'late':
                dayData.late += 1;
                break;
              case 'EXCUSED':
              case 'excused':
                dayData.excused += 1;
                break;
              default:
                console.log('Unknown attendance status:', record.status || record.attendanceStatus);
                break;
            }
          });
          
          const processedAttendanceData = Array.from(dailyAttendanceMap.values());
          console.log('Processed attendance data:', processedAttendanceData);
          setAttendanceData(processedAttendanceData);

          // Process monthly attendance data from the response
          const monthlyData = attendanceData.monthlyTrend || [];
          setMonthlyAttendance(monthlyData);

          // Merge student attendance data with student records
          if (attendanceData.studentStats && attendanceData.studentStats.length > 0) {
            console.log('Merging attendance data with students:', attendanceData.studentStats);
            setStudents(prevStudents =>
              prevStudents.map(student => {
                const studentStat = attendanceData.studentStats.find((stat: any) => stat.studentId === student.id);
                if (studentStat) {
                  console.log(`Found attendance for student ${student.id}:`, studentStat);
                  return {
                    ...student,
                    attendance: studentStat.attendanceRate || studentStat.rate || 0
                  };
                }
                return student;
              })
            );
          } else {
            console.log('No studentStats found, calculating from raw attendance data');
            // Fallback: Calculate attendance from raw attendance records
            const rawAttendances = attendanceData.details || [];
            const studentAttendanceMap = new Map();
            
            rawAttendances.forEach((record: any) => {
              const studentId = record.studentId;
              if (!studentAttendanceMap.has(studentId)) {
                studentAttendanceMap.set(studentId, { total: 0, present: 0 });
              }
              const stats = studentAttendanceMap.get(studentId);
              stats.total += 1;
              if (record.status === 'PRESENT') {
                stats.present += 1;
              }
            });
            
            setStudents(prevStudents =>
              prevStudents.map(student => {
                const attendanceStats = studentAttendanceMap.get(student.id);
                if (attendanceStats && attendanceStats.total > 0) {
                  const rate = (attendanceStats.present / attendanceStats.total) * 100;
                  return {
                    ...student,
                    attendance: Math.round(rate * 100) / 100
                  };
                }
                return student;
              })
            );
          }

          // Process grade distribution from the response
          const gradesResponse = await fetch(`/api/reports?type=class-grades&startDate=${startDateStr}&endDate=${endDateStr}${selectedClass !== 'all' ? `&classRoomId=${selectedClass}` : ''}${selectedAcademicYear !== 'all' ? `&academicYearId=${selectedAcademicYear}` : ''}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (gradesResponse.ok) {
            const gradesData = await gradesResponse.json();
            console.log('Grades API response:', gradesData);
            setGradeDistribution(gradesData.gradeDistribution || []);
            setSubjectPerformance(gradesData.subjectPerformance || []);
            
            // Calculate individual student averages from grades data
            if (gradesData.grades && gradesData.grades.length > 0) {
              console.log('Processing individual student grades:', gradesData.grades.slice(0, 5)); // Log first 5 grades
              
              // Group grades by student
              const studentGradesMap = new Map();
              gradesData.grades.forEach((grade: any) => {
                const studentId = grade.studentId;
                if (!studentGradesMap.has(studentId)) {
                  studentGradesMap.set(studentId, []);
                }
                studentGradesMap.get(studentId).push(grade);
              });
              
              console.log('Student grades map:', Array.from(studentGradesMap.entries()));
              
              // Calculate average for each student
              setStudents(prevStudents =>
                prevStudents.map(student => {
                  const studentGrades = studentGradesMap.get(student.id) || [];
                  if (studentGrades.length > 0) {
                    const totalMarks = studentGrades.reduce((sum: number, grade: any) => sum + Number(grade.marks), 0);
                    const average = totalMarks / studentGrades.length;
                    return {
                      ...student,
                      averageGrade: Math.round(average * 100) / 100
                    };
                  }
                  return {
                    ...student,
                    averageGrade: 0 // Set to 0 if no grades found
                  };
                })
              );
            } else {
              console.log('No grades found in grades API response');
              // Set default average grade of 0 for all students
              setStudents(prevStudents =>
                prevStudents.map(student => ({
                  ...student,
                  averageGrade: 0
                }))
              );
            }
          } else {
            console.error('Grades API failed:', gradesResponse.status, await gradesResponse.text());
          }
        }
      } catch (error) {
        console.error('Failed to fetch report data:', error);
        setError(t('reports.failedToLoadReportData'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [token, selectedClass, selectedAcademicYear, dateRange]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const clearFilters = () => {
    setSelectedClass('all');
    setSelectedAcademicYear('all');
    setSelectedPeriod('term');
    setDateRange({
      start: dayjs().subtract(3, 'month'),
      end: dayjs()
    });
  };
  
  // Handler for viewing student details
  const handleViewStudentDetails = async (student: any) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
    setDetailsLoading(true);
    
    try {
      if (token) {
        // Fetch detailed student data including attendance and grades
        const studentId = student.id;
        const startDateStr = dateRange.start.format('YYYY-MM-DD');
        const endDateStr = dateRange.end.format('YYYY-MM-DD');
        
        const detailsResponse = await fetch(`/api/reports?type=student-grades&studentId=${studentId}&startDate=${startDateStr}&endDate=${endDateStr}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (detailsResponse.ok) {
          const gradesData = await detailsResponse.json();
          
          // Fetch attendance data
          const attendanceResponse = await fetch(`/api/reports?type=student-attendance&studentId=${studentId}&startDate=${startDateStr}&endDate=${endDateStr}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (attendanceResponse.ok) {
            const attendanceData = await attendanceResponse.json();
            
            // Update the selected student with the detailed data
            setSelectedStudent({
              ...student,
              gradesData,
              attendanceData
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch student details:', error);
      setError(t('reports.failedToLoadStudentDetails'));
    } finally {
      setDetailsLoading(false);
    }
  };
  
  // Handler for viewing teacher details
  const handleViewTeacherDetails = async (teacher: any) => {
    setSelectedTeacher(teacher);
    setShowTeacherDetails(true);
    setDetailsLoading(true);
    
    try {
      if (token) {
        // Fetch detailed teacher data including performance and subjects
        const teacherId = teacher.id;
        const startDateStr = dateRange.start.format('YYYY-MM-DD');
        const endDateStr = dateRange.end.format('YYYY-MM-DD');
        
        const detailsResponse = await fetch(`/api/reports?type=teacher-performance&teacherId=${teacherId}&startDate=${startDateStr}&endDate=${endDateStr}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (detailsResponse.ok) {
          const performanceData = await detailsResponse.json();
          
          // Update the selected teacher with the detailed data
          setSelectedTeacher({
            ...teacher,
            performanceData
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch teacher details:', error);
      setError(t('reports.failedToLoadTeacherDetails'));
    } finally {
      setDetailsLoading(false);
    }
  };

  const getAvailableTabs = () => {
    const tabs = [
      { label: t('reports.tabs.academicPerformance'), value: 0 },
    ];

    if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
      tabs.push({ label: t('reports.tabs.attendanceAnalytics'), value: 1 });
      tabs.push({ label: t('reports.tabs.studentReports'), value: 2 });
    }

    if (user?.role === 'ADMIN') {
      tabs.push({ label: t('reports.tabs.staffReports'), value: 3 });
      tabs.push({ label: t('reports.tabs.schoolOverview'), value: 4 });
    }

    return tabs;
  };

  // Calculate real attendance statistics
  const attendanceStats = useMemo(() => {
    if (attendanceData.length === 0) {
      return {
        overallAttendance: 0,
        perfectAttendance: 0,
        chronicAbsence: 0,
        tardinessRate: 0
      };
    }

    // Calculate totals from attendance data
    const totals = attendanceData.reduce(
      (acc, day) => ({
        present: acc.present + (day.present || 0),
        absent: acc.absent + (day.absent || 0),
        late: acc.late + (day.late || 0),
        excused: acc.excused + (day.excused || 0),
        total: acc.total + (day.total || 0)
      }),
      { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
    );

    const overallAttendance = totals.total > 0 ? Math.round((totals.present / totals.total) * 100 * 10) / 10 : 0;
    const tardinessRate = totals.total > 0 ? Math.round((totals.late / totals.total) * 100 * 10) / 10 : 0;

    // For perfect attendance and chronic absence, we'd need student-level data
    // For now, return 0 or calculate based on available data
    return {
      overallAttendance,
      perfectAttendance: 0, // Would need student attendance records
      chronicAbsence: 0, // Would need student attendance records
      tardinessRate
    };
  }, [attendanceData]);

  // Calculate real school overview statistics
  const schoolOverviewStats = useMemo(() => {
    const totalStudents = students.length;
    const totalTeachers = teachers.length;
    const studentTeacherRatio = totalTeachers > 0 ? `1:${Math.round(totalStudents / totalTeachers)}` : 'N/A';

    // Calculate average attendance from student data
    const studentsWithAttendance = students.filter(s => s.attendance !== null && s.attendance !== undefined);
    const averageAttendance = studentsWithAttendance.length > 0
      ? Math.round(studentsWithAttendance.reduce((sum, s) => sum + (s.attendance || 0), 0) / studentsWithAttendance.length * 10) / 10
      : 0;

    // Calculate average grade from student data
    const studentsWithGrades = students.filter(s => s.averageGrade !== null && s.averageGrade !== undefined);
    const averageGrade = studentsWithGrades.length > 0
      ? Math.round(studentsWithGrades.reduce((sum, s) => sum + (s.averageGrade || 0), 0) / studentsWithGrades.length * 10) / 10
      : 0;

    // Calculate passing rate (assuming 60% is passing)
    const passingStudents = studentsWithGrades.filter(s => (s.averageGrade || 0) >= 60).length;
    const passingRate = studentsWithGrades.length > 0
      ? Math.round((passingStudents / studentsWithGrades.length) * 100 * 10) / 10
      : 0;

    return {
      totalStudents,
      totalTeachers,
      studentTeacherRatio,
      averageAttendance,
      averageGrade,
      passingRate
    };
  }, [students, teachers]);

  // Calculate real academic performance statistics
  const academicPerformanceStats = useMemo(() => {
    const studentsWithGrades = students.filter(s => s.averageGrade !== null && s.averageGrade !== undefined);
    
    if (studentsWithGrades.length === 0) {
      return {
        averageScore: 0,
        passingRate: 0,
        aPlusStudents: 0,
        atRiskStudents: 0
      };
    }

    const averageScore = Math.round(studentsWithGrades.reduce((sum, s) => sum + (s.averageGrade || 0), 0) / studentsWithGrades.length * 10) / 10;
    const passingStudents = studentsWithGrades.filter(s => (s.averageGrade || 0) >= 60).length;
    const passingRate = Math.round((passingStudents / studentsWithGrades.length) * 100 * 10) / 10;
    const aPlusStudents = studentsWithGrades.filter(s => (s.averageGrade || 0) >= 90).length;
    const atRiskStudents = studentsWithGrades.filter(s => (s.averageGrade || 0) < 60).length;

    return {
      averageScore,
      passingRate,
      aPlusStudents,
      atRiskStudents
    };
  }, [students]);

  // Calculate real staff statistics
  const staffStats = useMemo(() => {
    const totalFaculty = teachers.length;
    const teacherStudentRatio = students.length > 0 ? Math.round(students.length / totalFaculty) : 0;
    const averagePerformance = teachers.length > 0 
      ? Math.round(teachers.reduce((sum, t) => sum + (t.performance || 0), 0) / teachers.length * 10) / 10
      : 0;

    return {
      totalFaculty,
      teacherStudentRatio,
      averagePerformance
    };
  }, [teachers, students]);

  // Transform attendance data for charts - calculate from real data
  const attendanceChartData = React.useMemo(() => {
    if (attendanceData.length === 0) {
      return [
        { label: t('reports.attendanceAnalytics.present'), value: 0, color: '#4caf50' },
        { label: t('reports.attendanceAnalytics.absent'), value: 0, color: '#f44336' },
        { label: t('reports.attendanceAnalytics.late'), value: 0, color: '#ff9800' },
        { label: t('reports.attendanceAnalytics.excused'), value: 0, color: '#2196f3' }
      ];
    }

    // Calculate totals from real attendance data
    const totals = attendanceData.reduce(
      (acc, day) => ({
        present: acc.present + (day.present || 0),
        absent: acc.absent + (day.absent || 0),
        late: acc.late + (day.late || 0),
        excused: acc.excused + (day.excused || 0),
        total: acc.total + (day.total || 0)
      }),
      { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
    );

    if (totals.total === 0) {
      return [
        { label: t('reports.attendanceAnalytics.present'), value: 0, color: '#4caf50' },
        { label: t('reports.attendanceAnalytics.absent'), value: 0, color: '#f44336' },
        { label: t('reports.attendanceAnalytics.late'), value: 0, color: '#ff9800' },
        { label: t('reports.attendanceAnalytics.excused'), value: 0, color: '#2196f3' }
      ];
    }

    return [
      { label: t('reports.attendanceAnalytics.present'), value: Math.round((totals.present / totals.total) * 100 * 10) / 10, color: '#4caf50' },
      { label: t('reports.attendanceAnalytics.absent'), value: Math.round((totals.absent / totals.total) * 100 * 10) / 10, color: '#f44336' },
      { label: t('reports.attendanceAnalytics.late'), value: Math.round((totals.late / totals.total) * 100 * 10) / 10, color: '#ff9800' },
      { label: t('reports.attendanceAnalytics.excused'), value: Math.round((totals.excused / totals.total) * 100 * 10) / 10, color: '#2196f3' }
    ];
  }, [attendanceData, t]);
  
  // Transform grade distribution for charts
  const gradeChartData = gradeDistribution.map(item => ({
    label: item.gradeRange.split(' ')[0],
    value: item.percentage
  }));
  
  // Monthly attendance trend data
  const monthlyAttendanceData = monthlyAttendance.map(item => ({
    label: item.month,
    value: item.attendance
  }));
  
  // Subject performance data
  const subjectPerformanceData = subjectPerformance.map(item => ({
    label: item.subject,
    value: item.average
  }));

  // Get top performing students from real data
  const topStudents = students
    .filter(student => student.averageGrade !== null && student.averageGrade !== undefined)
    .sort((a, b) => (b.averageGrade || 0) - (a.averageGrade || 0))
    .slice(0, 5);

  const downloadAttendanceData = () => {
    const columns = [
      { key: 'date', label: t('reports.date') },
      { key: 'present', label: t('reports.attendanceAnalytics.present') },
      { key: 'absent', label: t('reports.attendanceAnalytics.absent') },
      { key: 'late', label: t('reports.attendanceAnalytics.late') },
      { key: 'excused', label: t('reports.attendanceAnalytics.excused') },
      { key: 'total', label: t('reports.totalStudents') }
    ];
    
    downloadCSV(attendanceData, columns, 'attendance_report');
  };

  // Dashboard section has been moved to AdminDashboard.tsx

  const renderAcademicPerformance = () => (
    <>
      <ReportHeader
        title={t("reports.academicPerformanceSection.title")}
        description={t("reports.academicPerformanceSection.description")}
        onFilterToggle={toggleFilters}
        showFilters={showFilters}
        onClearFilters={clearFilters}
        filterCount={(selectedClass !== 'all' ? 1 : 0) + (selectedAcademicYear !== 'all' ? 1 : 0)}
        exportData={{
          data: students.slice(0, 20),
          columns: [
            { key: 'id', label: t('reports.id') },
            { key: 'name', label: t('reports.studentName') },
            { key: 'grade', label: 'Grade' },
            { key: 'averageGrade', label: 'Average Grade (%)' },
            { key: 'attendance', label: 'Attendance (%)' },
          ],
          filename: 'academic_performance_report'
        }}
      >
        {/* Filter Controls */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="academic-year-select-label">Academic Year</InputLabel>
              <Select
                labelId="academic-year-select-label"
                id="academic-year-select"
                value={selectedAcademicYear}
                label="Academic Year"
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
              >
                <MenuItem value="all">All Years</MenuItem>
                {academicYears.map((year: any) => (
                  <MenuItem key={year.id} value={year.id}>
                    {year.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="class-select-label">Class</InputLabel>
              <Select
                labelId="class-select-label"
                id="class-select"
                value={selectedClass}
                label="Class"
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <MenuItem value="all">All Classes</MenuItem>
                {classes.map((cls: any) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name} - Grade {cls.gradeLevel?.level || 'N/A'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="period-select-label">Time Period</InputLabel>
              <Select
                labelId="period-select-label"
                id="period-select"
                value={selectedPeriod}
                label="Time Period"
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <MenuItem value="term">Current Term</MenuItem>
                <MenuItem value="year">Academic Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {selectedPeriod === 'custom' && (
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Stack direction="row" spacing={2}>
                  <DatePicker
                    label="Start Date"
                    value={dateRange.start}
                    onChange={(newValue) => handleDateChange('start', newValue)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                  <DatePicker
                    label="End Date"
                    value={dateRange.end}
                    onChange={(newValue) => handleDateChange('end', newValue)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Stack>
              </LocalizationProvider>
            </Grid>
          )}
        </Grid>
      </ReportHeader>

      {/* Academic Performance Statistics */}
      <StatisticsSummary
        stats={[
          {
            title: t('reports.academicPerformanceSection.averageScore'),
            value: `${academicPerformanceStats.averageScore}%`,
            description: t('reports.academicPerformanceSection.allSubjects'),
            trend: 'up',
            trendValue: '+0.8%',
            color: 'primary'
          },
          {
            title: t('reports.academicPerformanceSection.passingRate'),
            value: `${academicPerformanceStats.passingRate}%`,
            description: t('reports.academicPerformanceSection.studentsAbove60'),
            trend: 'up',
            trendValue: '+1.3%',
            color: 'success'
          },
          {
            title: t('reports.academicPerformanceSection.aPlusStudents'),
            value: academicPerformanceStats.aPlusStudents.toString(),
            description: t('reports.academicPerformanceSection.percentOfTotal', { percentage: ((academicPerformanceStats.aPlusStudents / students.length) * 100).toFixed(1) }),
            trend: 'up',
            trendValue: '+5',
            color: 'info'
          },
          {
            title: t('reports.academicPerformanceSection.atRisk'),
            value: academicPerformanceStats.atRiskStudents.toString(),
            description: t('reports.academicPerformanceSection.studentsBelow60'),
            trend: 'down',
            trendValue: '-2',
            color: 'warning'
          }
        ]}
        loading={loading}
      />

      {/* Grade Distribution */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <ReportChart
            title={t("reports.academicPerformanceSection.gradeDistribution")}
            data={gradeChartData}
            type="bar"
            height={350}
            showLegend={false}
            xAxisLabel={t("reports.academicPerformanceSection.gradeRange")}
            yAxisLabel={t("reports.academicPerformanceSection.percentage")}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('reports.gradeDistribution')}
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('reports.gradeRange')}</TableCell>
                      <TableCell align="right">{t('reports.count')}</TableCell>
                      <TableCell align="right">{t('reports.percentage')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gradeDistribution.map((grade) => (
                      <TableRow key={grade.gradeRange}>
                        <TableCell>{grade.gradeRange}</TableCell>
                        <TableCell align="right">{grade.count}</TableCell>
                        <TableCell align="right">{grade.percentage.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Subject Performance */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ReportChart
            title={t("reports.academicPerformanceSection.subjectPerformance")}
            data={subjectPerformanceData}
            type="bar"
            height={400}
            showLegend={false}
            xAxisLabel={t("reports.academicPerformanceSection.subjects")}
            yAxisLabel={t("reports.academicPerformanceSection.averageScorePercent")}
            showDownload={true}
          />
        </Grid>
      </Grid>
    </>
  );

  const renderAttendanceAnalytics = () => (
    <>
      <ReportHeader
        title={t("reports.attendanceSection.analytics")}
        description={t("reports.attendanceAnalytics.description")}
        onFilterToggle={toggleFilters}
        showFilters={showFilters}
        onClearFilters={clearFilters}
        filterCount={(selectedClass !== 'all' ? 1 : 0) + (selectedPeriod === 'custom' ? 1 : 0) + (selectedAcademicYear !== 'all' ? 1 : 0)}
        exportData={{
          data: attendanceData,
          columns: [
            { key: 'date', label: 'Date' },
            { key: 'present', label: 'Present' },
            { key: 'absent', label: 'Absent' },
            { key: 'late', label: 'Late' },
            { key: 'excused', label: 'Excused' },
            { key: 'total', label: 'Total' },
          ],
          filename: 'attendance_analytics_report'
        }}
      >
        {/* Filter Controls */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="academic-year-select-label">Academic Year</InputLabel>
              <Select
                labelId="academic-year-select-label"
                id="academic-year-select"
                value={selectedAcademicYear}
                label="Academic Year"
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
              >
                <MenuItem value="all">All Years</MenuItem>
                {academicYears.map((year: any) => (
                  <MenuItem key={year.id} value={year.id}>
                    {year.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="class-select-label">Class</InputLabel>
              <Select
                labelId="class-select-label"
                id="class-select"
                value={selectedClass}
                label="Class"
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <MenuItem value="all">All Classes</MenuItem>
                {classes.map((cls: any) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name} - Grade {cls.gradeLevel?.level || 'N/A'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="period-select-label">Time Period</InputLabel>
              <Select
                labelId="period-select-label"
                id="period-select"
                value={selectedPeriod}
                label="Time Period"
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <MenuItem value="term">Current Term</MenuItem>
                <MenuItem value="year">Academic Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {selectedPeriod === 'custom' && (
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Stack direction="row" spacing={2}>
                  <DatePicker
                    label="Start Date"
                    value={dateRange.start}
                    onChange={(newValue) => handleDateChange('start', newValue)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                  <DatePicker
                    label="End Date"
                    value={dateRange.end}
                    onChange={(newValue) => handleDateChange('end', newValue)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Stack>
              </LocalizationProvider>
            </Grid>
          )}
        </Grid>
      </ReportHeader>

      {/* Attendance Summary */}
      <StatisticsSummary
        stats={[
          {
            title: t('reports.attendanceAnalytics.overallAttendance'),
            value: `${attendanceStats.overallAttendance}%`,
            description: selectedPeriod === 'custom' ? 'Custom period' : t('reports.attendanceAnalytics.currentTerm'),
            trend: 'neutral',
            trendValue: '0%',
            color: 'primary'
          },
          {
            title: t('reports.attendanceAnalytics.perfectAttendance'),
            value: attendanceStats.perfectAttendance.toString(),
            description: t('reports.attendanceAnalytics.perfectAttendanceDesc'),
            trend: 'neutral',
            trendValue: '0',
            color: 'success'
          },
          {
            title: t('reports.attendanceAnalytics.chronicAbsence'),
            value: attendanceStats.chronicAbsence.toString(),
            description: t('reports.attendanceAnalytics.chronicAbsenceDesc'),
            trend: 'neutral',
            trendValue: '0',
            color: 'error'
          },
          {
            title: t('reports.attendanceAnalytics.tardinessRate'),
            value: `${attendanceStats.tardinessRate}%`,
            description: t('reports.attendanceAnalytics.averageDailyLate'),
            trend: 'neutral',
            trendValue: '0%',
            color: 'warning'
          }
        ]}
        loading={loading}
      />

      {/* Attendance Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <ReportChart
            title={t("reports.attendanceSection.trend")}
            data={monthlyAttendanceData}
            type="line"
            height={350}
            showLegend={false}
            xAxisLabel="Month"
            yAxisLabel="Attendance Rate (%)"
            showDownload={true}
            onDownload={downloadAttendanceData}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ReportChart
            title={t("reports.attendanceSection.breakdown")}
            data={attendanceChartData}
            type="pie"
            height={350}
            showLegend={true}
          />
        </Grid>
      </Grid>

      {/* Daily Attendance Table */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{t('reports.dailyAttendanceLog')}</Typography>
          <Button startIcon={<DownloadIcon />} size="small" onClick={downloadAttendanceData}>
            {t('reports.exportData')}
          </Button>
        </Box>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('reports.date')}</TableCell>
                <TableCell align="right">{t('reports.presentCount')}</TableCell>
                <TableCell align="right">{t('reports.absentCount')}</TableCell>
                <TableCell align="right">{t('reports.lateCount')}</TableCell>
                <TableCell align="right">{t('reports.excusedCount')}</TableCell>
                <TableCell align="right">{t('reports.attendanceRateColumn')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography>{t('reports.noAttendanceDataAvailable')}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                attendanceData.slice(0, showAllAttendanceRecords ? attendanceData.length : 10).map((day: any) => (
                  <TableRow key={day.date}>
                    <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                    <TableCell align="right">{day.present || 0}</TableCell>
                    <TableCell align="right">{day.absent || 0}</TableCell>
                    <TableCell align="right">{day.late || 0}</TableCell>
                    <TableCell align="right">{day.excused || 0}</TableCell>
                    <TableCell align="right">
                      {day.total > 0 ? ((day.present / day.total) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button onClick={() => setShowAllAttendanceRecords(!showAllAttendanceRecords)}>
            {showAllAttendanceRecords ? 'Show Less' : 'View All Records'}
          </Button>
        </Box>
      </Paper>
    </>
  );

  const renderStudentReports = () => (
    <>
      <ReportHeader
        title={t("reports.studentReportsSection.title")}
        description={t("reports.studentReportsSection.description")}
        onFilterToggle={toggleFilters}
        showFilters={showFilters}
        onClearFilters={clearFilters}
        exportData={{
          data: students,
          columns: [
            { key: 'id', label: 'Student ID' },
            { key: 'name', label: 'Student Name' },
            { key: 'grade', label: 'Grade' },
            { key: 'averageGrade', label: 'Average Grade (%)' },
            { key: 'attendance', label: 'Attendance (%)' },
          ],
          filename: 'students_report'
        }}
      >
        {/* Filter Controls */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="academic-year-select-label">Academic Year</InputLabel>
              <Select
                labelId="academic-year-select-label"
                id="academic-year-select"
                value={selectedAcademicYear}
                label="Academic Year"
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
              >
                <MenuItem value="all">All Years</MenuItem>
                {academicYears.map((year: any) => (
                  <MenuItem key={year.id} value={year.id}>
                    {year.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="class-select-label">Class</InputLabel>
              <Select
                labelId="class-select-label"
                id="class-select"
                value={selectedClass}
                label="Class"
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <MenuItem value="all">All Classes</MenuItem>
                {classes.map((cls: any) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name} - Grade {cls.gradeLevel?.level || 'N/A'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </ReportHeader>

      {/* Student Table */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('reports.id')}</TableCell>
                <TableCell>{t('reports.studentName')}</TableCell>
                <TableCell>{t('reports.grade')}</TableCell>
                <TableCell align="right">{t('reports.averageScore')}</TableCell>
                <TableCell align="right">{t('reports.attendance')}</TableCell>
                <TableCell align="center">{t('reports.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                // Filter students based on selected class
                const filteredStudents = selectedClass === 'all' 
                  ? students 
                  : students.filter((student: any) => student.classId === selectedClass);
                
                return loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography>{t('reports.loadingStudentData')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography>{t('reports.noStudentsFound')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.slice(0, 10).map((student: any) => {
                  console.log(`Rendering student ${student.id}:`, {
                    name: student.name,
                    grade: student.grade,
                    averageGrade: student.averageGrade,
                    attendance: student.attendance,
                    attendanceRate: student.attendanceRate
                  });
                  return (
                    <TableRow key={student.id}>
                      <TableCell>{student.id}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                            {student.name ? student.name.charAt(0) : (student.firstName ? student.firstName.charAt(0) : 'S')}
                          </Avatar>
                          {student.name || `${student.firstName} ${student.lastName}`}
                        </Box>
                      </TableCell>
                      <TableCell>{student.grade || student.gradeLevel?.name || 'N/A'}</TableCell>
                      <TableCell align="right">
                        {student.averageGrade !== null && student.averageGrade !== undefined 
                          ? `${student.averageGrade}%` 
                          : (student.academicRecord?.averageGrade ? `${student.academicRecord.averageGrade}%` : 'N/A')}
                      </TableCell>
                      <TableCell align="right">
                        {student.attendance !== null && student.attendance !== undefined 
                          ? `${student.attendance}%` 
                          : (student.attendanceRate ? `${student.attendanceRate}%` : 'N/A')}
                      </TableCell>
                      <TableCell align="center">
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => handleViewStudentDetails(student)}
                        >
                          {t('reports.viewDetails')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
                );
              })()}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Sample Student Detailed Report */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('reports.studentSpotlight')}: {loading ? t('reports.loading') : students[0]?.name || t('reports.noStudentsAvailable')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {loading ? (
          <Typography>{t('reports.loadingStudentData')}</Typography>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}>
                  {students[0]?.name?.charAt(0) || 'S'}
                </Avatar>
                <Typography variant="h6">{students[0]?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {students[0]?.id} • Grade {students[0]?.grade}
                </Typography>
              </Box>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('reports.averageGrade')}
                  </Typography>
                  <Typography variant="h4">{students[0]?.averageGrade}%</Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('reports.attendanceRate')}
                  </Typography>
                  <Typography variant="h4">{students[0]?.attendance}%</Typography>
                </Box>
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <ReportChart
                title={t("reports.studentReportsSection.performanceBySubject")}
                data={subjectPerformanceData}
                type="bar"
                height={280}
                showLegend={false}
                showDownload={true}
              />
            </Grid>
          </Grid>
        )}
      </Paper>
    </>
  );

  const renderStaffReports = () => (
    <>
      <ReportHeader
        title={t("reports.staffReportsSection.title")}
        description={t("reports.staffReportsSection.description")}
        exportData={{
          data: teachers,
          columns: [
            { key: 'id', label: 'Teacher ID' },
            { key: 'name', label: 'Teacher Name' },
            { key: 'department', label: 'Department' },
            { key: 'performance', label: 'Performance Score' },
          ],
          filename: 'staff_report'
        }}
      />

      {/* Staff Statistics */}
      <StatisticsSummary
        stats={[
          {
            title: t('reports.staffReportsSection.totalFaculty'),
            value: staffStats.totalFaculty.toString(),
            description: t('reports.staffReportsSection.departmentsCount'),
            icon: <PersonIcon />,
            color: 'primary'
          },
          {
            title: t('reports.staffReportsSection.teacherStudentRatio'),
            value: `1:${staffStats.teacherStudentRatio}`,
            description: t('reports.staffReportsSection.schoolAverage'),
            icon: <GroupIcon />,
            color: 'info'
          },
          {
            title: t('reports.staffReportsSection.averagePerformance'),
            value: `${staffStats.averagePerformance}%`,
            description: t('reports.staffReportsSection.basedOnReviews'),
            trend: 'up',
            trendValue: '+1.7%',
            color: 'success'
          }
        ]}
        loading={loading}
      />

      {/* Teacher Table */}
      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('reports.id')}</TableCell>
                <TableCell>{t('reports.teacherName')}</TableCell>
                <TableCell>{t('reports.department')}</TableCell>
                <TableCell>{t('reports.subjects')}</TableCell>
                <TableCell align="right">{t('reports.performance')}</TableCell>
                <TableCell align="center">{t('reports.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teachers.map((teacher: any) => (
                <TableRow key={teacher.id}>
                  <TableCell>{teacher.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                        {teacher.name ? teacher.name.charAt(0) : (teacher.firstName ? teacher.firstName.charAt(0) : 'T')}
                      </Avatar>
                      {teacher.name || `${teacher.firstName} ${teacher.lastName}`}
                    </Box>
                  </TableCell>
                  <TableCell>{teacher.department || teacher.departmentName || 'N/A'}</TableCell>
                  <TableCell>
                    {Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : 
                     teacher.subjectsTaught ? teacher.subjectsTaught.map((s: any) => s.name).join(', ') : 'N/A'}
                  </TableCell>
                  <TableCell align="right">{teacher.performance || teacher.performanceRating || 'N/A'}{teacher.performance || teacher.performanceRating ? '%' : ''}</TableCell>
                  <TableCell align="center">
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => handleViewTeacherDetails(teacher)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );

  const renderSchoolOverview = () => (
    <>
      <ReportHeader
        title={t("reports.schoolOverviewSection.title")}
        description={t("reports.schoolOverviewSection.description")}
        exportData={{
          data: [
            { metric: t('reports.schoolOverviewSection.totalStudents'), value: schoolOverviewStats.totalStudents },
            { metric: 'Total Staff', value: schoolOverviewStats.totalTeachers },
            { metric: 'Student-Teacher Ratio', value: schoolOverviewStats.studentTeacherRatio },
            { metric: t('reports.schoolOverviewSection.averageAttendance'), value: `${schoolOverviewStats.averageAttendance}%` },
            { metric: t('reports.schoolOverviewSection.averageGrade'), value: `${schoolOverviewStats.averageGrade}%` },
            { metric: t('reports.schoolOverviewSection.passingRate'), value: `${schoolOverviewStats.passingRate}%` },
          ],
          columns: [
            { key: 'metric', label: 'Metric' },
            { key: 'value', label: 'Value' },
          ],
          filename: 'school_overview_report'
        }}
      />

      {/* School Statistics */}
      <StatisticsSummary
        title={t("reports.charts.schoolSummary")}
        stats={[
          {
            title: t('reports.schoolOverviewSection.totalStudents'),
            value: schoolOverviewStats.totalStudents.toLocaleString(),
            icon: <SchoolIcon />,
            color: 'primary'
          },
          {
            title: t('reports.schoolOverviewSection.averageAttendance'),
            value: `${schoolOverviewStats.averageAttendance}%`,
            trend: 'neutral',
            trendValue: '0%',
            color: 'warning'
          },
          {
            title: t('reports.schoolOverviewSection.averageGrade'),
            value: `${schoolOverviewStats.averageGrade}%`,
            trend: 'neutral',
            trendValue: '0%',
            color: 'success'
          },
          {
            title: t('reports.schoolOverviewSection.graduationRate'),
            value: `${schoolOverviewStats.passingRate}%`,
            trend: 'neutral',
            trendValue: '0%',
            color: 'info'
          }
        ]}
        loading={loading}
      />

      {/* Overview Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <ReportChart
            title={t("reports.charts.enrollmentByGradeLevel")}
            data={[
              { label: '9th', value: 328 },
              { label: '10th', value: 312 },
              { label: '11th', value: 301 },
              { label: '12th', value: 306 }
            ]}
            type="bar"
            height={350}
            showLegend={false}
            xAxisLabel="Grade Level"
            yAxisLabel="Number of Students"
            showDownload={true}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ReportChart
            title={t("reports.charts.academicPerformanceTrend")}
            data={[
              { label: '2020', value: 74.2 },
              { label: '2021', value: 75.1 },
              { label: '2022', value: 74.8 },
              { label: '2023', value: 75.6 },
              { label: '2024', value: 76.8 }
            ]}
            type="line"
            height={350}
            showLegend={false}
            xAxisLabel="Year"
            yAxisLabel="Average Grade (%)"
            trendDirection="up"
          />
        </Grid>
      </Grid>

      {/* Department Performance */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <DashboardCard
            title={t("reports.charts.departmentPerformance")}
            subheader="Average grades by department"
            chart="bar"
            chartData={[
              { name: 'Mathematics', value: 74.2 },
              { name: 'Science', value: 76.5 },
              { name: 'English', value: 79.8 },
              { name: 'History', value: 77.1 },
              { name: 'Languages', value: 80.3 },
              { name: 'Arts', value: 88.7 },
              { name: 'Physical Ed.', value: 91.2 },
              { name: 'Tech', value: 82.4 }
            ]}
            loading={loading}
            showDownload={true}
            height={400}
            footer={
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Updated: September 15, 2025
                </Typography>
                <Button size="small" startIcon={<PictureAsPdfIcon />}>
                  Generate PDF Report
                </Button>
              </Box>
            }
          />
        </Grid>
      </Grid>
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return renderAcademicPerformance();
      case 1:
        return renderAttendanceAnalytics();
      case 2:
        return renderStudentReports();
      case 3:
        return renderStaffReports();
      case 4:
        return renderSchoolOverview();
      default:
        return renderAcademicPerformance();
    }
  };

  return (
    <SidebarLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Paper sx={{ px: 3, py: 2, mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              {getAvailableTabs().map((tab) => (
                <Tab key={tab.value} label={tab.label} value={tab.value} />
              ))}
            </Tabs>
          </Paper>

          {/* Error Message */}
          {error && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.dark' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1">{error}</Typography>
                <Button 
                  size="small" 
                  sx={{ ml: 'auto' }} 
                  onClick={() => setError('')}
                >
                  Dismiss
                </Button>
              </Box>
            </Paper>
          )}

          {/* Loading State */}
          {loading ? (
            <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('reports.loadingReportData')}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('reports.fetchingDataMessage')}
              </Typography>
            </Paper>
          ) : (
            renderContent()
          )}
        </Box>
      </Container>
      
      {/* Student Details Dialog */}
      <Dialog
        open={showStudentDetails}
        onClose={() => setShowStudentDetails(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {t('reports.studentDetails')}
          <IconButton
            aria-label="close"
            onClick={() => setShowStudentDetails(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>{t('reports.loadingStudentDetails')}</Typography>
            </Box>
          ) : selectedStudent ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}>
                      {selectedStudent.name ? selectedStudent.name.charAt(0) : 
                       selectedStudent.firstName ? selectedStudent.firstName.charAt(0) : 'S'}
                    </Avatar>
                    <Typography variant="h6">
                      {selectedStudent.name || 
                       (selectedStudent.firstName && selectedStudent.lastName ? 
                        `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'N/A')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      ID: {selectedStudent.id || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>{t('reports.personalInformation')}</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>{t('reports.grade')}:</strong> {selectedStudent.grade || 
                                             selectedStudent.gradeLevel?.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('reports.dateOfBirth')}:</strong> {selectedStudent.dateOfBirth || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('reports.gender')}:</strong> {selectedStudent.gender || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('reports.contact')}:</strong> {selectedStudent.contact || 
                                              selectedStudent.contactNumber || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('reports.email')}:</strong> {selectedStudent.email || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>{t('reports.academicSummary')}</Typography>
                  <Box>
                    <Typography variant="body2">
                      <strong>{t('reports.averageGrade')}:</strong> {selectedStudent.averageGrade || 
                                                    selectedStudent.academicRecord?.averageGrade || 'N/A'}
                      {selectedStudent.averageGrade || selectedStudent.academicRecord?.averageGrade ? '%' : ''}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('reports.attendance')}:</strong> {selectedStudent.attendance || 
                                                 selectedStudent.attendanceRate || 'N/A'}
                      {selectedStudent.attendance || selectedStudent.attendanceRate ? '%' : ''}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>{t('reports.academicPerformance')}</Typography>
                      
                      {selectedStudent.gradesData ? (
                        <Box>
                          <TableContainer sx={{ mb: 3 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Subject</TableCell>
                                  <TableCell align="right">Midterm</TableCell>
                                  <TableCell align="right">Final</TableCell>
                                  <TableCell align="right">Average</TableCell>
                                  <TableCell align="right">Grade</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(selectedStudent.gradesData.subjects || []).map((subject: any) => (
                                  <TableRow key={subject.id}>
                                    <TableCell>{subject.name}</TableCell>
                                    <TableCell align="right">{subject.midterm || 'N/A'}</TableCell>
                                    <TableCell align="right">{subject.final || 'N/A'}</TableCell>
                                    <TableCell align="right">{subject.average || 'N/A'}</TableCell>
                                    <TableCell align="right">{subject.grade || 'N/A'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          
                          <ReportChart
                            title={t("reports.charts.subjectPerformance")}
                            subTitle={t("reports.studentReportsSection.currentTermGradesBySubject")}
                            data={(selectedStudent.gradesData.subjects || []).map((subject: any) => ({
                              label: subject.name,
                              value: subject.average || 0
                            }))}
                            type="bar"
                            height={250}
                            showDownload={false}
                          />
                        </Box>
                      ) : (
                        <Typography>{t('reports.noAcademicDataAvailable')}</Typography>
                      )}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>{t('reports.attendanceRecords')}</Typography>
                      
                      {selectedStudent.attendanceData ? (
                        <Box>
                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={3}>
                              <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText', p: 2 }}>
                                <Typography variant="body2">{t('reports.present')}</Typography>
                                <Typography variant="h5">
                                  {selectedStudent.attendanceData.summary?.presentDays || 0} {t('reports.days')}
                                </Typography>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText', p: 2 }}>
                                <Typography variant="body2">{t('reports.absent')}</Typography>
                                <Typography variant="h5">
                                  {selectedStudent.attendanceData.summary?.absentDays || 0} {t('reports.days')}
                                </Typography>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText', p: 2 }}>
                                <Typography variant="body2">{t('reports.late')}</Typography>
                                <Typography variant="h5">
                                  {selectedStudent.attendanceData.summary?.lateDays || 0} {t('reports.days')}
                                </Typography>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', p: 2 }}>
                                <Typography variant="body2">{t('reports.attendanceRate')}</Typography>
                                <Typography variant="h5">
                                  {selectedStudent.attendanceData.summary?.attendanceRate || 0}%
                                </Typography>
                              </Card>
                            </Grid>
                          </Grid>
                          
                          <TableContainer sx={{ maxHeight: 300 }}>
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Date</TableCell>
                                  <TableCell>Subject</TableCell>
                                  <TableCell>Status</TableCell>
                                  <TableCell>Notes</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(selectedStudent.attendanceData.details || []).map((record: any) => (
                                  <TableRow key={record.id}>
                                    <TableCell>{record.date}</TableCell>
                                    <TableCell>{record.timetable?.subject?.name || 'N/A'}</TableCell>
                                    <TableCell>
                                      <Chip
                                        size="small"
                                        label={record.status}
                                        color={
                                          record.status === 'PRESENT' ? 'success' :
                                          record.status === 'LATE' ? 'warning' :
                                          record.status === 'ABSENT' ? 'error' : 'default'
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>{record.notes || '-'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      ) : (
                        <Typography>{t('reports.noAttendanceDataAvailable')}</Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          ) : (
            <Typography>No student selected</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStudentDetails(false)}>Close</Button>
          <Button 
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={() => {
              if (selectedStudent) {
                downloadCSV(
                  [selectedStudent], 
                  [
                    { key: 'id', label: 'Student ID' },
                    { key: 'name', label: 'Name' },
                    { key: 'grade', label: 'Grade' },
                    { key: 'averageGrade', label: 'Average Grade' },
                    { key: 'attendance', label: 'Attendance Rate' }
                  ],
                  `student_${selectedStudent.id}_report`
                );
              }
            }}
          >
            Export Report
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Teacher Details Dialog */}
      <Dialog
        open={showTeacherDetails}
        onClose={() => setShowTeacherDetails(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {t('reports.studentDetails').replace('Student', 'Teacher')}
          <IconButton
            aria-label="close"
            onClick={() => setShowTeacherDetails(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>{t('reports.loadingStudentDetails').replace('student', 'teacher')}</Typography>
            </Box>
          ) : selectedTeacher ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}>
                      {selectedTeacher.name ? selectedTeacher.name.charAt(0) : 
                       selectedTeacher.firstName ? selectedTeacher.firstName.charAt(0) : 'T'}
                    </Avatar>
                    <Typography variant="h6">
                      {selectedTeacher.name || 
                       (selectedTeacher.firstName && selectedTeacher.lastName ? 
                        `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : 'N/A')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      ID: {selectedTeacher.id || 'N/A'}
                    </Typography>
                    <Chip 
                      label={selectedTeacher.department || 'N/A'} 
                      color="primary" 
                      size="small" 
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>{t('reports.personalInformation')}</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedTeacher.email || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Contact:</strong> {selectedTeacher.contact || 
                                              selectedTeacher.contactNumber || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Qualification:</strong> {selectedTeacher.qualification || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Joining Date:</strong> {selectedTeacher.joiningDate || 
                                                   selectedTeacher.createdAt || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>Teaching Summary</Typography>
                  <Box>
                    <Typography variant="body2">
                      <strong>Performance:</strong> {selectedTeacher.performance || 
                                                  selectedTeacher.performanceData?.overall || 'N/A'}
                      {selectedTeacher.performance || selectedTeacher.performanceData?.overall ? '%' : ''}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Classes:</strong> {
                        selectedTeacher.classes ? 
                        selectedTeacher.classes.length : 
                        selectedTeacher.performanceData?.classes?.length || 'N/A'
                      }
                    </Typography>
                    <Typography variant="body2">
                      <strong>Subjects:</strong> {
                        selectedTeacher.subjects ? 
                        (Array.isArray(selectedTeacher.subjects) ? 
                          selectedTeacher.subjects.join(', ') : 
                          selectedTeacher.subjects) : 
                        (selectedTeacher.performanceData?.subjects || [])
                          .map((s: any) => s.name || s)
                          .join(', ') || 'N/A'
                      }
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
                      
                      {selectedTeacher.performanceData ? (
                        <Box>
                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={3}>
                              <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', p: 2 }}>
                                <Typography variant="body2">Overall Rating</Typography>
                                <Typography variant="h5">
                                  {selectedTeacher.performanceData.overall || 0}%
                                </Typography>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText', p: 2 }}>
                                <Typography variant="body2">Student Progress</Typography>
                                <Typography variant="h5">
                                  {selectedTeacher.performanceData.studentProgress || 0}%
                                </Typography>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText', p: 2 }}>
                                <Typography variant="body2">Peer Review</Typography>
                                <Typography variant="h5">
                                  {selectedTeacher.performanceData.peerReview || 0}%
                                </Typography>
                              </Card>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText', p: 2 }}>
                                <Typography variant="body2">Attendance</Typography>
                                <Typography variant="h5">
                                  {selectedTeacher.performanceData.attendance || 0}%
                                </Typography>
                              </Card>
                            </Grid>
                          </Grid>
                          
                          <ReportChart
                            title={t("reports.charts.performanceTrend")}
                            subTitle={t("reports.studentReportsSection.monthlyPerformanceRatings")}
                            data={(selectedTeacher.performanceData.trend || []).map((point: any) => ({
                              label: point.month,
                              value: point.rating
                            }))}
                            type="line"
                            height={250}
                            showLegend={false}
                            trendDirection={
                              (selectedTeacher.performanceData.trend || []).length > 1 &&
                              (selectedTeacher.performanceData.trend || []).slice(-1)[0].rating > 
                              (selectedTeacher.performanceData.trend || []).slice(-2)[0].rating
                              ? 'up' : 'down'
                            }
                          />
                        </Box>
                      ) : (
                        <Typography>{t('reports.noPerformanceDataAvailable')}</Typography>
                      )}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>Class Performance</Typography>
                      
                      {selectedTeacher.performanceData?.classes ? (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Class</TableCell>
                                <TableCell>Subject</TableCell>
                                <TableCell align="right">Average Grade</TableCell>
                                <TableCell align="right">{t('reports.schoolOverviewSection.passingRate')}</TableCell>
                                <TableCell align="right">Highest Score</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(selectedTeacher.performanceData.classes || []).map((cls: any) => (
                                <TableRow key={cls.id}>
                                  <TableCell>{cls.name}</TableCell>
                                  <TableCell>{cls.subject}</TableCell>
                                  <TableCell align="right">{cls.averageGrade || 'N/A'}</TableCell>
                                  <TableCell align="right">{cls.passingRate || 'N/A'}</TableCell>
                                  <TableCell align="right">{cls.highestScore || 'N/A'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography>{t('reports.noClassPerformanceDataAvailable')}</Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          ) : (
            <Typography>No teacher selected</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTeacherDetails(false)}>Close</Button>
          <Button 
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={() => {
              if (selectedTeacher) {
                downloadCSV(
                  [selectedTeacher], 
                  [
                    { key: 'id', label: 'Teacher ID' },
                    { key: 'name', label: 'Name' },
                    { key: 'department', label: 'Department' },
                    { key: 'performance', label: 'Performance' },
                    { key: 'subjects', label: 'Subjects' }
                  ],
                  `teacher_${selectedTeacher.id}_report`
                );
              }
            }}
          >
            Export Report
          </Button>
        </DialogActions>
      </Dialog>
    </SidebarLayout>
  );
}
