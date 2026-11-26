'use client';

import React, { useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import type { Feature } from '@/types/database';

interface FeatureModalProps {
  open: boolean;
  feature?: Feature | null;
  onCancel: () => void;
  onSubmit: (values: { title: string; description?: string; doc_url?: string }) => Promise<void>;
  loading?: boolean;
}

export default function FeatureModal({
  open,
  feature,
  onCancel,
  onSubmit,
  loading = false,
}: FeatureModalProps) {
  const [form] = Form.useForm();
  const isEditing = !!feature;

  useEffect(() => {
    if (open) {
      if (feature) {
        form.setFieldsValue({
          title: feature.title,
          description: feature.description,
          doc_url: feature.doc_url,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, feature, form]);

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
      title={isEditing ? 'Editar Feature' : 'Nova Feature'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={isEditing ? 'Salvar Alterações' : 'Criar Feature'}
      cancelText="Cancelar"
      destroyOnClose
    >
      <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
        <Form.Item
          name="title"
          label="Título da Feature"
          rules={[
            { required: true, message: 'Por favor, informe o título da feature' },
            { min: 3, message: 'O título deve ter no mínimo 3 caracteres' },
          ]}
        >
          <Input placeholder="Ex: Checkout Transparente Pix" />
        </Form.Item>

        <Form.Item name="description" label="Descrição (Opcional)">
          <Input.TextArea
            rows={3}
            placeholder="Contexto da feature, regras de negócio ou objetivo principal"
          />
        </Form.Item>

        <Form.Item
          name="doc_url"
          label="Link da Documentação (Notion, Clickup, Confluence)"
          rules={[
            {
              type: 'url',
              message: 'Por favor, informe uma URL válida (ex: https://notion.so/...)',
            },
          ]}
        >
          <Input placeholder="https://app.clickup.com/..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
