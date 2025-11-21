INSERT INTO t_p61217265_workplace_management.users (username, password, full_name, role)
VALUES ('adminik', 'admin', 'Администратор', 'admin')
ON CONFLICT (username) DO NOTHING;

CREATE TABLE IF NOT EXISTS t_p61217265_workplace_management.admin_credentials (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO t_p61217265_workplace_management.admin_credentials (username, password)
VALUES ('adminik', 'admin')
ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password;
