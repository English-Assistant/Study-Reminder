import {
  createFileRoute,
  Outlet,
  Link as RouterLink,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { Layout, Menu, Avatar, Typography, Space, theme, Dropdown } from 'antd';
import type { MenuProps } from 'antd';

// Import downloaded icons. Ensure paths are correct relative to this file or use path aliases.
// These are illustrative paths, adjust if your alias or structure is different.
import AboutPageLogo from '@/assets/icons/about-page-logo.svg?react';
import SidebarDashboardIcon from '@/assets/icons/sidebar-dashboard-icon.svg?react';
import SidebarCalendarIcon from '@/assets/icons/sidebar-calendar-icon.svg?react';
import SidebarSettingsIcon from '@/assets/icons/sidebar-settings-icon.svg?react';
import SidebarInfoIcon from '@/assets/icons/sidebar-info-icon.svg?react';
import { useUserStore } from '@/stores/user.store';
import { useSocket } from '@/hooks/useSocket';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const HEADER_HEIGHT = 64; // Assuming default AntD Header height
const SIDER_WIDTH = 256; // As specified in current Sider props

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const menuItems: MenuItem[] = [
  getItem(
    <RouterLink to="/dashboard">仪表盘</RouterLink>,
    '/dashboard',
    <SidebarDashboardIcon />,
  ),
  getItem(
    <RouterLink to="/study-records">添加复习计划</RouterLink>,
    '/study-records',
    <SidebarCalendarIcon />,
  ),
  getItem(
    <RouterLink to="/courses">课程管理</RouterLink>,
    '/courses',
    <SidebarSettingsIcon />,
  ),
  getItem(
    <RouterLink to="/set-up">设置</RouterLink>,
    '/set-up',
    <SidebarSettingsIcon />,
  ),
  getItem(
    <RouterLink to="/about">关于</RouterLink>,
    '/about',
    <SidebarInfoIcon />,
  ),
];

export const Route = createFileRoute('/_core')({
  component: CoreLayoutComponent,
});

function CoreLayoutComponent() {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.actions.logout);
  const navigate = useNavigate();

  // WebSocket连接和通知管理（静默运行）
  useSocket();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #EBEBEA',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 101,
          height: `${HEADER_HEIGHT}px`,
        }}
      >
        <Space size="middle">
          <AboutPageLogo style={{ height: '37px', width: '43px' }} />
          <Title level={4} style={{ margin: 0, color: '#242524' }}>
            Study Reminder
          </Title>
        </Space>

        <Space size="middle">
          <Dropdown
            menu={{
              items: [
                {
                  label: '退出登录',
                  key: 'logout',
                  onClick: () => {
                    logout();
                    navigate({ to: '/login' });
                  },
                },
              ],
            }}
          >
            <Avatar className="cursor-pointer" size={32}>
              {user?.username.slice(0, 1)}
            </Avatar>
          </Dropdown>
        </Space>
      </Header>
      <Layout
        style={{
          paddingTop: `${HEADER_HEIGHT}px`,
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <Sider
          width={SIDER_WIDTH}
          style={{
            background: colorBgContainer,
            borderRight: '1px solid #EBEBEA',
            position: 'fixed',
            left: 0,
            top: `${HEADER_HEIGHT}px`,
            height: `calc(100vh - ${HEADER_HEIGHT}px)`,
            overflowY: 'auto',
            zIndex: 100,
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[currentPath]}
            style={{ height: '100%', borderRight: 0, paddingTop: '8px' }}
            items={menuItems}
          />
        </Sider>
        <Layout
          style={{
            marginLeft: `${SIDER_WIDTH}px`,
            width: `calc(100% - ${SIDER_WIDTH}px)`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Content
            style={{
              padding: 24,
              margin: 0,
              background: `#FAFAFA`,
              overflowY: 'auto',
              flexGrow: 1,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
