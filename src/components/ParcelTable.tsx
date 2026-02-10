import { useState, useEffect } from 'react';
import { Table, Tag, Typography, Button, Space, Modal, Input, message, Tooltip, Popover, List, Divider, Row, Col } from 'antd';
import { RetweetOutlined, InfoCircleOutlined, StarOutlined, StarFilled, HistoryOutlined, SearchOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { Parcel, Role } from '../types';
import { useTranslation } from 'react-i18next';

interface ParcelTableProps {
    role: Role;
    activeBarcode: string | null;
    activeBatchId: string;
    readOnly?: boolean;
    refreshTrigger?: number;
}

export default function ParcelTable({ role, activeBarcode, activeBatchId, readOnly, refreshTrigger }: ParcelTableProps) {
    const { t } = useTranslation();
    const [data, setData] = useState<Parcel[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [relations, setRelations] = useState<any[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState<Parcel[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [currentUserId] = useState(() => localStorage.getItem('mock_user_id') || 'U001');

    const fetchFavorites = async () => {
        const { scanEngine } = await import('../services/scanEngine');
        const favs = await scanEngine.getFavorites(currentUserId);
        setFavorites(favs);
    };

    const fetchHistory = async () => {
        const { scanEngine } = await import('../services/scanEngine');
        const history = await scanEngine.getRecentSearches(currentUserId);
        setSearchHistory(history);
    };

    const fetchRelations = async () => {
        const { data: rels } = await supabase.from('package_relations').select('parent_id, child_id, parent:parcels!parent_id(*)');
        if (rels) setRelations(rels);
    };

    const fetchData = async () => {
        if (!activeBatchId) return;
        setLoading(true);
        const { data: parcels, error } = await supabase.from('parcels').select('*, batches(batch_number)').eq('batch_id', activeBatchId).order('updated_at', { ascending: false });
        if (!error && parcels) setData(parcels);
        fetchRelations(); fetchFavorites(); fetchHistory();
        setLoading(false);
    };

    useEffect(() => {
        if (!activeBatchId) return;
        fetchData();
        const channel = supabase.channel('table-sync-' + activeBatchId).on('postgres_changes', { event: '*', schema: 'public', table: 'parcels', filter: `batch_id=eq.${activeBatchId}` }, () => fetchData()).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [activeBatchId, refreshTrigger]);

    const handleSearch = async (val: string) => {
        setSearchKeyword(val);
        if (!val || val.length < 3) { setSearchResults([]); setIsSearching(false); return; }
        setIsSearching(true);
        const { scanEngine } = await import('../services/scanEngine');
        const results = await scanEngine.fuzzySearch(val, activeBatchId);
        setSearchResults(results);
        if (results.length > 0) { await scanEngine.saveSearch(currentUserId, val); fetchHistory(); }
    };

    const toggleFavorite = async (parcelId: string) => {
        const { scanEngine } = await import('../services/scanEngine');
        const isFav = await scanEngine.toggleFavorite(currentUserId, parcelId);
        if (isFav) setFavorites([...favorites, parcelId]);
        else setFavorites(favorites.filter(id => id !== parcelId));
    };

    const getWeightColor = (v: any, otherV: any, active: boolean) => {
        if (active) return 'var(--primary)';
        if (v && otherV && Math.abs(parseFloat(v) - parseFloat(otherV)) > 0.1) return '#ef4444'; // High contrast red
        return 'var(--text-main)';
    };

    const columns = [
        {
            title: '',
            key: 'favorite',
            width: 50,
            render: (_: any, record: Parcel) => (
                <Button
                    type="text"
                    icon={favorites.includes(record.id) ? <StarFilled style={{ color: '#eab308' }} /> : <StarOutlined style={{ color: '#cbd5e1' }} />}
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(record.id); }}
                />
            )
        },
        {
            title: t('parcel.barcode'),
            dataIndex: 'barcode',
            key: 'barcode',
            render: (text: string, record: Parcel) => (
                <Space>
                    <Typography.Text style={{ color: record.id === activeBarcode ? 'var(--primary)' : 'var(--text-main)', fontWeight: 800, fontSize: '15px' }}>{text}</Typography.Text>
                    {record.package_type === 'derived' && <Tag color="blue" bordered={false} style={{ fontWeight: 700 }}>{t('parcel.derived_tag')}</Tag>}
                </Space>
            )
        },
        {
            title: `${t('parcel.sender_weight')}(kg)`,
            dataIndex: 'sender_weight',
            key: 'sender_weight',
            render: (v: any, record: Parcel) => (
                <Typography.Text style={{ fontWeight: 700, fontSize: '15px', color: getWeightColor(v, record.receiver_weight, role === 'sender') }}>
                    {v || '-'}
                </Typography.Text>
            )
        },
        {
            title: `${t('parcel.receiver_weight')}(kg)`,
            dataIndex: 'receiver_weight',
            key: 'receiver_weight',
            render: (v: any, record: Parcel) => (
                <Typography.Text style={{ fontWeight: 700, fontSize: '15px', color: getWeightColor(v, record.sender_weight, role === 'receiver') }}>
                    {v || '-'}
                </Typography.Text>
            )
        },
        {
            title: t('parcel.status'),
            dataIndex: 'status',
            key: 'status',
            responsive: ['sm'] as any,
            render: (s: string) => {
                const colors: any = { relabeled: 'purple', received: 'green', anomaly: 'red', in_transit: 'orange' };
                return <Tag color={colors[s] || 'blue'} style={{ fontWeight: 700, textTransform: 'uppercase', minWidth: '80px', textAlign: 'center' }}>{s}</Tag>;
            }
        },
        {
            title: t('parcel.dims'),
            key: 'dims',
            responsive: ['md'] as any,
            render: (_: any, record: Parcel) => (
                <Typography.Text style={{ fontWeight: 600, color: 'var(--text-sub)' }}>
                    {record.length_cm || '-'}/{record.width_cm || '-'}/{record.height_cm || '-'}
                </Typography.Text>
            )
        }
    ];

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Row justify="space-between" align="middle" gutter={16}>
                <Col flex="1">
                    <Input
                        placeholder={t('parcel.search_placeholder') || '搜索单号...'}
                        prefix={<SearchOutlined style={{ color: 'var(--text-sub)' }} />}
                        size="large"
                        value={searchKeyword}
                        onChange={e => handleSearch(e.target.value)}
                        style={{ borderRadius: '10px', maxWidth: '500px', border: '2px solid var(--border-light)' }}
                    />
                </Col>
                <Col>
                    {role === 'transit' && (
                        <Button
                            type="primary"
                            size="large"
                            icon={<RetweetOutlined />}
                            disabled={selectedRowKeys.length === 0 || readOnly}
                            style={{ borderRadius: '10px', fontWeight: 700 }}
                        >
                            {t('parcel.consolidate_button')} ({selectedRowKeys.length})
                        </Button>
                    )}
                </Col>
            </Row>

            <Table
                loading={loading || isSearching}
                dataSource={searchKeyword.length >= 3 ? searchResults : data}
                columns={columns}
                rowKey="id"
                className="pro-table"
                rowSelection={role === 'transit' ? { selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) } : undefined}
                pagination={{ pageSize: 15 }}
                style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-light)' }}
            />
        </Space>
    );
}
