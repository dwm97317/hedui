
import { Modal, Form, Input, Select, message } from 'antd';
import { supabase } from '../../lib/supabase';

interface CreateUserModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function CreateUserModal({ open, onCancel, onSuccess }: CreateUserModalProps) {
    const [form] = Form.useForm();

    const handleCreateUser = async (values: any) => {
        const { error } = await supabase.from('users').insert({
            id: values.id,
            nickname: values.nickname,
            system_role: values.system_role
        });
        if (error) {
            message.error(error.message);
        } else {
            message.success('用户创建成功');
            onSuccess();
        }
    };

    return (
        <Modal title="新增人员" open={open} onCancel={onCancel} onOk={form.submit}>
            <Form form={form} onFinish={handleCreateUser} layout="vertical">
                <Form.Item name="id" label="LINE User ID" rules={[{ required: true }]}>
                    <Input placeholder="U123456..." />
                </Form.Item>
                <Form.Item name="nickname" label="昵称" rules={[{ required: true }]}>
                    <Input placeholder="张三" />
                </Form.Item>
                <Form.Item name="system_role" label="系统角色" initialValue="operator">
                    <Select>
                        <Select.Option value="operator">Operator (一线)</Select.Option>
                        <Select.Option value="admin">Admin (后台)</Select.Option>
                        <Select.Option value="auditor">Auditor (审计)</Select.Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
}
