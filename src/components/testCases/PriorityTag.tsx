import React from 'react';
import { Tag } from 'antd';
import type { TestPriority } from '@/types/database';

interface PriorityTagProps {
  priority: TestPriority | string;
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'green', label: 'Baixa' },
  medium: { color: 'blue', label: 'Média' },
  high: { color: 'orange', label: 'Alta' },
  critical: { color: 'red', label: 'Crítica' },
};

export default function PriorityTag({ priority }: PriorityTagProps) {
  const config = priorityConfig[priority] || { color: 'default', label: priority };

  return (
    <Tag color={config.color} style={{ fontWeight: 500, textTransform: 'capitalize' }}>
      {config.label}
    </Tag>
  );
}
