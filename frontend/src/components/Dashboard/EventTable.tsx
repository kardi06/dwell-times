import React, { useState, useEffect, useCallback } from 'react';
import { Card, Alert, Button, Input, Loading } from '../ui';

interface CameraEvent {
  person_id: string;
  date: string; // YYYY-MM-DD format
  time_period: string; // e.g., "01:00 PM - 02:00 PM"
  gender: string; // "male", "female", "other"
  age_group: string; // "20-29", "30-39", "other"
  total_dwell_time: number; // in seconds, pre-calculated
  event_count: number; // number of events for this group
  created_at: string; // ISO timestamp of latest event
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
  const [personIdFilter, setPersonIdFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [ageGroupFilter, setAgeGroupFilter] = useState('');
  const [timePeriodFilter, setTimePeriodFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Available filter options
  const genderOptions = ['male', 'female', 'other'];
  const ageGroupOptions = [
    '10–19',
    '20–29',
    '30–39',
    '40–49',
    '50–59',
    'inconclusive',
    'not_determined',
    'other'
  ];
  const timePeriodOptions = [
    '12:00 AM - 01:00 AM', '01:00 AM - 02:00 AM', '02:00 AM - 03:00 AM',
    '03:00 AM - 04:00 AM', '04:00 AM - 05:00 AM', '05:00 AM - 06:00 AM',
    '06:00 AM - 07:00 AM', '07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM',
    '09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM', '01:00 PM - 02:00 PM', '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM', '05:00 PM - 06:00 PM',
    '06:00 PM - 07:00 PM', '07:00 PM - 08:00 PM', '08:00 PM - 09:00 PM',
    '09:00 PM - 10:00 PM', '10:00 PM - 11:00 PM', '11:00 PM - 12:00 AM'
  ];

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
        search: searchTerm,
        person_id: personIdFilter,
        date: dateFilter,
        gender: genderFilter,
        age_group: ageGroupFilter,
        time_period: timePeriodFilter
      });
      
      console.log('API URL parameters:', params.toString());

      // Call the real backend API endpoint
      const response = await fetch(`http://localhost:8000/api/v1/analytics/events?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      console.log('Filters applied:', { personIdFilter, dateFilter, genderFilter, ageGroupFilter, timePeriodFilter });
      setEvents(data.events || []);
      setTotalCount(data.pagination?.total || 0);
      setTotalPages(data.pagination?.pages || 0);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Failed to fetch events from database');
    } finally {
      setLoading(false);
    }
  }, [token, page, rowsPerPage, searchTerm, personIdFilter, dateFilter, genderFilter, ageGroupFilter, timePeriodFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Clear time period filter when date filter is cleared
  useEffect(() => {
    if (!dateFilter) {
      setTimePeriodFilter('');
    }
  }, [dateFilter]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(0); // Reset to first page when searching
      fetchEvents();
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm, personIdFilter, dateFilter, genderFilter, ageGroupFilter, timePeriodFilter]);

  // Fetch data when page or rowsPerPage changes
  useEffect(() => {
    fetchEvents();
  }, [page, rowsPerPage]);

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setPersonIdFilter('');
    setDateFilter('');
    setGenderFilter('');
    setAgeGroupFilter('');
    setTimePeriodFilter('');
    setPage(0);
  };

  const handleExportCSV = () => {
    const headers = ['Person ID', 'Date', 'Time Period', 'Gender', 'Age Group', 'Total Dwell Time (s)', 'Event Count', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...events.map(event => [
        event.person_id,
        event.date,
        event.time_period,
        event.gender,
        event.age_group,
        event.total_dwell_time,
        event.event_count,
        event.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'demographic_camera_events.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // No need to filter locally since the API handles filtering
  const paginatedEvents = events;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDwellTime = (seconds: number) => {
    if (!seconds) return '-';
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const formatDwellTimeSeconds = (seconds: number) => {
    return `${seconds}s`;
  };

  const getGenderColor = (gender: string) => {
    switch (gender.toLowerCase()) {
      case 'male': return 'bg-blue-100 text-blue-800';
      case 'female': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgeGroupColor = (ageGroup: string) => {
    switch (ageGroup) {
      case '20-29': return 'bg-green-100 text-green-800';
      case '30-39': return 'bg-yellow-100 text-yellow-800';
      case '40-49': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/*<Input
              placeholder="Search person ID..."
              value={searchTerm}
              onChange={setSearchTerm}
              className="sm:w-48"
            /> */}
            <Input
              placeholder="Filter by person ID..."
              value={personIdFilter}
              onChange={setPersonIdFilter}
              className="sm:w-48"
            />
            <Input
              type="date"
              placeholder="Filter by date..."
              value={dateFilter}
              onChange={setDateFilter}
              className="sm:w-48"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="border border-secondary-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Genders</option>
              {genderOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select
              value={ageGroupFilter}
              onChange={(e) => setAgeGroupFilter(e.target.value)}
              className="border border-secondary-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Age Groups</option>
              {ageGroupOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select
              value={timePeriodFilter}
              onChange={(e) => setTimePeriodFilter(e.target.value)}
              disabled={!dateFilter}
              className="border border-secondary-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{dateFilter ? 'All Time Periods' : 'Select Date First'}</option>
              {dateFilter && timePeriodOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Clear Filters</span>
          </Button>
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
                  Person ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Time Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Age Group
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Total Dwell Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Event Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
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
                paginatedEvents.map((event, index) => (
                                  <tr key={`${event.person_id}-${event.date}-${event.time_period}-${event.gender}-${event.age_group}-${index}`} className="hover:bg-secondary-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                    {event.person_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {event.date}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {event.time_period}
                    </span>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGenderColor(event.gender)}`}>
                        {event.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAgeGroupColor(event.age_group)}`}>
                        {event.age_group}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                      {formatDwellTime(event.total_dwell_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                        {event.event_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                      {formatTimestamp(event.created_at)}
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
            Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, totalCount)} of {totalCount} results
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
              {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => handleChangePage(page + 1)}
              disabled={page >= totalPages - 1}
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