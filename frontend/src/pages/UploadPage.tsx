import React from 'react';
import { Typography, Card } from 'antd';
import FileUpload from '../components/FileUpload/FileUpload';
import { analyticsAPI } from '../services/api';

const { Title } = Typography;

const UploadPage: React.FC = () => {
  // const handleFileUpload = async (file: File) => {
    // Simulate API call
    // console.log('Uploading file:', file.name);
    
    // In a real implementation, this would call the backend API
    // const formData = new FormData();
    // formData.append('file', file);
    // await axios.post('/api/v1/analytics/upload-csv', formData);
    
    // 
  const handleFileUpload = async (file: File) => {
    try {
      const response = await analyticsAPI.uploadCSV(file);
      console.log('Upload successful:', response.data);
      return Promise.resolve();
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };
  // };

  return (
    <div className="p-6">
      <div className="mb-8">
        <Title level={2}>Upload Data</Title>
        <p className="text-gray-600 mt-2">
          Upload CSV files containing dwell time data for analysis. 
          The system will automatically process and calculate analytics.
        </p>
      </div>

      <div className="max-w-4xl">
        <Card title="Data Upload" className="mb-6">
          <FileUpload
            onFileUpload={handleFileUpload}
            acceptedFileTypes={['.csv']}
            maxFileSize={10 * 1024 * 1024} // 10MB
          />
        </Card>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Upload Guidelines">
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• CSV files only (maximum 10MB)</li>
              <li>• Include timestamp, camera_id, person_id columns</li>
              <li>• Data will be processed automatically</li>
              <li>• Analytics will be available after processing</li>
            </ul>
          </Card>

          <Card title="Processing Status">
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Files are validated before processing</p>
              <p>• Dwell time calculations are performed</p>
              <p>• Results are available in the Analytics section</p>
              <p>• Processing typically takes 1-2 minutes</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UploadPage; 