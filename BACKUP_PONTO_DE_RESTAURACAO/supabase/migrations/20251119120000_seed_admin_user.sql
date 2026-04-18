-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure cargos exist (idempotent)
INSERT INTO public.cargos (nome, descricao, default_role, active)
SELECT 'Administrador', 'Acesso total ao sistema', 'ADMIN', true
WHERE NOT EXISTS (SELECT 1 FROM public.cargos WHERE default_role = 'ADMIN');

INSERT INTO public.cargos (nome, descricao, default_role, active)
SELECT 'Gestor', 'Gestão financeira e operacional', 'GESTOR', true
WHERE NOT EXISTS (SELECT 1 FROM public.cargos WHERE default_role = 'GESTOR');

INSERT INTO public.cargos (nome, descricao, default_role, active)
SELECT 'Analista', 'Análise e lançamento de dados', 'ANALISTA', true
WHERE NOT EXISTS (SELECT 1 FROM public.cargos WHERE default_role = 'ANALISTA');

INSERT INTO public.cargos (nome, descricao, default_role, active)
SELECT 'Consulta', 'Apenas visualização', 'CONSULTA', true
WHERE NOT EXISTS (SELECT 1 FROM public.cargos WHERE default_role = 'CONSULTA');

-- Create or Update Admin User
DO $$
DECLARE
  v_admin_email text := 'rickmayck89@gmail.com';
  v_admin_password text := '1234567';
  v_admin_name text := 'Rick Mayck';
  v_user_id uuid;
  v_cargo_id uuid;
BEGIN
  -- Get Admin Cargo ID
  SELECT id INTO v_cargo_id FROM public.cargos WHERE default_role = 'ADMIN' LIMIT 1;

  -- Check if user exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_admin_email;

  IF v_user_id IS NULL THEN
    -- Create new user in auth.users
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_admin_email,
      crypt(v_admin_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('name', v_admin_name),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Insert into public.profiles
    INSERT INTO public.profiles (
      id,
      name,
      email,
      role,
      status,
      cargo_id,
      unidade
    ) VALUES (
      v_user_id,
      v_admin_name,
      v_admin_email,
      'ADMIN',
      'ATIVO',
      v_cargo_id,
      'Gabinete'
    );

  ELSE
    -- User exists, update password and profile
    UPDATE auth.users
    SET encrypted_password = crypt(v_admin_password, gen_salt('bf'))
    WHERE id = v_user_id;

    -- Update profile
    UPDATE public.profiles
    SET 
      role = 'ADMIN',
      status = 'ATIVO',
      cargo_id = v_cargo_id
    WHERE id = v_user_id;
    
    -- If profile didn't exist for some reason (e.g. deleted manually)
    IF NOT FOUND THEN
      INSERT INTO public.profiles (
        id,
        name,
        email,
        role,
        status,
        cargo_id,
        unidade
      ) VALUES (
        v_user_id,
        v_admin_name,
        v_admin_email,
        'ADMIN',
        'ATIVO',
        v_cargo_id,
        'Gabinete'
      );
    END IF;
  END IF;

  -- Optional: Deactivate old admin if exists
  UPDATE public.profiles
  SET status = 'BLOQUEADO'
  WHERE email = 'admin@asplan.gov' AND email != v_admin_email;

END $$;
