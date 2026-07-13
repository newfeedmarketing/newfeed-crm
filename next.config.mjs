/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // permite anexar contratos em PDF
    },
  },
};

export default nextConfig;
