-- Lock snapshot sync to the signed-in user's own workspace (`u:<auth.uid()>`).
ALTER TABLE packlog_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packlog_snapshots_select" ON packlog_snapshots;
CREATE POLICY "packlog_snapshots_select"
ON packlog_snapshots FOR SELECT
TO authenticated
USING (workspace = ('u:' || auth.uid()::text));

DROP POLICY IF EXISTS "packlog_snapshots_insert" ON packlog_snapshots;
CREATE POLICY "packlog_snapshots_insert"
ON packlog_snapshots FOR INSERT
TO authenticated
WITH CHECK (workspace = ('u:' || auth.uid()::text));

DROP POLICY IF EXISTS "packlog_snapshots_update" ON packlog_snapshots;
CREATE POLICY "packlog_snapshots_update"
ON packlog_snapshots FOR UPDATE
TO authenticated
USING (workspace = ('u:' || auth.uid()::text))
WITH CHECK (workspace = ('u:' || auth.uid()::text));

DROP POLICY IF EXISTS "packlog_snapshots_delete" ON packlog_snapshots;
CREATE POLICY "packlog_snapshots_delete"
ON packlog_snapshots FOR DELETE
TO authenticated
USING (workspace = ('u:' || auth.uid()::text));
