ALTER TABLE manufacturing_advance_payments
MODIFY COLUMN status ENUM('pending', 'paid', 'used', 'cancelled') DEFAULT 'pending',
ADD COLUMN created_by INT,
ADD FOREIGN KEY (created_by) REFERENCES users(id);

-- Update any existing 'unused' statuses to 'pending'
UPDATE manufacturing_advance_payments SET status = 'pending' WHERE status = 'unused';