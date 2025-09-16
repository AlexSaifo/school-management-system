'use client';

import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  IconButton,
  Stack,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import { 
  CalendarMonth, 
  Add, 
  Edit, 
  Delete, 
  Schedule, 
  Event,
  ArrowBack,
  School,
  DateRange,
  Today,
  EventAvailable,
  EventBusy
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import SidebarLayout from '@/components/layout/SidebarLayout';
import PageHeader from '@/components/PageHeader';

export default function AcademicYearPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState<any>(null);
  const [dialogType, setDialogType] = useState<'year' | 'semester' | 'event'>('year');

  // Mock data for academic years
  const academicYears = [
    {
      id: 1,
      name: '2024-2025',
      nameAr: '2024-2025',
      startDate: '2024-09-01',
      endDate: '2025-06-30',
      status: 'Active',
      isActive: true,
      totalDays: 180,
      completedDays: 45,
      color: '#1976d2',
      semesters: [
        {
          id: 1,
          name: 'First Semester',
          nameAr: 'الفصل الأول',
          startDate: '2024-09-01',
          endDate: '2025-01-15',
          status: 'Active',
          days: 90,
          completedDays: 45
        },
        {
          id: 2,
          name: 'Second Semester',
          nameAr: 'الفصل الثاني',
          startDate: '2025-01-30',
          endDate: '2025-06-30',
          status: 'Upcoming',
          days: 90,
          completedDays: 0
        }
      ]
    },
    {
      id: 2,
      name: '2023-2024',
      nameAr: '2023-2024',
      startDate: '2023-09-01',
      endDate: '2024-06-30',
      status: 'Completed',
      isActive: false,
      totalDays: 180,
      completedDays: 180,
      color: '#4caf50',
      semesters: [
        {
          id: 3,
          name: 'First Semester',
          nameAr: 'الفصل الأول',
          startDate: '2023-09-01',
          endDate: '2024-01-15',
          status: 'Completed',
          days: 90,
          completedDays: 90
        },
        {
          id: 4,
          name: 'Second Semester',
          nameAr: 'الفصل الثاني',
          startDate: '2024-01-30',
          endDate: '2024-06-30',
          status: 'Completed',
          days: 90,
          completedDays: 90
        }
      ]
    },
    {
      id: 3,
      name: '2025-2026',
      nameAr: '2025-2026',
      startDate: '2025-09-01',
      endDate: '2026-06-30',
      status: 'Planning',
      isActive: false,
      totalDays: 180,
      completedDays: 0,
      color: '#ff9800',
      semesters: [
        {
          id: 5,
          name: 'First Semester',
          nameAr: 'الفصل الأول',
          startDate: '2025-09-01',
          endDate: '2026-01-15',
          status: 'Planning',
          days: 90,
          completedDays: 0
        },
        {
          id: 6,
          name: 'Second Semester',
          nameAr: 'الفصل الثاني',
          startDate: '2026-01-30',
          endDate: '2026-06-30',
          status: 'Planning',
          days: 90,
          completedDays: 0
        }
      ]
    }
  ];

  // Mock data for important events
  const academicEvents = [
    {
      id: 1,
      name: 'First Day of School',
      nameAr: 'اليوم الأول من المدرسة',
      date: '2024-09-01',
      type: 'Academic',
      color: '#1976d2'
    },
    {
      id: 2,
      name: 'Mid-term Exams',
      nameAr: 'امتحانات منتصف الفصل',
      date: '2024-11-15',
      type: 'Assessment',
      color: '#f57c00'
    },
    {
      id: 3,
      name: 'Winter Break',
      nameAr: 'عطلة الشتاء',
      date: '2024-12-20',
      type: 'Holiday',
      color: '#2196f3'
    },
    {
      id: 4,
      name: 'Final Exams',
      nameAr: 'الامتحانات النهائية',
      date: '2025-01-05',
      type: 'Assessment',
      color: '#d32f2f'
    },
    {
      id: 5,
      name: 'Spring Semester Begins',
      nameAr: 'بداية الفصل الربيعي',
      date: '2025-01-30',
      type: 'Academic',
      color: '#4caf50'
    },
    {
      id: 6,
      name: 'Graduation Ceremony',
      nameAr: 'حفل التخرج',
      date: '2025-06-15',
      type: 'Event',
      color: '#9c27b0'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#4caf50';
      case 'Completed': return '#2196f3';
      case 'Planning': return '#ff9800';
      case 'Upcoming': return '#f57c00';
      default: return '#757575';
    }
  };

  const handleAddYear = () => {
    setSelectedYear(null);
    setDialogType('year');
    setOpenDialog(true);
  };

  const handleAddSemester = () => {
    setSelectedYear(null);
    setDialogType('semester');
    setOpenDialog(true);
  };

  const handleAddEvent = () => {
    setSelectedYear(null);
    setDialogType('event');
    setOpenDialog(true);
  };

  const handleEdit = (item: any, type: 'year' | 'semester' | 'event') => {
    setSelectedYear(item);
    setDialogType(type);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedYear(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <SidebarLayout>
      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Page Header */}
          <PageHeader
            title={t('academic.academicYearManagement')}
            subtitle={t('academic.manageAcademicYearsDescription')}
            actionLabel={t('academic.addAcademicYear')}
            actionIcon={<Add />}
            onAction={handleAddYear}
          />

          {/* Additional Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<Event />}
              onClick={handleAddEvent}
              sx={{ px: 2 }}
            >
              {t('academic.addEvent')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Schedule />}
              onClick={handleAddSemester}
              sx={{ px: 2 }}
            >
              {t('academic.addSemester')}
            </Button>
          </Box>

          {/* Academic Years Overview */}
          <Grid container spacing={3}>
            {academicYears.map((year) => (
              <Grid item xs={12} md={6} lg={4} key={year.id}>
                <Card
                  sx={{
                    height: '100%',
                    background: `linear-gradient(135deg, ${year.color}15 0%, ${year.color}05 100%)`,
                    border: `2px solid ${year.color}20`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                      border: `2px solid ${year.color}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      {/* Year Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Avatar
                          sx={{
                            width: 50,
                            height: 50,
                            background: `linear-gradient(135deg, ${year.color} 0%, ${year.color}CC 100%)`,
                          }}
                        >
                          <DateRange />
                        </Avatar>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <FormControlLabel
                            control={
                              <Switch 
                                checked={year.isActive} 
                                size="small"
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: year.color,
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: year.color,
                                  },
                                }}
                              />
                            }
                            label=""
                          />
                          <IconButton 
                            size="small" 
                            onClick={() => handleEdit(year, 'year')}
                            sx={{ color: year.color }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Year Info */}
                      <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                          {year.name}
                        </Typography>
                        <Chip 
                          label={t(`academic.${year.status.toLowerCase()}`)} 
                          size="small" 
                          sx={{ 
                            background: getStatusColor(year.status),
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            mb: 2
                          }} 
                        />
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EventAvailable sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              <strong>{t('academic.startDate')}:</strong> {formatDate(year.startDate)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EventBusy sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              <strong>{t('academic.endDate')}:</strong> {formatDate(year.endDate)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      {/* Progress */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {t('academic.progress')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {year.completedDays}/{year.totalDays} {t('academic.days')}
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          width: '100%', 
                          height: 8, 
                          backgroundColor: `${year.color}20`,
                          borderRadius: 4,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{
                            width: `${(year.completedDays / year.totalDays) * 100}%`,
                            height: '100%',
                            backgroundColor: year.color,
                            transition: 'width 0.3s ease'
                          }} />
                        </Box>
                      </Box>

                      {/* Semesters */}
                      <Box>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          {t('academic.semesters')}:
                        </Typography>
                        <Stack spacing={1}>
                          {year.semesters.map((semester, index) => (
                            <Box key={semester.id} sx={{ 
                              p: 1.5, 
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              backgroundColor: 'background.paper'
                            }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {isRTL ? semester.nameAr : semester.name}
                                </Typography>
                                <Chip 
                                  label={t(`academic.${semester.status.toLowerCase()}`)} 
                                  size="small" 
                                  sx={{ 
                                    background: `${getStatusColor(semester.status)}20`,
                                    color: getStatusColor(semester.status),
                                    fontSize: '0.65rem'
                                  }} 
                                />
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(semester.startDate)} - {formatDate(semester.endDate)}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Academic Calendar Timeline */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule />
                    {t('academic.academicCalendar')}
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {academicEvents.map((event, index) => (
                      <Box key={event.id} sx={{ display: 'flex', mb: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2 }}>
                          <Avatar
                            sx={{ 
                              width: 32,
                              height: 32,
                              backgroundColor: event.color,
                              color: 'white'
                            }}
                          >
                            <Event fontSize="small" />
                          </Avatar>
                          {index < academicEvents.length - 1 && (
                            <Box 
                              sx={{ 
                                width: 2, 
                                height: 40, 
                                backgroundColor: 'grey.300', 
                                mt: 1 
                              }} 
                            />
                          )}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {isRTL ? event.nameAr : event.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(event.date)}
                          </Typography>
                          <Chip 
                            label={t(`academic.${event.type.toLowerCase()}`)} 
                            size="small" 
                            sx={{ 
                              mt: 0.5,
                              backgroundColor: `${event.color}20`,
                              color: event.color,
                              fontSize: '0.7rem'
                            }} 
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {/* Current Academic Year Stats */}
                <Card sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Today />
                      {t('academic.currentYear')}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                      2024-2025
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">{t('academic.daysCompleted')}:</Typography>
                        <Typography variant="body2" fontWeight="bold">45/180</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">{t('academic.currentSemester')}:</Typography>
                        <Typography variant="body2" fontWeight="bold">{t('academic.first')}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">{t('academic.daysRemaining')}:</Typography>
                        <Typography variant="body2" fontWeight="bold">135</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', color: 'white' }}>
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" fontWeight="bold">3</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {t('academic.totalYears')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white' }}>
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" fontWeight="bold">6</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {t('academic.semesters')}
                        </Typography>
                      </CardContent>
                    </Card>  
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ background: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)', color: 'white' }}>
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" fontWeight="bold">12</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {t('academic.events')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)', color: 'white' }}>
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" fontWeight="bold">180</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {t('academic.schoolDays')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Stack>
            </Grid>
          </Grid>
        </Stack>

        {/* Add/Edit Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {dialogType === 'year' && (selectedYear ? t('academic.editAcademicYear') : t('academic.addAcademicYear'))}
            {dialogType === 'semester' && (selectedYear ? t('academic.editSemester') : t('academic.addSemester'))}
            {dialogType === 'event' && (selectedYear ? t('academic.editEvent') : t('academic.addEvent'))}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              {dialogType === 'year' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.yearName')}
                      defaultValue={selectedYear?.name || ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.yearNameArabic')}
                      defaultValue={selectedYear?.nameAr || ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.startDate')}
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      defaultValue={selectedYear?.startDate || ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.endDate')}
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      defaultValue={selectedYear?.endDate || ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.totalDays')}
                      type="number"
                      defaultValue={selectedYear?.totalDays || ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>{t('academic.status')}</InputLabel>
                      <Select defaultValue={selectedYear?.status || ''}>
                        <MenuItem value="Planning">{t('academic.planning')}</MenuItem>
                        <MenuItem value="Active">{t('academic.active')}</MenuItem>
                        <MenuItem value="Completed">{t('academic.completed')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}

              {dialogType === 'semester' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.semesterName')}
                      defaultValue={selectedYear?.name || ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.semesterNameArabic')}
                      defaultValue={selectedYear?.nameAr || ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.startDate')}
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      defaultValue={selectedYear?.startDate || ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.endDate')}
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      defaultValue={selectedYear?.endDate || ''}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>{t('academic.academicYear')}</InputLabel>
                      <Select defaultValue="">
                        <MenuItem value="2024-2025">2024-2025</MenuItem>
                        <MenuItem value="2025-2026">2025-2026</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}

              {dialogType === 'event' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.eventName')}
                      defaultValue={selectedYear?.name || ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.eventNameArabic')}
                      defaultValue={selectedYear?.nameAr || ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.eventDate')}
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      defaultValue={selectedYear?.date || ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>{t('academic.eventType')}</InputLabel>
                      <Select defaultValue={selectedYear?.type || ''}>
                        <MenuItem value="Academic">{t('academic.academic')}</MenuItem>
                        <MenuItem value="Assessment">{t('academic.assessment')}</MenuItem>
                        <MenuItem value="Holiday">{t('academic.holiday')}</MenuItem>
                        <MenuItem value="Event">{t('academic.event')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCloseDialog}
              sx={{
                background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)'
              }}
            >
              {selectedYear ? t('common.update') : t('common.add')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </SidebarLayout>
  );
}
