import React from 'react';
import { Tag } from 'antd';
import {
  ClockCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ItemStatus } from '@/types/database';

interface ItemStatusTagProps {
  status: ItemStatus | string;
}

export const itemStatusConfig: Record<
  ItemStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  to_test: {
    label: 'A Testar',
    color: '#8c8c8c',
    bg: 'default',
    icon: <ClockCircleOutlined />,
  },
  testing: {
    label: 'Testando',
    color: '#fa8c16',
    bg: 'warning',
    icon: <SyncOutlined spin />,
  },
  failed: {
    label: 'Falhou',
    color: '#ff4d4f',
    bg: 'error',
    icon: <CloseCircleOutlined />,
  },
  done: {
    label: 'Passou',
    color: '#52c41a',
    bg: 'success',
    icon: <CheckCircleOutlined />,
  },
};

export default function ItemStatusTag({ status }: ItemStatusTagProps) {
  const config = itemStatusConfig[status as ItemStatus] || {
    label: status,
    color: '#8c8c8c',
    bg: 'default',
    icon: null,
  };

  return (
    <Tag
      color={config.bg}
      icon={config.icon}
      style={{ fontWeight: 500, padding: '2px 8px', textTransform: 'capitalize' }}
    >
      {config.label}
    </Tag>
  );
}
