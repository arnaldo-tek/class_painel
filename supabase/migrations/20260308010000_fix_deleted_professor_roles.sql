-- Fix users who were professors, got soft-deleted, but still have professor role.
-- Remove the orphaned professor role so the user can be re-registered with another role.

DELETE FROM public.user_roles
WHERE role = 'professor'
  AND user_id IN (
    SELECT user_id FROM public.professor_profiles
    WHERE deleted_at IS NOT NULL
  );
