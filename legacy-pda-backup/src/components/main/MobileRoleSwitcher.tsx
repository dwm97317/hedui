
import { Button, Divider, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { Role } from '../../types';

interface MobileRoleSwitcherProps {
    role: Role;
    setRole: (role: Role) => void;
    batchNumber: string;
}

export default function MobileRoleSwitcher({ role, setRole, batchNumber }: MobileRoleSwitcherProps) {
    const { t } = useTranslation();

    return (
        <div className="glass-card">
            <div style={{ marginBottom: '16px' }}>
                <Typography.Text type="secondary" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                    {t('common.app_title')}
                </Typography.Text>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>{batchNumber}</div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '8px', fontWeight: 600 }}>
                {t('common.current_role')}
            </div>
            <Button.Group style={{ width: '100%' }}>
                {(['sender', 'transit', 'receiver'] as Role[]).map(r => (
                    <Button
                        key={r}
                        type={role === r ? 'primary' : 'default'}
                        onClick={() => setRole(r)}
                        style={{ flex: 1, height: '48px', fontWeight: 700 }}
                    >
                        {t(`roles.${r}`)}
                    </Button>
                ))}
            </Button.Group>
        </div>
    );
}
