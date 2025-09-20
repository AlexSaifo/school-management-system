'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Alert,
  CircularProgress 
} from '@mui/material';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

export const NotificationTester: React.FC = () => {
  const [title, setTitle] = useState('Test Notification');
  const [message, setMessage] = useState('This is a test notification from the system.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const { isConnected, socket } = useSocket();
  const { user } = useAuth();

  const sendTestNotification = async () => {
    if (!user) {
      setResult('Error: User not authenticated');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/announcements/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          title,
          content: message,
          targetRoles: ['ALL'],
          priority: 'NORMAL'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Success! Notification sent to ${data.targetUsers} users`);
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testSocketConnection = () => {
    if (socket && isConnected) {
      socket.emit('test-event', { message: 'Test from client' });
      setResult('✅ Socket test event sent');
    } else {
      setResult('❌ Socket not connected');
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, m: 2, maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        🧪 Notification System Tester
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        Socket Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}<br/>
        User: {user ? `${user.firstName} ${user.lastName} (${user.role})` : 'Not authenticated'}
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Notification Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
        />
        
        <TextField
          label="Notification Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          fullWidth
          multiline
          rows={3}
        />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            onClick={sendTestNotification}
            disabled={loading || !user}
            startIcon={loading && <CircularProgress size={16} />}
          >
            Send Test Announcement
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={testSocketConnection}
            disabled={!isConnected}
          >
            Test Socket
          </Button>
        </Box>

        {result && (
          <Alert severity={result.includes('✅') ? 'success' : 'error'} sx={{ mt: 2 }}>
            {result}
          </Alert>
        )}
      </Box>
    </Paper>
  );
};