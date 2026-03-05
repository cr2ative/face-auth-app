import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── 타입 ──────────────────────────────────────────────
export interface FaceUser {
  id: string;
  name: string;
  descriptor: number[];   // Float32Array(128) → JSON 배열
  created_at: string;
}

export interface MatchResult {
  user: FaceUser;
  distance: number;
  similarity: number; // 0-100 (%)
}

// ── 유사도 계산 ───────────────────────────────────────
/**
 * 두 얼굴 디스크립터 사이의 유클리드 거리
 * 동일인: ~0.0-0.4  /  다른 사람: ~0.5-1.0+
 */
export function euclideanDistance(
  d1: Float32Array | number[],
  d2: Float32Array | number[]
): number {
  let sum = 0;
  for (let i = 0; i < d1.length; i++) {
    const diff = d1[i] - d2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * 유클리드 거리 → 일치율(%)
 * distance 0.0 → 100%
 * distance 0.5 → 50%
 * distance 1.0 → 0%
 */
export function toSimilarity(distance: number): number {
  return Math.max(0, Math.min(100, Math.round((1 - distance) * 100)));
}

// ── Supabase CRUD ─────────────────────────────────────
/** 등록된 전체 사용자 불러오기 */
export async function fetchAllUsers(): Promise<FaceUser[]> {
  const { data, error } = await supabase
    .from("face_users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`사용자 조회 실패: ${error.message}`);
  return data as FaceUser[];
}

/** 이름 + 얼굴 디스크립터 저장 */
export async function saveUser(
  name: string,
  descriptor: Float32Array
): Promise<FaceUser> {
  const { data, error } = await supabase
    .from("face_users")
    .insert({ name: name.trim(), descriptor: Array.from(descriptor) })
    .select()
    .single();

  if (error) throw new Error(`저장 실패: ${error.message}`);
  return data as FaceUser;
}

/** 카메라 디스크립터와 DB 전체 비교 → 가장 유사한 사용자 반환 */
export function findBestMatch(
  queryDescriptor: Float32Array,
  users: FaceUser[]
): MatchResult | null {
  if (users.length === 0) return null;

  let best: MatchResult | null = null;

  for (const user of users) {
    const distance = euclideanDistance(queryDescriptor, user.descriptor);
    const similarity = toSimilarity(distance);

    if (!best || distance < best.distance) {
      best = { user, distance, similarity };
    }
  }

  return best;
}
