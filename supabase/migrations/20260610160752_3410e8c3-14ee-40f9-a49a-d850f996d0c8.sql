UPDATE auth.users
SET encrypted_password = crypt('Jules20021023', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email = 'jules2310.peron@gmail.com';

UPDATE auth.users
SET email_confirmed_at = now(),
    updated_at = now()
WHERE email_confirmed_at IS NULL;