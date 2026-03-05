-- =============================================
-- face_users 테이블
-- Supabase 대시보드 > SQL Editor 에서 실행
-- =============================================

CREATE TABLE IF NOT EXISTS face_users (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        NOT NULL,
  descriptor  JSONB       NOT NULL,   -- Float32Array(128) → number[] JSON 배열
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 (이름 검색용)
CREATE INDEX IF NOT EXISTS face_users_name_idx ON face_users (name);

-- RLS 활성화 (데모용: 전체 허용)
ALTER TABLE face_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for demo" ON face_users;
CREATE POLICY "Allow all for demo"
  ON face_users FOR ALL
  USING (true)
  WITH CHECK (true);
