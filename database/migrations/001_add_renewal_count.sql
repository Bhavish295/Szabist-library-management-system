-- Run this if your database was created before renewal support was added.
-- Safe to run once; schema.sql already includes this column for fresh installs.

USE szabist_library;

ALTER TABLE IssuedBooks
  ADD COLUMN IF NOT EXISTS renewal_count INT NOT NULL DEFAULT 0;
