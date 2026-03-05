import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack 사용 명시 (Next.js 16+ 기본값)
  // face-api.js는 "use client" + dynamic import로만 사용하므로 별도 설정 불필요
  turbopack: {},
};

export default nextConfig;
