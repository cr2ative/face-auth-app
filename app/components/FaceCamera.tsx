"use client";

import { useRef, useEffect, useState } from "react";

const MODEL_URL = "/models";

// ── 모델 캐시 (재마운트 시 재로딩 방지) ──────────────
const LOADED = { base: false, recognition: false };
const LOADING: { base: Promise<void> | null; recognition: Promise<void> | null } = {
  base: null,
  recognition: null,
};

async function ensureBaseModels() {
  if (LOADED.base) return;
  if (LOADING.base) return LOADING.base;
  LOADING.base = (async () => {
    const fa = await import("face-api.js");
    await Promise.all([
      fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      fa.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    ]);
    LOADED.base = true;
  })();
  return LOADING.base;
}

async function ensureRecognitionModel() {
  if (LOADED.recognition) return;
  if (LOADING.recognition) return LOADING.recognition;
  LOADING.recognition = (async () => {
    const fa = await import("face-api.js");
    await fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    LOADED.recognition = true;
  })();
  return LOADING.recognition;
}

// ── 공개 타입 ──────────────────────────────────────────
export interface FaceInfo {
  score: number;
  landmarks: number;
  box: { x: number; y: number; width: number; height: number };
  descriptor?: Float32Array; // computeDescriptor=true 일 때 포함
}

interface Props {
  active?: boolean;
  showLandmarks?: boolean;
  computeDescriptor?: boolean;                              // 128D 특징값 추출 여부
  onFaceDetected?: (detected: boolean, info?: FaceInfo) => void;
  onDescriptor?: (descriptor: Float32Array) => void;        // 안정적 얼굴 감지 시 콜백
}

