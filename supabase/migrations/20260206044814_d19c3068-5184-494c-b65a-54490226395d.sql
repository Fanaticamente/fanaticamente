-- Adicionar página de autenticação/login ao sistema
INSERT INTO app_pages (page_id, name, path, icon, description, is_visible, is_public, platform, order_index)
VALUES ('auth', 'Login / Entrar', '/auth', 'LogIn', 'Página de autenticação e cadastro de usuários', true, true, 'both', 0);