import React from 'react';
import { Tag } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { RunStatus } from '@/types/database';

interface RunStatusTagProps {
  status: RunStatus | string;
}

export default function RunStatusTag({ status }: RunStatusTagProps) {
  if (status === 'closed') {
    return (
      <Tag
        color="default"
        icon={<CheckCircleOutlined />}
        style={{ fontWeight: 500, padding: '2px 8px' }}
      >
        Concluído
      </Tag>
    );
  }

  return (
    <Tag
      color="processing"
      icon={<PlayCircleOutlined />}
      style={{ fontWeight: 500, padding: '2px 8px' }}
    >
      Em Execução
    </Tag>
  );
}
