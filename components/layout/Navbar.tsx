'use client';

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Chip,
} from '@mui/material';
import { AccountCircle, Logout, Dashboard, School } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    handleClose();
  };

  const handleProfile = () => {
    router.push('/dashboard/profile');
    handleClose();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'TEACHER':
        return 'primary';
      case 'STUDENT':
        return 'success';
      case 'PARENT':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
        borderRadius: 0,
      }}
    >
      <Toolbar>
        <School sx={{ mr: isRTL ? 0 : 2, ml: isRTL ? 2 : 0 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          {t('dashboard.welcomeMessage')}
        </Typography>

        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LanguageSwitcher />
            
            <Chip
              label={user.role}
              color={getRoleColor(user.role) as any}
              variant="filled"
              sx={{ 
                fontWeight: 'bold',
                color: 'white',
                '& .MuiChip-label': { px: 2 }
              }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {t('common.welcome')}, {user.firstName}
              </Typography>
              
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    fontSize: '0.9rem'
                  }}
                >
                  {user.firstName[0]}{user.lastName[0]}
                </Avatar>
              </IconButton>
              
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: isRTL ? 'left' : 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: isRTL ? 'left' : 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    direction: isRTL ? 'rtl' : 'ltr',
                  }
                }}
              >
                <MenuItem onClick={() => router.push('/dashboard')}>
                  <Dashboard sx={{ mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0 }} />
                  {t('navigation.dashboard')}
                </MenuItem>
  
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0 }} />
                  {t('common.logout')}
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LanguageSwitcher />
            <Button 
              color="inherit" 
              onClick={() => router.push('/')}
              sx={{ fontWeight: 'bold' }}
            >
              {t('common.login')}
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
