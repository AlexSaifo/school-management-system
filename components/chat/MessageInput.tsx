import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Chip,
  LinearProgress,
  Menu,
  MenuItem,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  InsertDriveFile as FileIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  Close as CloseIcon,
  Reply as ReplyIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface ReplyMessage {
  id: string;
  content?: string;
  messageType: string;
  sender: {
    firstName: string;
    lastName: string;
  };
}

interface MessageInputProps {
  onSendMessage: (data: {
    content?: string;
    messageType?: string;
    replyToId?: string;
    attachments?: any[];
  }) => void;
  replyTo?: ReplyMessage;
  onCancelReply?: () => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  isMobile?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  replyTo,
  onCancelReply,
  onStartTyping,
  onStopTyping,
  disabled = false,
  isMobile = false
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [attachMenuAnchor, setAttachMenuAnchor] = useState<null | HTMLElement>(null);
  const [error, setError] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicators
  const handleStartTyping = useCallback(() => {
    if (!isTyping && onStartTyping) {
      onStartTyping();
      setIsTyping(true);
    }
  }, [isTyping, onStartTyping]);

  const handleStopTyping = useCallback(() => {
    if (isTyping && onStopTyping) {
      onStopTyping();
      setIsTyping(false);
    }
  }, [isTyping, onStopTyping]);

