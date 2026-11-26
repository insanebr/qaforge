import React from 'react';
import { Tag } from 'antd';
import {
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { BranchStatus } from '@/types/database';

interface BranchStatusTagProps {
  status: BranchStatus | string;
}

const statusConfig: Record<
  string,
  { color: string; label: string; icon: React.ReactNode }
> = {
  testing: {
    color: 'processing',
    label: 'Em Teste',
    icon: <SyncOutlined spin />,
  },
  approved: {
    color: 'success',
    label: 'Aprovada',
    icon: <CheckCircleOutlined />,
  },
  rejected: {
    color: 'error',
    label: 'Reprovada',
    icon: <CloseCircleOutlined />,
  },
};

export default function BranchStatusTag({ status }: BranchStatusTagProps) {
  const config = statusConfig[status] || {
    color: 'default',
    label: status,
    icon: null,
  };

  return (
    <Tag
      color={config.color}
      icon={config.icon}
      style={{ fontWeight: 500, padding: '2px 8px' }}
    >
      {config.label}
    </Tag>
  );
}
