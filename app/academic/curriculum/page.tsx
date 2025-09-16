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
  Stepper,
  Step,
  StepLabel,
  StepContent,

  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';

import { 
  Assignment, 
  Add, 
  Edit, 
  Delete, 
  Schedule, 
  CheckCircle,
  ArrowBack,
  School,
  ExpandMore,
  BookmarkBorder,
  PlayCircleOutline,
  Timer
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import SidebarLayout from '@/components/layout/SidebarLayout';

export default function CurriculumPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState<any>(null);

  // Mock data for curriculum programs
  const curriculumPrograms = [
    {
      id: 1,
      name: 'Primary Mathematics Program',
      nameAr: 'برنامج الرياضيات الأساسية',
      description: 'Comprehensive mathematics curriculum for grades 1-4',
      descriptionAr: 'منهج الرياضيات الشامل للصفوف من 1 إلى 4',
      grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'],
      subjects: ['Basic Math', 'Algebra Basics', 'Geometry', 'Problem Solving'],
      duration: '4 Years',
      progress: 75,
      status: 'Active',
      color: '#1976d2',
      modules: [
        { name: 'Numbers & Operations', completed: true, duration: '3 months' },
        { name: 'Measurement & Data', completed: true, duration: '2 months' },
        { name: 'Geometry Basics', completed: false, duration: '2 months' },
        { name: 'Problem Solving', completed: false, duration: '1 month' }
      ]
    },
    {
      id: 2,
      name: 'English Language Arts',
      nameAr: 'برنامج فنون اللغة الإنجليزية',
      description: 'Complete English language learning program',
      descriptionAr: 'برنامج تعلم اللغة الإنجليزية الكامل',
      grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'],
      subjects: ['Reading', 'Writing', 'Speaking', 'Vocabulary'],
      duration: '4 Years',
      progress: 60,
      status: 'Active',
      color: '#388e3c',
      modules: [
        { name: 'Phonics & Reading', completed: true, duration: '4 months' },
        { name: 'Writing Skills', completed: true, duration: '3 months' },
        { name: 'Grammar & Usage', completed: false, duration: '3 months' },
        { name: 'Literature & Comprehension', completed: false, duration: '2 months' }
      ]
    },
    {
      id: 3,
      name: 'Science Exploration',
      nameAr: 'برنامج استكشاف العلوم',
      description: 'Hands-on science curriculum for young learners',
      descriptionAr: 'منهج العلوم العملي للمتعلمين الصغار',
      grades: ['Grade 2', 'Grade 3', 'Grade 4'],
      subjects: ['Life Science', 'Physical Science', 'Earth Science', 'Scientific Method'],
      duration: '3 Years',
      progress: 45,
      status: 'Active',
      color: '#7b1fa2',
      modules: [
        { name: 'Living Things', completed: true, duration: '2 months' },
        { name: 'Matter & Energy', completed: false, duration: '3 months' },
        { name: 'Earth & Space', completed: false, duration: '2 months' },
        { name: 'Scientific Inquiry', completed: false, duration: '1 month' }
      ]
    },
    {
      id: 4,
      name: 'Arabic Heritage Program',
      nameAr: 'برنامج التراث العربي',
      description: 'Arabic language and cultural heritage curriculum',
      descriptionAr: 'منهج اللغة العربية والتراث الثقافي',
      grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'],
      subjects: ['Arabic Language', 'Islamic Studies', 'Arab History', 'Cultural Studies'],
      duration: '4 Years',
      progress: 80,
      status: 'Active',
      color: '#f57c00',
      modules: [
        { name: 'Arabic Alphabet & Reading', completed: true, duration: '3 months' },
        { name: 'Grammar & Composition', completed: true, duration: '4 months' },
        { name: 'Literature & Poetry', completed: true, duration: '3 months' },
        { name: 'Cultural Heritage', completed: false, duration: '2 months' }
      ]
    },
    {
      id: 5,
      name: 'Creative Arts Program',
      nameAr: 'برنامج الفنون الإبداعية',
      description: 'Comprehensive arts and creativity curriculum',
      descriptionAr: 'منهج الفنون والإبداع الشامل',
      grades: ['Grade 1', 'Grade 2', 'Grade 3'],
      subjects: ['Visual Arts', 'Music', 'Drama', 'Crafts'],
      duration: '3 Years',
      progress: 30,
      status: 'Planning',
      color: '#e91e63',
      modules: [
        { name: 'Drawing & Painting', completed: false, duration: '2 months' },
        { name: 'Music Basics', completed: false, duration: '2 months' },
        { name: 'Creative Expression', completed: false, duration: '2 months' },
        { name: 'Performance Arts', completed: false, duration: '1 month' }
      ]
    },
    {
      id: 6,
      name: 'Physical Education',
      nameAr: 'برنامج التربية البدنية',
      description: 'Physical fitness and sports curriculum',
      descriptionAr: 'منهج اللياقة البدنية والرياضة',
      grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'],
      subjects: ['Basic Movement', 'Team Sports', 'Individual Sports', 'Health Education'],
      duration: '4 Years',
      progress: 90,
      status: 'Active',
      color: '#d32f2f',
      modules: [
        { name: 'Motor Skills Development', completed: true, duration: '2 months' },
        { name: 'Team Sports Basics', completed: true, duration: '3 months' },
        { name: 'Individual Fitness', completed: true, duration: '2 months' },
        { name: 'Health & Nutrition', completed: true, duration: '1 month' }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#4caf50';
      case 'Planning': return '#ff9800';
      case 'Completed': return '#2196f3';
      default: return '#757575';
    }
  };

  const handleAddCurriculum = () => {
    setSelectedCurriculum(null);
    setOpenDialog(true);
  };

  const handleEditCurriculum = (curriculumData: any) => {
    setSelectedCurriculum(curriculumData);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCurriculum(null);
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
              <Assignment sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold">
                  {t('academic.curriculumManagement')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('academic.manageCurriculumDescription')}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddCurriculum}
              sx={{
                background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
                px: 3,
                py: 1.5
              }}
            >
              {t('academic.addProgram')}
            </Button>
          </Box>

          {/* Curriculum Overview Stats */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="h3" fontWeight="bold">6</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {t('academic.totalPrograms')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="h3" fontWeight="bold">4</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {t('academic.activePrograms')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="h3" fontWeight="bold">1</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {t('academic.inPlanning')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="h3" fontWeight="bold">62%</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {t('academic.avgProgress')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Curriculum Programs Grid */}
          <Grid container spacing={3}>
            {curriculumPrograms.map((program) => (
              <Grid item xs={12} md={6} lg={4} key={program.id}>
                <Card
                  sx={{
                    height: '100%',
                    background: `linear-gradient(135deg, ${program.color}15 0%, ${program.color}05 100%)`,
                    border: `2px solid ${program.color}20`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                      border: `2px solid ${program.color}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      {/* Program Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Avatar
                          sx={{
                            width: 50,
                            height: 50,
                            background: `linear-gradient(135deg, ${program.color} 0%, ${program.color}CC 100%)`,
                          }}
                        >
                          <BookmarkBorder />
                        </Avatar>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditCurriculum(program)}
                            sx={{ color: program.color }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Program Info */}
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {isRTL ? program.nameAr : program.name}
                        </Typography>
                        <Stack direction="row" spacing={1} mb={1}>
                          <Chip 
                            label={t(`academic.${program.status.toLowerCase()}`)} 
                            size="small" 
                            sx={{ 
                              background: getStatusColor(program.status),
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }} 
                          />
                          <Chip 
                            label={program.duration} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              borderColor: program.color,
                              color: program.color,
                              fontSize: '0.75rem'
                            }} 
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {isRTL ? program.descriptionAr : program.description}
                        </Typography>
                      </Box>

                      {/* Progress */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {t('academic.progress')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {program.progress}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={program.progress} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: `${program.color}20`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: program.color,
                            }
                          }} 
                        />
                      </Box>

                      {/* Grades */}
                      <Box>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          {t('academic.targetGrades')}:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {program.grades.map((grade, index) => (
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

                      {/* Subjects */}
                      <Box>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          {t('academic.subjects')} ({program.subjects.length}):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {program.subjects.slice(0, 2).map((subject, index) => (
                            <Chip 
                              key={index}
                              label={subject} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                          {program.subjects.length > 2 && (
                            <Chip 
                              label={`+${program.subjects.length - 2}`} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Detailed Program Modules */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School />
                {t('academic.programModules')}
              </Typography>
              
              {curriculumPrograms.slice(0, 3).map((program, programIndex) => (
                <Accordion key={program.id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          background: program.color,
                          fontSize: '0.8rem'
                        }}
                      >
                        <BookmarkBorder fontSize="small" />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {isRTL ? program.nameAr : program.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {program.modules.length} {t('academic.modules')} • {program.progress}% {t('academic.complete')}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={program.progress} 
                        sx={{ 
                          width: 100,
                          height: 6, 
                          borderRadius: 3,
                          backgroundColor: `${program.color}20`,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: program.color,
                          }
                        }} 
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ pl: 2 }}>
                      {program.modules.map((module, index) => (
                        <Box key={index} sx={{ display: 'flex', mb: 2 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2 }}>
                            <Avatar
                              sx={{ 
                                width: 32,
                                height: 32,
                                backgroundColor: module.completed ? program.color : 'grey.300',
                                color: 'white'
                              }}
                            >
                              {module.completed ? <CheckCircle fontSize="small" /> : <Timer fontSize="small" />}
                            </Avatar>
                            {index < program.modules.length - 1 && (
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
                              {module.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <Schedule sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                              {t('academic.duration')}: {module.duration}
                            </Typography>
                            <Chip 
                              label={module.completed ? t('academic.completed') : t('academic.inProgress')} 
                              size="small" 
                              sx={{ 
                                mt: 0.5,
                                backgroundColor: module.completed ? `${program.color}20` : 'grey.100',
                                color: module.completed ? program.color : 'text.secondary'
                              }} 
                            />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Stack>

        {/* Add/Edit Curriculum Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            {selectedCurriculum ? t('academic.editProgram') : t('academic.addProgram')}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('academic.programName')}
                    defaultValue={selectedCurriculum?.name || ''}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('academic.programNameArabic')}
                    defaultValue={selectedCurriculum?.nameAr || ''}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t('academic.duration')}
                    defaultValue={selectedCurriculum?.duration || ''}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>{t('academic.status')}</InputLabel>
                    <Select defaultValue={selectedCurriculum?.status || ''}>
                      <MenuItem value="Planning">{t('academic.planning')}</MenuItem>
                      <MenuItem value="Active">{t('academic.active')}</MenuItem>
                      <MenuItem value="Completed">{t('academic.completed')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t('academic.progress')}
                    type="number"
                    InputProps={{ endAdornment: '%' }}
                    defaultValue={selectedCurriculum?.progress || ''}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('academic.description')}
                    multiline
                    rows={3}
                    defaultValue={selectedCurriculum?.description || ''}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('academic.descriptionArabic')}
                    multiline
                    rows={3}
                    defaultValue={selectedCurriculum?.descriptionAr || ''}
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
                background: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)'
              }}
            >
              {selectedCurriculum ? t('common.update') : t('common.add')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </SidebarLayout>
  );
}
