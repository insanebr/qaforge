'use client';

import React, { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import type { TestCase, TestPriority } from '@/types/database';

interface TestCaseModalProps {
  open: boolean;
  testCase?: TestCase | null;
  onCancel: () => void;
  onSubmit: (values: { title: string; priority: TestPriority }) => Promise<void>;
  loading?: boolean;
}

export default function TestCaseModal({
  open,
  testCase,
  onCancel,
  onSubmit,
  loading = false,
}: TestCaseModalProps) {
  const [form] = Form.useForm();
  const isEditing = !!testCase;

  useEffect(() => {
    if (open) {
      if (testCase) {
        form.setFieldsValue({
          title: testCase.title,
          priority: testCase.priority,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, testCase, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch {
      // form validation failed
    }
  };

  return (
    <Modal
      title={isEditing ? 'Editar Caso de Teste' : 'Novo Caso de Teste'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={isEditing ? 'Salvar Alterações' : 'Criar Caso'}
      cancelText="Cancelar"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ priority: 'medium' }}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="title"
          label="Título do Caso de Teste"
          rules={[
            { required: true, message: 'Por favor, informe o título do teste' },
            { min: 3, message: 'O título deve ter no mínimo 3 caracteres' },
          ]}
        >
          <Input placeholder="Ex: Validar se o QR Code Pix expira após 15 minutos" />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Prioridade"
          rules={[{ required: true, message: 'Selecione a prioridade' }]}
        >
          <Select
            options={[
              { value: 'low', label: 'Baixa' },
              { value: 'medium', label: 'Média' },
              { value: 'high', label: 'Alta' },
              { value: 'critical', label: 'Crítica' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
