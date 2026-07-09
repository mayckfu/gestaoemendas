create unique index if not exists profiles_cpf_digits_unique
on public.profiles (regexp_replace(coalesce(cpf, ''), '\D', '', 'g'))
where length(regexp_replace(coalesce(cpf, ''), '\D', '', 'g')) = 11;
