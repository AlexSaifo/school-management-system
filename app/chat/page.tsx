'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  AppBar,
  Toolbar,
  Avatar,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
  Drawer,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import SidebarLayout from '@/components/layout/SidebarLayout';
import ChatList from '@/components/chat/ChatList';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageInput from '@/components/chat/MessageInput';
import UserSelector from '@/components/chat/UserSelector';

interface Chat {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: Array<{
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      role: string;
    };
  }>;
  messages: Array<{
    id: string;
    content?: string;
    messageType: string;
    createdAt: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  _count: {
    messages: number; // This now represents unread count from others
  };
  updatedAt: string;
}

interface Message {
  id: string;
  content?: string;
  messageType: string;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
  };
  attachments?: Array<{
    id: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    fileUrl: string;
    thumbnailUrl?: string;
    duration?: number;
  }>;
  replyTo?: {
    id: string;
    content?: string;
    messageType: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  readReceipts?: Array<{
    id: string;
    readAt: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const { 
    isConnected, 
    joinChat, 
    leaveChat, 
    sendMessage: socketSendMessage,
    onNewMessage, 
    onMessageConfirmed,
    startTyping,
    stopTyping,
    onUserTyping,
    onUserStopTyping
  } = useSocket();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [userSelectorOpen, setUserSelectorOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | undefined>();
  const [error, setError] = useState<string>('');
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [messagesPage, setMessagesPage] = useState(1);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket event handlers
  useEffect(() => {
    // Handle new incoming messages
    const unsubscribeNewMessage = onNewMessage?.((message: Message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      // Refresh chat list to update unread counts
      fetchChats();
    });

    // Handle message confirmation (for sender)
    const unsubscribeMessageConfirmed = onMessageConfirmed?.((message: Message) => {
      setMessages(prev => {
        // Check if message already exists to avoid duplication
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
      scrollToBottom();
    });

    // Handle typing indicators
    const unsubscribeUserTyping = onUserTyping?.((data: { userId: string; chatId: string }) => {
      if (data.chatId === selectedChatId && data.userId !== user?.id) {
        setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
      }
    });

    const unsubscribeUserStopTyping = onUserStopTyping?.((data: { userId: string; chatId: string }) => {
      if (data.chatId === selectedChatId) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    });

    return () => {
      unsubscribeNewMessage?.();
      unsubscribeMessageConfirmed?.();
      unsubscribeUserTyping?.();
      unsubscribeUserStopTyping?.();
    };
  }, [selectedChatId, user?.id, onNewMessage, onMessageConfirmed, onUserTyping, onUserStopTyping]);

  // Join/leave chat rooms when selected chat changes
  useEffect(() => {
    if (!selectedChatId || !isConnected) return;

    joinChat(selectedChatId);
    setTypingUsers([]); // Clear typing indicators when switching chats

    return () => {
      if (selectedChatId) {
        leaveChat(selectedChatId);
      }
    };
  }, [selectedChatId, isConnected, joinChat, leaveChat]);

  // Fetch chats
  const fetchChats = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      } else {
        setError(t('Failed to load chats'));
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError(t('Failed to load chats'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  // Fetch messages for selected chat
  const fetchMessages = useCallback(async (chatId: string, page = 1, append = false) => {
    if (!chatId) return;

    setMessagesLoading(true);
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch(`/api/chats/${chatId}?page=${page}&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (append) {
          setMessages(prev => [...data.messages, ...prev]);
        } else {
          setMessages(data.messages || []);
          scrollToBottom();
        }
        setHasMoreMessages(data.pagination?.hasNext || false);
        
        // Refresh chat list to update unread count after messages are marked as read
        if (!append) {
          fetchChats();
        }
      } else {
        setError(t('Failed to load messages'));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(t('Failed to load messages'));
    } finally {
      setMessagesLoading(false);
    }
  }, [t]);

  // Send message
  const handleSendMessage = useCallback(async (data: {
    content?: string;
    messageType?: string;
    replyToId?: string;
    attachments?: any[];
  }) => {
    if (!selectedChatId) return;

    try {
      // For WebSocket, we still need to send to API for persistence, but also emit via socket
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          chatId: selectedChatId,
          ...data
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add message to local state immediately
        setMessages(prev => [...prev, result.data]);
        scrollToBottom();
        
        // Send message via WebSocket to all participants (only if connected)
        if (isConnected) {
          socketSendMessage(selectedChatId, result.data);
        }
        
        setReplyTo(undefined);
        
        // Refresh chats to update last message
        fetchChats();
      } else {
        setError(t('Failed to send message'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(t('Failed to send message'));
    }
  }, [selectedChatId, isConnected, socketSendMessage, fetchChats, t]);

  // Handle typing indicators
  const handleStartTyping = useCallback(() => {
    if (!selectedChatId || !isConnected || isTyping) return;
    
    startTyping(selectedChatId);
    setIsTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 3000);
  }, [selectedChatId, isConnected, isTyping, startTyping]);

  const handleStopTyping = useCallback(() => {
    if (!selectedChatId || !isConnected || !isTyping) return;
    
    stopTyping(selectedChatId);
    setIsTyping(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [selectedChatId, isConnected, isTyping, stopTyping]);

  // Create new chat
  const handleCreateChat = useCallback(async (participantIds: string[], name?: string, isGroup?: boolean) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          participantIds,
          name,
          isGroup
        })
      });

      if (response.ok) {
        const result = await response.json();
        await fetchChats();
        setSelectedChatId(result.chat.id);
      } else {
        setError(t('Failed to create chat'));
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      setError(t('Failed to create chat'));
    }
  }, [fetchChats, t]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(() => {
    if (hasMoreMessages && !messagesLoading) {
      const nextPage = messagesPage + 1;
      setMessagesPage(nextPage);
      fetchMessages(selectedChatId, nextPage, true);
    }
  }, [hasMoreMessages, messagesLoading, messagesPage, selectedChatId, fetchMessages]);

  // Handle chat selection
  const handleChatSelect = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
    setMessages([]);
    setMessagesPage(1);
    setReplyTo(undefined);
    fetchMessages(chatId);
    
    // On mobile, hide chat list and show chat view
    if (isMobile) {
      setShowChatList(false);
      setMobileDrawerOpen(false);
    }
  }, [fetchMessages, isMobile]);

  // Get selected chat info
  const selectedChat = chats.find(chat => chat.id === selectedChatId);
  const getChatDisplayInfo = (chat: Chat) => {
    if (chat.isGroup) {
      return {
        name: chat.name || t('Group Chat'),
        participants: chat.participants.length,
        isGroup: true
      };
    } else {
      const otherParticipant = chat.participants.find(p => p.user.id !== user?.id);
      if (otherParticipant) {
        return {
          name: `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`,
          role: otherParticipant.user.role,
          avatar: otherParticipant.user.avatar,
          isGroup: false
        };
      }
      return { name: t('Unknown User'), isGroup: false };
    }
  };

  // Initial load
  useEffect(() => {
    fetchChats();
    
    // On mobile, start with chat list visible
    if (isMobile && !selectedChatId) {
      setShowChatList(true);
    }
  }, [fetchChats, isMobile, selectedChatId]);

  // Handle scroll for loading more messages
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget;
    if (scrollTop === 0 && hasMoreMessages && !messagesLoading) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, messagesLoading, loadMoreMessages]);

  // Handle back to chat list on mobile
  const handleBackToChatList = useCallback(() => {
    if (isMobile) {
      setShowChatList(true);
      setSelectedChatId('');
    }
  }, [isMobile]);

  // Toggle mobile drawer
  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  if (!user) {
    return (
      <SidebarLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <Box sx={{ height: '100%', display: 'flex', position: 'relative' }}>
        {/* Desktop Chat List Sidebar - Hidden on mobile */}
        {!isMobile && (
          <Paper 
            sx={{ 
              width: isTablet ? 300 : 350, 
              display: 'flex', 
              flexDirection: 'column', 
              borderRadius: 0,
              borderRight: '1px solid',
              borderColor: 'divider'
            }}
          >
            <AppBar position="static" color="default" elevation={1}>
              <Toolbar 
                variant="dense" 
                sx={{ 
                  minHeight: { xs: 64, sm: 70 },
                  px: { xs: 1, sm: 2 },
                  bgcolor: 'background.paper',
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    flexGrow: 1,
                    fontWeight: 500,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    color: 'text.primary'
                  }}
                >
                  {t('Chats')}
                </Typography>
                <Tooltip title={t('Refresh')}>
                  <IconButton 
                    onClick={fetchChats} 
                    disabled={loading}
                    sx={{ 
                      color: 'text.secondary',
                      mr: 0.5
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('New Chat')}>
                  <IconButton 
                    onClick={() => setUserSelectorOpen(true)}
                    sx={{ color: 'text.secondary' }}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Toolbar>
            </AppBar>

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <ChatList
                  chats={chats}
                  selectedChatId={selectedChatId}
                  onChatSelect={handleChatSelect}
                  currentUserId={user.id}
                />
              )}
            </Box>
          </Paper>
        )}

        {/* Mobile Drawer for Chat List */}
        {isMobile && (
          <Drawer
            variant="temporary"
            anchor="left"
            open={mobileDrawerOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: '85vw',
                maxWidth: 350,
              },
            }}
          >
            <AppBar position="static" color="default" elevation={1}>
              <Toolbar 
                variant="dense" 
                sx={{ 
                  minHeight: { xs: 64, sm: 70 },
                  px: { xs: 1, sm: 2 },
                  bgcolor: 'background.paper',
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    flexGrow: 1,
                    fontWeight: 500,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    color: 'text.primary'
                  }}
                >
                  {t('Chats')}
                </Typography>
                <Tooltip title={t('Refresh')}>
                  <IconButton 
                    onClick={fetchChats} 
                    disabled={loading}
                    sx={{ 
                      color: 'text.secondary',
                      mr: 0.5
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('New Chat')}>
                  <IconButton 
                    onClick={() => setUserSelectorOpen(true)}
                    sx={{ color: 'text.secondary' }}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Toolbar>
            </AppBar>

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <ChatList
                  chats={chats}
                  selectedChatId={selectedChatId}
                  onChatSelect={handleChatSelect}
                  currentUserId={user.id}
                />
              )}
            </Box>
          </Drawer>
        )}

        {/* Chat Messages Area */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column',
            width: isMobile ? '100%' : 'auto',
            position: 'relative'
          }}
        >
          {selectedChat ? (
            <>
              {/* Chat Header - WhatsApp Style */}
              <AppBar position="static" color="default" elevation={1}>
                <Toolbar 
                  variant="dense" 
                  sx={{ 
                    minHeight: { xs: 64, sm: 70 },
                    px: { xs: 1, sm: 2 },
                    bgcolor: 'background.paper',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  {/* Mobile back button */}
                  {isMobile && (
                    <IconButton
                      edge="start"
                      onClick={handleBackToChatList}
                      sx={{ 
                        mr: 1,
                        p: 1
                      }}
                    >
                      <ArrowBackIcon />
                    </IconButton>
                  )}
                  
                  {/* Avatar and Chat Info - WhatsApp Layout */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      flexGrow: 1, 
                      minWidth: 0,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      },
                      borderRadius: 1,
                      p: 0.5,
                      mr: 1
                    }}
                  >
                    <Avatar
                      src={!selectedChat.isGroup ? getChatDisplayInfo(selectedChat).avatar : undefined}
                      sx={{ 
                        width: { xs: 40, sm: 44 }, 
                        height: { xs: 40, sm: 44 }, 
                        mr: { xs: 1.5, sm: 2 },
                        bgcolor: selectedChat.isGroup ? 'primary.main' : 'secondary.main'
                      }}
                    >
                      {selectedChat.isGroup ? (
                        <GroupIcon fontSize={isMobile ? 'medium' : 'large'} />
                      ) : (
                        <PersonIcon fontSize={isMobile ? 'medium' : 'large'} />
                      )}
                    </Avatar>
                    
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography 
                        variant="subtitle1"
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: 500,
                          fontSize: { xs: '0.95rem', sm: '1.1rem' },
                          lineHeight: 1.2,
                          color: 'text.primary'
                        }}
                      >
                        {getChatDisplayInfo(selectedChat).name}
                      </Typography>
                      
                      {/* Status/Info line - WhatsApp style */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.25 }}>
                        {selectedChat.isGroup ? (
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                              fontSize: { xs: '0.75rem', sm: '0.8rem' },
                              lineHeight: 1.2
                            }}
                          >
                            {t('{{count}} participants', { count: selectedChat.participants.length })}
                          </Typography>
                        ) : (
                          <>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'success.main',
                                mr: 0.75,
                                display: { xs: 'none', sm: 'block' }
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ 
                                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                                lineHeight: 1.2
                              }}
                            >
                              {getChatDisplayInfo(selectedChat).role} • {t('Online')}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* Action buttons - WhatsApp style */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {!isMobile && (
                      <Tooltip title={t('Search')}>
                        <IconButton size="medium" sx={{ color: 'text.secondary' }}>
                          <SearchIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title={t('More options')}>
                      <IconButton 
                        size="medium"
                        sx={{ color: 'text.secondary' }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Toolbar>
              </AppBar>

              {/* Messages Area */}
              <Box
                ref={messagesContainerRef}
                sx={{
                  flexGrow: 1,
                  overflow: 'auto',
                  p: { xs: 0.5, sm: 1 },
                  bgcolor: 'background.default',
                  position: 'relative',
                  zIndex: 1
                }}
                onScroll={handleScroll}
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                {messagesLoading && messagesPage === 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress />
                  </Box>
                )}

                {hasMoreMessages && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                    <Button size="small" onClick={loadMoreMessages} disabled={messagesLoading}>
                      {messagesLoading ? <CircularProgress size={16} /> : t('Load more')}
                    </Button>
                  </Box>
                )}

                {messages.map((message, index) => {
                  const prevMessage = messages[index - 1];
                  const showAvatar = !prevMessage || 
                                   prevMessage.sender.id !== message.sender.id ||
                                   (new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()) > 300000; // 5 minutes

                  return (
                    <MessageBubble
                      key={message.id}
                      message={{
                        ...message,
                        attachments: message.attachments || []
                      }}
                      isOwn={message.sender.id === user.id}
                      showAvatar={showAvatar}
                      onReply={setReplyTo}
                      isMobile={isMobile}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </Box>

              <Divider />

              {/* Typing Indicators */}
              {typingUsers.length > 0 && (
                <Box sx={{ px: { xs: 1, sm: 2 }, py: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {typingUsers.length === 1 
                      ? t('Someone is typing...') 
                      : t('{{count}} people are typing...', { count: typingUsers.length })
                    }
                  </Typography>
                </Box>
              )}

              {/* Message Input */}
              <MessageInput
                onSendMessage={handleSendMessage}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(undefined)}
                onStartTyping={handleStartTyping}
                onStopTyping={handleStopTyping}
                isMobile={isMobile}
              />
            </>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: 'text.secondary',
              p: { xs: 2, sm: 3 },
              textAlign: 'center'
            }}>
              {/* Mobile menu button when no chat selected */}
              {isMobile && (
                <IconButton
                  onClick={handleDrawerToggle}
                  sx={{ 
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    '&:hover': {
                      bgcolor: 'background.paper',
                      boxShadow: 4
                    }
                  }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              
              <GroupIcon sx={{ fontSize: { xs: 48, sm: 64 }, mb: 2, opacity: 0.5 }} />
              <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
                {t('Welcome to Chat')}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 3, 
                  textAlign: 'center', 
                  maxWidth: { xs: 250, sm: 350 },
                  px: { xs: 2, sm: 0 }
                }}
              >
                {t('Select a conversation from the sidebar or start a new chat to begin messaging.')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setUserSelectorOpen(true)}
                size={isMobile ? "large" : "medium"}
                sx={{ 
                  minWidth: { xs: 200, sm: 'auto' },
                  py: { xs: 1.5, sm: 1 }
                }}
              >
                {t('Start New Chat')}
              </Button>
            </Box>
          )}
        </Box>

        {/* User Selector Dialog */}
        <UserSelector
          open={userSelectorOpen}
          onClose={() => setUserSelectorOpen(false)}
          onCreateChat={handleCreateChat}
          currentUserId={user.id}
        />

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}
      </Box>
    </SidebarLayout>
  );
};

export default ChatPage;