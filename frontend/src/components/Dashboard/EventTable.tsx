import React, { useState, useEffect } from 'react';
import { Card, Alert, Button, Input, Loading } from '../ui';

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
        },
        {
          id: 4,
          timestamp: '2024-01-15T11:05:00Z',
          person_id: 'P003',
          camera_id: 'CAM001',
          event_type: 'entry',
          dwell_duration: 90
        },
        {
          id: 5,
          timestamp: '2024-01-15T11:10:00Z',
          person_id: 'P003',
          camera_id: 'CAM001',
          event_type: 'exit',
          dwell_duration: 90
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

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
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

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'entry':
        return 'bg-success-100 text-success-800';
      case 'exit':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-secondary-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-secondary-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Export */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="sm:w-64"
          />
          <Input
            placeholder="Filter by camera..."
            value={cameraFilter}
            onChange={setCameraFilter}
            className="sm:w-48"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleExportCSV}
          disabled={events.length === 0}
          className="flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export CSV</span>
        </Button>
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Table */}
      <Card variant="default" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 border-b border-secondary-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Person ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Camera ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Dwell Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-secondary-500">
                      <svg className="mx-auto h-12 w-12 text-secondary-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-lg font-medium">No events found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-secondary-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                      {formatTimestamp(event.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                      {event.person_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {event.camera_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                        {event.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                      {formatDwellDuration(event.dwell_duration)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-secondary-700">
            Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredEvents.length)} of {filteredEvents.length} results
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={rowsPerPage}
            onChange={(e) => handleChangeRowsPerPage(Number(e.target.value))}
            className="border border-secondary-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleChangePage(page - 1)}
              disabled={page === 0}
              className="px-3 py-1 text-sm border border-secondary-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-secondary-700">
              {page + 1} of {Math.ceil(filteredEvents.length / rowsPerPage)}
            </span>
            <button
              onClick={() => handleChangePage(page + 1)}
              disabled={page >= Math.ceil(filteredEvents.length / rowsPerPage) - 1}
              className="px-3 py-1 text-sm border border-secondary-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventTable; 