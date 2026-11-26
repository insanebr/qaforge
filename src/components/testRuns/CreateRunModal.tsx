'use client';

import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Checkbox,
  Collapse,
  Typography,
  Space,
  Badge,
  message,
  Divider,
} from 'antd';
import { getBranches } from '@/services/branches';
import { getFeaturesWithCounts } from '@/services/features';
import { createClient } from '@/lib/supabase/client';
import type { QaBranch } from '@/types/database';
import type { FeatureWithCount } from '@/services/features';
import PriorityTag from '@/components/testCases/PriorityTag';

const { Text } = Typography;

interface CreateRunModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    title: string;
    qa_branch_id?: string | null;
    selectedTestCaseIds: string[];
  }) => Promise<void>;
  loading?: boolean;
}

interface FeatureWithTests extends FeatureWithCount {
  tests: { id: string; title: string; priority: string }[];
}

export default function CreateRunModal({
  open,
  onCancel,
  onSubmit,
  loading = false,
}: CreateRunModalProps) {
  const [form] = Form.useForm();
  const [branches, setBranches] = useState<QaBranch[]>([]);
  const [featuresWithTests, setFeaturesWithTests] = useState<FeatureWithTests[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (open) {
      loadInitialData();
      form.resetFields();
      setSelectedTestIds(new Set());
    }
  }, [open]);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      const supabase = createClient();
      const [branchesData, featuresData] = await Promise.all([
        getBranches(),
        getFeaturesWithCounts(),
      ]);

      setBranches(branchesData);

      // Carregar todos os casos de teste agrupados pelas features
      const { data: allTestCases } = await supabase
        .from('test_cases')
        .select('id, feature_id, title, priority')
        .order('created_at', { ascending: true });

      const mapped = featuresData.map((f) => ({
        ...f,
        tests: (allTestCases || []).filter((tc) => tc.feature_id === f.id),
      }));

      setFeaturesWithTests(mapped);

      // Por padrão, já selecionar todos os testes para agilizar
      const allIds = new Set<string>((allTestCases || []).map((t) => t.id));
      setSelectedTestIds(allIds);
    } catch {
      message.error('Erro ao carregar dados para o ciclo de teste');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set<string>();
      featuresWithTests.forEach((f) => f.tests.forEach((t) => allIds.add(t.id)));
      setSelectedTestIds(allIds);
    } else {
      setSelectedTestIds(new Set());
    }
  };

  const handleToggleFeatureTests = (feature: FeatureWithTests, checked: boolean) => {
    const updated = new Set(selectedTestIds);
    feature.tests.forEach((t) => {
      if (checked) {
        updated.add(t.id);
      } else {
        updated.delete(t.id);
      }
    });
    setSelectedTestIds(updated);
  };

  const handleToggleSingleTest = (testId: string) => {
    const updated = new Set(selectedTestIds);
    if (updated.has(testId)) {
      updated.delete(testId);
    } else {
      updated.add(testId);
    }
    setSelectedTestIds(updated);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (selectedTestIds.size === 0) {
        message.warning('Selecione ao menos um caso de teste para o ciclo.');
        return;
      }

      await onSubmit({
        title: values.title,
        qa_branch_id: values.qa_branch_id || null,
        selectedTestCaseIds: Array.from(selectedTestIds),
      });
    } catch {
      // form validation failed
    }
  };

  const totalAvailableTests = featuresWithTests.reduce(
    (acc, f) => acc + f.tests.length,
    0
  );
  const allSelected =
    totalAvailableTests > 0 && selectedTestIds.size === totalAvailableTests;

  return (
    <Modal
      title="Novo Ciclo de Teste (Test Run)"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={`Iniciar Ciclo (${selectedTestIds.size} Testes)`}
      cancelText="Cancelar"
      width={720}
      destroyOnClose
    >
      <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
        <Form.Item
          name="title"
          label="Título do Ciclo"
          rules={[
            { required: true, message: 'Informe o título do ciclo de testes' },
            { min: 3, message: 'O título deve ter no mínimo 3 caracteres' },
          ]}
        >
          <Input placeholder="Ex: Smoke Test - Semana 48 (Release v2.4)" />
        </Form.Item>

        <Form.Item name="qa_branch_id" label="Vincular à Branch (Opcional)">
          <Select
            allowClear
            placeholder="Selecione a branch testada..."
            options={branches.map((b) => ({
              value: b.id,
              label: `${b.name} (${b.status === 'approved' ? 'Aprovada' : b.status === 'rejected' ? 'Reprovada' : 'Em teste'})`,
            }))}
          />
        </Form.Item>

        <Divider style={{ margin: '16px 0 12px 0' }} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text strong>
            Importar Casos de Teste ({selectedTestIds.size} de {totalAvailableTests} selecionados)
          </Text>
          <Checkbox
            checked={allSelected}
            indeterminate={selectedTestIds.size > 0 && !allSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
          >
            Selecionar Todos
          </Checkbox>
        </div>

        <div
          style={{
            maxHeight: 320,
            overflowY: 'auto',
            border: '1px solid rgba(128, 128, 128, 0.2)',
            borderRadius: 6,
            padding: 8,
          }}
        >
          {featuresWithTests.map((feature) => {
            const featureTestIds = feature.tests.map((t) => t.id);
            const selectedInFeature = featureTestIds.filter((id) =>
              selectedTestIds.has(id)
            ).length;
            const isFeatureAllSelected =
              feature.tests.length > 0 && selectedInFeature === feature.tests.length;
            const isFeatureIndeterminate =
              selectedInFeature > 0 && !isFeatureAllSelected;

            return (
              <Collapse
                key={feature.id}
                ghost
                size="small"
                style={{ marginBottom: 4 }}
                items={[
                  {
                    key: feature.id,
                    label: (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          paddingRight: 8,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isFeatureAllSelected}
                          indeterminate={isFeatureIndeterminate}
                          onChange={(e) =>
                            handleToggleFeatureTests(feature, e.target.checked)
                          }
                        >
                          <span style={{ fontWeight: 600 }}>{feature.title}</span>
                        </Checkbox>
                        <Badge
                          count={`${selectedInFeature}/${feature.tests.length}`}
                          style={{
                            backgroundColor: selectedInFeature > 0 ? '#1677ff' : '#8c8c8c',
                          }}
                        />
                      </div>
                    ),
                    children: (
                      <div style={{ paddingLeft: 24 }}>
                        {feature.tests.length === 0 ? (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Nenhum teste nesta feature.
                          </Text>
                        ) : (
                          feature.tests.map((t) => (
                            <div
                              key={t.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '4px 0',
                              }}
                            >
                              <Checkbox
                                checked={selectedTestIds.has(t.id)}
                                onChange={() => handleToggleSingleTest(t.id)}
                              >
                                <span style={{ fontSize: 13 }}>{t.title}</span>
                              </Checkbox>
                              <PriorityTag priority={t.priority} />
                            </div>
                          ))
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            );
          })}
        </div>
      </Form>
    </Modal>
  );
}
