-- Run with workers stopped. Never invalidate an existing publication.
UPDATE content_versions v SET state='queued',
 draft_metadata=CASE WHEN metadata_confirmed_at IS NOT NULL THEN metadata ELSE draft_metadata END,
 metadata_confirmed_at=NULL, review_snapshot=NULL, error=NULL, updated_at=now()
FROM contents c WHERE c.draft_version_id=v.id
 AND c.published_version_id IS DISTINCT FROM v.id
 AND v.technical_report IS NULL
 AND v.state IN ('queued','scanning','scan_error','extracting','needs_entry','needs_metadata','review','publishing','publish_error');
