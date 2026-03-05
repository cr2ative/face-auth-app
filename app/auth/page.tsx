"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import FaceCamera from "@/app/components/FaceCamera";
import { fetchAllUsers, findBestMatch, type MatchResult } from "@/lib/supabase";

const AUTH_THRESHOLD = 90; // 일치율 90% 이상이어야 인증 성공

type Step = "ready" | "scanning" | "success" | "fail";

export default function AuthPage() {
  const [step, setStep] = useState<Step>("ready");
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [authError, setAuthError] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [dots, setDots] = useState(0);

  // 중복 비교 방지
  const comparingRef = useRef(false);

  // 로딩 점 애니메이션 (scanning 단계)
  useEffect(() => {
    if (step !== "scanning") return;
    const interval = setInterval(() => setDots(d => (d + 1) % 4), 450);
    return () => clearInterval(interval);
  }, [step]);

  // ── 핵심: descriptor 받으면 Supabase와 비교 ──────────
  const handleDescriptor = useCallback(async (descriptor: Float32Array) => {
    // 이미 비교 중이거나 완료된 경우 스킵
    if (comparingRef.current || step !== "scanning") return;
    comparingRef.current = true;
    setIsComparing(true);

    try {
      const users = await fetchAllUsers();

      if (users.length === 0) {
        setAuthError("등록된 사용자가 없습니다. 먼저 얼굴을 등록해주세요.");
        setStep("fail");
        return;
      }

      const best = findBestMatch(descriptor, users);
      if (!best) {
        setAuthError("비교에 실패했습니다.");
        setStep("fail");
        return;
      }

      setMatchResult(best);

      if (best.similarity >= AUTH_THRESHOLD) {
        setStep("success");
      } else {
        setAuthError(
          `가장 유사한 사용자: ${best.user.name} (${best.similarity}%)\n인증 기준 미달: ${AUTH_THRESHOLD}% 이상 필요`
        );
        setStep("fail");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      setAuthError(msg);
      setStep("fail");
    } finally {
      setIsComparing(false);
      // comparingRef는 step 전환 후에도 유지해 중복 방지
    }
  }, [step]);

  const startScanning = () => {
    comparingRef.current = false;
    setMatchResult(null);
    setAuthError("");
    setIsComparing(false);
    setStep("scanning");
  };

  const reset = () => {
    comparingRef.current = false;
    setStep("ready");
    setMatchResult(null);
    setAuthError("");
    setIsComparing(false);
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#070B14] overflow-hidden">

      {/* 배경 오브 */}
      <div className="absolute top-[-100px] left-[-60px] w-[300px] h-[300px] rounded-full bg-blue-600/8 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-80px] right-[-40px] w-[260px] h-[260px] rounded-full bg-indigo-500/8 blur-[80px] pointer-events-none" />

      {/* 헤더 */}
      <header className="flex items-center gap-4 px-6 pt-14 pb-6">
        <Link href="/">
          <button className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center active:scale-95 transition-transform cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </Link>
        <div>
          <h2 className="text-white font-semibold text-lg">얼굴 인증</h2>
          <p className="text-slate-500 text-xs mt-0.5">Face Authentication</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6L12 2z" fill="#3B82F6" fillOpacity="0.7" stroke="#3B82F6" strokeWidth="1.5"/>
          </svg>
          <span className="text-blue-400 text-xs font-medium">128D 벡터 비교</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-6">

        {/* ── READY 단계 ─────────────────────────────── */}
        {step === "ready" && (
          <div className="flex-1 flex flex-col fade-in-up">
            {/* 카메라 프리뷰 (descriptor 미사용) */}
            <div className="relative mx-auto w-64 h-64 mt-2 mb-6 rounded-3xl overflow-hidden">
              <FaceCamera active={true} showLandmarks={true} computeDescriptor={false} />
              {["top-3 left-3", "top-3 right-3 rotate-90", "bottom-3 left-3 -rotate-90", "bottom-3 right-3 rotate-180"].map((cls, i) => (
                <div key={i} className={`absolute ${cls} w-6 h-6 z-20 pointer-events-none`}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M2 8V2h6" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ))}
            </div>

            {/* 인증 방식 안내 */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-4 mb-5">
              <p className="text-white text-sm font-medium mb-3">인증 방식</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: "🔢", text: "128차원 얼굴 특징 벡터 추출" },
                  { icon: "📊", text: "Supabase DB와 유클리드 거리 비교" },
                  { icon: "✅", text: `일치율 ${AUTH_THRESHOLD}% 이상 시 인증 완료` },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-slate-400 text-xs">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 최근 인증 내역 (정적 예시) */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 px-5 py-4 mb-6">
              <p className="text-slate-500 text-xs font-medium mb-3 uppercase tracking-wider">최근 인증</p>
              {[
                { time: "오늘 09:42", status: "성공", color: "emerald" },
                { time: "어제 18:15", status: "성공", color: "emerald" },
                { time: "어제 08:30", status: "실패", color: "red" },
              ].map((item, i) => (
                <div key={i} className={`flex items-center justify-between py-2.5 ${i < 2 ? "border-b border-slate-800/60" : ""}`}>
                  <span className="text-slate-400 text-sm">{item.time}</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    item.color === "emerald"
                      ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20"
                      : "text-red-400 bg-red-400/10 border border-red-400/20"
                  }`}>{item.status}</span>
                </div>
              ))}
            </div>

            <button
              onClick={startScanning}
              className="w-full rounded-2xl py-[18px] font-semibold text-white text-base
                bg-gradient-to-r from-blue-600 to-indigo-600
                hover:from-blue-500 hover:to-indigo-500
                active:scale-[0.98] transition-all duration-200
                shadow-[0_4px_32px_rgba(59,130,246,0.35)]
                cursor-pointer mb-4"
            >
              <span className="flex items-center justify-center gap-2.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
                  <circle cx="12" cy="12" r="4" fill="white"/>
                </svg>
                인증하기
              </span>
            </button>
          </div>
        )}

        {/* ── SCANNING 단계 ───────────────────────────── */}
        {step === "scanning" && (
          <div className="flex-1 flex flex-col items-center fade-in-up">
            <p className="text-slate-400 text-sm mb-5 mt-2">
              {isComparing ? "DB와 비교 중..." : "얼굴을 화면에 위치시켜주세요"}
            </p>

            {/* 카메라 (descriptor 추출 활성화) */}
            <div className="relative w-64 h-64 mb-8">
              <FaceCamera
                active={true}
                showLandmarks={true}
                computeDescriptor={!isComparing}
                onDescriptor={handleDescriptor}
              />
              {/* 스캔 라인 */}
              {!isComparing && (
                <div className="scan-line absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400/80 to-transparent z-20 pointer-events-none" />
              )}
              {/* 비교 중 오버레이 */}
              {isComparing && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070B14]/80 rounded-3xl backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-full border-2 border-blue-800/30 border-t-blue-500 border-r-blue-500 animate-spin mb-3" />
                  <p className="text-blue-300 text-sm font-medium">DB 비교 중...</p>
                </div>
              )}
              {/* 코너 마커 */}
              {["top-3 left-3", "top-3 right-3 rotate-90", "bottom-3 left-3 -rotate-90", "bottom-3 right-3 rotate-180"].map((cls, i) => (
                <div key={i} className={`absolute ${cls} w-7 h-7 z-20 pointer-events-none`}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M2 8V2h6" stroke={isComparing ? "#818CF8" : "#60A5FA"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ))}
            </div>

            {/* 진행 단계 표시 */}
            <div className="flex items-center gap-2 mb-6">
              {["얼굴 감지", "특징 추출", "DB 비교"].map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      isComparing ? (i < 2 ? "bg-blue-400" : "bg-blue-400 blink") : (i === 0 ? "bg-blue-400 blink" : "bg-slate-700")
                    }`} />
                    <span className="text-slate-500 text-[10px] whitespace-nowrap">{label}</span>
                  </div>
                  {i < 2 && <div className="w-8 h-px bg-slate-800 mb-3" />}
                </div>
              ))}
            </div>

            <p className="text-slate-500 text-xs text-center">
              {isComparing
                ? `등록된 사용자와 유클리드 거리를 계산하는 중${".".repeat(dots)}`
                : `얼굴이 감지되면 자동으로 인증이 진행됩니다${".".repeat(dots)}`}
            </p>
          </div>
        )}

        {/* ── SUCCESS 단계 ────────────────────────────── */}
        {step === "success" && matchResult && (
          <div className="flex-1 flex flex-col items-center justify-center fade-in-up pb-12">
            {/* 성공 아이콘 */}
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <h3 className="text-white font-bold text-2xl mb-1">인증 완료!</h3>
            <p className="text-emerald-400 text-base font-semibold mb-1">{matchResult.user.name}</p>
            <p className="text-slate-400 text-xs mb-8">신원이 확인되었습니다</p>

            {/* 일치율 게이지 */}
            <div className="w-full rounded-2xl bg-slate-900/60 border border-slate-800/60 p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm">얼굴 일치율</span>
                <span className="text-emerald-400 text-xl font-bold">{matchResult.similarity}%</span>
              </div>
              {/* 진행 바 */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${matchResult.similarity}%`,
                    background: `linear-gradient(90deg, #10B981, #34D399)`,
                  }}
                />
              </div>
              {/* 기준선 표시 */}
              <div className="flex items-center justify-between text-xs text-slate-600 mb-4">
                <span>0%</span>
                <span className="text-slate-500">기준: {AUTH_THRESHOLD}%</span>
                <span>100%</span>
              </div>
              {/* 상세 정보 */}
              {[
                { label: "인증된 사용자", value: matchResult.user.name },
                { label: "벡터 거리", value: matchResult.distance.toFixed(4) },
                { label: "인증 방식", value: "128D 유클리드 거리" },
                { label: "인증 시각", value: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) },
              ].map((item, i) => (
                <div key={i} className={`flex justify-between items-center py-2.5 ${i < 3 ? "border-b border-slate-800/60" : ""}`}>
                  <span className="text-slate-500 text-sm">{item.label}</span>
                  <span className="text-white text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col w-full gap-3">
              <Link href="/" className="w-full">
                <button className="w-full rounded-2xl py-[18px] font-semibold text-white text-base
                  bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                  active:scale-[0.98] transition-all duration-200 shadow-[0_4px_24px_rgba(59,130,246,0.3)] cursor-pointer">
                  홈으로
                </button>
              </Link>
              <button onClick={reset}
                className="w-full rounded-2xl py-[18px] font-semibold text-slate-400 text-base
                  border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/30
                  active:scale-[0.98] transition-all duration-200 cursor-pointer">
                다시 인증
              </button>
            </div>
          </div>
        )}

        {/* ── FAIL 단계 ───────────────────────────────── */}
        {step === "fail" && (
          <div className="flex-1 flex flex-col items-center justify-center fade-in-up pb-12">
            {/* 실패 아이콘 */}
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <h3 className="text-white font-bold text-2xl mb-2">인증 실패</h3>
            <p className="text-red-400 text-sm mb-8 text-center leading-relaxed whitespace-pre-line">{authError}</p>

            {/* 일치율 있으면 표시 */}
            {matchResult && (
              <div className="w-full rounded-2xl bg-slate-900/60 border border-red-900/30 p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm">측정된 일치율</span>
                  <span className="text-red-400 text-xl font-bold">{matchResult.similarity}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                    style={{ width: `${matchResult.similarity}%` }}
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <span className="text-slate-600 text-xs">기준: {AUTH_THRESHOLD}% 이상</span>
                </div>
              </div>
            )}

            <div className="w-full rounded-2xl bg-slate-900/60 border border-slate-800/60 p-4 mb-6">
              <p className="text-slate-500 text-xs font-medium mb-3 uppercase tracking-wider">확인사항</p>
              {[
                "밝은 조명 아래에서 정면을 바라봐주세요",
                "마스크, 선글라스 착용을 피해주세요",
                "등록할 때와 같은 조건에서 시도해주세요",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2.5 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <span className="text-slate-400 text-sm">{text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col w-full gap-3">
              <button onClick={reset}
                className="w-full rounded-2xl py-[18px] font-semibold text-white text-base
                  bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                  active:scale-[0.98] transition-all duration-200 shadow-[0_4px_24px_rgba(59,130,246,0.3)] cursor-pointer">
                다시 시도
              </button>
              <Link href="/register" className="w-full">
                <button className="w-full rounded-2xl py-[18px] font-semibold text-slate-400 text-base
                  border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/30
                  active:scale-[0.98] transition-all duration-200 cursor-pointer">
                  얼굴 재등록
                </button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
