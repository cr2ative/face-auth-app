"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-col min-h-screen bg-[#070B14] overflow-hidden">

      {/* 배경 그라디언트 오브 */}
      <div className="absolute top-[-120px] left-[-80px] w-[320px] h-[320px] rounded-full bg-blue-600/10 blur-[80px] pointer-events-none" />
      <div className="absolute top-[200px] right-[-100px] w-[260px] h-[260px] rounded-full bg-indigo-500/8 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[20px] w-[280px] h-[280px] rounded-full bg-blue-400/6 blur-[100px] pointer-events-none" />

      {/* 상단 헤더 */}
      <header className="flex items-center justify-between px-6 pt-14 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C9.243 2 7 4.243 7 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z" fill="white"/>
              <path d="M21 20c0-4.418-4.03-8-9-8s-9 3.582-9 8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-base tracking-tight">FaceSecure</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 blink" />
          <span className="text-emerald-400 text-xs font-medium">보안 연결</span>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col px-6 pt-8">

        {/* 히어로 섹션 */}
        <div className="fade-in-up" style={{ animationDelay: "0ms" }}>
          <p className="text-slate-500 text-xs font-medium mb-2 tracking-widest uppercase">Face Authentication</p>
          <h1 className="text-white text-[2rem] font-bold leading-tight mb-3">
            얼굴로 증명하는<br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              나만의 보안
            </span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            생체 인증 기술로 더 안전하고 빠르게.<br />
            비밀번호 없이 얼굴만으로 인증하세요.
          </p>
        </div>

        {/* 얼굴 인식 아이콘 영역 */}
        <div className="fade-in-up flex justify-center mt-12 mb-12" style={{ animationDelay: "100ms" }}>
          <div className="relative w-48 h-48">
            {/* 외부 링 */}
            <div className="absolute inset-0 rounded-full border border-blue-500/20 pulse-ring" />
            <div className="absolute inset-3 rounded-full border border-blue-500/30 pulse-ring" style={{ animationDelay: "0.4s" }} />
            {/* 중앙 얼굴 아이콘 컨테이너 */}
            <div className="absolute inset-6 rounded-full bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-sm flex items-center justify-center shadow-2xl">
              <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
                {/* 얼굴 윤곽 */}
                <ellipse cx="40" cy="38" rx="22" ry="24" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3 2"/>
                {/* 눈 */}
                <circle cx="31" cy="33" r="3.5" fill="#3B82F6" fillOpacity="0.8"/>
                <circle cx="49" cy="33" r="3.5" fill="#3B82F6" fillOpacity="0.8"/>
                <circle cx="31" cy="33" r="1.5" fill="white"/>
                <circle cx="49" cy="33" r="1.5" fill="white"/>
                {/* 코 */}
                <path d="M40 36 L37 44 L43 44" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                {/* 입 */}
                <path d="M33 50 Q40 56 47 50" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                {/* 스캔 코너 마커 */}
                <path d="M14 20 L14 12 L22 12" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M66 20 L66 12 L58 12" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 60 L14 68 L22 68" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M66 60 L66 68 L58 68" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* 보안 지표 카드 */}
        <div className="fade-in-up grid grid-cols-3 gap-3 mb-10" style={{ animationDelay: "200ms" }}>
          {[
            { label: "정확도", value: "99.9%", icon: "🎯" },
            { label: "인식 속도", value: "0.3초", icon: "⚡" },
            { label: "보안 등급", value: "AAA", icon: "🔐" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-3.5 text-center backdrop-blur-sm"
            >
              <div className="text-lg mb-1">{item.icon}</div>
              <div className="text-white font-bold text-sm">{item.value}</div>
              <div className="text-slate-500 text-[10px] mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>

        {/* 버튼 영역 */}
        <div className="fade-in-up flex flex-col gap-3 pb-12" style={{ animationDelay: "300ms" }}>
          {/* 인증 시작 버튼 (Primary) */}
          <Link href="/auth">
            <button className="w-full relative overflow-hidden rounded-2xl py-[18px] px-6 font-semibold text-white text-base
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-500 hover:to-indigo-500
              active:scale-[0.98]
              transition-all duration-200
              shadow-[0_4px_32px_rgba(59,130,246,0.35)]
              cursor-pointer">
              <span className="relative z-10 flex items-center justify-center gap-2.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C9.243 2 7 4.243 7 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z" fill="white"/>
                  <path d="M12 14c-4.418 0-8 2.686-8 6v1h16v-1c0-3.314-3.582-6-8-6z" fill="white"/>
                  <path d="M20 8l-1.5 1.5M18 6.5l1.5-1.5M20 11h-2M20 6h-2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                인증 시작
              </span>
              {/* 광택 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent shimmer-btn" />
            </button>
          </Link>

          {/* 얼굴 등록 버튼 (Secondary) */}
          <Link href="/register">
            <button className="w-full rounded-2xl py-[18px] px-6 font-semibold text-blue-400 text-base
              bg-transparent
              border border-blue-500/40
              hover:border-blue-400/70 hover:bg-blue-500/5
              active:scale-[0.98]
              transition-all duration-200
              cursor-pointer">
              <span className="flex items-center justify-center gap-2.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12z" stroke="#60A5FA" strokeWidth="1.5"/>
                  <path d="M20.4 21.6c0-4.6-3.8-8.4-8.4-8.4s-8.4 3.8-8.4 8.4" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="19" cy="6" r="3.5" fill="#3B82F6"/>
                  <path d="M19 4.5v3M17.5 6h3" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                얼굴 등록
              </span>
            </button>
          </Link>
        </div>
      </main>

      {/* 하단 안내 */}
      <footer className="px-6 pb-8 text-center">
        <p className="text-slate-600 text-xs leading-relaxed">
          생체 정보는 디바이스 내에서만 처리되며<br />외부로 전송되지 않습니다.
        </p>
      </footer>
    </div>
  );
}
