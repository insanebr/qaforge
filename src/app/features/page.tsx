'use client';

import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  Typography,
  Button,
  Space,
  Table,
  Input,
  Tag,
  Badge,
  Popconfirm,
  message,
  Card,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  LinkOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import {
  getFeaturesWithCounts,
  createFeature,
  updateFeature,
  deleteFeature,
  type FeatureWithCount,
} from '@/services/features';
import FeatureModal from '@/components/features/FeatureModal';
import { useAuth } from '@/context/AuthContext';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function FeaturesPage() {
  const [features, setFeatures] = useState<FeatureWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureWithCount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { profile } = useAuth();

  const isViewer = profile?.role === 'viewer';

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const data = await getFeaturesWithCounts();
      setFeatures(data);
    } catch {
      message.error('Erro ao carregar features');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeatures();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingFeature(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (feature: FeatureWithCount) => {
    setEditingFeature(feature);
    setModalOpen(true);
  };

  const handleDeleteFeature = async (id: string) => {
    try {
      await deleteFeature(id);
      message.success('Feature excluída com sucesso');
      loadFeatures();
    } catch {
      message.error('Erro ao excluir feature');
    }
  };

  const handleFormSubmit = async (values: {
    title: string;
    description?: string;
    doc_url?: string;
  }) => {
    setSubmitting(true);
    try {
      if (editingFeature) {
        await updateFeature(editingFeature.id, values);
        message.success('Feature atualizada com sucesso');
      } else {
        await createFeature(values);
        message.success('Feature criada com sucesso');
      }
      setModalOpen(false);
      loadFeatures();
    } catch {
      message.error('Erro ao salvar feature');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFeatures = useMemo(() => {
    if (!searchTerm.trim()) return features;
    const term = searchTerm.toLowerCase();
    return features.filter(
      (f) =>
        f.title.toLowerCase().includes(term) ||
        (f.description && f.description.toLowerCase().includes(term))
    );
  }, [features, searchTerm]);

  const totalTestCases = useMemo(() => {
    return features.reduce((acc, curr) => acc + (curr.test_cases_count || 0), 0);
  }, [features]);

  const columns: ColumnsType<FeatureWithCount> = [
    {
      title: 'Feature',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (title: string, record) => (
        <div>
          <div
            style={{ fontWeight: 600, fontSize: 15, cursor: 'pointer', color: '#1677ff' }}
            onClick={() => router.push(`/features/${record.id}`)}
          >
            {title}
          </div>
          {record.description && (
            <Paragraph
              type="secondary"
              ellipsis={{ rows: 2 }}
              style={{ margin: '4px 0 0 0', fontSize: 13 }}
            >
              {record.description}
            </Paragraph>
          )}
        </div>
      ),
    },
    {
      title: 'Casos de Teste',
      dataIndex: 'test_cases_count',
      key: 'test_cases_count',
      width: 140,
      align: 'center',
      sorter: (a, b) => (a.test_cases_count || 0) - (b.test_cases_count || 0),
      render: (count: number) => (
        <Badge
          count={count || 0}
          showZero
          style={{
            backgroundColor: count > 0 ? '#1677ff' : '#8c8c8c',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      title: 'Documentação',
      dataIndex: 'doc_url',
      key: 'doc_url',
      width: 150,
      render: (url: string | null) =>
        url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <LinkOutlined /> Documento
          </a>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Criada em',
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
            onClick={() => router.push(`/features/${record.id}`)}
          >
            Testes
          </Button>

          {!isViewer && (
            <>
              <Tooltip title="Editar">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleOpenEditModal(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Excluir feature?"
                description="Todos os casos de teste vinculados também serão removidos."
                onConfirm={() => handleDeleteFeature(record.id)}
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
            Features & Repositório de Testes
          </Title>
          <Text type="secondary">
            {features.length} features cadastradas • {totalTestCases} moldes de casos de teste
          </Text>
        </div>

        <Space size="middle">
          <Input
            placeholder="Buscar por feature..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            style={{ width: 260 }}
          />
          {!isViewer && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
            >
              Nova Feature
            </Button>
          )}
        </Space>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredFeatures}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{
            emptyText: (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <FolderOpenOutlined style={{ fontSize: 42, color: '#1677ff', marginBottom: 12 }} />
                <div>
                  <Text strong>Nenhuma feature encontrada</Text>
                </div>
                {!isViewer && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    style={{ marginTop: 12 }}
                    onClick={handleOpenCreateModal}
                  >
                    Criar Primeira Feature
                  </Button>
                )}
              </div>
            ),
          }}
        />
      </Card>

      <FeatureModal
        open={modalOpen}
        feature={editingFeature}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleFormSubmit}
        loading={submitting}
      />
    </AppLayout>
  );
}
