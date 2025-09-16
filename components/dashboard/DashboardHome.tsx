"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  Button,
} from "@mui/material";
import {
  TrendingUp,
  People,
  School,
  Assignment,
  EventNote,
  Announcement,
  Warning,
  CheckCircle,
  AccessTime,
  Refresh,
  ArrowUpward,
  ArrowDownward,
  Class,
  Event,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import EventsWidget from "@/components/EventsWidget";

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalAdmins: number;
  activeClasses: number;
  totalAssignments: number;
  pendingAssignments: number;
  upcomingExams: number;
  totalSubjects: number;
  attendanceToday: number;
  attendanceRate: number;
  recentEnrollments: number;
  academicYear: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "error";
  createdAt: string;
  author: string;
  priority: "high" | "medium" | "low" | "normal" | "urgent";
}

interface SchoolActivity {
  recentAssignments: Array<{
    id: string;
    title: string;
    subject: string;
    class: string;
    dueDate: string;
    createdAt: string;
  }>;
  upcomingExams: Array<{
    id: string;
    title: string;
    subject: string;
    class: string;
    examDate: string;
    duration: number;
  }>;
  recentEvents: Array<{
    id: string;
    title: string;
    description: string;
    eventDate: string;
    location: string;
  }>;
  lowAttendanceClasses: Array<{
    id: string;
    name: string;
    attendanceRate: number;
    totalStudents: number;
  }>;
}