export default function FaceCamera({
  active = true,
  showLandmarks = true,
  computeDescriptor = false,
  onFaceDetected,
  onDescriptor,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  // 클로저 문제 방지 - prop을 ref로 관리
  const showLandmarksRef = useRef(showLandmarks);
  const computeDescRef = useRef(computeDescriptor);
  const onFaceDetectedRef = useRef(onFaceDetected);
  const onDescriptorRef = useRef(onDescriptor);
  useEffect(() => { showLandmarksRef.current = showLandmarks; }, [showLandmarks]);
  useEffect(() => { computeDescRef.current = computeDescriptor; }, [computeDescriptor]);
  useEffect(() => { onFaceDetectedRef.current = onFaceDetected; }, [onFaceDetected]);
  useEffect(() => { onDescriptorRef.current = onDescriptor; }, [onDescriptor]);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadMsg, setLoadMsg] = useState("AI 모델 로딩 중...");
  const [errorMsg, setErrorMsg] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceScore, setFaceScore] = useState(0);
  const [lmCount, setLmCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function setup() {
      try {
        setStatus("loading");
        setLoadMsg("AI 모델 로딩 중...");

        // 기본 모델 (탐지 + 랜드마크)
        await ensureBaseModels();
        if (cancelled) return;

        // 인식 모델 (descriptor 추출용) - computeDescriptor=true 일 때만
        if (computeDescriptor) {
          setLoadMsg("인식 모델 로딩 중...");
          await ensureRecognitionModel();
          if (cancelled) return;
        }

        // 카메라 스트림
        setLoadMsg("카메라 연결 중...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;

        setStatus("ready");

        const fa = await import("face-api.js");
        const opts = new fa.TinyFaceDetectorOptions({ scoreThreshold: 0.45, inputSize: 320 });

        // ── 감지 루프 ───────────────────────────────────
        async function loop() {
          if (cancelled) return;
          const vid = videoRef.current;
          const cvs = canvasRef.current;
          if (!vid || !cvs || vid.readyState < 2) {
            rafRef.current = requestAnimationFrame(loop);
            return;
          }

          if (cvs.width !== vid.videoWidth) cvs.width = vid.videoWidth;
          if (cvs.height !== vid.videoHeight) cvs.height = vid.videoHeight;

          const displaySize = { width: vid.videoWidth, height: vid.videoHeight };
          const ctx = cvs.getContext("2d")!;

          // descriptor 추출 여부에 따라 체인 분기
          let result;
          if (computeDescRef.current && LOADED.recognition) {
            result = await fa
              .detectSingleFace(vid, opts)
              .withFaceLandmarks(true)
              .withFaceDescriptor();
          } else {
            result = await fa
              .detectSingleFace(vid, opts)
              .withFaceLandmarks(true);
          }

          if (cancelled) return;
          ctx.clearRect(0, 0, cvs.width, cvs.height);

          if (result) {
            const r = fa.resizeResults(result, displaySize);
            const { x, y, width, height } = r.detection.box;
            const score = r.detection.score;

            // ── 바운딩 박스 ───────────────────────────
            ctx.fillStyle = "rgba(59, 130, 246, 0.07)";
            ctx.fillRect(x, y, width, height);

            ctx.strokeStyle = "#3B82F6";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([]);
            ctx.strokeRect(x, y, width, height);

            // 코너 브라켓
            const cLen = Math.min(24, width * 0.2);
            ctx.strokeStyle = "#60A5FA";
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            [
              [x, y + cLen,              x, y,          x + cLen, y],
              [x + width - cLen, y,      x + width, y,  x + width, y + cLen],
              [x, y + height - cLen,     x, y + height, x + cLen, y + height],
              [x + width - cLen, y + height, x + width, y + height, x + width, y + height - cLen],
            ].forEach(([x1, y1, mx, my, x2, y2]) => {
              ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(mx, my); ctx.lineTo(x2, y2); ctx.stroke();
            });

            // 신뢰도 배지
            const badge = `${(score * 100).toFixed(0)}%`;
            ctx.font = "bold 11px 'Courier New', monospace";
            const tw = ctx.measureText(badge).width + 14;
            const bh = 20, br = 4;
            const bx = x, by = Math.max(0, y - bh - 3);
            ctx.fillStyle = "rgba(37, 99, 235, 0.88)";
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(bx, by, tw, bh, br);
            else ctx.rect(bx, by, tw, bh);
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.fillText(badge, bx + 7, by + 14);

            // ── 랜드마크 (68점) ───────────────────────
            if (showLandmarksRef.current) {
              const pts = r.landmarks.positions;

              const drawLine = (indices: number[], closed: boolean, color: string) => {
                if (indices.length < 2) return;
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 0.9;
                ctx.moveTo(pts[indices[0]].x, pts[indices[0]].y);
                for (let i = 1; i < indices.length; i++) ctx.lineTo(pts[indices[i]].x, pts[indices[i]].y);
                if (closed) ctx.closePath();
                ctx.stroke();
              };

              drawLine([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], false, "rgba(96,165,250,0.40)");
              drawLine([17,18,19,20,21], false, "rgba(129,140,248,0.60)");
              drawLine([22,23,24,25,26], false, "rgba(129,140,248,0.60)");
              drawLine([27,28,29,30], false, "rgba(52,211,153,0.55)");
              drawLine([30,31,32,33,34,35,30], false, "rgba(52,211,153,0.45)");
              drawLine([36,37,38,39,40,41], true, "rgba(244,114,182,0.60)");
              drawLine([42,43,44,45,46,47], true, "rgba(244,114,182,0.60)");
              drawLine([48,49,50,51,52,53,54,55,56,57,58,59], true, "rgba(251,146,60,0.50)");
              drawLine([60,61,62,63,64,65,66,67], true, "rgba(251,146,60,0.50)");

              pts.forEach((pt, i) => {
                const color = i < 17 ? "#60A5FA" : i < 27 ? "#818CF8" : i < 36 ? "#34D399" : i < 48 ? "#F472B6" : "#FB923C";
                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.arc(pt.x, pt.y, 1.7, 0, 2 * Math.PI);
                ctx.fill();
              });

              setLmCount(pts.length);
            }

            // descriptor 콜백
            const descriptor = "descriptor" in r ? (r as { descriptor: Float32Array }).descriptor : undefined;
            const info: FaceInfo = {
              score,
              landmarks: r.landmarks.positions.length,
              box: { x, y, width, height },
              ...(descriptor ? { descriptor } : {}),
            };
            setFaceDetected(true);
            setFaceScore(score);
            onFaceDetectedRef.current?.(true, info);
            if (descriptor) onDescriptorRef.current?.(descriptor);
          } else {
            setFaceDetected(false);
            setFaceScore(0);
            setLmCount(0);
            onFaceDetectedRef.current?.(false);
          }

          rafRef.current = requestAnimationFrame(loop);
        }

        loop();
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg(
          msg.includes("NotAllowed") || msg.includes("Permission") || msg.includes("denied")
            ? "카메라 접근 권한이 필요합니다.\n브라우저 주소창 옆 카메라 아이콘을 허용해주세요."
            : msg.includes("NotFound")
            ? "카메라를 찾을 수 없습니다."
            : "카메라 초기화에 실패했습니다."
        );
        setStatus("error");
        console.error("[FaceCamera]", err);
      }
    }

    setup();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setFaceDetected(false);
      setFaceScore(0);
      setLmCount(0);
    };
  }, [active, computeDescriptor]);

  return (
    <div className="relative w-full h-full bg-[#0A0F1E] rounded-3xl overflow-hidden">

      {/* 로딩 */}
      {status === "loading" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070B14]/95">
          <div className="w-10 h-10 rounded-full border-2 border-blue-800/40 border-t-blue-500 animate-spin mb-4" />
          <p className="text-white text-sm font-medium">{loadMsg}</p>
          <p className="text-slate-500 text-xs mt-1.5">잠시만 기다려주세요</p>
        </div>
      )}

      {/* 오류 */}
      {status === "error" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070B14]/95 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#EF4444" strokeWidth="1.5"/>
              <path d="M12 8v5M12 16h.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-red-400 text-sm font-semibold mb-2">카메라 오류</p>
          <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-line">{errorMsg}</p>
        </div>
      )}

      {/* 비디오 (셀피 모드) */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: "scaleX(-1)" }}
        playsInline
        muted
      />

      {/* 감지 캔버스 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ transform: "scaleX(-1)" }}
      />

      {/* 상태 표시 */}
      {status === "ready" && (
        <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md border transition-all duration-500 ${
          faceDetected
            ? "bg-emerald-950/80 border-emerald-500/40"
            : "bg-slate-950/80 border-slate-700/50"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${faceDetected ? "bg-emerald-400 blink" : "bg-slate-600"}`} />
          <span className={`text-xs font-medium whitespace-nowrap tracking-tight ${faceDetected ? "text-emerald-300" : "text-slate-400"}`}>
            {faceDetected
              ? `얼굴 감지됨 · ${(faceScore * 100).toFixed(0)}% · ${lmCount}pt`
              : "얼굴 감지 중..."}
          </span>
        </div>
      )}
    </div>
  );
}
