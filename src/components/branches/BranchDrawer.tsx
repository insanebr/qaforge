'use client';

import React, { useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
} from 'antd';
import type { QaBranch, BranchStatus } from '@/types/database';
import dayjs from 'dayjs';

interface BranchDrawerProps {
  open: boolean;
  branch?: QaBranch | null;
  onClose: () => void;
  onSubmit: (values: {
    name: string;
    review_date: string;
    rejection_count: number;
    rejected_cards_count: number;
    bugs_created_count: number;
    status: BranchStatus;
    reason?: string;
  }) => Promise<void>;
  loading?: boolean;
}

export default function BranchDrawer({
  open,
  branch,
  onClose,
  onSubmit,
  loading = false,
}: BranchDrawerProps) {
  const [form] = Form.useForm();
  const isEditing = !!branch;

  useEffect(() => {
    if (open) {
      if (branch) {
        form.setFieldsValue({
          name: branch.name,
          review_date: branch.review_date ? dayjs(branch.review_date) : dayjs(),
          rejection_count: branch.rejection_count,
          rejected_cards_count: branch.rejected_cards_count,
          bugs_created_count: branch.bugs_created_count,
          status: branch.status,
          reason: branch.reason,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          review_date: dayjs(),
          rejection_count: 0,
          rejected_cards_count: 0,
          bugs_created_count: 0,
          status: 'testing',
        });
      }
    }
  }, [open, branch, form]);

  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit({
        ...values,
        review_date: values.review_date.format('YYYY-MM-DD'),
      });
      form.resetFields();
    } catch {
      // form validation failed
    }
  };

  return (
    <Drawer
      title={isEditing ? 'Editar Controle de Branch' : 'Registrar Nova Branch'}
      width={460}
      onClose={onClose}
      open={open}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" onClick={handleFinish} loading={loading}>
            {isEditing ? 'Salvar' : 'Registrar'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="name"
          label="Nome da Branch"
          rules={[
            { required: true, message: 'Informe o nome da branch' },
            { min: 3, message: 'O nome da branch deve ter no mínimo 3 caracteres' },
          ]}
        >
          <Input placeholder="Ex: feature/checkout-pix ou bugfix/card-rejections" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="review_date"
              label="Data da Revisão"
              rules={[{ required: true, message: 'Selecione a data' }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Selecione o status' }]}
            >
              <Select
                options={[
                  { value: 'testing', label: 'Em Teste' },
                  { value: 'approved', label: 'Aprovada' },
                  { value: 'rejected', label: 'Reprovada' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <div
          style={{
            background: 'rgba(128, 128, 128, 0.05)',
            padding: '16px',
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 12 }}>
            Métricas de Qualidade (Incrementos Ágeis)
          </div>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="rejection_count"
                label="Reprovações"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="rejected_cards_count"
                label="Cards Reprovados"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="bugs_created_count"
                label="Bugs Abertos"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Form.Item
          name="reason"
          label="Motivo / Observações da Aprovação ou Reprovação"
        >
          <Input.TextArea
            rows={4}
            placeholder="Ex: Reprovado por falha no retorno do webhook Pix. Cards 120 e 124 afetados..."
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
