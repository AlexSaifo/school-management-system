'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { SnackbarProvider } from '@/contexts/SnackbarContext';
import { useEffect, useMemo } from 'react';
import '@/lib/i18n';

// Arabic fonts for better Arabic text rendering
const arabicFonts = '"Tajawal", "Cairo", "Amiri", "Noto Sans Arabic", sans-serif';
const englishFonts = '"Roboto", "Helvetica", "Arial", sans-serif';

function ThemedApp({ children }: { children: React.ReactNode }) {
  const { language, direction } = useLanguage();

  const theme = useMemo(() => createTheme({
    direction: direction,
    palette: {
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: '#f5f5f5',
      },
    },
    typography: {
      fontFamily: language === 'ar' ? arabicFonts : englishFonts,
      h1: {
        fontWeight: 600,
        textAlign: direction === 'rtl' ? 'right' : 'left',
      },
      h2: {
        fontWeight: 600,
        textAlign: direction === 'rtl' ? 'right' : 'left',
      },
      h3: {
        fontWeight: 600,
        textAlign: direction === 'rtl' ? 'right' : 'left',
      },
      h4: {
        fontWeight: 600,
        textAlign: direction === 'rtl' ? 'right' : 'left',
      },
      h5: {
        fontWeight: 600,
        textAlign: direction === 'rtl' ? 'right' : 'left',
      },
      h6: {
        fontWeight: 600,
        textAlign: direction === 'rtl' ? 'right' : 'left',
      },
      body1: {
        textAlign: direction === 'rtl' ? 'right' : 'left',
      },
      body2: {
        textAlign: direction === 'rtl' ? 'right' : 'left',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            fontFamily: language === 'ar' ? arabicFonts : englishFonts,
          },
          startIcon: {
            marginRight: direction === 'rtl' ? 0 : 8,
            marginLeft: direction === 'rtl' ? 8 : 0,
          },
          endIcon: {
            marginLeft: direction === 'rtl' ? 0 : 8,
            marginRight: direction === 'rtl' ? 8 : 0,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontFamily: language === 'ar' ? arabicFonts : englishFonts,
          },
          icon: {
            marginRight: direction === 'rtl' ? 0 : 6,
            marginLeft: direction === 'rtl' ? 6 : 0,
            order: direction === 'rtl' ? 2 : 1,
          },
          label: {
            order: direction === 'rtl' ? 1 : 2,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-input': {
              textAlign: direction === 'rtl' ? 'right' : 'left',
              fontFamily: language === 'ar' ? arabicFonts : englishFonts,
            },
            '& .MuiInputLabel-root': {
              transformOrigin: direction === 'rtl' ? 'top right' : 'top left',
              right: direction === 'rtl' ? 14 : 'auto',
              left: direction === 'rtl' ? 'auto' : 14,
              fontFamily: language === 'ar' ? arabicFonts : englishFonts,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            textAlign: direction === 'rtl' ? 'right' : 'left',
            fontFamily: language === 'ar' ? arabicFonts : englishFonts,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            justifyContent: direction === 'rtl' ? 'flex-end' : 'flex-start',
            fontFamily: language === 'ar' ? arabicFonts : englishFonts,
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          root: {
            textAlign: direction === 'rtl' ? 'right' : 'left',
            fontFamily: language === 'ar' ? arabicFonts : englishFonts,
          },
        },
      },
    },
  }), [language, direction]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <SnackbarProvider>
            {children}
          </SnackbarProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700&family=Cairo:wght@400;500;600;700&family=Amiri:wght@400;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>
        <LanguageProvider>
          <ThemedApp>
            {children}
          </ThemedApp>
        </LanguageProvider>
      </body>
    </html>
  );
}
