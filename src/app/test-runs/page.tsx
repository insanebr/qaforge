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
  Progress,
  Popconfirm,
  message,
  Tooltip,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  PlaySquareOutlined,
  CheckCircleOutlined,
  BranchesOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  CheckOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import {
  getTestRuns,
  createTestRun,
  updateTestRunStatus,
  deleteTestRun,
  type TestRunSummary,
} from '@/services/testRuns';
import RunStatusTag from '@/components/testRuns/RunStatusTag';
import CreateRunModal from '@/components/testRuns/CreateRunModal';
import { useAuth } from '@/context/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function TestRunsPage() {
  const [runs, setRuns] = useState<TestRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const { profile } = useAuth();
  const isViewer = profile?.role === 'viewer';

  const loadRuns = async () => {
    setLoading(true);
    try {
      const data = await getTestRuns();
      setRuns(data);
    } catch {
      message.error('Erro ao carregar ciclos de teste');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleCreateRun = async (values: {
    title: string;
    qa_branch_id?: string | null;
    selectedTestCaseIds: string[];
  }) => {
    setSubmitting(true);
    try {
      const created = await createTestRun(values);
      message.success('Ciclo de teste iniciado!');
      setModalOpen(false);
      router.push(`/test-runs/${created.id}`);
    } catch {
      message.error('Erro ao criar ciclo de teste');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (run: TestRunSummary) => {
    const nextStatus = run.status === 'open' ? 'closed' : 'open';
    try {
      await updateTestRunStatus(run.id, nextStatus);
      message.success(
        nextStatus === 'closed'
          ? 'Ciclo marcado como concluído!'
          : 'Ciclo reaberto para execução!'
      );
      loadRuns();
    } catch {
      message.error('Erro ao atualizar status do ciclo');
    }
  };

  const handleDeleteRun = async (id: string) => {
    try {
      await deleteTestRun(id);
      message.success('Ciclo de teste excluído');
      loadRuns();
    } catch {
      message.error('Erro ao excluir ciclo');
    }
  };

  const filteredRuns = useMemo(() => {
    return runs.filter((r) => {
      const matchesSearch =
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.branch_name && r.branch_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [runs, searchTerm, statusFilter]);

  // Top Metrics
  const totalRuns = runs.length;
  const openRuns = runs.filter((r) => r.status === 'open').length;
  const closedRuns = runs.filter((r) => r.status === 'closed').length;
  const totalExecutedTests = runs.reduce(
    (acc, curr) => acc + (curr.done_count + curr.failed_count),
    0
  );

  const columns: ColumnsType<TestRunSummary> = [
    {
      title: 'Ciclo de Teste',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (title: string, record) => (
        <div>
          <div
            style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#1677ff' }}
            onClick={() => router.push(`/test-runs/${record.id}`)}
          >
            {title}
          </div>
          {record.branch_name && (
            <Tag icon={<BranchesOutlined />} color="blue" style={{ marginTop: 4 }}>
              {record.branch_name}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      align: 'center',
      render: (status) => <RunStatusTag status={status} />,
      filters: [
        { text: 'Em Execução', value: 'open' },
        { text: 'Concluído', value: 'closed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Progresso da Execução',
      key: 'progress',
      width: 260,
      render: (_, record) => {
        const total = record.total_items;
        if (total === 0) return <Text type="secondary">Nenhum teste</Text>;

        const percent = Math.round(((record.done_count + record.failed_count) / total) * 100);

        return (
          <div>
            <Progress
              percent={percent}
              size="small"
              status={record.status === 'closed' ? 'success' : 'active'}
              strokeColor={{
                '0%': '#1677ff',
                '100%': '#52c41a',
              }}
            />
            <div
              style={{
                display: 'flex',
                gap: 8,
                fontSize: 12,
                marginTop: 2,
                color: '#8c8c8c',
              }}
            >
              <span style={{ color: '#52c41a' }}>✓ {record.done_count}</span>
              <span style={{ color: '#ff4d4f' }}>✕ {record.failed_count}</span>
              <span style={{ color: '#fa8c16' }}>⟳ {record.testing_count}</span>
              <span>⋯ {record.to_test_count}</span>
              <span style={{ marginLeft: 'auto' }}>Total: {total}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Criado em',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 180,
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<ArrowRightOutlined />}
            onClick={() => router.push(`/test-runs/${record.id}`)}
          >
            Executar
          </Button>

          {!isViewer && (
            <>
              <Tooltip title={record.status === 'open' ? 'Concluir ciclo' : 'Reabrir ciclo'}>
                <Button
                  size="small"
                  icon={record.status === 'open' ? <CheckOutlined /> : <UndoOutlined />}
                  onClick={() => handleToggleStatus(record)}
                />
              </Tooltip>

              <Popconfirm
                title="Excluir ciclo de teste?"
                description="Todo o histórico de execução deste ciclo será removido."
                onConfirm={() => handleDeleteRun(record.id)}
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
            Ciclos de Execução (Test Runs)
          </Title>
          <Text type="secondary">
            Execução de testes manuais, registro isolado de histórico e vínculo com branches
          </Text>
        </div>

        <Space size="middle">
          <Input
            placeholder="Buscar ciclo ou branch..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            style={{ width: 240 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
            options={[
              { value: 'all', label: 'Todos Status' },
              { value: 'open', label: 'Em Execução' },
              { value: 'closed', label: 'Concluídos' },
            ]}
          />
          {!isViewer && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              Novo Ciclo (Run)
            </Button>
          )}
        </Space>
      </div>

      {/* Top Metrics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Total de Ciclos"
              value={totalRuns}
              prefix={<PlaySquareOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Ciclos Em Execução"
              value={openRuns}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Ciclos Concluídos"
              value={closedRuns}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Testes Executados"
              value={totalExecutedTests}
              prefix={<CheckOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredRuns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{
            emptyText: (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <PlaySquareOutlined style={{ fontSize: 42, color: '#1677ff', marginBottom: 12 }} />
                <div>
                  <Text strong>Nenhum ciclo de teste encontrado</Text>
                </div>
                {!isViewer && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    style={{ marginTop: 12 }}
                    onClick={() => setModalOpen(true)}
                  >
                    Iniciar Primeiro Ciclo
                  </Button>
                )}
              </div>
            ),
          }}
        />
      </Card>

      <CreateRunModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleCreateRun}
        loading={submitting}
      />
    </AppLayout>
  );
}
