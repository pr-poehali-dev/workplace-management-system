CREATE TABLE IF NOT EXISTS t_p61217265_workplace_management.server_addresses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO t_p61217265_workplace_management.server_addresses (name, address, is_active) 
VALUES ('Основной сервер', 'http://localhost:3000', true);
