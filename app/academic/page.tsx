'use client';

import React from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button,
  Avatar,
  Stack,
  Chip
} from '@mui/material';
import { 
  School, 
  MenuBook, 
  Class, 
  CalendarMonth,
  Room,
  Science,
  TrendingUp,
  Assignment
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import SidebarLayout from '@/components/layout/SidebarLayout';

export default function AcademicPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const academicSections = React.useMemo(() => [
    {
      title: t('academic.classrooms.title'),
      description: t('academic.classrooms.subtitle'),
      icon: <Class />,
      color: '#1976d2',
      gradient: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
      route: '/academic/classrooms',
      stats: '42 Classrooms'
    },
    {
      title: t('academic.specialLocations.title'),
      description: t('academic.specialLocations.subtitle'),
      icon: <Science />,
      color: '#7b1fa2',
      gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
      route: '/academic/special-locations',
      stats: '9 Locations'
    },
    {
      title: t('academic.subjects'),
      description: t('academic.subjectsDescription'),
      icon: <MenuBook />,
      color: '#388e3c',
      gradient: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
      route: '/academic/subjects',
      stats: '8 Subjects'
    },
    // {
    //   title: t('academic.curriculum'),
    //   description: t('academic.curriculumDescription'),
    //   icon: <Assignment />,
    //   color: '#f57c00',
    //   gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
    //   route: '/academic/curriculum',
    //   stats: '6 Programs'
    // },
    {
      title: t('academic.academicYear'),
      description: t('academic.academicYearDescription'),
      icon: <CalendarMonth />,
      color: '#7b1fa2',
      gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
      route: '/academic/academic-year',
      stats: '2024-2025'
    },
    {
      title: t('academic.grades.title'),
      description: 'Manage grade levels and their classes',
      icon: <School />,
      color: '#2e7d32',
      gradient: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
      route: '/academic/grades',
      stats: '12 Grades'
    },
    {
      title: t('studentProgression.title'),
      description: t('studentProgression.subtitle'),
      icon: <TrendingUp />,
      color: '#ed6c02',
      gradient: 'linear-gradient(135deg, #ff9800 0%, #ed6c02 100%)',
      route: '/academic/student-progression',
      stats: t('navigation.manageTransitions')
    },
  ], [t]);

  return (
    <SidebarLayout>
      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <School sx={{ fontSize: 40 }} />
              {t('academic.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('academic.subtitle')}
            </Typography>
          </Box>

          {/* Academic Sections Grid */}
          <Grid container spacing={3}>
            {academicSections.map((section, index) => (
              <Grid item xs={12} sm={6} md={6} lg={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                      borderColor: section.color,
                    },
                  }}
                  onClick={() => router.push(section.route)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Avatar
                          sx={{
                            width: 60,
                            height: 60,
                            background: section.gradient,
                            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                          }}
                        >
                          {section.icon}
                        </Avatar>
                        <Chip 
                          label={section.stats} 
                          size="small" 
                          sx={{ 
                            background: section.gradient,
                            color: 'white',
                            fontWeight: 'bold'
                          }} 
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {section.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {section.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                  
                  <CardActions sx={{ p: 3, pt: 0 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{
                        borderColor: section.color,
                        color: section.color,
                        '&:hover': {
                          backgroundColor: section.color,
                          color: 'white',
                        },
                      }}
                    >
                      {t('common.manage')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Quick Stats */}
          <Card sx={{ mt: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp />
                {t('academic.quickStats')}
              </Typography>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold">12</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('academic.totalClasses')}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold">8</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('academic.totalSubjects')}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold">350</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('academic.enrolledStudents')}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold">24</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('academic.activeTeachers')}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </SidebarLayout>
  );
}
