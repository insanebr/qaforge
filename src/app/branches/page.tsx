'use client';

import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  Typography,
  Button,
  Space,
  Table,
  Input,
  Select,
  Row,
  Col,
  Card,
  Statistic,
  Popconfirm,
  message,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BugOutlined,
} from '@ant-design/icons';
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from '@/services/branches';
import type { QaBranch, BranchStatus } from '@/types/database';
import BranchStatusTag from '@/components/branches/BranchStatusTag';
import BranchDrawer from '@/components/branches/BranchDrawer';
import { useAuth } from '@/context/AuthContext';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function BranchesPage() {
  const [branches, setBranches] = useState<QaBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<QaBranch | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { profile } = useAuth();
  const isViewer = profile?.role === 'viewer';

  const loadBranches = async () => {
    setLoading(true);
    try {
      const data = await getBranches();
      setBranches(data);
    } catch {
      message.error('Erro ao carregar lista de branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (branch: QaBranch) => {
    setEditingBranch(branch);
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBranch(id);
      message.success('Branch excluída com sucesso');
      loadBranches();
    } catch {
      message.error('Erro ao excluir branch');
    }
  };

  const handleFormSubmit = async (values: {
    name: string;
    review_date: string;
    rejection_count: number;
    rejected_cards_count: number;
    bugs_created_count: number;
    status: BranchStatus;
    reason?: string;
  }) => {
    setSubmitting(true);
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, values);
        message.success('Métricas da branch atualizadas!');
      } else {
        await createBranch(values);
        message.success('Branch registrada com sucesso!');
      }
      setDrawerOpen(false);
      loadBranches();
    } catch {
      message.error('Erro ao salvar métricas da branch');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.reason && b.reason.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [branches, searchTerm, statusFilter]);

  // Metrics overview calculations
  const totalBranches = branches.length;
  const approvedCount = branches.filter((b) => b.status === 'approved').length;
  const rejectedCount = branches.filter((b) => b.status === 'rejected').length;
  const approvalRate = totalBranches > 0 ? Math.round((approvedCount / totalBranches) * 100) : 0;
  const totalBugs = branches.reduce((acc, curr) => acc + (curr.bugs_created_count || 0), 0);

  const columns: ColumnsType<QaBranch> = [
    {
      title: 'Branch',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            <BranchesOutlined style={{ marginRight: 6, color: '#1677ff' }} />
            {name}
          </div>
          {record.reason && (
            <Paragraph
              type="secondary"
              ellipsis={{ rows: 1 }}
              style={{ margin: '2px 0 0 0', fontSize: 12 }}
            >
              {record.reason}
            </Paragraph>
          )}
        </div>
      ),
    },
    {
      title: 'Data Revisão',
      dataIndex: 'review_date',
      key: 'review_date',
      width: 130,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => new Date(a.review_date).getTime() - new Date(b.review_date).getTime(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      align: 'center',
      render: (status: BranchStatus) => <BranchStatusTag status={status} />,
      filters: [
        { text: 'Em Teste', value: 'testing' },
        { text: 'Aprovada', value: 'approved' },
        { text: 'Reprovada', value: 'rejected' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Reprovações',
      dataIndex: 'rejection_count',
      key: 'rejection_count',
      width: 120,
      align: 'center',
      sorter: (a, b) => a.rejection_count - b.rejection_count,
      render: (count: number) => (
        <span style={{ fontWeight: count > 0 ? 600 : 400, color: count > 0 ? '#ff4d4f' : undefined }}>
          {count}
        </span>
      ),
    },
    {
      title: 'Cards Reprovados',
      dataIndex: 'rejected_cards_count',
      key: 'rejected_cards_count',
      width: 140,
      align: 'center',
      sorter: (a, b) => a.rejected_cards_count - b.rejected_cards_count,
      render: (count: number) => (
        <span style={{ fontWeight: count > 0 ? 600 : 400, color: count > 0 ? '#fa8c16' : undefined }}>
          {count}
        </span>
      ),
    },
    {
      title: 'Bugs Criados',
      dataIndex: 'bugs_created_count',
      key: 'bugs_created_count',
      width: 120,
      align: 'center',
      sorter: (a, b) => a.bugs_created_count - b.bugs_created_count,
      render: (count: number) => (
        <span style={{ fontWeight: count > 0 ? 600 : 400, color: count > 0 ? '#cf1322' : undefined }}>
          {count}
        </span>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 110,
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          {!isViewer && (
            <>
              <Tooltip title="Editar métricas">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleOpenEdit(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Excluir registro de branch?"
                description="Essa ação removerá os dados do histórico de qualidade."
                onConfirm={() => handleDelete(record.id)}
                okText="Excluir"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Excluir">
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AppLayout>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Controle de Qualidade de Branches
          </Title>
          <Text type="secondary">
            Rastreamento de reprovações, cards com retrabalho e bugs por entrega
          </Text>
        </div>

        <Space size="middle">
          <Input
            placeholder="Buscar branch ou motivo..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            style={{ width: 260 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
            options={[
              { value: 'all', label: 'Todos Status' },
              { value: 'testing', label: 'Em Teste' },
              { value: 'approved', label: 'Aprovadas' },
              { value: 'rejected', label: 'Reprovadas' },
            ]}
          />
          {!isViewer && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreate}
            >
              Registrar Branch
            </Button>
          )}
        </Space>
      </div>

      {/* Top Metrics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Branches Registradas"
              value={totalBranches}
              prefix={<BranchesOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Taxa de Aprovação"
              value={approvalRate}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Branches Reprovadas"
              value={rejectedCount}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Total de Bugs Criados"
              value={totalBugs}
              prefix={<BugOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredBranches}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{
            emptyText: (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <BranchesOutlined style={{ fontSize: 42, color: '#1677ff', marginBottom: 12 }} />
                <div>
                  <Text strong>Nenhuma branch registrada ainda</Text>
                </div>
                {!isViewer && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    style={{ marginTop: 12 }}
                    onClick={handleOpenCreate}
                  >
                    Registrar Primeira Branch
                  </Button>
                )}
              </div>
            ),
          }}
        />
      </Card>

      <BranchDrawer
        open={drawerOpen}
        branch={editingBranch}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleFormSubmit}
        loading={submitting}
      />
    </AppLayout>
  );
}
