
import { Modal, Form, Select, message } from 'antd';
import { supabase } from '../../lib/supabase';
import { Batch, User } from '../../types';

interface AssignRoleModalProps {
    open: boolean;
    batch: Batch | null;
    currentUser: User | null;
    users: User[];
    onCancel: () => void;
    onSuccess: () => void;
}

export default function AssignRoleModal({ open, batch, currentUser, users, onCancel, onSuccess }: AssignRoleModalProps) {
    const [form] = Form.useForm();

    const handleAssignRole = async (values: any) => {
        if (!batch) return;

        // Deactivate existing active role for this batch/role combo first
        await supabase
            .from('batch_user_roles')
            .update({ is_active: false, revoked_at: new Date().toISOString() })
            .eq('batch_id', batch.id)
            .eq('role', values.role)
            .eq('is_active', true);

        // Insert new active record
        const { error } = await supabase.from('batch_user_roles').insert({
            batch_id: batch.id,
            user_id: values.user_id,
            role: values.role,
            assigned_by: currentUser?.id
        });

        if (error) {
            message.error(error.message);
        } else {
            message.success('权限分配成功');
            onSuccess();
        }
    };

    return (
        <Modal title={`分配权限: ${batch?.batch_number}`} open={open} onCancel={onCancel} onOk={form.submit}>
            <Form form={form} onFinish={handleAssignRole} layout="vertical">
                <Form.Item name="role" label="负责环节" rules={[{ required: true }]}>
                    <Select>
                        <Select.Option value="sender">发出方 (Sender)</Select.Option>
                        <Select.Option value="transit">中转方 (Transit)</Select.Option>
                        <Select.Option value="receiver">接收方 (Receiver)</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item name="user_id" label="指派人员" rules={[{ required: true }]}>
                    <Select showSearch optionFilterProp="children">
                        {users.map(u => (
                            <Select.Option key={u.id} value={u.id}>{u.nickname} ({u.id})</Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
}
