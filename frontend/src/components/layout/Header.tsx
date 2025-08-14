import React, { useState } from 'react';
import { Layout, Button, Avatar, Dropdown } from 'antd';
import {
	SettingOutlined,
	UserOutlined,
	LogoutOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import SettingsModal from '../Settings/SettingsModal';
import MAPLogo from '../../assets/MAP_Logo.svg';

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
		{ type: 'divider' },
		{
			key: 'logout',
			icon: <LogoutOutlined />,
			label: 'Logout',
		},
	];

	const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
		if (key === 'logout') {
			console.log('Logout clicked');
		} else if (key === 'settings') {
			setSettingsVisible(true);
		}
	};

	return (
		<AntHeader className="top-0 z-30 px-4 md:px-6 flex items-center justify-between shadow-lg bg-gradient-to-r from-[#ff4569] via-[#ff1744] to-[#ff8aa0]">
			{/* Left: Toggle + Logo */}
			<div className="flex items-center gap-3 md:gap-4">
				<Button
					type="text"
					icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
					onClick={onToggle}
					className="flex items-center justify-center w-10 h-10 text-white hover:text-white/90"
				/>
				<a href="/" className="flex items-center gap-3 group">
					<img src={MAPLogo} alt="MAP Logo" className="h-8 md:h-10 select-none" />
					{/* <span className="hidden sm:inline text-white/90 font-semibold tracking-wide group-hover:text-white">Mitra Adiperkasa</span> */}
				</a>
			</div>

			{/* Right: Settings + User */}
			<div className="flex items-center gap-1 md:gap-2">
				<Button
					type="text"
					icon={<SettingOutlined />}
					onClick={() => setSettingsVisible(true)}
					className="flex items-center justify-center w-10 h-10 text-white hover:text-white/90"
				/>
				<Dropdown
					menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
					placement="bottomRight"
					trigger={['click']}
					overlayStyle={{ minWidth: '150px' }}
				>
					<Avatar
						size={40}
						icon={<UserOutlined />}
						className="cursor-pointer hover:opacity-90 transition-opacity bg-white text-red-700"
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