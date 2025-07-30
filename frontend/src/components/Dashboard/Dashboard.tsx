import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import { Upload, Analytics, TableChart } from '@mui/icons-material';
// import LoginForm from '../Auth/LoginForm';
import FileUpload from '../FileUpload/FileUpload';
import KPICards from './KPICards';
import EventTable from './EventTable';

interface DashboardProps {
  token: string;
  onLogout: () => void;
}

interface KPIMetrics {
  total_unique_visitors?: number;
  average_dwell_time?: number;
  max_dwell_time?: number;
  total_events_processed?: number;
  cameras_with_activity?: number;
}

const Dashboard: React.FC<DashboardProps> = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/analytics/kpi-metrics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.kpi_metrics);
      } else {
        setError('Failed to fetch metrics');
      }
    } catch (err) {
      setError('Network error while fetching metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/v1/analytics/upload-csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        // Refresh metrics after successful upload
        await fetchMetrics();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Upload failed');
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [token]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Dwell-Insight Analytics Dashboard
          </Typography>
          <Box>
            <Typography variant="body2" color="textSecondary" sx={{ mr: 2 }}>
              Welcome back!
            </Typography>
            <button onClick={onLogout} style={{ 
              background: 'none', 
              border: 'none', 
              color: '#1976d2', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}>
              Logout
            </button>
          </Box>
        </Box>
      </Paper>

      <Container maxWidth="xl">
        {/* KPI Cards */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Key Performance Indicators
          </Typography>
          <KPICards metrics={metrics} loading={loading} />
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Paper elevation={2}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab 
              icon={<Upload />} 
              label="Upload Data" 
              iconPosition="start"
            />
            <Tab 
              icon={<Analytics />} 
              label="Analytics" 
              iconPosition="start"
            />
            <Tab 
              icon={<TableChart />} 
              label="Event Table" 
              iconPosition="start"
            />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Upload Camera Event Data
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Drag and drop a CSV file with camera event data to process and analyze.
                </Typography>
                <FileUpload onFileUpload={handleFileUpload} />
              </Box>
            )}

            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Analytics Overview
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Detailed analytics and insights will be displayed here.
                </Typography>
                {/* TODO: Add charts and detailed analytics */}
              </Box>
            )}

            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Event Data Table
                </Typography>
                <EventTable token={token} />
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Dashboard; 