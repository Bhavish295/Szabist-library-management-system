-- Run this if your database was created before the hold-queue (waitlist)
-- feature was added. Safe to run once; schema.sql already reflects this
-- for fresh installs.

USE szabist_library;

ALTER TABLE Reservations
  MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'expired', 'cancelled', 'waitlisted') DEFAULT 'pending',
  MODIFY COLUMN expiry_date DATETIME NULL;
