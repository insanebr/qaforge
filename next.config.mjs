/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ant-design/charts', '@ant-design/plots', '@ant-design/icons', 'antd', 'rc-util', 'rc-pagination', 'rc-picker'],
  reactStrictMode: false
};

export default nextConfig;
