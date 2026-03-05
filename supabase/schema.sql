-- =============================================
-- Supabase 대시보드 > SQL Editor 에서 실행
-- =============================================

-- 1. 얼굴 사용자 테이블
CREATE TABLE IF NOT EXISTS face_users (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        NOT NULL,
  descriptor  JSONB       NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS face_users_name_idx ON face_users (name);

ALTER TABLE face_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for demo" ON face_users;
CREATE POLICY "Allow all for demo"
  ON face_users FOR ALL USING (true) WITH CHECK (true);


-- 2. 인증 로그 테이블 (신규)
CREATE TABLE IF NOT EXISTS auth_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name   TEXT,                          -- 매칭된 사용자 이름 (없으면 NULL)
  similarity  INTEGER,                       -- 일치율 0~100
  distance    FLOAT8,                        -- 유클리드 거리
  result      TEXT        NOT NULL           -- 'success' | 'fail'
                CHECK (result IN ('success', 'fail')),
  reason      TEXT,                          -- 실패 사유 (선택)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_logs_created_at_idx ON auth_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS auth_logs_result_idx     ON auth_logs (result);

ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for demo" ON auth_logs;
CREATE POLICY "Allow all for demo"
  ON auth_logs FOR ALL USING (true) WITH CHECK (true);
