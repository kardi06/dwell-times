import React, { useState } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';

const { Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <Layout className="bg-gray-50">
        <Header collapsed={collapsed} onToggle={handleToggle} />
        <Content className="p-6">
          <div className="min-h-full">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout; 