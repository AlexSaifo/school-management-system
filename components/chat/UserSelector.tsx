import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Checkbox,
  Typography,
  Box,
  Chip,
  InputAdornment,
  CircularProgress,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  admin?: { department?: string };
  teacher?: { department?: string; employeeId?: string };
  student?: { 
    studentId?: string; 
    classRoom?: { name: string; nameAr: string };
  };
  parent?: {
    students?: Array<{
      studentId?: string;
      classRoom?: { name: string; nameAr: string };
    }>;
  };
}

interface UserSelectorProps {
  open: boolean;
  onClose: () => void;
  onCreateChat: (participantIds: string[], name?: string, isGroup?: boolean) => void;
  currentUserId: string;
}

const UserSelector: React.FC<UserSelectorProps> = ({
  open,
  onClose,
  onCreateChat,
  currentUserId
}) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isGroup, setIsGroup] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch(`/api/users/all?search=${encodeURIComponent(search)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => {
      const isSelected = prev.includes(userId);
      if (isSelected) {
        const newSelection = prev.filter(id => id !== userId);
        if (newSelection.length <= 1) {
          setIsGroup(false);
        }
        return newSelection;
      } else {
        const newSelection = [...prev, userId];
        if (newSelection.length > 1 && !isGroup) {
          setIsGroup(true);
        }
        return newSelection;
      }
    });
  };

  const handleCreate = () => {
    if (selectedUsers.length === 0) return;

    const finalIsGroup = selectedUsers.length > 1 || isGroup;
    const finalGroupName = finalIsGroup ? groupName || undefined : undefined;

    onCreateChat(selectedUsers, finalGroupName, finalIsGroup);
    handleClose();
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setGroupName('');
    setIsGroup(false);
    setSearch('');
    onClose();
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

  const getUserSubtext = (user: User) => {
    switch (user.role) {
      case 'ADMIN':
        return user.admin?.department || t('Administrator');
      case 'TEACHER':
        return `${user.teacher?.department || t('Teacher')} - ${user.teacher?.employeeId || ''}`;
      case 'STUDENT':
        return user.student?.classRoom?.name || t('Student');
      case 'PARENT':
        const studentInfo = user.parent?.students?.[0];
        return studentInfo?.classRoom?.name ? `${t('Parent')} - ${studentInfo.classRoom.name}` : t('Parent');
      default:
        return user.email;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('Start New Conversation')}</DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder={t('Search users...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: loading ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ) : null
            }}
          />
        </Box>

        {selectedUsers.length > 1 && (
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isGroup}
                  onChange={(e) => setIsGroup(e.target.checked)}
                />
              }
              label={t('Create group chat')}
            />
            
            {isGroup && (
              <TextField
                fullWidth
                label={t('Group name (optional)')}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        )}

        {selectedUsers.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('Selected')} ({selectedUsers.length}):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedUsers.map(userId => {
                const user = users.find(u => u.id === userId);
                if (!user) return null;
                return (
                  <Chip
                    key={userId}
                    label={`${user.firstName} ${user.lastName}`}
                    onDelete={() => handleUserToggle(userId)}
                    color={getRoleColor(user.role) as any}
                    variant="outlined"
                  />
                );
              })}
            </Box>
          </Box>
        )}

        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {users.map((user) => (
            <ListItem key={user.id} disablePadding>
              <ListItemButton onClick={() => handleUserToggle(user.id)}>
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => handleUserToggle(user.id)}
                />
                <ListItemAvatar>
                  <Avatar src={user.avatar} sx={{ bgcolor: 'primary.main' }}>
                    {user.avatar ? null : <PersonIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Chip
                        label={user.role}
                        size="small"
                        color={getRoleColor(user.role) as any}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={getUserSubtext(user)}
                />
              </ListItemButton>
            </ListItem>
          ))}
          
          {users.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                {search ? t('No users found') : t('Type to search for users')}
              </Typography>
            </Box>
          )}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {t('Cancel')}
        </Button>
        <Button 
          onClick={handleCreate}
          variant="contained"
          disabled={selectedUsers.length === 0}
        >
          {selectedUsers.length > 1 
            ? t('Create Group') 
            : selectedUsers.length === 1 
              ? t('Start Chat') 
              : t('Select Users')
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserSelector;