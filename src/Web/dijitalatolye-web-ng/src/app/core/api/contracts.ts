// Backend kontratlarına birebir karşılık gelen TS tipleri.
// Tek kaynak: bu dosya değiştiğinde tüm kullanım yerleri ayarlanır.

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { email: string; password: string; displayName: string; }
export interface AuthTokens { accessToken: string; refreshToken: string; email?: string; roles?: string[]; }

export type ContentState =
  | 'Draft' | 'Submitted' | 'AIReviewing' | 'AIReviewed'
  | 'EditorReviewing' | 'Approved' | 'Rejected' | 'AutoRejected'
  | 'RevisionRequested' | 'Published' | 'Unpublished';

export interface ContentSummary {
  id: string;
  title: string;
  state: ContentState;
  subject?: string | null;
  gradeLevel?: number | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface ContentDetail extends ContentSummary {
  description?: string | null;
  difficulty?: string | null;
  durationMinutes?: number | null;
  outcomeCodes: string[];
  tags: string[];
  currentVersionId?: string | null;
  coverImageBucket?: string | null;
  coverImageKey?: string | null;
}

export interface CreateContentRequest {
  title: string;
  description?: string | null;
  subject: string;
  gradeLevel?: number | null;
  outcomeCodes: string[];
  tags: string[];
  targetAge?: number | null;
  durationMinutes?: number | null;
  difficulty?: string | null;
  coverImageBucket?: string | null;
  coverImageKey?: string | null;
}

export interface AddVersionRequest {
  bucket: string;
  key: string;
  manifestEntry?: string | null;
  manifestJson?: string | null;
  fileSizeBytes: number;
  sha256?: string | null;
  changeLog?: string | null;
}

export interface AiExtractedMetadataDto {
  title: string | null;
  description: string | null;
  subject: string | null;
  gradeLevel: number | null;
  durationMinutes: number | null;
  difficulty: string | null;
  outcomeCodes: string[];
  tags: string[];
  confidence: number;
  candidateOutcomeCount: number;
  rawDraftResponse?: string | null;
  rawOutcomesResponse?: string | null;
}

export interface AiExtractResponse {
  bucket: string;
  key: string;
  manifestEntry: string;
  fileSizeBytes: number;
  sha256: string;
  metadata: AiExtractedMetadataDto;
  filesScanned: number;
}

export interface CatalogOutcome { code: string; description: string; }
export interface CatalogSubject { id: string; code: string; name: string; }
export interface CatalogGrade { id: number; code: string; name: string; educationStage?: string | null; }
export interface CatalogTag { id: string; slug: string; displayName: string; status: string; usageCount: number; }

export interface PresignedUploadRequest { fileName: string; contentType: string; purpose: 'content' | 'avatar'; }
export interface PresignedUploadResponse { url: string; bucket: string; key: string; expiresAtUtc: string; }
