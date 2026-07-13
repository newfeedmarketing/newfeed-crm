-- Links e anexo de contrato do cliente
alter table clients add column if not exists drive_url text;
alter table clients add column if not exists results_url text;
alter table clients add column if not exists contract_file_path text;

-- Bucket privado para anexos (contratos etc.)
insert into storage.buckets (id, name, public)
values ('anexos', 'anexos', false)
on conflict (id) do nothing;

create policy "auth_all_anexos" on storage.objects
  for all to authenticated
  using (bucket_id = 'anexos')
  with check (bucket_id = 'anexos');

NOTIFY pgrst, 'reload schema';
