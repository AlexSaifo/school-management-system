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
import {
  generateMockStudents,
  generateMockClasses,
  generateMockTeachers,
  generateMockSubjects,
  generateAttendanceData,
  generateGradeDistribution,
  generateMonthlyAttendance,
  generateSubjectPerformance,
} from "@/lib/mock-report-data";
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
  
  // Load mock data for dashboard charts
  useEffect(() => {
    const timer = setTimeout(() => {
      setStudents(generateMockStudents(50));
      setClasses(generateMockClasses());
      setTeachers(generateMockTeachers());
      setSubjects(generateMockSubjects());
      setAttendanceData(generateAttendanceData());
      setGradeDistribution(generateGradeDistribution());
      setMonthlyAttendance(generateMonthlyAttendance());
      setSubjectPerformance(generateSubjectPerformance());
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

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
              value: '1,247',
              description: t("dashboard.newThisMonth", { count: 32 }),
              icon: <SchoolIcon />,
              trend: 'up',
              trendValue: '+2.6%',
              color: 'primary'
            },
            {
              title: t("dashboard.attendanceRate"),
              value: '91.5%',
              description: t("dashboard.last30Days"),
              icon: <EventNoteIcon />,
              trend: 'down',
              trendValue: '-1.2%',
              color: 'warning'
            },
            {
              title: t("dashboard.averageGrade"),
              value: '76.8%',
              description: t("dashboard.termAverage"),
              icon: <AssessmentIcon />,
              trend: 'up',
              trendValue: '+0.8%',
              color: 'success'
            },
            {
              title: t("dashboard.faculty"),
              value: '78',
              description: t("dashboard.departments", { count: 12 }),
              icon: <PeopleIcon />,
              trend: 'neutral',
              trendValue: '0%',
              color: 'info'
            }
          ]}
          loading={loading}
        />

        {/* Chart Cards */}
        <Grid container spacing={3} sx={{ mb: 3, mt: 2 }}>
          <Grid item xs={12} md={8}>
            <ReportChart
              title={t("dashboard.attendanceTrend")}
              subTitle={t("dashboard.monthlyAttendance")}
              data={generateMonthlyAttendance().map(item => ({
                label: item.month,
                value: item.attendance
              }))}
              type="line"
              height={350}
              showDownload={true}
              onDownload={() => downloadCSV(
                generateAttendanceData(), 
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
              trendDirection="down"
              yAxisLabel={t("dashboard.attendancePercentage")}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ReportChart
              title={t("dashboard.gradeDistribution")}
              subTitle={t("dashboard.currentTermGrades")}
              data={generateGradeDistribution().map(item => ({
                label: item.gradeRange.split(' ')[0],
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
              chartData={generateSubjectPerformance().map(item => ({ 
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
                      {generateMockStudents(5).sort((a, b) => b.averageGrade - a.averageGrade).map((student) => (
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
                          <TableCell align="right">{student.averageGrade}%</TableCell>
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
