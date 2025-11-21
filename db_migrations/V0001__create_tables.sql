-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы категорий
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы цветов
CREATE TABLE IF NOT EXISTS colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hex_code VARCHAR(7),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы материалов
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    color_id INTEGER REFERENCES colors(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы прихода
CREATE TABLE IF NOT EXISTS incoming (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id),
    color_id INTEGER REFERENCES colors(id),
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы склада
CREATE TABLE IF NOT EXISTS warehouse (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id),
    color_id INTEGER REFERENCES colors(id),
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы заявок
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id),
    size VARCHAR(100),
    color_id INTEGER REFERENCES colors(id),
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    completed DECIMAL(10, 2) DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы брака
CREATE TABLE IF NOT EXISTS defects (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id),
    color_id INTEGER REFERENCES colors(id),
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'registered',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы отправок
CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    status VARCHAR(20) NOT NULL,
    shipped_by INTEGER REFERENCES users(id),
    shipped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы раскроя
CREATE TABLE IF NOT EXISTS cutting_sheets (
    id SERIAL PRIMARY KEY,
    liter VARCHAR(50),
    bs VARCHAR(50),
    floor VARCHAR(50),
    kv1 VARCHAR(100),
    kv2 VARCHAR(100),
    kv3 VARCHAR(100),
    kv4 VARCHAR(100),
    kv5 VARCHAR(100),
    kv6 VARCHAR(100),
    kv7 VARCHAR(100),
    kv8 VARCHAR(100),
    kv9 VARCHAR(100),
    kv10 VARCHAR(100),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
