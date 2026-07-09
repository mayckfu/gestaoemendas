create or replace function public.resolve_login_email(login_input text)
returns text
language sql
security definer
set search_path = public
as $$
  with normalized as (
    select
      trim(coalesce(login_input, '')) as raw_input,
      regexp_replace(coalesce(login_input, ''), '\D', '', 'g') as cpf_digits
  )
  select case
    when position('@' in raw_input) > 0 then lower(raw_input)
    when length(cpf_digits) = 11 then (
      select lower(p.email)
      from public.profiles p
      where regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g') = cpf_digits
      limit 1
    )
    else null
  end
  from normalized;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;
