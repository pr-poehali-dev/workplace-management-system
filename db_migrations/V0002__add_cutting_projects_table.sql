CREATE TABLE cutting_projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sheets_data JSONB NOT NULL,
    optimization_data JSONB,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cutting_projects_created_by ON cutting_projects(created_by);
CREATE INDEX idx_cutting_projects_created_at ON cutting_projects(created_at DESC);
