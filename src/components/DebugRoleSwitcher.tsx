import { Button, message, Space, Typography, Tag } from 'antd';
import { supabase } from '../lib/supabase';
import { UserSwitchOutlined } from '@ant-design/icons';

interface DebugRoleSwitcherProps {
    currentUserId: string;
    activeBatchId: string | null;
}

export default function DebugRoleSwitcher({ currentUserId, activeBatchId }: DebugRoleSwitcherProps) {
    const roles = [
        { id: 'U_TEST_SENDER', role: 'sender', label: '测发', color: 'blue' },
        { id: 'U_TEST_TRANSIT', role: 'transit', label: '测中', color: 'orange' },
        { id: 'U_TEST_RECEIVER', role: 'receiver', label: '测收', color: 'green' },
    ];

    const switchUser = async (targetUser: any) => {
        // 1. Auto-Grant Permission for Active Batch
        if (activeBatchId) {
            const { error } = await supabase.from('batch_user_roles').upsert({
                batch_id: activeBatchId,
                user_id: targetUser.id,
                role: targetUser.role,
                is_active: true,
                assigned_by: 'system_debug',
                assigned_at: new Date().toISOString()
            }, { onConflict: 'batch_id,user_id,role' });

            if (error) {
                console.warn('Auto-grant permission failed (might be acceptable if role exists):', error);
                // Continue properly anyway
            } else {
                message.success(`Granted ${targetUser.role} access to batch`);
            }
        }

        // 2. Switch
        localStorage.setItem('mock_user_id', targetUser.id);
        window.location.reload();
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.85)',
            padding: '12px',
            borderRadius: '8px',
            zIndex: 9999,
            border: '1px solid var(--primary)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary)', marginBottom: '5px' }}>
                <UserSwitchOutlined />
                <Typography.Text style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>Test Roles</Typography.Text>
            </div>
            <Space direction="vertical" size="small">
                {roles.map(r => (
                    <Button
                        key={r.id}
                        size="small"
                        type={currentUserId === r.id ? 'primary' : 'default'}
                        onClick={() => switchUser(r)}
                        style={{
                            fontSize: '12px',
                            width: '100%',
                            textAlign: 'left',
                            background: currentUserId === r.id ? undefined : 'rgba(255,255,255,0.1)',
                            color: currentUserId === r.id ? 'white' : 'rgba(255,255,255,0.8)',
                            border: 'none'
                        }}
                    >
                        <Tag color={r.color} style={{ marginRight: '5px', fontSize: '10px', lineHeight: '18px' }}>{r.label}</Tag>
                        {r.role}
                    </Button>
                ))}
            </Space>
        </div>
    );
}
