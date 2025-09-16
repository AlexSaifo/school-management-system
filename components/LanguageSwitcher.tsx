'use client';

import React from 'react';
import { 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Box 
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { language, setLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang: 'ar' | 'en') => {
    setLanguage(lang);
    handleClose();
  };

  return (
    <Box>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ 
          color: 'inherit',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }
        }}
        aria-label={t('language.switchLanguage')}
      >
        <LanguageIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
        PaperProps={{
          sx: {
            direction: isRTL ? 'rtl' : 'ltr',
          }
        }}
      >
        <MenuItem 
          onClick={() => handleLanguageChange('ar')}
          selected={language === 'ar'}
          sx={{
            minWidth: 120,
            direction: 'rtl',
            justifyContent: 'flex-start',
            '&.Mui-selected': {
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
            }
          }}
        >
          <Typography variant="body2">
            {t('language.arabic')}
          </Typography>
        </MenuItem>
        <MenuItem 
          onClick={() => handleLanguageChange('en')}
          selected={language === 'en'}
          sx={{
            minWidth: 120,
            direction: 'ltr',
            justifyContent: 'flex-start',
            '&.Mui-selected': {
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
            }
          }}
        >
          <Typography variant="body2">
            {t('language.english')}
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
