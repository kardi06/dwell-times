import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Analytics API endpoints
export const analyticsAPI = {
  // Key metrics
  getKPIMetrics: () => api.get('/analytics/kpi-metrics'),
  
  // Dwell time analytics
  getDwellTimeAnalytics: (params: {
    timePeriod?: string;
    metricType?: string;
    selectedDate?: string;
  }) => api.get('/analytics/dwell-time-analytics', { params }),
  
  // Foot traffic data
  getFootTrafficData: (params: {
    timePeriod?: string;
    viewType?: string;
    cameraFilter?: string;
    selectedDate?: string;
  }) => api.get('/analytics/foot-traffic-data', { params }),
  
  // Camera list
  getCameras: () => api.get('/analytics/cameras'),
  
  // File upload
  uploadCSV: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/analytics/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Project management API endpoints
export const projectsAPI = {
  getProjects: () => api.get('/projects'),
  createProject: (data: any) => api.post('/projects', data),
  updateProject: (id: string, data: any) => api.put(`/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/projects/${id}`),
};

// User settings API endpoints
export const settingsAPI = {
  getSettings: () => api.get('/user/settings'),
  updateSettings: (data: any) => api.put('/user/settings', data),
};

// Mock data for development (when API is not available)
export const mockData = {
  kpiMetrics: {
    totalVisitors: 1234,
    avgDwellTime: 45,
    activeCameras: 8,
    trends: {
      totalVisitors: 12.5,
      avgDwellTime: -2.3,
      activeCameras: 0,
    },
  },
  
  dwellTimeData: [
    { age_group: '18-25', gender: 'male', total_dwell_time: 3600, avg_dwell_time: 1800, event_count: 10 },
    { age_group: '18-25', gender: 'female', total_dwell_time: 4200, avg_dwell_time: 2100, event_count: 12 },
    { age_group: '26-35', gender: 'male', total_dwell_time: 3000, avg_dwell_time: 1500, event_count: 8 },
    { age_group: '26-35', gender: 'female', total_dwell_time: 4800, avg_dwell_time: 2400, event_count: 15 },
  ],
  
  footTrafficData: [
    { time_period: '10 AM', male_count: 15, female_count: 12, other_count: 3, total_count: 30 },
    { time_period: '11 AM', male_count: 22, female_count: 18, other_count: 5, total_count: 45 },
    { time_period: '12 PM', male_count: 35, female_count: 28, other_count: 8, total_count: 71 },
    { time_period: '1 PM', male_count: 28, female_count: 25, other_count: 6, total_count: 59 },
    { time_period: '2 PM', male_count: 20, female_count: 16, other_count: 4, total_count: 40 },
  ],
  
  cameras: [
    'Camera 1 - Main Entrance',
    'Camera 2 - Sales Floor',
    'Camera 3 - Checkout Area',
    'Camera 4 - Parking Lot',
    'Camera 5 - Food Court',
  ],
  
  projects: [
    {
      id: '1',
      name: 'Analytics Dashboard Redesign',
      description: 'Modernize the analytics dashboard with new UI components and improved user experience.',
      progress: 75,
      teamMembers: [
        { id: '1', name: 'John Doe', initials: 'JD' },
        { id: '2', name: 'Jane Smith', initials: 'JS' },
        { id: '3', name: 'Mike Johnson', initials: 'MJ' },
        { id: '4', name: 'Sarah Wilson', initials: 'SW' }
      ],
      taskCount: 12,
      completedTasks: 9,
      dueDate: new Date('2024-02-15'),
      status: 'active'
    },
    {
      id: '2',
      name: 'Data Pipeline Optimization',
      description: 'Optimize the data processing pipeline for better performance and reliability.',
      progress: 45,
      teamMembers: [
        { id: '5', name: 'Alex Brown', initials: 'AB' },
        { id: '6', name: 'Emily Davis', initials: 'ED' }
      ],
      taskCount: 8,
      completedTasks: 4,
      dueDate: new Date('2024-03-01'),
      status: 'active'
    },
    {
      id: '3',
      name: 'Mobile App Development',
      description: 'Develop a mobile application for real-time analytics monitoring.',
      progress: 90,
      teamMembers: [
        { id: '7', name: 'David Lee', initials: 'DL' },
        { id: '8', name: 'Lisa Chen', initials: 'LC' },
        { id: '9', name: 'Tom Anderson', initials: 'TA' }
      ],
      taskCount: 15,
      completedTasks: 14,
      dueDate: new Date('2024-01-30'),
      status: 'completed'
    }
  ],
};

export default api; 