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
            <div className="app-layout-main">
                {/* Fixed Sidebar */}
                <aside className="desktop-sidebar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
                        }}>
                            <BarcodeOutlined style={{ color: 'white', fontSize: '22px' }} />
                        </div>
                        <Typography.Title level={4} style={{ margin: 0, color: 'white', letterSpacing: '-0.5px' }}>
                            {t('common.app_title')}
                        </Typography.Title>
                    </div>

                    <nav style={{ flex: 1 }}>
                        <SidebarItem icon={<DashboardOutlined />} label={t('nav.home') || '首页'} active />
                        <SidebarItem icon={<BarcodeOutlined />} label={t('nav.scan') || '智能扫描'} />
                        <SidebarItem icon={<HistoryOutlined />} label={t('nav.history') || '数据历史'} />
                        <SidebarItem icon={<SettingOutlined />} label={t('nav.settings') || '系统设置'} />
                    </nav>

                    <div style={{ padding: '20px 8px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Avatar icon={<UserOutlined />} style={{ backgroundColor: 'var(--primary)' }} />
                            <div>
                                <div style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>Operator</div>
                                <div style={{ color: 'var(--text-sub)', fontSize: '11px' }}>Standard Role</div>
                            </div>
                        </div>
                        <Tooltip title="Logout">
                            <LogoutOutlined style={{ color: 'var(--text-sub)', cursor: 'pointer' }} />
                        </Tooltip>
                    </div>
                </aside>

                <main style={{ flex: 1, height: '100vh', overflowY: 'auto', background: 'var(--bg-oled)' }}>
                    <Header style={{
                        height: '72px',
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(10px)',
                        padding: '0 32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                    }}>
                        <Typography.Title level={3} style={{ margin: 0, color: 'white', fontSize: '20px' }}>
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

    // Mobile View (Existing)
    return (
        <Layout className="app-container" style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
            <Header style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                height: '60px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
                    }}>
                        <BarcodeOutlined style={{ color: 'white', fontSize: '18px' }} />
                    </div>
                    <Typography.Title level={4} style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 700 }}>
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
                bottom: '20px',
                left: '20px',
                right: '20px',
                height: '64px',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                zIndex: 1000,
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
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
        <div className={`sidebar-nav-item ${active ? 'active' : ''}`}>
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
            transition: 'all 0.3s',
            cursor: 'pointer'
        }}>
            <div style={{
                fontSize: '20px',
                filter: active ? 'drop-shadow(0 0 8px var(--primary))' : 'none',
                transform: active ? 'scale(1.1)' : 'scale(1)'
            }}>
                {icon}
            </div>
            <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400 }}>{label}</span>
        </div>
    );
}
