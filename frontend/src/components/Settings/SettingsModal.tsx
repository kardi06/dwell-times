import React, { useState } from 'react';
import { Modal, Tabs, Form, Switch, Input, Select, Button, Divider } from 'antd';
import { SettingOutlined, UserOutlined, BellOutlined, SafetyOutlined, SkinOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      console.log('Settings saved:', values);
      // In a real app, this would save to backend
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 1000);
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <SettingOutlined className="text-lg" />
          <span>Settings</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave}>
          Save Changes
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          notifications: true,
          emailNotifications: false,
          autoRefresh: true,
          refreshInterval: 30,
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
        }}
      >
        <Tabs defaultActiveKey="general">
          <TabPane
            tab={
              <span>
                <UserOutlined />
                General
              </span>
            }
            key="general"
          >
            <div className="space-y-6">
              <Form.Item label="Display Name" name="displayName">
                <Input placeholder="Enter your display name" />
              </Form.Item>
              
              <Form.Item label="Email" name="email">
                <Input placeholder="Enter your email" />
              </Form.Item>
              
              <Form.Item label="Language" name="language">
                <Select>
                  <Option value="en">English</Option>
                  <Option value="es">Spanish</Option>
                  <Option value="fr">French</Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="Timezone" name="timezone">
                <Select>
                  <Option value="UTC">UTC</Option>
                  <Option value="EST">Eastern Time</Option>
                  <Option value="PST">Pacific Time</Option>
                </Select>
              </Form.Item>
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <BellOutlined />
                Notifications
              </span>
            }
            key="notifications"
          >
            <div className="space-y-6">
              <Form.Item label="Enable Notifications" name="notifications" valuePropName="checked">
                <Switch />
              </Form.Item>
              
              <Form.Item label="Email Notifications" name="emailNotifications" valuePropName="checked">
                <Switch />
              </Form.Item>
              
              <Form.Item label="Auto Refresh" name="autoRefresh" valuePropName="checked">
                <Switch />
              </Form.Item>
              
              <Form.Item label="Refresh Interval (seconds)" name="refreshInterval">
                <Select>
                  <Option value={15}>15 seconds</Option>
                  <Option value={30}>30 seconds</Option>
                  <Option value={60}>1 minute</Option>
                  <Option value={300}>5 minutes</Option>
                </Select>
              </Form.Item>
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <SkinOutlined />
                Appearance
              </span>
            }
            key="appearance"
          >
            <div className="space-y-6">
              <Form.Item label="Theme" name="theme">
                <Select>
                  <Option value="light">Light</Option>
                  <Option value="dark">Dark</Option>
                  <Option value="auto">Auto</Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="Compact Mode" name="compactMode" valuePropName="checked">
                <Switch />
              </Form.Item>
              
              <Form.Item label="Show Animations" name="showAnimations" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <SafetyOutlined />
                Security
              </span>
            }
            key="security"
          >
            <div className="space-y-6">
              <Form.Item label="Two-Factor Authentication" name="twoFactorAuth" valuePropName="checked">
                <Switch />
              </Form.Item>
              
              <Form.Item label="Session Timeout (minutes)" name="sessionTimeout">
                <Select>
                  <Option value={15}>15 minutes</Option>
                  <Option value={30}>30 minutes</Option>
                  <Option value={60}>1 hour</Option>
                  <Option value={0}>Never</Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="Data Export" name="allowDataExport" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>
          </TabPane>
        </Tabs>
      </Form>
    </Modal>
  );
};

export default SettingsModal; 