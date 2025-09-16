"use client";

import React, { useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Collapse,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  School,
  Class,
  Assignment,
  CalendarMonth,
  Assessment,
  Notifications,
  Settings,
  Logout,
  ExpandLess,
  ExpandMore,
  Person,
  SupervisorAccount,
  Groups,
  FamilyRestroom,
  EventNote,
  Announcement,
  Schedule,
  Grade,
  BookOnline,
  AccountCircle,
  Room,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const drawerWidth = 280;

interface SidebarLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  titleKey: string;
  icon: React.ReactNode;
  path: string;
  roles: string[];
  children?: NavigationItem[];
  exact?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    titleKey: "navigation.dashboard",
    icon: <Dashboard />,
    path: "/dashboard",
    roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
  },
  {
    titleKey: "navigation.users",
    icon: <People />,
    path: "/users/admins",
    roles: ["ADMIN"],
    children: [
      {
        titleKey: "navigation.admins",
        icon: <SupervisorAccount />,
        path: "/users/admins",
        roles: ["ADMIN"],
      },
      {
        titleKey: "navigation.teachers",
        icon: <School />,
        path: "/users/teachers",
        roles: ["ADMIN"],
      },
      {
        titleKey: "navigation.students",
        icon: <Groups />,
        path: "/users/students",
        roles: ["ADMIN"],
      },
      {
        titleKey: "navigation.parents",
        icon: <FamilyRestroom />,
        path: "/users/parents",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    titleKey: "navigation.academic",
    icon: <BookOnline />,
    path: "/academic",
    roles: ["ADMIN", "TEACHER"],
    children: [
      {
        titleKey: "common.all",
        icon: <Dashboard />,
        path: "/academic",
        roles: ["ADMIN", "TEACHER"],
        exact: true,
      },
      {
        titleKey: "academic.classrooms.title",
        icon: <Class />,
        path: "/academic/classrooms",
        roles: ["ADMIN", "TEACHER"],
      },
      {
        titleKey: "academic.subjects",
        icon: <BookOnline />,
        path: "/academic/subjects",
        roles: ["ADMIN", "TEACHER"],
      },
      // {
      //   titleKey: "academic.curriculum",
      //   icon: <Assignment />,
      //   path: "/academic/curriculum",
      //   roles: ["ADMIN", "TEACHER"],
      // },
      {
        titleKey: "academic.academicYear",
        icon: <CalendarMonth />,
        path: "/academic/academic-year",
        roles: ["ADMIN", "TEACHER"],
      },
      {
        titleKey: "academic.grades.title",
        icon: <Grade />,
        path: "/academic/grades",
        roles: ["ADMIN"],
      },
      // {
      //   titleKey: "academic.rooms.title",
      //   icon: <Room />,
      //   path: "/academic/rooms",
      //   roles: ["ADMIN"],
      // },
      {
        titleKey: "academic.specialLocations.title",
        icon: <LocationIcon />,
        path: "/academic/special-locations",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    titleKey: "navigation.timetable",
    icon: <Schedule />,
    path: "/timetable",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    children: [
      {
        titleKey: "timetable.manage",
        icon: <Schedule />,
        path: "/timetable",
        roles: ["ADMIN", "TEACHER"],
      },
      {
        titleKey: "timetable.teachers",
        icon: <School />,
        path: "/timetable/teachers",
        roles: ["ADMIN", "TEACHER"],
      },
      {
        titleKey: "timetable.classes",
        icon: <Class />,
        path: "/timetable/classes",
        roles: ["ADMIN", "TEACHER"],
      },
    ],
  },
  {
    titleKey: "navigation.assignments",
    icon: <Assignment />,
    path: "/assignments",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    titleKey: "navigation.exams",
    icon: <Grade />,
    path: "/exams",
    roles: ["TEACHER", "STUDENT", "PARENT"],
  },
  {
    titleKey: "navigation.attendance",
    icon: <CalendarMonth />,
    path: "/attendance",
    roles: ["ADMIN", "TEACHER", "PARENT"],
  },
  {
    titleKey: "navigation.reports",
    icon: <Assessment />,
    path: "/reports",
    roles: ["ADMIN", "TEACHER"],
  },
  {
    titleKey: "navigation.events",
    icon: <EventNote />,
    path: "/events",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  {
    titleKey: "navigation.announcements",
    icon: <Announcement />,
    path: "/announcements",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
  },
  // {
  //   titleKey: "navigation.profile",
  //   icon: <AccountCircle />,
  //   path: "/profile",
  //   roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"],
  // },
];

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const { user, logout } = useAuth();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  console.log(
    "SidebarLayout: Rendering with user:",
    user?.email,
    "pathname:",
    pathname
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
    handleProfileMenuClose();
  };

  const handleExpandClick = (titleKey: string) => {
    setExpandedItems((prev) =>
      prev.includes(titleKey)
        ? prev.filter((item) => item !== titleKey)
        : [...prev, titleKey]
    );
  };

  const isItemVisible = (item: NavigationItem) => {
    return item.roles.includes(user?.role || "");
  };

  const isItemActive = (path: string, exact?: boolean) => {
    if (exact) {
      return pathname === path;
    }
    return pathname === path || pathname.startsWith(path + "/");
  };

  const NavigationList = () => (
    <Box>
      <Toolbar>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <School />
          </Avatar>
          <Box sx={{ textAlign: isRTL ? "right" : "left" }}>
            <Typography variant="h6" noWrap component="div" fontWeight="bold">
              EduManage
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("dashboard.welcomeMessage")}
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />

      <List sx={{ px: 1, py: 1 }}>
        {navigationItems.filter(isItemVisible).map((item) => {
          // Check if item has visible children
          const visibleChildren = item.children?.filter(isItemVisible) || [];
          const hasVisibleChildren = visibleChildren.length > 0;

          return (
            <Box key={item.titleKey}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    if (hasVisibleChildren) {
                      handleExpandClick(item.titleKey);
                    } else {
                      router.push(item.path);
                      setMobileOpen(false);
                    }
                  }}
                  selected={isItemActive(item.path, item.exact)}
                  sx={{
                    borderRadius: 2,
                    mx: 0.5,
                    flexDirection: isRTL ? "row-reverse" : "row",
                    "&.Mui-selected": {
                      backgroundColor: "primary.main",
                      color: "white",
                      "& .MuiListItemIcon-root": {
                        color: "white",
                      },
                      "&:hover": {
                        backgroundColor: "primary.dark",
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: isRTL ? "auto" : 56,
                      justifyContent: "center",
                      ml: isRTL ? 1 : 0,
                      mr: isRTL ? 0 : 1,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={t(item.titleKey)}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: isItemActive(item.path, item.exact)
                        ? 600
                        : 400,
                      textAlign: isRTL ? "right" : "left",
                    }}
                    sx={{
                      textAlign: isRTL ? "right" : "left",
                    }}
                  />
                  {hasVisibleChildren &&
                    (expandedItems.includes(item.titleKey) ? (
                      <ExpandLess />
                    ) : (
                      <ExpandMore />
                    ))}
                </ListItemButton>
              </ListItem>

              {hasVisibleChildren && (
                <Collapse
                  in={expandedItems.includes(item.titleKey)}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    {visibleChildren.map((child) => (
                      <ListItem
                        key={child.titleKey}
                        disablePadding
                        sx={{ mb: 0.5 }}
                      >
                        <ListItemButton
                          onClick={() => {
                            router.push(child.path);
                            setMobileOpen(false);
                          }}
                          selected={isItemActive(child.path, child.exact)}
                          sx={{
                            borderRadius: 2,
                            mx: 0.5,
                            ml: isRTL ? 0.5 : 2,
                            mr: isRTL ? 2 : 0.5,
                            flexDirection: isRTL ? "row-reverse" : "row",
                            "&.Mui-selected": {
                              backgroundColor: "primary.main",
                              color: "white",
                              "& .MuiListItemIcon-root": {
                                color: "white",
                              },
                              "&:hover": {
                                backgroundColor: "primary.dark",
                              },
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 36,
                              justifyContent: "center",
                              ml: isRTL ? 1 : 0,
                              mr: isRTL ? 0 : 1,
                            }}
                          >
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={t(child.titleKey)}
                            primaryTypographyProps={{
                              fontSize: "0.8125rem",
                              fontWeight: isItemActive(child.path, child.exact)
                                ? 600
                                : 400,
                              textAlign: isRTL ? "right" : "left",
                            }}
                            sx={{
                              textAlign: isRTL ? "right" : "left",
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: isRTL ? 0 : `${drawerWidth}px` },
          mr: { sm: isRTL ? `${drawerWidth}px` : 0 },
          backgroundColor: "white",
          color: "text.primary",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Toolbar sx={{ direction: isRTL ? "rtl" : "ltr" }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge={isRTL ? "end" : "start"}
            onClick={handleDrawerToggle}
            sx={{
              mr: isRTL ? 0 : 2,
              ml: isRTL ? 2 : 0,
              display: { sm: "none" },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1 }}
            suppressHydrationWarning
          >
            {t("navigation.dashboard")} {user?.role}
          </Typography>

          <Box display="flex" alignItems="center" gap={1}>
            <LanguageSwitcher />

            <Tooltip title={t("navigation.notifications")}>
              <IconButton color="inherit">
                <Badge badgeContent={4} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title={t("navigation.profile")}>
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{
                  p: 0,
                  ml: isRTL ? 0 : 1,
                  mr: isRTL ? 1 : 0,
                }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "primary.main",
                    fontSize: "1rem",
                  }}
                >
                  {user?.firstName[0]}
                  {user?.lastName[0]}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
            mt: 1.5,
            direction: isRTL ? "rtl" : "ltr",
          },
        }}
        transformOrigin={{
          horizontal: isRTL ? "left" : "right",
          vertical: "top",
        }}
        anchorOrigin={{
          horizontal: isRTL ? "left" : "right",
          vertical: "bottom",
        }}
      >
        <MenuItem onClick={() => router.push("/dashboard/profile")}>
          <ListItemIcon
            sx={{
              minWidth: "auto",
              mr: isRTL ? 0 : 2,
              ml: isRTL ? 2 : 0,
            }}
          >
            <Person fontSize="small" />
          </ListItemIcon>
          {t("navigation.profile")}
        </MenuItem>

        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon
            sx={{
              minWidth: "auto",
              mr: isRTL ? 0 : 2,
              ml: isRTL ? 2 : 0,
            }}
          >
            <Logout fontSize="small" />
          </ListItemIcon>
          {t("common.logout")}
        </MenuItem>
      </Menu>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          anchor={isRTL ? "right" : "left"}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              backgroundColor: "#fafafa",
              direction: isRTL ? "rtl" : "ltr",
            },
          }}
        >
          <NavigationList />
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          anchor={isRTL ? "right" : "left"}
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              backgroundColor: "#fafafa",
              borderRight: isRTL ? "none" : "1px solid #e0e0e0",
              borderLeft: isRTL ? "1px solid #e0e0e0" : "none",
              direction: isRTL ? "rtl" : "ltr",
            },
          }}
          open
        >
          <NavigationList />
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
