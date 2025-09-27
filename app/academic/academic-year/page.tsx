'use client';

import React, { useEffect, useState } from 'react';
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
  Add, 
  Edit, 
  Delete, 
  Schedule, 
  DateRange,
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
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    startDate: '',
    endDate: '',
    status: 'Planning',
    totalDays: 180,
    color: '#1976d2',
    // semester-specific fields
    days: 90,
    academicYearId: ''
  });

  // State for academic years data
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetch academic years from API
  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      setError('');

      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch('/api/academic/academic-years', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const years = data.data || [];
        setAcademicYears(years);
        const cookieActive = document.cookie
          .split('; ')
          .find(r => r.startsWith('active_academic_year_id='))?.split('=')[1];
        const active = years.find((y: any) => y.id === cookieActive) || years.find((y: any) => y.isActive) || years[0];
        if (active) {
          document.cookie = `active_academic_year_id=${active.id}; path=/`;
          const activeSem = active.semesters?.find((s: any) => s.isActive) || active.semesters?.[0];
          if (activeSem) {
            document.cookie = `active_semester_id=${activeSem.id}; path=/`;
          }
        }
      } else {
        setError(t('Failed to load academic years'));
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
      setError(t('Failed to load academic years'));
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchAcademicYears();
  }, []);

  // Removed hardcoded academic events

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
    setError(''); // Clear any previous errors
    setOpenDialog(true);
  };

  const handleAddSemester = () => {
    if (!academicYears || academicYears.length === 0) {
      setError(t('Please create an academic year first'));
      return;
    }
    const defaultYear = academicYears.find((y: any) => y.isActive) || academicYears[0];
    setSelectedYear(null);
    setDialogType('semester');
    setFormData({
      name: '',
      nameAr: '',
      startDate: '',
      endDate: '',
      status: 'Planning',
      totalDays: 180,
      color: '#1976d2',
      days: 90,
      academicYearId: defaultYear?.id || ''
    });
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

  const formatDateForInput = (date: string | Date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  if (type === 'year') {
      // Format dates for the date input fields
      setFormData({
        name: item.name || '',
        nameAr: item.nameAr || '',
        startDate: formatDateForInput(item.startDate),
        endDate: formatDateForInput(item.endDate),
        status: item.status || 'Planning',
        totalDays: item.totalDays || 180,
        color: item.color || '#1976d2',
        days: 90,
        academicYearId: item.id || ''
      });
    }

    if (type === 'semester') {
      setFormData({
        name: item.name || '',
        nameAr: item.nameAr || '',
        startDate: item.startDate ? formatDateForInput(item.startDate) : '',
        endDate: item.endDate ? formatDateForInput(item.endDate) : '',
        status: item.status || 'Planning',
        totalDays: 180,
        color: '#1976d2',
        days: item.days ?? 90,
        academicYearId: item.academicYearId || ''
      });
    }

    setError(''); // Clear any previous errors
    setOpenDialog(true);
  };

  const handleToggleActive = async (year: any, nextActive: boolean) => {
    try {
      setError('');
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch(`/api/academic/academic-years/${year.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: nextActive })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setError(err.error || t('Failed to update active status'));
        return;
      }

      await fetchAcademicYears();
    } catch (e) {
      console.error('Error toggling active status:', e);
      setError(t('Failed to update active status'));
    }
  };

  const handleToggleActiveSemester = async (semester: any, nextActive: boolean) => {
    try {
      setError('');
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch(`/api/academic/semesters/${semester.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: nextActive })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setError(err.error || t('Failed to update active semester'));
        return;
      }

      if (nextActive) {
        document.cookie = `active_semester_id=${semester.id}; path=/`;
      }
      await fetchAcademicYears();
    } catch (e) {
      console.error('Error toggling active semester:', e);
      setError(t('Failed to update active semester'));
    }
  };

  const handleDelete = async (year: any) => {
    if (!confirm(t('academic.confirmDeleteYear', { name: year.name }))) {
      return;
    }

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch(`/api/academic/academic-years/${year.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setError(err.error || t('Failed to delete academic year'));
        return;
      }

      await fetchAcademicYears();
    } catch (e) {
      console.error('Error deleting academic year:', e);
      setError(t('Failed to delete academic year'));
    }
  };

  const handleDeleteSemester = async (semester: any) => {
    if (!confirm(t('academic.confirmDeleteSemester', { name: semester.name }))) {
      return;
    }

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch(`/api/academic/semesters/${semester.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setError(err.error || t('Failed to delete semester'));
        return;
      }

      await fetchAcademicYears();
    } catch (e) {
      console.error('Error deleting semester:', e);
      setError(t('Failed to delete semester'));
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedYear(null);
    setError(''); // Clear error when closing dialog
    setFormData({
      name: '',
      nameAr: '',
      startDate: '',
      endDate: '',
      status: 'Planning',
      totalDays: 180,
      color: '#1976d2',
      days: 90,
      academicYearId: ''
    });
  };

  const handleSubmit = async () => {
    if (dialogType === 'year') {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth_token='))
          ?.split('=')[1];

        const isUpdate = !!selectedYear;
        const method = isUpdate ? 'PUT' : 'POST';
        const url = isUpdate
          ? `/api/academic/academic-years/${selectedYear.id}`
          : '/api/academic/academic-years';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: formData.name,
            nameAr: formData.nameAr,
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: formData.status.toUpperCase(),
            totalDays: formData.totalDays,
            color: formData.color
          })
        });

        if (response.ok) {
          const result = await response.json();
          // Refresh the academic years list
          await fetchAcademicYears();
          // Reset form data and close dialog
          setFormData({
            name: '',
            nameAr: '',
            startDate: '',
            endDate: '',
            status: 'Planning',
            totalDays: 180,
            color: '#1976d2',
            days: 90,
            academicYearId: ''
          });
          setSelectedYear(null);
          setOpenDialog(false);
        } else {
          const errorData = await response.json();
          setError(errorData.error || `Failed to ${isUpdate ? 'update' : 'create'} academic year`);
          return; // Don't close dialog on error
        }
      } catch (error) {
        console.error(`Error ${selectedYear ? 'updating' : 'creating'} academic year:`, error);
        setError(`Failed to ${selectedYear ? 'update' : 'create'} academic year`);
        return; // Don't close dialog on error
      }
    }

    if (dialogType === 'semester') {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth_token='))
          ?.split('=')[1];

        const isUpdate = !!(selectedYear && selectedYear.id);
        const method = isUpdate ? 'PUT' : 'POST';
        const url = isUpdate
          ? `/api/academic/semesters/${selectedYear.id}`
          : '/api/academic/semesters';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: formData.name,
            nameAr: formData.nameAr,
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: formData.status.toUpperCase(),
            days: formData.days,
            academicYearId: formData.academicYearId
          })
        });

        if (response.ok) {
          await fetchAcademicYears();
          setFormData({
            name: '',
            nameAr: '',
            startDate: '',
            endDate: '',
            status: 'Planning',
            totalDays: 180,
            color: '#1976d2',
            days: 90,
            academicYearId: ''
          });
          setSelectedYear(null);
          setOpenDialog(false);
        } else {
          const errorData = await response.json();
          setError(errorData.error || `Failed to ${isUpdate ? 'update' : 'create'} semester`);
          return;
        }
      } catch (error) {
        console.error(`Error ${selectedYear ? 'updating' : 'creating'} semester:`, error);
        setError(`Failed to ${selectedYear ? 'update' : 'create'} semester`);
        return;
      }
    }
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
                                onChange={(e) => handleToggleActive(year, e.target.checked)}
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
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDelete(year)}
                          >
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

                      {/* Progress removed per request */}

                      {/* Semesters */}
                      <Box>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          {t('academic.semesters')}:
                        </Typography>
                        <Stack spacing={1}>
                          {year.semesters.map((semester: any, index: number) => (
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        size="small"
                                        checked={!!semester.isActive}
                                        onChange={(e) => handleToggleActiveSemester(semester, e.target.checked)}
                                      />
                                    }
                                    label=""
                                  />
                                  <IconButton size="small" onClick={() => handleEdit(semester, 'semester')}>
                                    <Edit fontSize="inherit" />
                                  </IconButton>
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleDeleteSemester(semester)}
                                  >
                                    <Delete fontSize="inherit" />
                                  </IconButton>
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

          {/* Removed hardcoded Academic Calendar and sidebar stats */}
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
              {error && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                  {error}
                </Typography>
              )}
              {dialogType === 'year' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.yearName')}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.yearNameArabic')}
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.startDate')}
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.endDate')}
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.totalDays')}
                      type="number"
                      value={formData.totalDays}
                      onChange={(e) => setFormData({ ...formData, totalDays: parseInt(e.target.value) || 180 })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>{t('academic.status')}</InputLabel>
                      <Select 
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
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
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.semesterNameArabic')}
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.startDate')}
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.endDate')}
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('academic.days')}
                      type="number"
                      value={formData.days}
                      onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 90 })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>{t('academic.academicYear')}</InputLabel>
                      <Select 
                        value={formData.academicYearId}
                        label={t('academic.academicYear')}
                        onChange={(e) => setFormData({ ...formData, academicYearId: String(e.target.value) })}
                        required
                      >
                        {academicYears.map((y: any) => (
                          <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>
                        ))}
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
              onClick={handleSubmit}
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
