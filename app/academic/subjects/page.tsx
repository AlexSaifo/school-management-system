'use client';

import React, { useState, useEffect } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { 
  MenuBook, 
  Add, 
  Edit, 
  Delete, 
  Schedule, 
  Person,
  ArrowBack,
  School,
  ExpandMore,
  Assignment,
  Class,
  ColorLens,
  Groups,
  BookmarkBorder
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import SidebarLayout from '@/components/layout/SidebarLayout';

interface Subject {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  grades: Array<{
    id: string;
    name: string;
    nameAr: string;
    level: number;
    weeklyHours: number;
    isRequired: boolean;
  }>;
  teachers: Array<{
    id: string;
    name: string;
    isPrimary: boolean;
  }>;
  stats: {
    gradeCount: number;
    teacherCount: number;
    assignmentCount: number;
    examCount: number;
  };
}

export default function SubjectsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(t('academic.all'));
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    code: '',
    description: '',
    color: '#1976d2'
  });

  // Fetch subjects from API
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/academic/subjects?includeGrades=true&includeTeachers=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubjects(data.data);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Group subjects by category based on their name/code patterns
  const categorizeSubject = (subject: Subject): string => {
    const name = subject.name.toLowerCase();
    const code = subject.code.toLowerCase();
    
    if (name.includes('math') || name.includes('algebra') || name.includes('geometry')) return t('academic.math');
    if (name.includes('science') || name.includes('physics') || name.includes('chemistry') || name.includes('biology')) return t('academic.science');
    if (name.includes('english') || name.includes('arabic') || name.includes('language')) return t('academic.language');
    if (name.includes('history') || name.includes('geography') || name.includes('social')) return t('academic.social');
    if (name.includes('art') || name.includes('music') || name.includes('creative')) return t('academic.creative');
    if (name.includes('religion') || name.includes('islamic') || code.includes('rel')) return t('academic.religious');
    if (name.includes('physical') || name.includes('sport') || name.includes('pe')) return t('academic.physical');
    return t('academic.other');
  };

  const categories = [
    t('academic.all'), 
    t('academic.math'), 
    t('academic.science'), 
    t('academic.language'), 
    t('academic.social'), 
    t('academic.creative'), 
    t('academic.religious'), 
    t('academic.physical'), 
    t('academic.other')
  ];
  
  const filteredSubjects = selectedCategory === t('academic.all') 
    ? subjects 
    : subjects.filter(subject => categorizeSubject(subject) === selectedCategory);

  const handleAddSubject = () => {
    setSelectedSubject(null);
    setFormData({
      name: '',
      nameAr: '',
      code: '',
      description: '',
      color: '#1976d2'
    });
    setOpenDialog(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      nameAr: subject.nameAr,
      code: subject.code,
      description: subject.description || '',
      color: subject.color
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSubject(null);
    setFormData({
      name: '',
      nameAr: '',
      code: '',
      description: '',
      color: '#1976d2'
    });
  };

  const handleSubmit = async () => {
    try {
      const url = selectedSubject 
        ? `/api/academic/subjects/${selectedSubject.id}` 
        : '/api/academic/subjects';
      
      const method = selectedSubject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchSubjects(); // Refresh the list
        handleCloseDialog();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save subject');
      }
    } catch (error) {
      console.error('Error saving subject:', error);
      setError('Network error occurred');
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        const response = await fetch(`/api/academic/subjects/${subjectId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          await fetchSubjects(); // Refresh the list
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to delete subject');
        }
      } catch (error) {
        console.error('Error deleting subject:', error);
        setError('Network error occurred');
      }
    }
  };

  return (
    <SidebarLayout>
      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={() => router.push('/academic')} sx={{ mr: 1 }}>
                <ArrowBack />
              </IconButton>
              <MenuBook sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold">
                  {t('academic.subjectManagement')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('academic.manageSubjectsDescription')}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddSubject}
              sx={{
                background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                px: 3,
                py: 1.5
              }}
            >
              {t('academic.addSubject')}
            </Button>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Category Filter */}
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('academic.filterByCategory')}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  onClick={() => setSelectedCategory(category)}
                  variant={selectedCategory === category ? 'filled' : 'outlined'}
                  color={selectedCategory === category ? 'primary' : 'default'}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </Box>

          {/* Loading State */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Subjects Grid */}
              <Grid container spacing={3}>
                {filteredSubjects.map((subject) => (
                  <Grid item xs={12} md={6} lg={4} key={subject.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        {/* Header with actions */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: subject.color, 
                              width: 48, 
                              height: 48 
                            }}
                          >
                            <MenuBook />
                          </Avatar>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditSubject(subject)}
                              sx={{ color: subject.color }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteSubject(subject.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Subject Info */}
                        <Box>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {isRTL ? subject.nameAr : subject.name}
                          </Typography>
                          <Stack direction="row" spacing={1} mb={1}>
                            <Chip 
                              label={subject.code} 
                              size="small" 
                              sx={{ 
                                background: subject.color,
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }} 
                            />
                            <Chip 
                              label={categorizeSubject(subject)} 
                              size="small" 
                              variant="outlined"
                              sx={{ 
                                borderColor: subject.color,
                                color: subject.color,
                                fontSize: '0.75rem'
                              }} 
                            />
                          </Stack>
                          {subject.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {subject.description}
                            </Typography>
                          )}
                        </Box>

                        {/* Stats */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Groups sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {subject.stats.teacherCount} {t('academic.teacherCount')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <School sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {subject.stats.gradeCount} {t('academic.gradeCount')}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Grade Pills */}
                        {subject.grades.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                              Assigned Grades
                            </Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {subject.grades.slice(0, 3).map((grade, index) => (
                                <Chip 
                                  key={grade.id}
                                  label={`${isRTL ? grade.nameAr : grade.name} (${grade.weeklyHours}h)`}
                                  size="small" 
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', mb: 0.5 }}
                                />
                              ))}
                              {subject.grades.length > 3 && (
                                <Chip 
                                  label={`+${subject.grades.length - 3} more`}
                                  size="small" 
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', mb: 0.5 }}
                                />
                              )}
                            </Stack>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Empty State */}
              {filteredSubjects.length === 0 && (
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    py: 6,
                    color: 'text.secondary'
                  }}
                >
                  <MenuBook sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                  <Typography variant="h6" gutterBottom>
                    {t('academic.noSubjectsFound')}
                  </Typography>
                  <Typography variant="body2">
                    {selectedCategory === t('academic.all') 
                      ? t('academic.startByAddingFirstSubject')
                      : t('academic.noSubjectsFoundInCategory', { category: selectedCategory })
                    }
                  </Typography>
                </Box>
              )}
            </>
          )}

        </Stack>

        {/* Add/Edit Subject Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedSubject ? t('academic.editSubject') : t('academic.addSubject')}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('academic.subjectName')}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('academic.subjectNameArabic')}
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('academic.subjectCode')}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('academic.color')}
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('academic.description')}
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Grid>
              </Grid>
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
                background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)'
              }}
            >
              {selectedSubject ? t('common.update') : t('common.add')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </SidebarLayout>
  );
}
