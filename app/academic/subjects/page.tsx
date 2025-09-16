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
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  Class
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import SidebarLayout from '@/components/layout/SidebarLayout';

export default function SubjectsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);

  // Mock data for subjects
  const subjects = [
    {
      id: 1,
      name: 'Mathematics',
      nameAr: 'الرياضيات',
      code: 'MATH',
      description: 'Core mathematics curriculum covering algebra, geometry, and arithmetic',
      descriptionAr: 'منهج الرياضيات الأساسي يغطي الجبر والهندسة والحساب',
      grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'],
      teachers: ['Sarah Johnson', 'Ahmed Hassan'],
      hoursPerWeek: 5,
      color: '#1976d2',
      category: 'Core'
    },
    {
      id: 2,
      name: 'English Language',
      nameAr: 'اللغة الإنجليزية',
      code: 'ENG',
      description: 'English language arts including reading, writing, and speaking',
      descriptionAr: 'فنون اللغة الإنجليزية تشمل القراءة والكتابة والتحدث',
      grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'],
      teachers: ['Michael Brown', 'Lisa Wilson'],
      hoursPerWeek: 4,
      color: '#388e3c',
      category: 'Language'
    },
    {
      id: 3,
      name: 'Arabic Language',
      nameAr: 'اللغة العربية',
      code: 'AR',
      description: 'Arabic language and literature studies',
      descriptionAr: 'دراسات اللغة العربية والأدب',
      grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'],
      teachers: ['Fatima Al-Zahra', 'Omar Al-Rashid'],
      hoursPerWeek: 5,
      color: '#f57c00',
      category: 'Language'
    },
    {
      id: 4,
      name: 'Science',
      nameAr: 'العلوم',
      code: 'SCI',
      description: 'General science covering biology, chemistry, and physics basics',
      descriptionAr: 'العلوم العامة تغطي أساسيات الأحياء والكيمياء والفيزياء',
      grades: ['Grade 2', 'Grade 3', 'Grade 4'],
      teachers: ['Dr. James Wilson', 'Dr. Amina Khalil'],
      hoursPerWeek: 3,
      color: '#7b1fa2',
      category: 'Science'
    },
    {
      id: 5,
      name: 'Social Studies',
      nameAr: 'الدراسات الاجتماعية',
      code: 'SS',
      description: 'History, geography, and civics education',
      descriptionAr: 'التاريخ والجغرافيا والتربية المدنية',
      grades: ['Grade 3', 'Grade 4'],
      teachers: ['Robert Davis'],
      hoursPerWeek: 2,
      color: '#d32f2f',
      category: 'Social'
    },
    {
      id: 6,
      name: 'Art & Craft',
      nameAr: 'الفنون والحرف',
      code: 'ART',
      description: 'Creative arts and crafts activities',
      descriptionAr: 'أنشطة الفنون الإبداعية والحرف اليدوية',
      grades: ['Grade 1', 'Grade 2', 'Grade 3'],
      teachers: ['Emma Thompson'],
      hoursPerWeek: 2,
      color: '#e91e63',
      category: 'Creative'
    }
  ];

  const categories = ['All', 'Core', 'Language', 'Science', 'Social', 'Creative'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredSubjects = selectedCategory === 'All' 
    ? subjects 
    : subjects.filter(subject => subject.category === selectedCategory);

  const handleAddSubject = () => {
    setSelectedSubject(null);
    setOpenDialog(true);
  };

  const handleEditSubject = (subjectData: any) => {
    setSelectedSubject(subjectData);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSubject(null);
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

          {/* Category Filter */}
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('academic.filterByCategory')}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={t(`academic.${category.toLowerCase()}`)}
                  variant={selectedCategory === category ? 'filled' : 'outlined'}
                  onClick={() => setSelectedCategory(category)}
                  sx={{
                    backgroundColor: selectedCategory === category ? 'primary.main' : 'transparent',
                    color: selectedCategory === category ? 'white' : 'primary.main',
                    '&:hover': {
                      backgroundColor: selectedCategory === category ? 'primary.dark' : 'primary.light',
                    }
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Subjects Overview Cards */}
          <Grid container spacing={3}>
            {filteredSubjects.map((subject) => (
              <Grid item xs={12} md={6} lg={4} key={subject.id}>
                <Card
                  sx={{
                    height: '100%',
                    background: `linear-gradient(135deg, ${subject.color}15 0%, ${subject.color}05 100%)`,
                    border: `2px solid ${subject.color}20`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                      border: `2px solid ${subject.color}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      {/* Subject Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Avatar
                          sx={{
                            width: 50,
                            height: 50,
                            background: `linear-gradient(135deg, ${subject.color} 0%, ${subject.color}CC 100%)`,
                          }}
                        >
                          <Assignment />
                        </Avatar>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditSubject(subject)}
                            sx={{ color: subject.color }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
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
                            label={t(`academic.${subject.category.toLowerCase()}`)} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              borderColor: subject.color,
                              color: subject.color,
                              fontSize: '0.75rem'
                            }} 
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {isRTL ? subject.descriptionAr : subject.description}
                        </Typography>
                      </Box>

                      {/* Stats */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {subject.hoursPerWeek} {t('academic.hoursPerWeek')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Class sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {subject.grades.length} {t('academic.grades')}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Teachers */}
                      <Box>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          {t('academic.teachers')}:
                        </Typography>
                        <Stack spacing={0.5}>
                          {subject.teachers.map((teacher, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {teacher}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>

                      {/* Grades */}
                      <Box>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          {t('academic.grades')}:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {subject.grades.map((grade, index) => (
                            <Chip 
                              key={index}
                              label={grade} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Subjects Detailed View */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School />
                {t('academic.subjectsOverview')}
              </Typography>
              
              {/* Subjects by Category */}
              {categories.slice(1).map((category) => {
                const categorySubjects = subjects.filter(subject => subject.category === category);
                if (categorySubjects.length === 0) return null;

                return (
                  <Accordion key={category} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Typography variant="h6">
                          {t(`academic.${category.toLowerCase()}`)} ({categorySubjects.length})
                        </Typography>
                        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                          {categorySubjects.slice(0, 3).map((subject, index) => (
                            <Avatar
                              key={index}
                              sx={{
                                width: 24,
                                height: 24,
                                background: subject.color,
                                fontSize: '0.7rem'
                              }}
                            >
                              {subject.code.charAt(0)}
                            </Avatar>
                          ))}
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>{t('academic.subject')}</TableCell>
                              <TableCell>{t('academic.code')}</TableCell>
                              <TableCell>{t('academic.grades')}</TableCell>
                              <TableCell>{t('academic.teachers')}</TableCell>
                              <TableCell>{t('academic.hoursPerWeek')}</TableCell>
                              <TableCell>{t('common.actions')}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {categorySubjects.map((subject) => (
                              <TableRow key={subject.id} hover>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar 
                                      sx={{ 
                                        width: 30, 
                                        height: 30, 
                                        background: subject.color,
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      {subject.code.charAt(0)}
                                    </Avatar>
                                    {isRTL ? subject.nameAr : subject.name}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={subject.code} 
                                    size="small" 
                                    sx={{ 
                                      background: `${subject.color}20`,
                                      color: subject.color,
                                      fontWeight: 'bold'
                                    }} 
                                  />
                                </TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={0.5}>
                                    {subject.grades.slice(0, 2).map((grade, index) => (
                                      <Chip 
                                        key={index}
                                        label={grade} 
                                        size="small" 
                                        variant="outlined"
                                        sx={{ fontSize: '0.7rem' }}
                                      />
                                    ))}
                                    {subject.grades.length > 2 && (
                                      <Chip 
                                        label={`+${subject.grades.length - 2}`} 
                                        size="small" 
                                        variant="outlined"
                                        sx={{ fontSize: '0.7rem' }}
                                      />
                                    )}
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  {subject.teachers.length} {t('academic.teachers')}
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Schedule sx={{ fontSize: 16 }} />
                                    {subject.hoursPerWeek}h
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={1}>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleEditSubject(subject)}
                                      sx={{ color: 'primary.main' }}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error">
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </CardContent>
          </Card>
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
                    defaultValue={selectedSubject?.name || ''}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('academic.subjectNameArabic')}
                    defaultValue={selectedSubject?.nameAr || ''}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t('academic.subjectCode')}
                    defaultValue={selectedSubject?.code || ''}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>{t('academic.category')}</InputLabel>
                    <Select defaultValue={selectedSubject?.category || ''}>
                      <MenuItem value="Core">{t('academic.core')}</MenuItem>
                      <MenuItem value="Language">{t('academic.language')}</MenuItem>
                      <MenuItem value="Science">{t('academic.science')}</MenuItem>
                      <MenuItem value="Social">{t('academic.social')}</MenuItem>
                      <MenuItem value="Creative">{t('academic.creative')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t('academic.hoursPerWeek')}
                    type="number"
                    defaultValue={selectedSubject?.hoursPerWeek || ''}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('academic.description')}
                    multiline
                    rows={3}
                    defaultValue={selectedSubject?.description || ''}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('academic.descriptionArabic')}
                    multiline
                    rows={3}
                    defaultValue={selectedSubject?.descriptionAr || ''}
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
              onClick={handleCloseDialog}
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
