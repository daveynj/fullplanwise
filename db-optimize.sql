-- Add indexes to improve query performance for lesson filtering and pagination

-- Index for lessons by teacherId (used in almost all lesson queries)
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_id ON lessons(teacher_id);

-- Index for filtering by createdAt (used in date filters)
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons(created_at DESC);

-- Index for filtering by cefrLevel
CREATE INDEX IF NOT EXISTS idx_lessons_cefr_level ON lessons(cefr_level);

-- Composite index for the most common filtering operation: teacherId + createdAt
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_created ON lessons(teacher_id, created_at DESC);

-- Composite index for teacherId + cefrLevel
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_cefr ON lessons(teacher_id, cefr_level);

-- Create a GIN index for text search on title and topic
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_lessons_title_trgm ON lessons USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_lessons_topic_trgm ON lessons USING gin (topic gin_trgm_ops);

-- Add indexes to improve student queries
CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON students(teacher_id);

-- Add an index for student lookup by ID (for student assignment)
CREATE INDEX IF NOT EXISTS idx_lessons_student_id ON lessons(student_id);