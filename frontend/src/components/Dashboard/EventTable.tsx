import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  Box,
  Typography,
  Skeleton,
  Alert,
  Button
} from '@mui/material';
import { Download } from '@mui/icons-material';

interface CameraEvent {
  id: number;
  timestamp: string;
  person_id: string;
  camera_id: string;
  event_type: string;
  dwell_duration?: number;
}

interface EventTableProps {
  token: string;
}

const EventTable: React.FC<EventTableProps> = ({ token }) => {
  const [events, setEvents] = useState<CameraEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [cameraFilter, setCameraFilter] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    
    try {
      // For now, we'll simulate data since the backend doesn't have a specific events endpoint
      // In a real implementation, this would call the backend API
      const mockEvents: CameraEvent[] = [
        {
          id: 1,
          timestamp: '2024-01-15T10:30:00Z',
          person_id: 'P001',
          camera_id: 'CAM001',
          event_type: 'entry',
          dwell_duration: 45
        },
        {
          id: 2,
          timestamp: '2024-01-15T10:35:00Z',
          person_id: 'P001',
          camera_id: 'CAM001',
          event_type: 'exit',
          dwell_duration: 45
        },
        {
          id: 3,
          timestamp: '2024-01-15T11:00:00Z',
          person_id: 'P002',
          camera_id: 'CAM002',
          event_type: 'entry',
          dwell_duration: 120
        }
      ];
      
      setEvents(mockEvents);
    } catch (err) {
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [token]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Person ID', 'Camera ID', 'Event Type', 'Dwell Duration'];
    const csvContent = [
      headers.join(','),
      ...events.map(event => [
        event.timestamp,
        event.person_id,
        event.camera_id,
        event.event_type,
        event.dwell_duration || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'camera_events.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.person_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.camera_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.event_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCamera = !cameraFilter || event.camera_id === cameraFilter;
    
    return matchesSearch && matchesCamera;
  });

  const paginatedEvents = filteredEvents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDwellDuration = (duration?: number) => {
    if (!duration) return '-';
    return `${Math.floor(duration / 60)}m ${duration % 60}s`;
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Filters and Export */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <TextField
          label="Camera ID"
          variant="outlined"
          size="small"
          value={cameraFilter}
          onChange={(e) => setCameraFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        />
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleExportCSV}
          disabled={events.length === 0}
        >
          Export CSV
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Person ID</TableCell>
              <TableCell>Camera ID</TableCell>
              <TableCell>Event Type</TableCell>
              <TableCell>Dwell Duration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No events found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{formatTimestamp(event.timestamp)}</TableCell>
                  <TableCell>{event.person_id}</TableCell>
                  <TableCell>{event.camera_id}</TableCell>
                  <TableCell>{event.event_type}</TableCell>
                  <TableCell>{formatDwellDuration(event.dwell_duration)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredEvents.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default EventTable; 