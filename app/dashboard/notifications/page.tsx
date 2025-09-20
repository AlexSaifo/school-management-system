'use client';

import { NotificationCenter } from '@/components/NotificationCenter';
import { NotificationTester } from '@/components/NotificationTester';
import PageHeader from '@/components/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { Box, Divider } from '@mui/material';

export default function NotificationsPage() {
  const { language } = useLanguage();

  return (
    <>
      <PageHeader 
        title={language === 'ar' ? 'الإشعارات' : 'Notifications'}
        subtitle={language === 'ar' ? 'عرض وإدارة جميع الإشعارات' : 'View and manage all notifications'}
      />
      
      {/* Debug Tester - Remove this in production */}
      <NotificationTester />
      
      <Divider sx={{ my: 3 }} />
      
      <NotificationCenter />
    </>
  );
}