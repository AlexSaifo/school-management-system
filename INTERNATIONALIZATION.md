# School Management System - Internationalization Guide

## Overview
The School Management System now supports multi-language functionality with Arabic as the primary language and English as the secondary language, including full RTL (Right-To-Left) and LTR (Left-To-Right) layout support.

## Features
- ✅ **Bilingual Support**: Arabic (العربية) and English
- ✅ **RTL/LTR Layout**: Automatic layout direction switching
- ✅ **Font Optimization**: Arabic fonts (Tajawal, Cairo, Amiri) and English fonts (Roboto)
- ✅ **UI Component Adaptation**: All Material-UI components adapted for RTL/LTR
- ✅ **Language Persistence**: User language preference saved in localStorage
- ✅ **Dynamic Language Switching**: Real-time language switching without page reload

## Implementation Details

### 1. Language Files
Located in `/messages/` directory:
- `ar.json` - Arabic translations
- `en.json` - English translations

### 2. Key Components

#### Language Context (`/contexts/LanguageContext.tsx`)
- Manages language state and direction
- Provides language switching functionality
- Handles message loading and caching

#### Language Switcher (`/components/LanguageSwitcher.tsx`)
- UI component for language selection
- Available in Navbar and other key locations

#### Layout Integration (`/app/layout.tsx`)
- Theme adaptation for RTL/LTR
- Font family switching
- Direction-aware component styling

### 3. RTL/LTR Features

#### Automatic Layout Adaptation
- Sidebar positioning (left for LTR, right for RTL)
- Text alignment and input field direction
- Icon and menu positioning
- Navigation flow adaptation

#### Component Styling
All components have been updated with RTL-aware styling:
```typescript
sx={{ 
  mr: isRTL ? 0 : 2, 
  ml: isRTL ? 2 : 0,
  direction: isRTL ? 'rtl' : 'ltr'
}}
```

#### Typography and Fonts
- Arabic: Tajawal, Cairo, Amiri, Noto Sans Arabic
- English: Roboto, Helvetica, Arial
- Automatic font switching based on selected language

### 4. Global CSS Adaptations (`/app/globals.css`)
Added RTL-specific styles:
- Font family declarations
- Text alignment rules
- Input field adaptations
- Table cell alignment
- Menu item positioning

## Usage

### Adding New Translations
1. Add the key-value pair to both `ar.json` and `en.json`
2. Use in components with `useIntl`:
```typescript
const intl = useIntl();
const text = intl.formatMessage({ 
  id: 'your.translation.key', 
  defaultMessage: 'Default text' 
});
```

### Using Language Context
```typescript
import { useLanguage } from '@/contexts/LanguageContext';

const { language, isRTL, setLanguage, toggleLanguage } = useLanguage();
```

### RTL-Aware Styling
```typescript
import { useLanguage } from '@/contexts/LanguageContext';

const { isRTL } = useLanguage();

// In JSX
<Box sx={{
  textAlign: isRTL ? 'right' : 'left',
  ml: isRTL ? 0 : 2,
  mr: isRTL ? 2 : 0,
}} />
```

## Translation Keys Structure

### Common Keys
- `common.*` - General UI elements (save, cancel, delete, etc.)
- `navigation.*` - Navigation items and menu labels
- `auth.*` - Authentication related text

### Specific Sections
- `dashboard.*` - Dashboard specific content
- `users.*` - User management
- `students.*` - Student management
- `teachers.*` - Teacher management
- `assignments.*` - Assignment management
- `attendance.*` - Attendance tracking
- `grades.*` - Grade management

## Browser Support
- All modern browsers support RTL layout
- Automatic language detection from browser preferences
- Fallback to Arabic if no preference detected

## Development Guidelines

### 1. Always Use Translation Keys
```typescript
// ❌ Avoid hardcoded text
<Typography>Dashboard</Typography>

// ✅ Use translation keys
<Typography>
  {intl.formatMessage({ id: 'navigation.dashboard', defaultMessage: 'Dashboard' })}
</Typography>
```

### 2. RTL-Aware Components
Always consider RTL layout when creating new components:
```typescript
// ❌ Fixed positioning
sx={{ ml: 2 }}

// ✅ RTL-aware positioning
sx={{ ml: isRTL ? 0 : 2, mr: isRTL ? 2 : 0 }}
```

### 3. Icon Positioning
Icons should be positioned contextually:
```typescript
<InputAdornment position={isRTL ? "end" : "start"}>
  <SearchIcon />
</InputAdornment>
```

## Testing
1. Switch between Arabic and English using the language switcher
2. Verify all text is translated
3. Check layout adaptation for RTL/LTR
4. Test component positioning and alignment
5. Verify font rendering for Arabic text

## Future Enhancements
- Additional language support (French, Spanish, etc.)
- Date/time formatting per locale
- Number formatting for different regions
- Currency display adaptation
- Keyboard input method switching

## Technical Notes
- Uses React Intl for internationalization
- Material-UI theme supports RTL out of the box
- Language preference persisted in localStorage
- Dynamic import of translation files for performance
- Smooth transitions between language switches
