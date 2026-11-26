'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  Typography,
  Row,
  Col,
  Card,
  Statistic,
  DatePicker,
  Space,
  Button,
  Empty,
  Spin,
  Tag,
  List,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  BranchesOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  FireOutlined,
  AlertOutlined,
  BugOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import dynamic from 'next/dynamic';
import {
  getDashboardMetrics,
  type DashboardMetrics,
} from '@/services/dashboard';
import ConfigCardsModal, {
  defaultCardConfig,
  type CardVisibilityConfig,
} from '@/components/dashboard/ConfigCardsModal';
import { useTheme } from '@/context/ThemeContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Dynamically import Ant Design Charts to avoid Next.js SSR canvas issues
const Pie = dynamic(() => import('@ant-design/plots').then((mod) => mod.Pie), {
  ssr: false,
  loading: () => <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>,
});

const Column = dynamic(() => import('@ant-design/plots').then((mod) => mod.Column), {
  ssr: false,
  loading: () => <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>,
});

export default function DashboardPage() {
  const { mode } = useTheme();

  // Period state: default to last 15 days (quinzenal)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(15, 'day'),
    dayjs(),
  ]);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Cards visibility state
  const [cardConfig, setCardConfig] = useState<CardVisibilityConfig>(defaultCardConfig);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('tm_card_config');
    if (saved) {
      try {
        setCardConfig(JSON.parse(saved));
      } catch {
        // fallback to default
      }
    }
  }, []);

  const handleCardConfigChange = (key: keyof CardVisibilityConfig, value: boolean) => {
    const updated = { ...cardConfig, [key]: value };
    setCardConfig(updated);
    localStorage.setItem('tm_card_config', JSON.stringify(updated));
  };

  const loadMetrics = async (start: Dayjs, end: Dayjs) => {
    setLoading(true);
    try {
      const data = await getDashboardMetrics(
        start.format('YYYY-MM-DD'),
        end.format('YYYY-MM-DD')
      );
      setMetrics(data);
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      loadMetrics(dateRange[0], dateRange[1]);
    }
  }, [dateRange]);

  const handleRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  // 1. Configuração do Gráfico de Donut (Status Geral)
  const donutData = metrics?.generalStatusData.filter((d) => d.value > 0) || [];
  const donutConfig = {
    data: donutData,
    angleField: 'value',
    colorField: 'type',
    innerRadius: 0.64,
    height: 260,
    color: ['#52c41a', '#ff4d4f'],
    legend: {
      color: {
        title: false,
        position: 'bottom' as const,
        rowPadding: 5,
      },
    },
    label: {
      text: 'value',
      style: {
        fontWeight: 'bold',
      },
    },
    theme: mode === 'dark' ? 'dark' : 'light',
  };

  // 2. Configuração do Gráfico de Barras/Colunas (Produtividade)
  const productivityData = metrics?.qaProductivityData || [];
  const productivityConfig = {
    data: productivityData,
    xField: 'qa',
    yField: 'count',
    height: 260,
    color: '#1677ff',
    label: {
      text: 'count',
      textBaseline: 'bottom',
    },
    theme: mode === 'dark' ? 'dark' : 'light',
  };

  // 4. Configuração do Gráfico de Branches (Aprovadas vs Reprovadas)
  const branchData = metrics?.branchQualityData.filter((d) => d.value > 0) || [];
  const branchChartConfig = {
    data: branchData,
    xField: 'status',
    yField: 'value',
    height: 260,
    colorField: 'status',
    scale: {
      color: {
        range: ['#52c41a', '#ff4d4f', '#1677ff'],
      },
    },
    theme: mode === 'dark' ? 'dark' : 'light',
  };

  return (
    <AppLayout>
      {/* Top Filter & Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Dashboard de Qualidade & Métricas Quinzenais
          </Title>
          <Text type="secondary">
            Período analisado: {dateRange[0].format('DD/MM/YYYY')} até {dateRange[1].format('DD/MM/YYYY')}
          </Text>
        </div>

        <Space size="middle" wrap>
          <RangePicker
            value={dateRange}
            onChange={handleRangeChange}
            format="DD/MM/YYYY"
            presets={[
              {
                label: 'Últimos 15 dias (Quinzena)',
                value: [dayjs().subtract(15, 'day'), dayjs()],
              },
              {
                label: 'Este Mês',
                value: [dayjs().startOf('month'), dayjs().endOf('month')],
              },
              {
                label: 'Últimos 30 dias',
                value: [dayjs().subtract(30, 'day'), dayjs()],
              },
            ]}
          />
          <Button icon={<SettingOutlined />} onClick={() => setConfigModalOpen(true)}>
            Configurar Cards
          </Button>
        </Space>
      </div>

      {/* Top Summary Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Testes Executados no Período"
              value={metrics?.summary.totalExecuted || 0}
              loading={loading}
              prefix={<PlayCircleOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Taxa de Sucesso"
              value={metrics?.summary.successRate || 0}
              suffix="%"
              loading={loading}
              valueStyle={{ color: (metrics?.summary.successRate || 0) >= 80 ? '#52c41a' : '#fa8c16' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Falhas Detectadas"
              value={metrics?.summary.totalFailures || 0}
              loading={loading}
              valueStyle={{ color: (metrics?.summary.totalFailures || 0) > 0 ? '#ff4d4f' : undefined }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Branches Revisadas"
              value={metrics?.summary.totalBranchesReviewed || 0}
              loading={loading}
              prefix={<BranchesOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Dynamic Grid of Charts & Cards */}
      <Row gutter={[16, 16]}>
        {/* Card 1: Status Geral (Donut) */}
        {cardConfig.generalStatus && (
          <Col xs={24} lg={12}>
            <Card
              title="1. Status Geral (Sucesso vs Falha)"
              bordered={false}
              style={{ minHeight: 340 }}
            >
              {loading ? (
                <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Spin />
                </div>
              ) : donutData.length === 0 ? (
                <Empty
                  description="Nenhum teste executado no período selecionado."
                  style={{ padding: '40px 0' }}
                />
              ) : (
                <Pie {...donutConfig} />
              )}
            </Card>
          </Col>
        )}

        {/* Card 2: Produtividade por QA */}
        {cardConfig.qaProductivity && (
          <Col xs={24} lg={12}>
            <Card
              title="2. Produtividade por QA (Testes Executados)"
              bordered={false}
              style={{ minHeight: 340 }}
            >
              {loading ? (
                <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Spin />
                </div>
              ) : productivityData.length === 0 ? (
                <Empty
                  description="Nenhuma execução atribuída a QAs no período."
                  style={{ padding: '40px 0' }}
                />
              ) : (
                <Column {...productivityConfig} />
              )}
            </Card>
          </Col>
        )}

        {/* Card 3: Saúde das Features (Top 3 Falhas) */}
        {cardConfig.featureHealth && (
          <Col xs={24} lg={12}>
            <Card
              title={
                <span>
                  <AlertOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                  3. Saúde das Features (Top 3 com mais falhas)
                </span>
              }
              bordered={false}
              style={{ minHeight: 340 }}
            >
              {loading ? (
                <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Spin />
                </div>
              ) : (metrics?.topFailedFeatures.length || 0) === 0 ? (
                <Empty
                  description="Nenhuma falha registrada em features no período! Todas saudáveis."
                  style={{ padding: '40px 0' }}
                />
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={metrics?.topFailedFeatures}
                  renderItem={(item, index) => (
                    <List.Item
                      extra={
                        <Tag color="error" style={{ fontSize: 13, fontWeight: 600 }}>
                          {item.failCount} {item.failCount === 1 ? 'falha' : 'falhas'}
                        </Tag>
                      }
                    >
                      <List.Item.Meta
                        avatar={
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              backgroundColor: index === 0 ? '#ff4d4f' : index === 1 ? '#fa8c16' : '#d9d9d9',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                            }}
                          >
                            {index + 1}
                          </div>
                        }
                        title={<span style={{ fontWeight: 600 }}>{item.featureTitle}</span>}
                        description="Funcionalidade com maior incidência de bugs no ciclo"
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>
        )}

        {/* Card 4: Qualidade de Entregas (Branches) */}
        {cardConfig.branchQuality && (
          <Col xs={24} lg={12}>
            <Card
              title="4. Qualidade de Entregas (Branches)"
              bordered={false}
              style={{ minHeight: 340 }}
            >
              {loading ? (
                <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Spin />
                </div>
              ) : branchData.length === 0 ? (
                <Empty
                  description="Nenhuma branch revisada no período."
                  style={{ padding: '40px 0' }}
                />
              ) : (
                <Column {...branchChartConfig} />
              )}
            </Card>
          </Col>
        )}

        {/* Card 5: Gargalos de Desenvolvimento */}
        {cardConfig.devBottlenecks && (
          <Col xs={24} lg={24}>
            <Card
              title={
                <span>
                  <FireOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                  5. Gargalos de Desenvolvimento (Top 3 Branches com mais retornos)
                </span>
              }
              bordered={false}
            >
              {loading ? (
                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Spin />
                </div>
              ) : (metrics?.topDevBottlenecks.length || 0) === 0 ? (
                <Empty
                  description="Nenhuma branch com reprovação ou gargalo no período."
                  style={{ padding: '24px 0' }}
                />
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={metrics?.topDevBottlenecks}
                  renderItem={(item, index) => (
                    <List.Item
                      extra={
                        <Space size="middle">
                          <Tag color="red">
                            Reprovações: {item.rejectionCount}
                          </Tag>
                          <Tag color="orange">
                            Cards Reprovados: {item.rejectedCards}
                          </Tag>
                          <Tag color="volcano" icon={<BugOutlined />}>
                            Bugs: {item.bugsCount}
                          </Tag>
                        </Space>
                      }
                    >
                      <List.Item.Meta
                        avatar={
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              backgroundColor: index === 0 ? '#cf1322' : index === 1 ? '#d4380d' : '#fa8c16',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                            }}
                          >
                            {index + 1}
                          </div>
                        }
                        title={
                          <span style={{ fontWeight: 600, fontSize: 15 }}>
                            <BranchesOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                            {item.name}
                          </span>
                        }
                        description={item.reason || 'Sem justificativa registrada'}
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>
        )}
      </Row>

      {/* Config Modal */}
      <ConfigCardsModal
        open={configModalOpen}
        config={cardConfig}
        onClose={() => setConfigModalOpen(false)}
        onChange={handleCardConfigChange}
      />
    </AppLayout>
  );
}
