import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

export const lightTheme: ThemeConfig = {
  algorithm: [theme.defaultAlgorithm, theme.compactAlgorithm],
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 6,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#001529',
    },
    Table: {
      headerBg: '#fafafa',
    },
  },
};

export const darkTheme: ThemeConfig = {
  algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 6,
    colorBgBase: '#141414',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#1f1f1f',
      siderBg: '#141414',
      bodyBg: '#0a0a0a',
    },
    Table: {
      headerBg: '#1f1f1f',
    },
  },
};
