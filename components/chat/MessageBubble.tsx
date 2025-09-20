import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  InsertDriveFile as FileIcon,
  Mic as VoiceIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface MessageAttachment {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  thumbnailUrl?: string;
  duration?: number;
}

interface MessageSender {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
}

interface ReplyMessage {
  id: string;
  content?: string;
  messageType: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface ReadReceipt {
  id: string;
  readAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Message {
  id: string;
  content?: string;
  messageType: string;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  sender: MessageSender;
  attachments: MessageAttachment[];
  replyTo?: ReplyMessage;
  readReceipts?: ReadReceipt[];
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  isMobile?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar,
  isMobile = false,
  onReply,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});

  // Safety check - ensure message exists and has required properties
  if (!message || !message.sender) {
    return null;
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAttachmentIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon />;
    if (mimeType.startsWith('video/')) return <VideoIcon />;
    if (mimeType.startsWith('audio/')) return <AudioIcon />;
    return <FileIcon />;
  };

  const renderAttachment = (attachment: MessageAttachment) => {
    const isImage = attachment.mimeType.startsWith('image/');
    const isVideo = attachment.mimeType.startsWith('video/');
    const isAudio = attachment.mimeType.startsWith('audio/');

    if (isImage) {
      return (
        <Box key={attachment.id} sx={{ maxWidth: isMobile ? 200 : 250, mb: 1 }}>
          {imageLoading[attachment.id] && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <img
            src={attachment.fileUrl}
            alt={attachment.originalName}
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: 8,
              cursor: 'pointer',
              display: imageLoading[attachment.id] ? 'none' : 'block'
            }}
            onLoad={() => setImageLoading(prev => ({ ...prev, [attachment.id]: false }))}
            onLoadStart={() => setImageLoading(prev => ({ ...prev, [attachment.id]: true }))}
            onClick={() => window.open(attachment.fileUrl, '_blank')}
          />
        </Box>
      );
    }

    if (isVideo) {
      return (
        <Box key={attachment.id} sx={{ maxWidth: isMobile ? 200 : 250, mb: 1 }}>
          <video
            controls
            style={{ maxWidth: '100%', borderRadius: 8 }}
            poster={attachment.thumbnailUrl}
          >
            <source src={attachment.fileUrl} type={attachment.mimeType} />
            {t('Your browser does not support video playback')}
          </video>
        </Box>
      );
    }

    if (isAudio || message.messageType === 'VOICE_NOTE') {
      return (
        <Box key={attachment.id} sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <VoiceIcon fontSize="small" />
            <Typography variant="caption">
              {message.messageType === 'VOICE_NOTE' ? t('Voice Message') : attachment.originalName}
            </Typography>
            {attachment.duration && (
              <Typography variant="caption" color="text.secondary">
                {Math.floor(attachment.duration / 60)}:{String(attachment.duration % 60).padStart(2, '0')}
              </Typography>
            )}
          </Box>
          <audio controls style={{ width: '100%', height: 40 }}>
            <source src={attachment.fileUrl} type={attachment.mimeType} />
            {t('Your browser does not support audio playback')}
          </audio>
        </Box>
      );
    }

