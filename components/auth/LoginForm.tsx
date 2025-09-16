'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  Avatar,
  CssBaseline,
  Grid,
  Fade,
  Slide,
  IconButton,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  School,
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  AdminPanelSettings,
  Person,
  FamilyRestroom,
  MenuBook,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const { login } = useAuth();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const router = useRouter();

  const roleData = {
    ADMIN: {
      title: t('navigation.admins'),
      description: t('auth.adminDescription'),
      email: 'admin@school.com',
      password: 'password123',
      icon: <AdminPanelSettings />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    TEACHER: {
      title: t('navigation.teachers'),
      description: t('auth.teacherDescription'),
      email: 'teacher@school.com',
      password: 'password123',
      icon: <MenuBook />,
      gradient: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
    },
    STUDENT: {
      title: t('navigation.students'),
      description: t('auth.studentDescription'),
      email: 'student@school.com',
      password: 'password123',
      icon: <Person />,
      gradient: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
    },
    PARENT: {
      title: t('navigation.parents'),
      description: t('auth.parentDescription'),
      email: 'parent@school.com',
      password: 'password123',
      icon: <FamilyRestroom />,
      gradient: 'linear-gradient(135deg, #ed8936 0%, #d69e2e 100%)',
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);

      if (success) {
        setTimeout(() => {
          router.replace('/dashboard');
        }, 200);
      } else {
        setError(t('auth.invalidCredentials'));
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('auth.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (roleKey: string) => {
    const role = roleData[roleKey as keyof typeof roleData];
    setEmail(role.email);
    setPassword(role.password);
    setSelectedRole(roleKey);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3,
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      <CssBaseline />
      <Box sx={{ position: 'absolute', top: 20, right: isRTL ? 'auto' : 20, left: isRTL ? 20 : 'auto' }}>
        <LanguageSwitcher />
      </Box>
      <Container maxWidth="xl">
        <Grid container spacing={4} alignItems="stretch">
          {/* Left Side */}
          <Grid item xs={12} lg={7}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Fade in timeout={800}>
                <Box textAlign="center" mb={4}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      margin: '0 auto 16px',
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <School sx={{ fontSize: 40, color: 'white' }} />
                  </Avatar>
                  <Typography
                    variant="h3"
                    fontWeight="800"
                    color="white"
                    mb={1}
                    sx={{
                      textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                      fontSize: { xs: '2rem', md: '3rem' },
                      textAlign: 'center',
                    }}
                  >
                    EduManage Pro
                  </Typography>
                  <Typography
                    variant="h6"
                    color="rgba(255,255,255,0.9)"
                    sx={{
                      textShadow: '0 1px 10px rgba(0,0,0,0.2)',
                      textAlign: 'center',
                    }}
                  >
                    {t('dashboard.welcomeMessage', { defaultValue: 'Advanced School Management System' })}
                  </Typography>
                </Box>
              </Fade>

              {/* Role Selection */}
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="h5"
                  fontWeight="600"
                  color="white"
                  mb={3}
                  textAlign="center"
                  sx={{ textShadow: '0 1px 10px rgba(0,0,0,0.3)' }}
                >
                  {t('auth.chooseRole')}
                </Typography>

                <Grid container spacing={2}>
                  {Object.entries(roleData).map(([key, role], index) => (
                    <Grid item xs={12} sm={6} key={key}>
                      <Slide in timeout={600 + index * 200} direction="up">
                        <Card
                          sx={{
                            background: selectedRole === key ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(15px)',
                            border:
                              selectedRole === key
                                ? '2px solid rgba(255,255,255,0.5)'
                                : '1px solid rgba(255,255,255,0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            transform: selectedRole === key ? 'scale(1.02)' : 'scale(1)',
                            '&:hover': {
                              background: 'rgba(255,255,255,0.25)',
                              transform: 'translateY(-4px) scale(1.02)',
                              boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                            },
                          }}
                          onClick={() => handleRoleSelect(key)}
                        >
                          <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                            <Avatar
                              sx={{
                                width: 50,
                                height: 50,
                                margin: '0 auto 12px',
                                background: role.gradient,
                                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                              }}
                            >
                              {role.icon}
                            </Avatar>
                            <Typography variant="h6" fontWeight="700" color="white" mb={1}>
                              {role.title}
                            </Typography>
                            <Typography variant="body2" color="rgba(255,255,255,0.8)" fontSize="0.85rem">
                              {role.description}
                            </Typography>
                            {selectedRole === key && (
                              <Chip
                                label={t('common.selected', { defaultValue: 'Selected' })}
                                size="small"
                                sx={{
                                  mt: 1,
                                  bgcolor: 'rgba(255,255,255,0.3)',
                                  color: 'white',
                                  fontWeight: 'bold',
                                }}
                              />
                            )}
                          </CardContent>
                        </Card>
                      </Slide>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Box>
          </Grid>

          {/* Right Side */}
          <Grid item xs={12} lg={5}>
            <Slide in timeout={1000} direction="left">
              <Paper
                elevation={10}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  height: 'fit-content',
                  minHeight: '500px',
                }}
              >
                <Box textAlign="center" mb={4}>
                  <Typography variant="h4" fontWeight="700" color="primary.main" mb={1}>
                    {t('auth.welcomeBack')}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {t('auth.signInMessage')}
                  </Typography>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                  {error && (
                    <Alert
                      severity="error"
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        '& .MuiAlert-message': { fontWeight: 500 },
                      }}
                    >
                      {error}
                    </Alert>
                  )}

                  <TextField
                    fullWidth
                    label={t('auth.email')}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position={isRTL ? 'end' : 'start'}>
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                  />

                  <TextField
                    fullWidth
                    label={t('auth.password')}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    sx={{ mb: 4 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position={isRTL ? 'end' : 'start'}>
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position={isRTL ? 'start' : 'end'}>
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge={isRTL ? 'start' : 'end'}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isLoading}
                    sx={{
                      py: 1.8,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                        boxShadow: '0 12px 35px rgba(102, 126, 234, 0.5)',
                        transform: 'translateY(-2px)',
                      },
                      '&:disabled': {
                        background: 'linear-gradient(135deg, #a0aec0 0%, #718096 100%)',
                      },
                    }}
                  >
                    {isLoading
                      ? t('auth.signingIn', { defaultValue: 'Signing In...' })
                      : t('auth.loginButton', { defaultValue: 'Sign In' })}
                  </Button>

                  {selectedRole && (
                    <Box mt={3} textAlign="center">
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {t('auth.loggingInAs', { defaultValue: 'Logging in as' })}
                      </Typography>
                      <Chip
                        label={roleData[selectedRole as keyof typeof roleData].title}
                        sx={{
                          background: roleData[selectedRole as keyof typeof roleData].gradient,
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    </Box>
                  )}

                  <Box mt={4} p={3} bgcolor="grey.50" borderRadius={2}>
                    <Typography variant="body2" align="center" color="text.secondary">
                      <strong>{t('auth.demoSystem', { defaultValue: 'Demo System:' })}</strong>{' '}
                      {t('auth.selectRoleMessage', {
                        defaultValue: 'Select any role above to auto-fill credentials',
                      })}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Slide>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
