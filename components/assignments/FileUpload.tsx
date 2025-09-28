import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  Typography, 
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { 
  CloudUpload, 
  Delete, 
  InsertDriveFile, 
  Download 
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { AttachmentFile } from '@/types/attachments';

interface FileUploadProps {
  attachments?: AttachmentFile[];
  onAttachmentsChange: (attachments: AttachmentFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  disabled?: boolean;
  label: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  attachments = [],
  onAttachmentsChange,
  maxFiles = 10,
  maxFileSize = 10, // 10MB
  acceptedTypes = [
    '.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', 
    '.zip', '.rar', '.xlsx', '.xls', '.ppt', '.pptx'
  ],
  disabled = false,
  label
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes || bytes === 0) return `0 ${t('common.fileSize.B')}`;
    const k = 1024;
    const sizes = [t('common.fileSize.B'), t('common.fileSize.KB'), t('common.fileSize.MB'), t('common.fileSize.GB')];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxFileSize) {
      return t('assignments.fileUpload.fileSizeTooLarge', 'File size must be less than {{size}}MB', { size: maxFileSize });
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return t('assignments.fileUpload.fileTypeNotAllowed', 'File type not allowed. Accepted types: {{types}}', { types: acceptedTypes.join(', ') });
    }

    return null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setError('');

    // Check if adding these files would exceed max files limit
    if (attachments.length + files.length > maxFiles) {
      setError(t('assignments.fileUpload.maxFilesExceeded', 'Maximum {{max}} files allowed', { max: maxFiles }));
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      validFiles.push(file);
    }

    setUploading(true);

    try {
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload files');
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      // Map API response to AttachmentFile format
      const newAttachments = [...attachments, ...result.files.map((file: any) => ({
        originalName: file.originalName,
        fileName: file.fileName,
        size: file.fileSize,
        type: file.mimeType,
        url: file.fileUrl
      }))];
      
      console.log('New attachments:', newAttachments);
      onAttachmentsChange(newAttachments);

    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (attachment: AttachmentFile, index: number) => {
    try {
      // Delete from server
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName: attachment.fileName }),
        credentials: 'include',
      });

      // Remove from local state
      const newAttachments = attachments.filter((_, i) => i !== index);
      onAttachmentsChange(newAttachments);

    } catch (error) {
      console.error('Error deleting file:', error);
      setError(t('assignments.fileUpload.deleteFile', 'Failed to delete file'));
    }
  };

  const handleDownloadFile = (attachment: AttachmentFile) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (type: string | undefined) => {
    if (!type) return '📎';
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
    if (type.includes('presentation') || type.includes('powerpoint')) return '📽️';
    if (type.includes('zip') || type.includes('rar')) return '🗜️';
    return '📎';
  };

  return (
    <Box>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept={acceptedTypes.join(',')}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        disabled={disabled || uploading}
      />

      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Button
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
          onClick={handleFileSelect}
          disabled={disabled || uploading || attachments.length >= maxFiles}
        >
          {uploading ? t('uploading') : label}
        </Button>

        <Typography variant="caption" color="text.secondary">
          {t('assignments.fileUpload.filesCount', '{{current}}/{{max}} files', { current: attachments.length, max: maxFiles })} • {t('assignments.fileUpload.maxSizeEach', 'Max {{size}}MB each', { size: maxFileSize })}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {acceptedTypes.length > 0 && (
        <Box mb={2}>
          <Typography variant="caption" color="text.secondary">
            {t('assignments.fileUpload.acceptedTypes', 'Accepted types')}: {acceptedTypes.join(', ')}
          </Typography>
        </Box>
      )}

      {attachments.length > 0 && (
        <List dense>
          {attachments.map((attachment, index) => (
            <ListItem 
              key={index}
              sx={{ 
                border: 1, 
                borderColor: 'divider', 
                borderRadius: 1, 
                mb: 1,
                bgcolor: 'background.paper'
              }}
            >
              <Box display="flex" alignItems="center" mr={1}>
                <Typography fontSize="1.2em">
                  {getFileIcon(attachment.type)}
                </Typography>
              </Box>
              
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" noWrap>
                      {attachment.originalName}
                    </Typography>
                    <Chip 
                      label={formatFileSize(attachment.size)} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={attachment.type || t('assignments.fileUpload.unknownType', 'Unknown type')}
              />
              
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleDownloadFile(attachment)}
                  size="small"
                  title={t('assignments.fileUpload.downloadFile', 'Download file')}
                >
                  <Download />
                </IconButton>
                {!disabled && (
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteFile(attachment, index)}
                    size="small"
                    color="error"
                    title={t('assignments.fileUpload.deleteFile', 'Delete file')}
                  >
                    <Delete />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default FileUpload;