    return (
      <Paper
        key={attachment.id}
        sx={{
          p: 2,
          mb: 1,
          bgcolor: 'action.hover',
          cursor: 'pointer'
        }}
        onClick={() => window.open(attachment.fileUrl, '_blank')}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getAttachmentIcon(attachment.mimeType)}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {attachment.originalName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatFileSize(attachment.fileSize)}
            </Typography>
          </Box>
          <IconButton size="small">
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        mb: { xs: 0.5, sm: 1 },
        gap: { xs: 0.5, sm: 1 },
        px: { xs: 1, sm: 0 }
      }}
    >
      {showAvatar && !isOwn && (
        <Avatar
          src={message.sender.avatar}
          sx={{ 
            width: { xs: 28, sm: 32 }, 
            height: { xs: 28, sm: 32 }, 
            mt: 1,
            fontSize: { xs: '0.75rem', sm: '1rem' }
          }}
        >
          {message.sender.firstName[0]}
        </Avatar>
      )}

      <Box sx={{ 
        maxWidth: isMobile ? '85%' : '70%', 
        minWidth: isMobile ? 100 : 120 
      }}>
        {/* Reply indicator */}
        {message.replyTo && (
          <Paper
            sx={{
              p: { xs: 0.5, sm: 1 },
              mb: 0.5,
              bgcolor: isOwn ? 'primary.light' : 'action.hover',
              borderLeft: isOwn ? '3px solid' : 'none',
              borderLeftColor: 'primary.main',
              borderRight: !isOwn ? '3px solid' : 'none',
              borderRightColor: 'primary.main'
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {t('Replying to')} {message.replyTo.sender.firstName}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.8,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {message.replyTo.messageType === 'TEXT' 
                ? message.replyTo.content 
                : t(`${message.replyTo.messageType.toLowerCase()}_message`)
              }
            </Typography>
          </Paper>
        )}

        <Paper
          sx={{
            p: { xs: 1, sm: 1.5 },
            bgcolor: isOwn ? 'primary.main' : 'background.paper',
            color: isOwn ? 'primary.contrastText' : 'text.primary',
            borderRadius: { xs: 1.5, sm: 2 },
            position: 'relative',
            '&:hover .message-menu': {
              opacity: isMobile ? 0.7 : 1
            }
          }}
        >
          {!isOwn && showAvatar && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }}
              >
                {message.sender.firstName} {message.sender.lastName}
              </Typography>
              <Chip
                label={message.sender.role}
                size="small"
                variant="outlined"
                sx={{ 
                  height: { xs: 14, sm: 16 }, 
                  fontSize: { xs: '0.55rem', sm: '0.6rem' }, 
                  opacity: 0.7,
                  display: { xs: 'none', sm: 'inline-flex' }
                }}
              />
            </Box>
          )}

          {/* Attachments */}
          {message.attachments?.map(renderAttachment)}

          {/* Text content */}
          {message.content && (
            <Typography 
              variant="body2" 
              sx={{ 
                wordBreak: 'break-word',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                lineHeight: { xs: 1.3, sm: 1.43 }
              }}
            >
              {message.content}
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.7,
                fontSize: { xs: '0.65rem', sm: '0.75rem' }
              }}
            >
              {formatTime(message.createdAt)}
              {message.isEdited && ` • ${t('edited')}`}
            </Typography>

            <IconButton
              size="small"
              className="message-menu"
              onClick={handleMenuOpen}
              sx={{ 
                opacity: 0,
                transition: 'opacity 0.2s',
                color: isOwn ? 'inherit' : 'text.secondary',
                p: { xs: 0.25, sm: 0.5 },
                minWidth: { xs: 28, sm: 32 },
                minHeight: { xs: 28, sm: 32 }
              }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Read receipts for own messages */}
          {isOwn && message.readReceipts && message.readReceipts.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  opacity: 0.7,
                  fontSize: { xs: '0.65rem', sm: '0.75rem' }
                }}
              >
                {t('Read by')} {message.readReceipts.length}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: isOwn ? 'left' : 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: isOwn ? 'left' : 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            minWidth: isMobile ? 140 : 120,
            '& .MuiMenuItem-root': {
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              py: { xs: 1.5, sm: 1 },
              minHeight: { xs: 48, sm: 36 }
            }
          }
        }}
      >
        {onReply && (
          <MenuItem onClick={() => { onReply(message); handleMenuClose(); }}>
            <ReplyIcon fontSize="small" sx={{ mr: { xs: 1.5, sm: 1 } }} />
            {t('Reply')}
          </MenuItem>
        )}
        {isOwn && onEdit && message.messageType === 'TEXT' && (
          <MenuItem onClick={() => { onEdit(message); handleMenuClose(); }}>
            <EditIcon fontSize="small" sx={{ mr: { xs: 1.5, sm: 1 } }} />
            {t('Edit')}
          </MenuItem>
        )}
        {isOwn && onDelete && (
          <MenuItem 
            onClick={() => { onDelete(message.id); handleMenuClose(); }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: { xs: 1.5, sm: 1 } }} />
            {t('Delete')}
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default MessageBubble;