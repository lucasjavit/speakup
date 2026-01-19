-- V8: Add user registration fields (id_number, country, city, address)
ALTER TABLE users
ADD COLUMN id_number VARCHAR(50),
ADD COLUMN country VARCHAR(100),
ADD COLUMN city VARCHAR(100),
ADD COLUMN address VARCHAR(500);

COMMENT ON COLUMN users.id_number IS 'User identification document number';
COMMENT ON COLUMN users.country IS 'Country of residence';
COMMENT ON COLUMN users.city IS 'City of residence';
COMMENT ON COLUMN users.address IS 'Full address (optional)';