export default function DashboardHome() {
  const { user, token } = useAuth();
  const { t } = useTranslation();

  console.log("DashboardHome: Rendering with user:", user?.email);

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalAdmins: 0,
    activeClasses: 0,
    totalAssignments: 0,
    pendingAssignments: 0,
    upcomingExams: 0,
    totalSubjects: 0,
    attendanceToday: 0,
    attendanceRate: 0,
    recentEnrollments: 0,
    academicYear: "2024-2025",
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activities, setActivities] = useState<SchoolActivity>({
    recentAssignments: [],
    upcomingExams: [],
    recentEvents: [],
    lowAttendanceClasses: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      fetchAnnouncements();
      fetchSchoolActivities();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        console.error("Failed to fetch dashboard stats");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch("/api/dashboard/announcements", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements);
      } else {
        console.error("Failed to fetch announcements");
        // Fall back to empty array if API fails
        setAnnouncements([]);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      // Fall back to empty array if API fails
      setAnnouncements([]);
    }
  };

  const fetchSchoolActivities = async () => {
    try {
      const response = await fetch("/api/dashboard/activities", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
      } else {
        console.error("Failed to fetch school activities");
      }
    } catch (error) {
      console.error("Error fetching school activities:", error);
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = t("dashboard.goodMorning");
    if (hour >= 12 && hour < 18) greeting = t("dashboard.goodAfternoon");
    else if (hour >= 18) greeting = t("dashboard.goodEvening");

    return `${greeting}, ${user?.firstName}!`;
  };

  const StatCard = ({
    title,
    value,
    icon,
    color = "primary",
    change,
    changeType = "increase",
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: "primary" | "secondary" | "success" | "warning" | "error";
    change?: string;
    changeType?: "increase" | "decrease";
  }) => (
    <Card sx={{ height: "100%", position: "relative", overflow: "hidden" }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography
              color="textSecondary"
              gutterBottom
              variant="body2"
              fontWeight={500}
            >
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
            {change && (
              <Box display="flex" alignItems="center" mt={1}>
                {changeType === "increase" ? (
                  <ArrowUpward sx={{ fontSize: 16, color: "success.main" }} />
                ) : (
                  <ArrowDownward sx={{ fontSize: 16, color: "error.main" }} />
                )}
                <Typography
                  variant="caption"
                  color={
                    changeType === "increase" ? "success.main" : "error.main"
                  }
                  fontWeight={600}
                >
                  {change}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 0.5 }}
                >
                  {t("dashboard.vsLastMonth")}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 60, height: 60 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>{t("dashboard.pleaseLogin")}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {getWelcomeMessage()}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {t("dashboard.welcomeToDashboard")} {user.role.toLowerCase()} dashboard
        </Typography>
        <Chip
          label={`${user.role} ${t("dashboard.portal")}`}
          color="primary"
          variant="filled"
          sx={{ fontWeight: "bold" }}
        />
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t("dashboard.activeClasses")}
            value={stats.activeClasses.toLocaleString()}
            icon={<Class />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t("dashboard.activeStudents")}
            value={stats.totalStudents.toLocaleString()}
            icon={<School />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t("dashboard.teachingStaff")}
            value={stats.totalTeachers}
            icon={<People />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t("dashboard.attendanceRate")}
            value={`${stats.attendanceRate}%`}
            icon={<CheckCircle />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Additional School Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t("dashboard.totalSubjects")}
            value={stats.totalSubjects.toLocaleString()}
            icon={<Assignment />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t("dashboard.pendingAssignments")}
            value={stats.pendingAssignments.toLocaleString()}
            icon={<AccessTime />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t("dashboard.upcomingExams")}
            value={stats.upcomingExams.toLocaleString()}
            icon={<School />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t("dashboard.newEnrollments")}
            value={stats.recentEnrollments.toLocaleString()}
            icon={<TrendingUp />}
            color="success"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Announcements */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              height: "500px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Typography variant="h6" fontWeight="bold">
                {t("dashboard.recentAnnouncements")}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EventNote />}
                onClick={() => (window.location.href = "/announcements")}
              >
                {t("dashboard.viewAll")}
              </Button>
            </Box>

            <Box flexGrow={1} overflow="auto">
              {announcements.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  sx={{ height: "300px", textAlign: "center" }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "grey.100",
                      width: 80,
                      height: 80,
                      mb: 2,
                    }}
                  >
                    <Announcement sx={{ fontSize: 40, color: "grey.500" }} />
                  </Avatar>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t("dashboard.noAnnouncements")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    {t("dashboard.noAnnouncementsDescription")}
                  </Typography>
                  {user.role === "ADMIN" && (
                    <Button
                      variant="contained"
                      startIcon={<Announcement />}
                      onClick={() => (window.location.href = "/announcements")}
                      size="small"
                    >
                      {t("dashboard.createFirstAnnouncement")}
                    </Button>
                  )}
                </Box>
              ) : (
                <List>
                  {announcements.map((announcement, index) => (
                    <React.Fragment key={announcement.id}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor:
                                announcement.type === "warning"
                                  ? "warning.main"
                                  : announcement.type === "error"
                                  ? "error.main"
                                  : announcement.type === "success"
                                  ? "success.main"
                                  : "info.main",
                            }}
                          >
                            {announcement.type === "warning" ? (
                              <Warning />
                            ) : announcement.type === "error" ? (
                              <Warning />
                            ) : announcement.type === "success" ? (
                              <CheckCircle />
                            ) : (
                              <Announcement />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              mb={0.5}
                            >
                              <Typography variant="subtitle1" fontWeight="bold">
                                {announcement.title}
                              </Typography>
                              <Chip
                                label={t(`dashboard.priority${announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}`)}
                                size="small"
                                color={
                                  announcement.priority === "urgent"
                                    ? "error"
                                    : announcement.priority === "high"
                                    ? "error"
                                    : announcement.priority === "medium"
                                    ? "warning"
                                    : announcement.priority === "normal"
                                    ? "info"
                                    : "default"
                                }
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography
                                variant="body2"
                                color="text.primary"
                                gutterBottom
                              >
                                {announcement.content}
                              </Typography>
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                mt={1}
                              >
                                <AccessTime sx={{ fontSize: 14 }} />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {new Date(
                                    announcement.createdAt
                                  ).toLocaleDateString()}{" "}
                                  • {announcement.author}
                                </Typography>
                              </Box>
                            </>
                          }
                        />
                      </ListItem>
                      {index < announcements.length - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Events Widget */}
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, height: "500px", display: "flex", flexDirection: "column" }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Typography variant="h6" fontWeight="bold">
                {t("dashboard.upcomingEvents")}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EventNote />}
                onClick={() => (window.location.href = "/events")}
              >
                {t("dashboard.viewAll")}
              </Button>
            </Box>

            <Box flexGrow={1} overflow="auto">
              <EventsWidget maxItems={5} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions for Admin */}
      {user.role === "ADMIN" && (
        <Grid container spacing={3} mt={2}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                {t("dashboard.quickActions")}
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button variant="contained" startIcon={<People />}>
                  {t("dashboard.manageUsers")}
                </Button>
                <Button variant="outlined" startIcon={<EventNote />}>
                  {t("dashboard.createEvent")}
                </Button>
                <Button variant="outlined" startIcon={<Announcement />}>
                  {t("dashboard.newAnnouncement")}
                </Button>
                <Button variant="outlined" startIcon={<TrendingUp />}>
                  {t("dashboard.viewReports")}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
