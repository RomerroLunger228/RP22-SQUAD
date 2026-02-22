import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Настройки для Telegram Mini Apps
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://web.telegram.org https://k.web.telegram.org; script-src 'self' https://telegram.org 'unsafe-inline'"
          }
        ]
      }
    ]
  },
};

export default nextConfig;
