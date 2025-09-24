"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  People,
  Event,
  Announcement,
  School,
  TrendingUp,
  Settings,
  Assessment,
  Download as DownloadIcon,
} from "@mui/icons-material";
import SchoolIcon from "@mui/icons-material/School";
import PeopleIcon from "@mui/icons-material/People";
import AssessmentIcon from "@mui/icons-material/Assessment";
import EventNoteIcon from "@mui/icons-material/EventNote";
import dayjs from "dayjs";

import { useAuth } from "@/contexts/AuthContext";
import StatisticsSummary from "@/components/reports/StatisticsSummary";
import DashboardCard from "@/components/reports/DashboardCard";
import ReportChart from "@/components/reports/ReportChart";
import { downloadCSV } from "@/lib/export-utils";
import { useTranslation } from "react-i18next";
import AdminAttendance from "@/components/attendance/AdminAttendance";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
}

interface SchoolEvent {
  id: string;
  title: string;
  description?: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  type: string;
  priority: string;
  isActive: boolean;
}

interface AnnouncementType {
  id: string;
  title: string;
  content: string;
  priority: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementType[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // States for dashboard charts
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<any[]>([]);

  // Calculated statistics
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceRate: 0,
    averageGrade: 0,
    totalTeachers: 0,
    excellentStudents: 0,
    atRiskStudents: 0,
    successRate: 0
  });

  // Dialog states
  const [userDialog, setUserDialog] = useState(false);
  const [eventDialog, setEventDialog] = useState(false);
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<AnnouncementType | null>(null);

  // Form states
  const [userForm, setUserForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "STUDENT",
    phone: "",
    address: "",
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    eventDate: "",
    eventTime: "",
    location: "",
    type: "GENERAL",
    targetRoles: ["ALL"] as ("ALL" | "STUDENTS" | "PARENTS" | "TEACHERS")[],
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    priority: "NORMAL",
    targetRoles: ["ALL"],
    expiresAt: "",
  });

  useEffect(() => {
    if (tabValue === 0) fetchUsers();
    else if (tabValue === 1) fetchEvents();
    else if (tabValue === 2) fetchAnnouncements();
  }, [tabValue]);

  useEffect(() => {
    fetchAttendanceStats();
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);
  
  // Calculate statistics from real data
  useEffect(() => {
    if (students.length > 0 || teachers.length > 0 || gradeDistribution.length > 0) {
      // Calculate total students
      const totalStudents = students.length;
      
      // Calculate total teachers
      const totalTeachers = teachers.length;
      
      // Calculate average grade from grade distribution
      let totalWeightedGrade = 0;
      let totalStudentsWithGrades = 0;
      
      gradeDistribution.forEach((grade: any) => {
        const gradeValue = getGradeValue(grade.gradeRange);
        totalWeightedGrade += gradeValue * grade.count;
        totalStudentsWithGrades += grade.count;
      });
      
      const averageGrade = totalStudentsWithGrades > 0 ? Math.round((totalWeightedGrade / totalStudentsWithGrades) * 100) / 100 : 0;
      
      // Calculate excellent students (90-100)
      const excellentStudents = gradeDistribution.find((g: any) => g.gradeRange === '90-100')?.count || 0;
      
      // Calculate at-risk students (below 60)
      const atRiskStudents = gradeDistribution.find((g: any) => g.gradeRange === '0-59')?.count || 0;
      
      // Calculate success rate (students with grades >= 60)
      const successRate = totalStudentsWithGrades > 0 ? Math.round(((totalStudentsWithGrades - atRiskStudents) / totalStudentsWithGrades) * 10000) / 100 : 0;
      
      // Calculate attendance rate
      let totalAttendanceRecords = 0;
      let totalPresent = 0;
      
      attendanceData.forEach((day: any) => {
        totalAttendanceRecords += day.total;
        totalPresent += day.present;
      });
      
      const attendanceRate = totalAttendanceRecords > 0 ? Math.round((totalPresent / totalAttendanceRecords) * 10000) / 100 : 0;
      
      setStats({
        totalStudents,
        attendanceRate,
        averageGrade,
        totalTeachers,
        excellentStudents,
        atRiskStudents,
        successRate
      });
    }
  }, [students, teachers, gradeDistribution, attendanceData]);

  // Helper function to get numeric value from grade range
  const getGradeValue = (gradeRange: string): number => {
    switch (gradeRange) {
      case '90-100': return 95;
      case '80-89': return 85;
      case '70-79': return 75;
      case '60-69': return 65;
      case '0-59': return 50;
      default: return 0;
    }
  };

  const fetchDashboardData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      // Fetch students
      const studentsResponse = await fetch('/api/users/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        const flattenedStudents = (studentsData.data?.students || []).map((student: any) => ({
          ...student,
          name: `${student.user.firstName} ${student.user.lastName}`,
          firstName: student.user.firstName,
          lastName: student.user.lastName,
          grade: student.gradeLevelData?.name || 'N/A',
          gradeLevel: student.gradeLevelData,
          averageGrade: null,
          attendance: null
        }));
        setStudents(flattenedStudents);
      }
      
      // Fetch classes
      const classesResponse = await fetch('/api/academic/classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData.data || []);
      }
      
      // Fetch teachers
      const teachersResponse = await fetch('/api/users/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        const flattenedTeachers = (teachersData.data?.teachers || []).map((teacher: any) => ({
          ...teacher,
          name: `${teacher.user.firstName} ${teacher.user.lastName}`,
          subjects: teacher.subjects?.map((s: any) => s.name) || [],
          performance: null
        }));
        setTeachers(flattenedTeachers);
      }
      
      // Fetch subjects
      const subjectsResponse = await fetch('/api/academic/subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData.data || []);
      }
      
      // Fetch active academic year first
      const activeYearResponse = await fetch('/api/academic/academic-years/active', {
        headers: { Authorization: `Bearer ${token}` }
      });

      let activeAcademicYearId = null;
      if (activeYearResponse.ok) {
        const activeYearData = await activeYearResponse.json();
        activeAcademicYearId = activeYearData.data?.id;
      }

      // Fetch attendance and grade data for charts
      const attendanceResponse = await fetch(`/api/reports?type=class-attendance${activeAcademicYearId ? `&academicYearId=${activeAcademicYearId}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();
        setAttendanceData(attendanceData.details || []);
        setMonthlyAttendance(attendanceData.monthlyTrend || []);
      }
      
      const gradesResponse = await fetch(`/api/reports?type=class-grades${activeAcademicYearId ? `&academicYearId=${activeAcademicYearId}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (gradesResponse.ok) {
        const gradesData = await gradesResponse.json();
        setGradeDistribution(gradesData.gradeDistribution || []);
        setSubjectPerformance(gradesData.subjectPerformance || []);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      setError(t("dashboard.errorFetchUsers"));
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch("/api/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (error) {
      setError(t("dashboard.errorFetchEvents"));
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch("/api/announcements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.data.announcements);
      }
    } catch (error) {
      setError(t("dashboard.errorFetchAnnouncements"));
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    if (!token) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/attendance/summary?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAttendanceStats({
          totalStudents: data.overallStats.totalStudents,
          presentToday: data.overallStats.totalPresent,
          attendanceRate: data.overallStats.overallAttendanceRate,
        });
      }
    } catch (error) {
      console.error("Failed to fetch attendance stats:", error);
    }
  };

  const handleCreateUser = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userData: {
            ...userForm,
            password: await hashPassword(userForm.password),
          },
          roleData: {},
        }),
      });

      if (response.ok) {
        setUserDialog(false);
        setUserForm({
          email: "",
          firstName: "",
          lastName: "",
          password: "",
          role: "STUDENT",
          phone: "",
          address: "",
        });
        fetchUsers();
      } else {
        setError(t("dashboard.errorCreateUser"));
      }
    } catch (error) {
      setError(t("dashboard.errorCreateUser"));
    }
  };

  const handleCreateEvent = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/events/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventForm),
      });

      if (response.ok) {
        setEventDialog(false);
        setEventForm({
          title: "",
          description: "",
          eventDate: "",
          eventTime: "",
          location: "",
          type: "GENERAL",
          targetRoles: ["ALL"],
        });
        fetchEvents();
      } else {
        setError(t("dashboard.errorCreateEvent"));
      }
    } catch (error) {
      setError(t("dashboard.errorCreateEvent"));
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/announcements/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(announcementForm),
      });

      if (response.ok) {
        setAnnouncementDialog(false);
        setAnnouncementForm({
          title: "",
          content: "",
          priority: "NORMAL",
          targetRoles: ["ALL"],
          expiresAt: "",
        });
        fetchAnnouncements();
      } else {
        setError(t("dashboard.errorCreateAnnouncement"));
      }
    } catch (error) {
      setError(t("dashboard.errorCreateAnnouncement"));
    }
  };

  const hashPassword = async (password: string) => {
    // In a real app, this would be handled server-side
    return password; // Simplified for demo
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token || !confirm("Are you sure you want to delete this user?"))
      return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchUsers();
      } else {
        setError(t("dashboard.errorDeleteUser"));
      }
    } catch (error) {
      setError(t("dashboard.errorDeleteUser"));
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "error";
      case "TEACHER":
        return "primary";
      case "STUDENT":
        return "success";
      case "PARENT":
        return "warning";
      default:
        return "default";
    }
  };

  const StatsCard = ({
    title,
    value,
    subtitle,
    icon,
    color = "primary",
  }: any) => (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography
              variant="h4"
              component="h2"
              color={`${color}.main`}
              fontWeight="bold"
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: `${color}.main` }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title={t("dashboard.totalStudents")}
            value={users.filter((u) => u.role === "STUDENT").length}
            icon={<People fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title={t("dashboard.totalTeachers")}
            value={users.filter((u) => u.role === "TEACHER").length}
            icon={<School fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title={t("dashboard.activeEvents")}
            value={events.filter((e) => e.isActive).length}
            icon={<Event fontSize="large" />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title={t("dashboard.announcements")}
            value={announcements.filter((a) => a.isActive).length}
            icon={<Announcement fontSize="large" />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title={t("dashboard.todayAttendance")}
            value={`${attendanceStats.attendanceRate}%`}
            subtitle={`${attendanceStats.presentToday}/${
              attendanceStats.totalStudents
            } ${t("attendance.present").toLowerCase()}`}
            icon={<Assessment fontSize="large" />}
            color="info"
          />
        </Grid>
      </Grid>
      
      {/* Dashboard Analytics Section - Moved from reports page */}
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          {t("dashboard.analytics")}
        </Typography>
        
        {/* Key Statistics */}
        <StatisticsSummary
          stats={[
            {
              title: t("dashboard.totalStudents"),
              value: stats.totalStudents.toString(),
              description: t("dashboard.activeStudents"),
              icon: <SchoolIcon />,
              trend: 'up',
              trendValue: '+2.6%',
              color: 'primary'
            },
            {
              title: t("dashboard.attendanceRate"),
              value: `${stats.attendanceRate}%`,
              description: t("dashboard.last30Days"),
              icon: <EventNoteIcon />,
              trend: 'up',
              trendValue: '+1.2%',
              color: 'success'
            },
            {
              title: t("dashboard.averageGrade"),
              value: `${stats.averageGrade}%`,
              description: t("dashboard.termAverage"),
              icon: <AssessmentIcon />,
              trend: 'up',
              trendValue: '+0.8%',
              color: 'success'
            },
            {
              title: t("dashboard.faculty"),
              value: stats.totalTeachers.toString(),
              description: t("dashboard.teachingStaff"),
              icon: <PeopleIcon />,
              trend: 'neutral',
              trendValue: '0%',
              color: 'info'
            }
          ]}
          loading={loading}
        />

        {/* Additional Statistics */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {stats.successRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      معدل النجاح
                    </Typography>
                  </Box>
                  <AssessmentIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {stats.excellentStudents}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      طلاب ممتاز
                    </Typography>
                  </Box>
                  <SchoolIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {stats.atRiskStudents}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      طلاب في خطر
                    </Typography>
                  </Box>
                  <PeopleIcon color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Chart Cards */}
        <Grid container spacing={3} sx={{ mb: 3, mt: 2 }}>
          <Grid item xs={12} md={8}>
            <ReportChart
              title={t("dashboard.attendanceTrend")}
              subTitle={t("dashboard.monthlyAttendance")}
              data={monthlyAttendance.map(item => ({
                label: item.month,
                value: item.attendance
              }))}
              type="line"
              height={350}
              showDownload={true}
              onDownload={() => downloadCSV(
                attendanceData, 
                [
                  { key: 'date', label: 'Date' },
                  { key: 'present', label: 'Present' },
                  { key: 'absent', label: 'Absent' },
                  { key: 'late', label: 'Late' },
                  { key: 'excused', label: 'Excused' },
                  { key: 'total', label: 'Total' }
                ],
                'attendance_report'
              )}
              showLegend={false}
              trendDirection="up"
              yAxisLabel={t("dashboard.attendancePercentage")}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ReportChart
              title={t("dashboard.gradeDistribution")}
              subTitle={t("dashboard.currentTermGrades")}
              data={gradeDistribution.map(item => ({
                label: item.gradeRange,
                value: item.percentage
              }))}
              type="pie"
              height={350}
              showLegend={true}
            />
          </Grid>
        </Grid>

        {/* Dashboard Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <DashboardCard
              title={t("dashboard.subjectPerformance")}
              subheader={t("dashboard.averageGradesBySubject")}
              chart="bar"
              chartData={subjectPerformance.map(item => ({ 
                name: item.subject, 
                value: item.average 
              }))}
              loading={loading}
              showDownload={true}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DashboardCard
              title={t("dashboard.topPerformingStudents")}
              subheader={t("dashboard.basedOnOverallGrades")}
              loading={loading}
              content={
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t("student")}</TableCell>
                        <TableCell>{t("grade")}</TableCell>
                        <TableCell align="right">{t("score")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.slice(0, 5).map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                                {student.name.charAt(0)}
                              </Avatar>
                              <Typography variant="body2">{student.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{student.grade}</TableCell>
                          <TableCell align="right">{student.averageGrade || 'N/A'}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              }
              footer={
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button size="small" color="primary">
                    {t("dashboard.viewAllStudents")}
                  </Button>
                </Box>
              }
            />
          </Grid>
        </Grid>
      </Box>

      {/* User Dialog */}
      <Dialog
        open={userDialog}
        onClose={() => setUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedUser ? "Edit User" : "Create New User"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={userForm.firstName}
                onChange={(e) =>
                  setUserForm({ ...userForm, firstName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={userForm.lastName}
                onChange={(e) =>
                  setUserForm({ ...userForm, lastName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
                helperText={
                  selectedUser ? "Leave blank to keep current password" : ""
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={userForm.role}
                  label="Role"
                  onChange={(e) =>
                    setUserForm({ ...userForm, role: e.target.value })
                  }
                >
                  <MenuItem value="ADMIN">
                    {t("users.roles.admin", "Admin")}
                  </MenuItem>
                  <MenuItem value="TEACHER">
                    {t("users.roles.teacher", "Teacher")}
                  </MenuItem>
                  <MenuItem value="STUDENT">
                    {t("users.roles.student", "Student")}
                  </MenuItem>
                  <MenuItem value="PARENT">
                    {t("users.roles.parent", "Parent")}
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateUser}>
            {selectedUser ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Event Dialog */}
      <Dialog
        open={eventDialog}
        onClose={() => setEventDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Event Title"
                value={eventForm.title}
                onChange={(e) =>
                  setEventForm({ ...eventForm, title: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={eventForm.description}
                onChange={(e) =>
                  setEventForm({ ...eventForm, description: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Event Date"
                value={eventForm.eventDate}
                onChange={(e) =>
                  setEventForm({ ...eventForm, eventDate: e.target.value })
                }
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="time"
                label="Event Time"
                value={eventForm.eventTime}
                onChange={(e) =>
                  setEventForm({ ...eventForm, eventTime: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={eventForm.location}
                onChange={(e) =>
                  setEventForm({ ...eventForm, location: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={eventForm.type}
                  label="Type"
                  onChange={(e) =>
                    setEventForm({ ...eventForm, type: e.target.value })
                  }
                >
                  <MenuItem value="GENERAL">General</MenuItem>
                  <MenuItem value="ACADEMIC">Academic</MenuItem>
                  <MenuItem value="SPORTS">Sports</MenuItem>
                  <MenuItem value="CULTURAL">Cultural</MenuItem>
                  <MenuItem value="MEETING">Meeting</MenuItem>
                  <MenuItem value="HOLIDAY">Holiday</MenuItem>
                  <MenuItem value="EXAM">Exam</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Target Audience</InputLabel>
                <Select
                  multiple
                  value={eventForm.targetRoles}
                  onChange={(e) => {
                    const value = e.target.value as (
                      | "ALL"
                      | "STUDENTS"
                      | "PARENTS"
                      | "TEACHERS"
                    )[];
                    // If ALL is selected, only select ALL
                    if (
                      value.includes("ALL") &&
                      !eventForm.targetRoles.includes("ALL")
                    ) {
                      setEventForm({ ...eventForm, targetRoles: ["ALL"] });
                    } else if (
                      !value.includes("ALL") &&
                      eventForm.targetRoles.includes("ALL")
                    ) {
                      // If ALL is deselected, allow selecting specific roles
                      setEventForm({
                        ...eventForm,
                        targetRoles: value.filter((v) => v !== "ALL"),
                      });
                    } else {
                      setEventForm({ ...eventForm, targetRoles: value });
                    }
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="ALL">All Users</MenuItem>
                  <MenuItem value="STUDENTS">Students</MenuItem>
                  <MenuItem value="PARENTS">Parents</MenuItem>
                  <MenuItem value="TEACHERS">Teachers</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEventDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateEvent}>
            Create Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Announcement Dialog */}
      <Dialog
        open={announcementDialog}
        onClose={() => setAnnouncementDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Announcement</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={announcementForm.title}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    title: e.target.value,
                  })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Content"
                value={announcementForm.content}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    content: e.target.value,
                  })
                }
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={announcementForm.priority}
                  label="Priority"
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      priority: e.target.value,
                    })
                  }
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="NORMAL">Normal</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Expires At (Optional)"
                value={announcementForm.expiresAt}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    expiresAt: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Target Audience</InputLabel>
                <Select
                  multiple
                  value={announcementForm.targetRoles}
                  onChange={(e) => {
                    const value = e.target.value as (
                      | "ALL"
                      | "STUDENTS"
                      | "PARENTS"
                      | "TEACHERS"
                    )[];
                    // If ALL is selected, only select ALL
                    if (
                      value.includes("ALL") &&
                      !announcementForm.targetRoles.includes("ALL")
                    ) {
                      setAnnouncementForm({
                        ...announcementForm,
                        targetRoles: ["ALL"],
                      });
                    } else if (
                      !value.includes("ALL") &&
                      announcementForm.targetRoles.includes("ALL")
                    ) {
                      // If ALL is deselected, allow selecting specific roles
                      setAnnouncementForm({
                        ...announcementForm,
                        targetRoles: value.filter((v) => v !== "ALL"),
                      });
                    } else {
                      setAnnouncementForm({
                        ...announcementForm,
                        targetRoles: value,
                      });
                    }
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="ALL">All Users</MenuItem>
                  <MenuItem value="STUDENTS">Students</MenuItem>
                  <MenuItem value="PARENTS">Parents</MenuItem>
                  <MenuItem value="TEACHERS">Teachers</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnnouncementDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateAnnouncement}>
            Create Announcement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
