-- Seed initial users for ArtShop
-- Passwords are hashed with bcrypt (salt rounds = 10)
--
-- User credentials:
-- 1. admin@example.com / admin123 (ADMIN)
-- 2. user@example.com / user123 (USER)
-- 3. john.doe@example.com / password123 (USER)
-- 4. jane.smith@example.com / password456 (USER)

INSERT INTO users (
    id,
    email,
    password,
    first_name,
    last_name,
    phone,
    role,
    is_active,
    created_at,
    updated_at
) VALUES
-- Admin user (admin@example.com / admin123)
(
    uuid_generate_v4(),
    'admin@example.com',
    '$2b$10$mBYqUvcW1zxXm0YNss2SCOSgzwpLhPgi4OgcFYTuvSBKd.URio.ay',
    'Matthéo',
    'Naegellen',
    '0611223344',
    'admin',
    true,
    '2024-01-01 00:00:00',
    '2024-06-01 00:00:00'
),
-- Regular user (user@example.com / user123)
(
    uuid_generate_v4(),
    'user@example.com',
    '$2b$10$nBPQ5GAjD7p3HGvsxdBrgeV300nqe5wSZ8QijXuWKvtn9GPq.lOk2',
    'User',
    'Name',
    '0655443322',
    'user',
    true,
    '2024-01-02 00:00:00',
    '2024-06-02 00:00:00'
),
-- John Doe (john.doe@example.com / password123)
(
    uuid_generate_v4(),
    'john.doe@example.com',
    '$2b$10$0TDYCcfgNLIWcPhxmUcbFOtt15yKnxdi.lXIlEoHamez6QPaGVhh.',
    'John',
    'Doe',
    '0677889900',
    'user',
    true,
    '2024-02-15 10:30:00',
    '2024-06-15 10:30:00'
),
-- Jane Smith (jane.smith@example.com / password456)
(
    uuid_generate_v4(),
    'jane.smith@example.com',
    '$2b$10$/.OamQAZlYsMJz0VQZTr8uqLc5o9PRFbWi.hFvEFrQJM6XtEljadK',
    'Jane',
    'Smith',
    '0644556677',
    'user',
    true,
    '2024-03-20 14:00:00',
    '2024-06-20 14:00:00'
);

-- Afficher le nombre d'utilisateurs insérés
SELECT COUNT(*) as "Users created" FROM users;
