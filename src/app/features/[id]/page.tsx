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
  Breadcrumb,
  Card,
  Popconfirm,
  message,
  Tooltip,
  Form,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  LinkOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import { getFeatureById, updateFeature } from '@/services/features';
import {
  getTestCasesByFeature,
  createTestCase,
  updateTestCase,
  deleteTestCase,
} from '@/services/testCases';
import type { Feature, TestCase, TestPriority } from '@/types/database';
import PriorityTag from '@/components/testCases/PriorityTag';
import TestCaseModal from '@/components/testCases/TestCaseModal';
import FeatureModal from '@/components/features/FeatureModal';
import { useAuth } from '@/context/AuthContext';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function FeatureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const featureId = params.id as string;
  const { profile } = useAuth();
  const isViewer = profile?.role === 'viewer';

  const [feature, setFeature] = useState<Feature | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Fast inline addition state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<TestPriority>('medium');
  const [quickAdding, setQuickAdding] = useState(false);

  // Modals state
  const [editingCase, setEditingCase] = useState<TestCase | null>(null);
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [caseSubmitting, setCaseSubmitting] = useState(false);

  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [featureSubmitting, setFeatureSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [feat, cases] = await Promise.all([
        getFeatureById(featureId),
        getTestCasesByFeature(featureId),
      ]);
      setFeature(feat);
      setTestCases(cases);
    } catch {
      message.error('Erro ao carregar dados da feature');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (featureId) {
      loadData();
    }
  }, [featureId]);

  // Quick inline add
  const handleQuickAdd = async () => {
    if (!quickTitle.trim()) {
      message.warning('Informe o título do caso de teste');
      return;
    }

    setQuickAdding(true);
    try {
      const created = await createTestCase({
        feature_id: featureId,
        title: quickTitle.trim(),
        priority: quickPriority,
      });
      setTestCases([created, ...testCases]);
      setQuickTitle('');
      message.success('Caso de teste adicionado!');
    } catch {
      message.error('Erro ao adicionar caso de teste');
    } finally {
      setQuickAdding(false);
    }
  };

  const handleDeleteCase = async (id: string) => {
    try {
      await deleteTestCase(id);
      setTestCases(testCases.filter((c) => c.id !== id));
      message.success('Caso de teste excluído');
    } catch {
      message.error('Erro ao excluir caso de teste');
    }
  };

  const handleCaseModalSubmit = async (values: { title: string; priority: TestPriority }) => {
    if (!editingCase) return;
    setCaseSubmitting(true);
    try {
      const updated = await updateTestCase(editingCase.id, values);
      setTestCases(testCases.map((c) => (c.id === updated.id ? updated : c)));
      setCaseModalOpen(false);
      message.success('Caso de teste atualizado');
    } catch {
      message.error('Erro ao atualizar caso de teste');
    } finally {
      setCaseSubmitting(false);
    }
  };

  const handleFeatureModalSubmit = async (values: {
    title: string;
    description?: string;
    doc_url?: string;
  }) => {
    if (!feature) return;
    setFeatureSubmitting(true);
    try {
      const updated = await updateFeature(feature.id, values);
      setFeature(updated);
      setFeatureModalOpen(false);
      message.success('Feature atualizada');
    } catch {
      message.error('Erro ao atualizar feature');
    } finally {
      setFeatureSubmitting(false);
    }
  };

  const filteredCases = useMemo(() => {
    return testCases.filter((c) => {
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [testCases, searchTerm, priorityFilter]);

  const priorityCounts = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    testCases.forEach((c) => {
      if (counts[c.priority] !== undefined) counts[c.priority]++;
    });
    return counts;
  }, [testCases]);

  const columns: ColumnsType<TestCase> = [
    {
      title: 'Caso de Teste (Molde)',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => <span style={{ fontWeight: 500 }}>{title}</span>,
    },
    {
      title: 'Prioridade',
      dataIndex: 'priority',
      key: 'priority',
      width: 130,
      align: 'center',
      render: (priority: TestPriority) => <PriorityTag priority={priority} />,
      filters: [
        { text: 'Baixa', value: 'low' },
        { text: 'Média', value: 'medium' },
        { text: 'Alta', value: 'high' },
        { text: 'Crítica', value: 'critical' },
      ],
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: 'Criado em',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          {!isViewer && (
            <>
              <Tooltip title="Editar">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingCase(record);
                    setCaseModalOpen(true);
                  }}
                />
              </Tooltip>
              <Popconfirm
                title="Excluir caso de teste?"
                description="O molde do teste será removido."
                onConfirm={() => handleDeleteCase(record.id)}
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
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          {
            title: (
              <span
                style={{ cursor: 'pointer', color: '#1677ff' }}
                onClick={() => router.push('/features')}
              >
                Features
              </span>
            ),
          },
          {
            title: feature?.title || 'Detalhes da Feature',
          },
        ]}
      />

      {/* Feature Header Card */}
      <Card bordered={false} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Space align="center">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/features')}
                style={{ marginRight: 8 }}
              />
              <Title level={3} style={{ margin: 0 }}>
                {feature?.title}
              </Title>
              {feature?.doc_url && (
                <a
                  href={feature.doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8 }}
                >
                  <LinkOutlined /> Documentação
                </a>
              )}
            </Space>

            {feature?.description && (
              <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, maxWidth: 800 }}>
                {feature.description}
              </Paragraph>
            )}
          </div>

          {!isViewer && feature && (
            <Button icon={<EditOutlined />} onClick={() => setFeatureModalOpen(true)}>
              Editar Feature
            </Button>
          )}
        </div>

        {/* Priority Pills */}
        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Tag color="default">Total: {testCases.length}</Tag>
          <Tag color="red">Crítica: {priorityCounts.critical}</Tag>
          <Tag color="orange">Alta: {priorityCounts.high}</Tag>
          <Tag color="blue">Média: {priorityCounts.medium}</Tag>
          <Tag color="green">Baixa: {priorityCounts.low}</Tag>
        </div>
      </Card>

      {/* Quick Add Inline Section */}
      {!isViewer && (
        <Card
          bordered={false}
          style={{ marginBottom: 20 }}
          bodyStyle={{ padding: '16px 20px' }}
        >
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Adicionar Novo Caso de Teste
          </Text>
          <Space direction="horizontal" style={{ width: '100%', display: 'flex' }} size="middle">
            <Input
              placeholder="Digite o título do teste (Ex: Validar cálculo de frete para região Norte)..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onPressEnter={handleQuickAdd}
              style={{ minWidth: 400, flex: 1 }}
              size="middle"
            />
            <Select
              value={quickPriority}
              onChange={(val) => setQuickPriority(val as TestPriority)}
              style={{ width: 130 }}
              size="middle"
              options={[
                { value: 'critical', label: 'Crítica' },
                { value: 'high', label: 'Alta' },
                { value: 'medium', label: 'Média' },
                { value: 'low', label: 'Baixa' },
              ]}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleQuickAdd}
              loading={quickAdding}
              size="middle"
            >
              Adicionar
            </Button>
          </Space>
        </Card>
      )}

      {/* Test Cases Table */}
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            borderBottom: '1px solid rgba(128, 128, 128, 0.15)',
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            Moldes de Teste ({filteredCases.length})
          </Title>

          <Space size="middle">
            <Select
              value={priorityFilter}
              onChange={setPriorityFilter}
              style={{ width: 140 }}
              options={[
                { value: 'all', label: 'Todas Prioridades' },
                { value: 'critical', label: 'Apenas Crítica' },
                { value: 'high', label: 'Apenas Alta' },
                { value: 'medium', label: 'Apenas Média' },
                { value: 'low', label: 'Apenas Baixa' },
              ]}
            />
            <Input
              placeholder="Buscar testes..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              style={{ width: 220 }}
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredCases}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          locale={{
            emptyText: (
              <div style={{ padding: '30px 0', textAlign: 'center' }}>
                <Text type="secondary">Nenhum caso de teste encontrado nesta feature.</Text>
              </div>
            ),
          }}
        />
      </Card>

      <TestCaseModal
        open={caseModalOpen}
        testCase={editingCase}
        onCancel={() => setCaseModalOpen(false)}
        onSubmit={handleCaseModalSubmit}
        loading={caseSubmitting}
      />

      <FeatureModal
        open={featureModalOpen}
        feature={feature}
        onCancel={() => setFeatureModalOpen(false)}
        onSubmit={handleFeatureModalSubmit}
        loading={featureSubmitting}
      />
    </AppLayout>
  );
}
