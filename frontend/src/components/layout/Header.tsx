import React, { useState } from 'react';
import { Layout, Input, Button, Badge, Avatar, Dropdown } from 'antd';
import { 
  // FilterOutlined, 
  // BellOutlined, 
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import SettingsModal from '../Settings/SettingsModal';

const { Header: AntHeader } = Layout;
// const { Search } = Input;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ collapsed, onToggle }) => {
  const [settingsVisible, setSettingsVisible] = useState(false);

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
    },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      // Handle logout
      console.log('Logout clicked');
    } else if (key === 'settings') {
      setSettingsVisible(true);
    }
  };

  return (
    <AntHeader className="bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      {/* Left side - Toggle Button, Search and Filter */}
      <div className="flex items-center space-x-4">
        {/* Sidebar Toggle Button */}
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          className="flex items-center justify-center w-10 h-10"
        />
        
        {/* <Search
          placeholder="Search analytics, projects..."
          className="w-80"
          allowClear
        />
        <Button 
          icon={<FilterOutlined />} 
          className="flex items-center"
        >
          Filter
        </Button> */}
      </div>

      {/* Right side - Notifications and User */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        {/* <Badge count={3} size="small">
          <Button 
            type="text" 
            icon={<BellOutlined />} 
            className="flex items-center justify-center w-10 h-10"
          />
        </Badge> */}

        {/* Settings */}
        <Button 
          type="text" 
          icon={<SettingOutlined />} 
          className="flex items-center justify-center w-10 h-10"
          onClick={() => setSettingsVisible(true)}
        />

        {/* User Menu */}
        <Dropdown
          menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
          placement="bottomRight"
          trigger={['click']}
          overlayStyle={{minWidth: '150px'}}
        >
          <Avatar 
            size={40} 
            icon={<UserOutlined />} 
            className="cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Dropdown>
      </div>

      <SettingsModal 
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </AntHeader>
  );
};

export default Header; 