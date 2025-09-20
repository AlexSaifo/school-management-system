import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Badge,
  Chip,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Group as GroupIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface ChatParticipant {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
  };
}

interface LastMessage {
  id: string;
  content?: string;
  messageType: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Chat {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: ChatParticipant[];
  messages: LastMessage[];
  _count: {
    messages: number;
  };
  unreadCount?: number; // Add this for proper unread count
  updatedAt: string;
}

interface ChatListProps {
  chats: Chat[];
  selectedChatId?: string;
  onChatSelect: (chatId: string) => void;
  currentUserId: string;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChatId,
  onChatSelect,
  currentUserId
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getChatDisplayInfo = (chat: Chat) => {
    if (chat.isGroup) {
      return {
        name: chat.name || t('Group Chat'),
        avatar: null,
        isGroup: true
      };
    } else {
      const otherParticipant = chat.participants.find(p => p.user.id !== currentUserId);
      if (otherParticipant) {
        return {
          name: `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`,
          avatar: otherParticipant.user.avatar,
          role: otherParticipant.user.role,
          isGroup: false
        };
      }
      return {
        name: t('Unknown User'),
        avatar: null,
        isGroup: false
      };
    }
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      return t('Just now');
    } else if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
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

  if (chats.length === 0) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('No chats yet')}
        </Typography>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
        >
          {t('Start a conversation with someone')}
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
      {chats.map((chat, index) => {
        const displayInfo = getChatDisplayInfo(chat);
        const lastMessage = chat.messages[0];
        // The API already filters for unread messages in _count.messages
        const unreadCount = chat._count.messages;

        return (
          <React.Fragment key={chat.id}>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedChatId === chat.id}
                onClick={() => onChatSelect(chat.id)}
                sx={{
                  py: { xs: 1.5, sm: 1.25 },
                  px: { xs: 2, sm: 1.5 },
                  minHeight: { xs: 72, sm: 68 },
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    '&:hover': {
                      bgcolor: 'primary.light',
                    }
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  transition: 'background-color 0.1s ease'
                }}
              >
                <ListItemAvatar sx={{ minWidth: { xs: 60, sm: 64 } }}>
                  <Badge
                    badgeContent={unreadCount}
                    color="primary"
                    max={99}
                    invisible={unreadCount === 0}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.7rem',
                        minWidth: 18,
                        height: 18
                      }
                    }}
                  >
                    <Avatar
                      src={displayInfo.avatar || undefined}
                      sx={{
                        width: { xs: 48, sm: 52 },
                        height: { xs: 48, sm: 52 },
                        bgcolor: displayInfo.isGroup ? 'primary.main' : 'secondary.main',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      {displayInfo.isGroup ? (
                        <GroupIcon fontSize="medium" />
                      ) : displayInfo.avatar ? null : (
                        <PersonIcon fontSize="medium" />
                      )}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  sx={{ ml: 0 }}
                  primary={
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      mb: 0.5
                    }}>
                      <Typography
                        variant="subtitle1"
                        component="span"
                        sx={{
                          fontWeight: unreadCount > 0 ? 600 : 500,
                          color: 'text.primary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          fontSize: { xs: '0.95rem', sm: '1rem' },
                          lineHeight: 1.3
                        }}
                      >
                        {displayInfo.name}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          whiteSpace: 'nowrap',
                          ml: 1,
                          lineHeight: 1.3
                        }}
                      >
                        {lastMessage ? formatLastMessageTime(lastMessage.createdAt) : ''}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center'
                    }}>
                      <Typography
                        variant="body2"
                        color={unreadCount > 0 ? 'text.primary' : 'text.secondary'}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          fontWeight: unreadCount > 0 ? 500 : 400,
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          lineHeight: 1.3,
                          mr: 1
                        }}
                      >
                        {lastMessage ? (
                          <>
                            {lastMessage.sender.id === currentUserId ? (
                              <Box component="span" sx={{ color: 'text.secondary', mr: 0.5 }}>
                                ✓ 
                              </Box>
                            ) : null}
                            {lastMessage.messageType === 'TEXT' 
                              ? lastMessage.content 
                              : t(`${lastMessage.messageType.toLowerCase()}_message`)
                            }
                          </>
                        ) : (
                          t('No messages yet')
                        )}
                      </Typography>
                      
                      {/* Status indicators */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {!displayInfo.isGroup && (
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: 'success.main',
                              display: { xs: 'none', sm: 'block' }
                            }}
                          />
                        )}
                        {!displayInfo.isGroup && displayInfo.role && !isMobile && (
                          <Chip
                            label={displayInfo.role}
                            size="small"
                            color={getRoleColor(displayInfo.role) as any}
                            variant="outlined"
                            sx={{ 
                              height: 16, 
                              fontSize: '0.65rem',
                              '& .MuiChip-label': {
                                px: 0.5
                              }
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
            {index < chats.length - 1 && (
              <Divider 
                variant="inset" 
                component="li" 
                sx={{ 
                  ml: { xs: 8, sm: 9 },
                  opacity: 0.3
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </List>
  );
};

export default ChatList;