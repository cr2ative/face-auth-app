"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import FaceCamera from "@/app/components/FaceCamera";
import { saveUser } from "@/lib/supabase";

type Step = "guide" | "saving" | "done";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("guide");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [faceReady, setFaceReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [registeredName, setRegisteredName] = useState("");

  // 최신 descriptor를 ref로 보관 (렌더링 없이 항상 최신값 유지)
  const latestDescriptorRef = useRef<Float32Array | null>(null);

  const handleFaceDetected = useCallback((detected: boolean) => {
    setFaceReady(detected);
    if (!detected) latestDescriptorRef.current = null;
  }, []);

  const handleDescriptor = useCallback((descriptor: Float32Array) => {
    latestDescriptorRef.current = descriptor;
  }, []);

  const handleRegister = async () => {
    // 유효성 검사
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("이름을 입력해주세요.");
      return;
    }
    if (trimmedName.length < 2) {
      setNameError("이름은 2자 이상 입력해주세요.");
      return;
    }
    if (!latestDescriptorRef.current) {
      setNameError("카메라에 얼굴이 감지되어야 합니다.");
      return;
    }

    setNameError("");
    setSaveError("");
    setSaving(true);
    setStep("saving");

    try {
      await saveUser(trimmedName, latestDescriptorRef.current);
      setRegisteredName(trimmedName);
      setStep("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setSaveError(msg);
      setStep("guide");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setStep("guide");
    setName("");
    setNameError("");
    setSaveError("");
    setRegisteredName("");
    setFaceReady(false);
    latestDescriptorRef.current = null;
  };

  const canRegister = name.trim().length >= 2 && faceReady && !saving;

  return (
    <div className="relative flex flex-col min-h-screen bg-[#070B14] overflow-hidden">

      {/* 배경 오브 */}
      <div className="absolute top-[-80px] right-[-60px] w-[250px] h-[250px] rounded-full bg-emerald-500/8 blur-[70px] pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-40px] w-[220px] h-[220px] rounded-full bg-blue-500/8 blur-[70px] pointer-events-none" />

      {/* 헤더 */}
      <header className="flex items-center gap-4 px-6 pt-14 pb-5">
        <Link href="/">
          <button className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center active:scale-95 transition-transform cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </Link>
        <div>
          <h2 className="text-white font-semibold text-lg">얼굴 등록</h2>
          <p className="text-slate-500 text-xs mt-0.5">Face Registration</p>
        </div>
        {/* 단계 도트 */}
        <div className="ml-auto flex items-center gap-1.5">
          {(["guide", "saving", "done"] as Step[]).map((s, i) => (
            <div key={s} className={`rounded-full transition-all duration-300 ${
              step === s ? "w-4 h-1.5 bg-emerald-400" :
              (["guide","saving","done"] as Step[]).indexOf(step) > i ? "w-1.5 h-1.5 bg-emerald-600" :
              "w-1.5 h-1.5 bg-slate-700"
            }`} />
          ))}
        </div>
      </header>

      <main className="flex-1 flex flex-col px-6">

        {/* ── GUIDE 단계 ──────────────────────────────── */}
        {(step === "guide" || step === "saving") && (
          <div className="flex-1 flex flex-col fade-in-up">

            {/* 이름 입력 */}
            <div className="mb-5">
              <label className="block text-slate-400 text-xs font-medium mb-2 tracking-wide">
                등록할 이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(""); }}
                placeholder="이름을 입력해주세요"
                maxLength={20}
                disabled={step === "saving"}
                className="w-full bg-slate-900/70 border border-slate-700/60 rounded-2xl px-4 py-3.5
                  text-white text-sm placeholder:text-slate-600
                  focus:outline-none focus:border-emerald-500/60 focus:bg-slate-900
                  disabled:opacity-50 transition-colors"
              />
              {nameError && (
                <p className="mt-2 text-red-400 text-xs flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="#EF4444" strokeWidth="1.5"/>
                    <path d="M12 8v4M12 15h.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {nameError}
                </p>
              )}
            </div>

            {/* 라이브 카메라 */}
            <div className="relative mx-auto w-64 h-64 mb-5 rounded-3xl overflow-hidden">
              <FaceCamera
                active={step === "guide"}
                showLandmarks={true}
                computeDescriptor={true}
                onFaceDetected={handleFaceDetected}
                onDescriptor={handleDescriptor}
              />
              {/* 코너 마커 */}
              {["top-3 left-3", "top-3 right-3 rotate-90", "bottom-3 left-3 -rotate-90", "bottom-3 right-3 rotate-180"].map((cls, i) => (
                <div key={i} className={`absolute ${cls} w-6 h-6 z-20 pointer-events-none`}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M2 8V2h6" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ))}
            </div>

            {/* 얼굴 감지 상태 */}
            <div className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 mb-5 border transition-all duration-300 ${
              faceReady
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-slate-900/50 border-slate-800/50"
            }`}>
              <div className={`w-2 h-2 rounded-full ${faceReady ? "bg-emerald-400 blink" : "bg-slate-600"}`} />
              <span className={`text-xs font-medium ${faceReady ? "text-emerald-300" : "text-slate-500"}`}>
                {faceReady
                  ? "얼굴 감지됨 · 128D 특징점 추출 완료"
                  : "카메라에 얼굴을 위치시켜주세요"}
              </span>
            </div>

            {/* 저장 오류 */}
            {saveError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 mb-4">
                <p className="text-red-400 text-xs leading-relaxed">{saveError}</p>
              </div>
            )}

            {/* 안내 */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-4 mb-5">
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: "💡", text: "밝은 조명 아래에서 정면을 바라봐주세요" },
                  { icon: "🚫", text: "마스크, 선글라스 착용을 피해주세요" },
                  { icon: "📐", text: "얼굴이 파란 박스 안에 들어와야 합니다" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-slate-400 text-xs">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 등록 버튼 */}
            <button
              onClick={handleRegister}
              disabled={!canRegister}
              className={`w-full rounded-2xl py-[18px] font-semibold text-white text-base
                transition-all duration-200 cursor-pointer mb-4
                ${canRegister
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] shadow-[0_4px_24px_rgba(16,185,129,0.3)]"
                  : "bg-slate-800 opacity-50 cursor-not-allowed"
                }`}
            >
              {step === "saving" ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  저장 중...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17 21 17 13 7 13 7 21" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="7 3 7 8 15 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  얼굴 데이터 등록
                </span>
              )}
            </button>
          </div>
        )}

        {/* ── DONE 단계 ──────────────────────────────── */}
        {step === "done" && (
          <div className="flex-1 flex flex-col items-center justify-center fade-in-up pb-16">
            {/* 성공 아이콘 */}
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <h3 className="text-white font-bold text-2xl mb-2">등록 완료!</h3>
            <p className="text-emerald-400 text-sm mb-2 font-medium">{registeredName}</p>
            <p className="text-slate-500 text-xs text-center mb-10 leading-relaxed">
              128차원 얼굴 특징값이 안전하게 저장되었습니다.
            </p>

            {/* 등록 요약 */}
            <div className="w-full rounded-2xl bg-slate-900/60 border border-slate-800/60 p-5 mb-8">
              {[
                { label: "등록 이름", value: registeredName },
                { label: "특징 벡터", value: "128차원 (Float32)" },
                { label: "저장 위치", value: "Supabase DB" },
                { label: "등록 일시", value: new Date().toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }) },
              ].map((item, i) => (
                <div key={i} className={`flex justify-between items-center py-2.5 ${i < 3 ? "border-b border-slate-800/60" : ""}`}>
                  <span className="text-slate-500 text-sm">{item.label}</span>
                  <span className="text-white text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col w-full gap-3">
              <Link href="/auth" className="w-full">
                <button className="w-full rounded-2xl py-[18px] font-semibold text-white text-base
                  bg-gradient-to-r from-blue-600 to-indigo-600
                  hover:from-blue-500 hover:to-indigo-500
                  active:scale-[0.98] transition-all duration-200
                  shadow-[0_4px_24px_rgba(59,130,246,0.3)] cursor-pointer">
                  인증 테스트
                </button>
              </Link>
              <button onClick={handleReset}
                className="w-full rounded-2xl py-[18px] font-semibold text-slate-400 text-base
                  border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/30
                  active:scale-[0.98] transition-all duration-200 cursor-pointer">
                추가 등록
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
