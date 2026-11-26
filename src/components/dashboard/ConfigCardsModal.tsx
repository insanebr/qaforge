'use client';

import React from 'react';
import { Modal, Switch, Typography, Space, Divider } from 'antd';

const { Text } = Typography;

export interface CardVisibilityConfig {
  generalStatus: boolean;
  qaProductivity: boolean;
  featureHealth: boolean;
  branchQuality: boolean;
  devBottlenecks: boolean;
}

export const defaultCardConfig: CardVisibilityConfig = {
  generalStatus: true,
  qaProductivity: true,
  featureHealth: true,
  branchQuality: true,
  devBottlenecks: true,
};

interface ConfigCardsModalProps {
  open: boolean;
  config: CardVisibilityConfig;
  onClose: () => void;
  onChange: (key: keyof CardVisibilityConfig, value: boolean) => void;
}

export default function ConfigCardsModal({
  open,
  config,
  onClose,
  onChange,
}: ConfigCardsModalProps) {
  const cardItems: { key: keyof CardVisibilityConfig; title: string; desc: string }[] = [
    {
      key: 'generalStatus',
      title: '1. Status Geral de Execução',
      desc: 'Gráfico Donut exibindo a proporção de testes com sucesso vs falhas no período.',
    },
    {
      key: 'qaProductivity',
      title: '2. Produtividade da Equipe de QA',
      desc: 'Gráfico de barras exibindo o total de testes executados por membro de QA.',
    },
    {
      key: 'featureHealth',
      title: '3. Saúde das Features (Top 3 Falhas)',
      desc: 'Ranking das funcionalidades mais afetadas por erros no ciclo de testes.',
    },
    {
      key: 'branchQuality',
      title: '4. Qualidade de Entregas (Branches)',
      desc: 'Gráfico de colunas com a relação de branches aprovadas vs reprovadas.',
    },
    {
      key: 'devBottlenecks',
      title: '5. Gargalos de Desenvolvimento (Top Retornos)',
      desc: 'Rastreamento das branches com maior índice de reprovações e cartões afetados.',
    },
  ];

  return (
    <Modal
      title="Configuração de Cards do Dashboard"
      open={open}
      onCancel={onClose}
      onOk={onClose}
      okText="Salvar Preferências"
      cancelButtonProps={{ style: { display: 'none' } }}
      width={500}
    >
      <div style={{ marginTop: 16 }}>
        <Text type="secondary">
          Ative ou desative os cards que deseja visualizar no painel quinzenal:
        </Text>

        <Divider style={{ margin: '16px 0' }} />

        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {cardItems.map((item) => (
            <div
              key={item.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ paddingRight: 16 }}>
                <div style={{ fontWeight: 600 }}>{item.title}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {item.desc}
                </Text>
              </div>
              <Switch
                checked={config[item.key]}
                onChange={(checked) => onChange(item.key, checked)}
              />
            </div>
          ))}
        </Space>
      </div>
    </Modal>
  );
}
