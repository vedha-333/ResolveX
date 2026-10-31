/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow uploading large files (videos can be large) — up to 50MB
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
