import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FaceSecure | 얼굴 인증",
  description: "안전한 얼굴 인증 서비스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} antialiased min-h-screen bg-[#070B14]`}>
        {/* 모바일 최적화 컨테이너 */}
        <div className="mx-auto max-w-[430px] min-h-screen relative overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