  const handleMessageChange = useCallback((value: string) => {
    setMessage(value);
    
    if (value.trim() && !isTyping) {
      handleStartTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 2000);
    } else {
      // Stop typing immediately if input is empty
      handleStopTyping();
    }
  }, [isTyping, handleStartTyping, handleStopTyping]);

  const handleSend = useCallback(async () => {
    if (!message.trim() && attachments.length === 0) return;

    setUploading(true);
    setError('');

    try {
      let uploadedAttachments: any[] = [];

      if (attachments.length > 0) {
        uploadedAttachments = await uploadFiles(attachments);
      }

      await onSendMessage({
        content: message.trim() || undefined,
        messageType: attachments.length > 0 ? getMessageType(attachments[0]) : 'TEXT',
        replyToId: replyTo?.id,
        attachments: uploadedAttachments
      });

      setMessage('');
      setAttachments([]);
      handleStopTyping(); // Stop typing when message is sent
      if (onCancelReply) onCancelReply();
    } catch (error) {
      console.error('Error sending message:', error);
      setError(t('Failed to send message'));
    } finally {
      setUploading(false);
    }
  }, [message, attachments, replyTo, onSendMessage, onCancelReply, t]);

  const uploadFiles = async (files: File[]): Promise<any[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('type', 'chat');

    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    return result.files || [];
  };

  const getMessageType = (file: File): string => {
    if (file.type.startsWith('image/')) return 'IMAGE';
    if (file.type.startsWith('video/')) return 'VIDEO';
    if (file.type.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
      setAttachMenuAnchor(null);
    }
  };

  const handleAttachMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAttachMenuAnchor(event.currentTarget);
  };

  const handleAttachMenuClose = () => {
    setAttachMenuAnchor(null);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        
        setUploading(true);
        try {
          const uploadedFiles = await uploadFiles([file]);
          await onSendMessage({
            messageType: 'VOICE_NOTE',
            attachments: uploadedFiles
          });
        } catch (error) {
          console.error('Error sending voice message:', error);
          setError(t('Failed to send voice message'));
        } finally {
          setUploading(false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setError(t('Failed to start recording. Please check microphone permissions.'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2 },
      bgcolor: 'background.paper',
      borderTop: '1px solid',
      borderColor: 'divider'
    }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {replyTo && (
        <Paper sx={{ 
          p: { xs: 0.75, sm: 1 }, 
          mb: 1, 
          bgcolor: 'action.hover' 
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
              <ReplyIcon fontSize="small" />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  {t('Replying to')} {replyTo.sender.firstName} {replyTo.sender.lastName}
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{ 
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {replyTo.messageType === 'TEXT' 
                    ? replyTo.content 
                    : t(`${replyTo.messageType.toLowerCase()}_message`)
                  }
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={onCancelReply}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      )}

      {attachments.length > 0 && (
        <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {attachments.map((file, index) => (
            <Chip
              key={index}
              label={file.name}
              onDelete={() => removeAttachment(index)}
              variant="outlined"
              size={isMobile ? 'small' : 'medium'}
              icon={
                file.type.startsWith('image/') ? <ImageIcon /> :
                file.type.startsWith('video/') ? <VideoIcon /> :
                file.type.startsWith('audio/') ? <AudioIcon /> : <FileIcon />
              }
              sx={{
                maxWidth: { xs: 150, sm: 200 },
                '& .MuiChip-label': {
                  fontSize: { xs: '0.7rem', sm: '0.8125rem' }
                }
              }}
            />
          ))}
        </Box>
      )}

      {uploading && (
        <Box sx={{ mb: 1 }}>
          <LinearProgress />
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
          >
            {t('Sending...')}
          </Typography>
        </Box>
      )}

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: { xs: 0.5, sm: 1 },
        minHeight: { xs: 48, sm: 56 }
      }}>
        <TextField
          fullWidth
          multiline
          maxRows={isMobile ? 3 : 4}
          placeholder={recording ? t('Recording...') : t('Type a message...')}
          value={message}
          onChange={(e) => handleMessageChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled || uploading || recording}
          variant="outlined"
          size={isMobile ? 'small' : 'medium'}
          sx={{
            '& .MuiInputBase-root': {
              fontSize: { xs: '0.875rem', sm: '1rem' },
              minHeight: { xs: 40, sm: 44 }
            },
            '& .MuiInputBase-input': {
              padding: { xs: '8px 12px', sm: '10px 14px' }
            }
          }}
        />

        {!recording ? (
          <>
            <Tooltip title={t('Attach file')}>
              <IconButton 
                onClick={handleAttachMenuOpen} 
                disabled={disabled || uploading}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  minWidth: { xs: 36, sm: 40 },
                  minHeight: { xs: 36, sm: 40 }
                }}
              >
                <AttachIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            </Tooltip>

            <Tooltip title={t('Record voice message')}>
              <IconButton 
                onClick={startRecording} 
                disabled={disabled || uploading}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  minWidth: { xs: 36, sm: 40 },
                  minHeight: { xs: 36, sm: 40 }
                }}
              >
                <MicIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            </Tooltip>

            <Tooltip title={t('Send message')}>
              <IconButton 
                onClick={handleSend} 
                disabled={disabled || uploading || (!message.trim() && attachments.length === 0)}
                color="primary"
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  minWidth: { xs: 36, sm: 40 },
                  minHeight: { xs: 36, sm: 40 }
                }}
              >
                <SendIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            minWidth: { xs: 120, sm: 140 }
          }}>
            <Typography 
              variant="body2" 
              color="error"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {formatRecordingTime(recordingTime)}
            </Typography>
            <IconButton 
              onClick={stopRecording} 
              color="error"
              size={isMobile ? 'small' : 'medium'}
            >
              <StopIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Box>
        )}
      </Box>

      <Menu
        anchorEl={attachMenuAnchor}
        open={Boolean(attachMenuAnchor)}
        onClose={handleAttachMenuClose}
        PaperProps={{
          sx: {
            minWidth: isMobile ? 160 : 140,
            '& .MuiMenuItem-root': {
              fontSize: { xs: '0.875rem', sm: '1rem' },
              py: { xs: 1.5, sm: 1 },
              minHeight: { xs: 48, sm: 36 }
            }
          }
        }}
      >
        <MenuItem onClick={() => { imageInputRef.current?.click(); handleAttachMenuClose(); }}>
          <ImageIcon sx={{ mr: { xs: 1.5, sm: 1 } }} fontSize={isMobile ? 'small' : 'medium'} />
          {t('Images')}
        </MenuItem>
        <MenuItem onClick={() => { videoInputRef.current?.click(); handleAttachMenuClose(); }}>
          <VideoIcon sx={{ mr: { xs: 1.5, sm: 1 } }} fontSize={isMobile ? 'small' : 'medium'} />
          {t('Videos')}
        </MenuItem>
        <MenuItem onClick={() => { audioInputRef.current?.click(); handleAttachMenuClose(); }}>
          <AudioIcon sx={{ mr: { xs: 1.5, sm: 1 } }} fontSize={isMobile ? 'small' : 'medium'} />
          {t('Audio')}
        </MenuItem>
        <MenuItem onClick={() => { fileInputRef.current?.click(); handleAttachMenuClose(); }}>
          <FileIcon sx={{ mr: { xs: 1.5, sm: 1 } }} fontSize={isMobile ? 'small' : 'medium'} />
          {t('Documents')}
        </MenuItem>
      </Menu>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <input
        ref={videoInputRef}
        type="file"
        multiple
        accept="video/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <input
        ref={audioInputRef}
        type="file"
        multiple
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </Box>
  );
};

export default MessageInput;