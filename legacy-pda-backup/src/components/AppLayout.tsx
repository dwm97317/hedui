import React, { useState, useEffect } from 'react';
import { Layout, Typography, Tooltip, Avatar } from 'antd';
import {
    DashboardOutlined,
    BarcodeOutlined,
    HistoryOutlined,
    SettingOutlined,
    UserOutlined,
    LogoutOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Header, Content } = Layout;

interface AppLayoutProps {
    children: React.ReactNode;
    activeTitle?: string;
}

export default function AppLayout({ children, activeTitle }: AppLayoutProps) {
    const { t } = useTranslation();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Desktop View
    if (!isMobile) {
        return (
            <div className="app-layout-main" style={{ background: 'var(--bg-app)' }}>
                {/* Fixed Sidebar - High Contrast Deep Navy */}
                <aside className="desktop-sidebar" style={{ background: 'var(--bg-sidebar)', width: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'white',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <BarcodeOutlined style={{ color: 'var(--bg-sidebar)', fontSize: '22px' }} />
                        </div>
                        <Typography.Title level={4} style={{ margin: 0, color: 'var(--text-on-dark)', fontWeight: 800 }}>
                            {t('common.app_title')}
                        </Typography.Title>
                    </div>

                    <nav style={{ flex: 1 }}>
                        <SidebarItem icon={<DashboardOutlined />} label={t('nav.home') || '首页'} active />
                        <SidebarItem icon={<BarcodeOutlined />} label={t('nav.scan') || '智能扫描'} />
                        <SidebarItem icon={<HistoryOutlined />} label={t('nav.history') || '数据历史'} />
                        <SidebarItem icon={<SettingOutlined />} label={t('nav.settings') || '系统设置'} />
                    </nav>

                    <div style={{ padding: '20px 8px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Avatar icon={<UserOutlined />} style={{ backgroundColor: 'var(--primary)' }} />
                            <div>
                                <div style={{ color: 'var(--text-on-dark)', fontSize: '13px', fontWeight: 600 }}>Operator</div>
                                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>Standard Role</div>
                            </div>
                        </div>
                        <Tooltip title="Logout">
                            <LogoutOutlined style={{ color: 'var(--text-on-dark)', cursor: 'pointer', opacity: 0.7 }} />
                        </Tooltip>
                    </div>
                </aside>

                <main style={{ flex: 1, height: '100vh', overflowY: 'auto' }}>
                    <Header style={{
                        height: '72px',
                        background: 'white',
                        padding: '0 32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid var(--border-light)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                    }}>
                        <Typography.Title level={3} style={{ margin: 0, color: 'var(--text-main)', fontWeight: 700 }}>
                            {activeTitle || t('nav.home')}
                        </Typography.Title>
                    </Header>
                    <div style={{ padding: '32px' }}>
                        {children}
                    </div>
                </main>
            </div>
        );
    }

    // Mobile View (High Contrast)
    return (
        <Layout className="app-container" style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
            <Header style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                background: 'white',
                borderBottom: '1px solid var(--border-light)',
                height: '64px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        background: 'var(--primary)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <BarcodeOutlined style={{ color: 'white', fontSize: '18px' }} />
                    </div>
                    <Typography.Title level={4} style={{ margin: 0, color: 'var(--text-main)', fontWeight: 700 }}>
                        {activeTitle || t('common.app_title')}
                    </Typography.Title>
                </div>
                <UserOutlined style={{ color: 'var(--text-sub)', fontSize: '20px' }} />
            </Header>

            <Content style={{ padding: '16px', paddingBottom: '100px' }}>
                {children}
            </Content>

            <div style={{
                position: 'fixed',
                bottom: '0',
                left: '0',
                right: '0',
                height: '72px',
                background: 'white',
                borderTop: '2px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                zIndex: 1000,
            }}>
                <NavItem icon={<DashboardOutlined />} label={t('nav.home') || '首页'} active />
                <NavItem icon={<BarcodeOutlined />} label={t('nav.scan') || '扫描'} />
                <NavItem icon={<HistoryOutlined />} label={t('nav.history') || '历史'} />
                <NavItem icon={<SettingOutlined />} label={t('nav.settings') || '设置'} />
            </div>
        </Layout>
    );
}

function SidebarItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
    return (
        <div className={`sidebar-nav-item ${active ? 'active' : ''}`} style={{
            color: active ? 'white' : 'rgba(255,255,255,0.7)',
            background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
            fontWeight: active ? 600 : 400
        }}>
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <span>{label}</span>
        </div>
    );
}

function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: active ? 'var(--primary)' : 'var(--text-sub)',
            cursor: 'pointer'
        }}>
            <div style={{ fontSize: '22px' }}>{icon}</div>
            <span style={{ fontSize: '12px', fontWeight: active ? 700 : 500 }}>{label}</span>
        </div>
    );
}
