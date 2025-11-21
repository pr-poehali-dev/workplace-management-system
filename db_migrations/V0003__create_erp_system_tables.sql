-- Таблица пользователей с ролями
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица разделов
CREATE TABLE IF NOT EXISTS sections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES sections(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица цветов
CREATE TABLE IF NOT EXISTS colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица материалов
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color_id INTEGER REFERENCES colors(id),
    section_id INTEGER REFERENCES sections(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица прихода материалов
CREATE TABLE IF NOT EXISTS arrivals (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id),
    color_id INTEGER REFERENCES colors(id),
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'шт',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Таблица склада
CREATE TABLE IF NOT EXISTS warehouse (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id),
    color_id INTEGER REFERENCES colors(id),
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'шт',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(material_id, color_id)
);

-- Таблица заявок
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id),
    size VARCHAR(255),
    color_id INTEGER REFERENCES colors(id),
    quantity_requested DECIMAL(10, 2) NOT NULL,
    quantity_completed DECIMAL(10, 2) DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'шт',
    status VARCHAR(50) NOT NULL CHECK (status IN ('new', 'in_progress', 'completed')) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Таблица отправки
CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    warehouse_id INTEGER REFERENCES warehouse(id),
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'шт',
    status VARCHAR(50) NOT NULL CHECK (status IN ('ready', 'shipped')) DEFAULT 'ready',
    shipped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Таблица брака
CREATE TABLE IF NOT EXISTS defects (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id),
    color_id INTEGER REFERENCES colors(id),
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'шт',
    reason TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('reported', 'disposed')) DEFAULT 'reported',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disposed_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Таблица данных сэндвич-панелей
CREATE TABLE IF NOT EXISTS sandwich_data (
    id SERIAL PRIMARY KEY,
    row_number INTEGER NOT NULL,
    liter VARCHAR(50),
    bs VARCHAR(50),
    floor VARCHAR(50),
    kv_1 VARCHAR(255),
    kv_2 VARCHAR(255),
    kv_3 VARCHAR(255),
    kv_4 VARCHAR(255),
    kv_5 VARCHAR(255),
    kv_6 VARCHAR(255),
    kv_7 VARCHAR(255),
    kv_8 VARCHAR(255),
    kv_9 VARCHAR(255),
    kv_10 VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_warehouse_material_color ON warehouse(material_id, color_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_colors_usage ON colors(usage_count DESC);

-- Вставляем администратора по умолчанию (пароль: adminik)
INSERT INTO users (username, password, full_name, role) 
VALUES ('admin', 'adminik', 'Администратор', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Вставляем базовые разделы
INSERT INTO sections (name, parent_id) VALUES 
    ('Ламинация', NULL),
    ('Москитки', NULL),
    ('Жесть', NULL),
    ('Другое', NULL),
    ('Сендвич', NULL),
    ('Расходники', NULL)
ON CONFLICT DO NOTHING;