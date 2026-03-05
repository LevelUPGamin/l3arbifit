-- Make user admin by email
-- Replace 'playnassro2@gmail.com' with your actual email if different

-- First, find the user ID by email
-- Then insert admin role for that user

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'playnassro2@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the user is now an admin
SELECT
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'playnassro2@gmail.com';