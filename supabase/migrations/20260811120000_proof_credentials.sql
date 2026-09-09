-- Proof Profile: allow consensus verification updates + atomic peer-audit RPC
-- Credential = submission with defense answers + >= 2 guild peer reviews → VERIFIED + seal hash

-- Authenticated auditors / system path may update submission consensus fields
CREATE POLICY "Allow authenticated update submission consensus"
  ON public.submissions
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow user insert guild badge"
  ON public.guild_badges
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Atomically record a peer review and seal the submission at 2 guild audits
CREATE OR REPLACE FUNCTION public.record_guild_audit(
  p_submission_id UUID,
  p_architecture_rating INT,
  p_edge_cases_rating INT,
  p_defense_clarity_rating INT,
  p_feedback_text TEXT,
  p_inline_comments JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  review_id UUID,
  reviews_count INT,
  status submission_status_enum,
  consensus_seal_hash TEXT,
  sealed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reviewer UUID := auth.uid();
  v_author UUID;
  v_reviews INT;
  v_defense JSONB;
  v_has_defense BOOLEAN;
  v_review_id UUID;
  v_status submission_status_enum;
  v_seal TEXT;
  v_overall DOUBLE PRECISION;
  v_sealed BOOLEAN := FALSE;
BEGIN
  IF v_reviewer IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT s.author_id, s.defense_answers, s.status
  INTO v_author, v_defense, v_status
  FROM public.submissions s
  WHERE s.id = p_submission_id
  FOR UPDATE;

  IF v_author IS NULL THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  IF v_author = v_reviewer THEN
    RAISE EXCEPTION 'Cannot audit your own submission';
  END IF;

  v_has_defense := EXISTS (
    SELECT 1
    FROM jsonb_each_text(COALESCE(v_defense, '{}'::jsonb)) AS d(key, value)
    WHERE length(trim(d.value)) > 0
  );

  IF NOT v_has_defense THEN
    RAISE EXCEPTION 'Submission missing Anti-AI Defense Gate answers';
  END IF;

  v_overall := (
    COALESCE(p_architecture_rating, 5)
    + COALESCE(p_edge_cases_rating, 5)
    + COALESCE(p_defense_clarity_rating, 5)
  ) / 3.0;

  INSERT INTO public.peer_reviews (
    submission_id,
    reviewer_id,
    architecture_rating,
    edge_cases_rating,
    defense_clarity_rating,
    overall_score,
    feedback_text,
    inline_comments
  )
  VALUES (
    p_submission_id,
    v_reviewer,
    COALESCE(p_architecture_rating, 5),
    COALESCE(p_edge_cases_rating, 5),
    COALESCE(p_defense_clarity_rating, 5),
    v_overall,
    p_feedback_text,
    COALESCE(p_inline_comments, '[]'::jsonb)
  )
  RETURNING id INTO v_review_id;

  SELECT COUNT(*)::INT INTO v_reviews
  FROM public.peer_reviews
  WHERE submission_id = p_submission_id;

  v_seal := NULL;
  IF v_reviews >= 2 THEN
    v_seal := 'napsed_seal_'
      || replace(p_submission_id::text, '-', '')
      || '_'
      || v_reviews::text
      || '_'
      || replace(gen_random_uuid()::text, '-', '');
    v_status := 'VERIFIED'::submission_status_enum;
    v_sealed := TRUE;
  END IF;

  UPDATE public.submissions s
  SET
    reviews_count = v_reviews,
    consensus_score = (
      SELECT AVG(pr.overall_score) FROM public.peer_reviews pr WHERE pr.submission_id = p_submission_id
    ),
    consensus_seal_hash = COALESCE(s.consensus_seal_hash, v_seal),
    status = CASE
      WHEN v_reviews >= 2 THEN 'VERIFIED'::submission_status_enum
      ELSE s.status
    END,
    updated_at = NOW()
  WHERE s.id = p_submission_id
  RETURNING s.status, s.consensus_seal_hash INTO v_status, v_seal;

  review_id := v_review_id;
  reviews_count := v_reviews;
  status := v_status;
  consensus_seal_hash := v_seal;
  sealed := v_sealed;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.record_guild_audit(UUID, INT, INT, INT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_guild_audit(UUID, INT, INT, INT, TEXT, JSONB) TO authenticated;

-- Partial index for Proof Profile ledger lookups (verified credentials by author)
CREATE INDEX IF NOT EXISTS idx_submissions_author_verified
  ON public.submissions (author_id, submitted_at DESC)
  WHERE status = 'VERIFIED' OR reviews_count >= 2 OR consensus_seal_hash IS NOT NULL;
