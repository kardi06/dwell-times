import React from 'react';
import { Layout, Menu, Avatar, Typography } from 'antd';
import { 
  DashboardOutlined, 
  UploadOutlined, 
  BarChartOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider } = Layout;
const { Text } = Typography;

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/upload',
      icon: <UploadOutlined />,
      label: 'Upload Data',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Sider
      width={250}
      collapsed={collapsed}
      collapsedWidth={80}
      className="bg-white border-r border-gray-200 shadow-sm transition-all duration-300"
      breakpoint="lg"
      trigger={null}
    >
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center mb-8">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">X</span>
          </div>
          {!collapsed && <Text className="text-xl font-semibold text-gray-900">Xplico</Text>}
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-0 bg-transparent"
          style={{ border: 'none' }}
          inlineCollapsed={collapsed}
        />
      </div>
    </Sider>
  );
};

export default Sidebar; 