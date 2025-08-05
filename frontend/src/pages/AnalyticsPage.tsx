import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const AnalyticsPage: React.FC = () => {
  return (
    <div className="p-6">
      <Title level={2}>Analytics</Title>
      <p className="text-gray-600">Analytics page content will be implemented in Task 7.</p>
    </div>
  );
};

export default AnalyticsPage; 