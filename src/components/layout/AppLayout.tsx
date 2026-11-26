'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, Tag, Space, Dropdown, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  FolderOpenOutlined,
  PlayCircleOutlined,
  BranchesOutlined,
  UserOutlined,
  LogoutOutlined,
  BulbOutlined,
  BulbFilled,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { mode, toggleTheme } = useTheme();
  const { user, profile, signOut } = useAuth();

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/features',
      icon: <FolderOpenOutlined />,
      label: 'Features & Casos',
    },
    {
      key: '/test-runs',
      icon: <PlayCircleOutlined />,
      label: 'Execuções (Runs)',
    },
    {
      key: '/branches',
      icon: <BranchesOutlined />,
      label: 'Qualidade de Branches',
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    router.push(e.key);
  };

  const roleColorMap: Record<string, string> = {
    admin: 'red',
    qa: 'blue',
    viewer: 'green',
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'email',
      disabled: true,
      label: <Text type="secondary">{user?.email}</Text>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sair',
      danger: true,
      onClick: signOut,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        collapsedWidth={70}
        style={{
          borderRight: mode === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            gap: 10,
            borderBottom: mode === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: '#1677ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 16,
            }}
          >
            TM
          </div>
          {!collapsed && (
            <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: 0.5 }}>
              TestManager
            </span>
          )}
        </div>

        <Menu
          theme={mode}
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: mode === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 40, height: 40 }}
          />

          <Space size="middle">
            <Button
              type="text"
              icon={mode === 'dark' ? <BulbFilled style={{ color: '#faad14' }} /> : <BulbOutlined />}
              onClick={toggleTheme}
              title={mode === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            />

            {profile && (
              <Tag color={roleColorMap[profile.role] || 'blue'} style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                {profile.role}
              </Tag>
            )}

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="default" icon={<UserOutlined />}>
                {profile?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Usuário'}
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: '20px 24px',
            padding: 24,
            minHeight: 280,
            background: mode === 'dark' ? '#141414' : '#ffffff',
            borderRadius: 8,
            border: mode === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
