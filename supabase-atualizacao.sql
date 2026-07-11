-- Execute este arquivo UMA VEZ no SQL Editor do Supabase.
-- Ele mantém os cadastros existentes e adiciona a organização por marca.

alter table public.pecas
  add column if not exists marca text not null default 'Sem marca';

update public.pecas
set marca = 'Sem marca'
where marca is null or btrim(marca) = '';

create index if not exists pecas_marca_modelo_idx
  on public.pecas (marca, modelo);

alter table public.pecas enable row level security;

grant select, insert, update, delete on table public.pecas to anon, authenticated;

drop policy if exists "Ler pecas" on public.pecas;
create policy "Ler pecas"
on public.pecas
for select
to anon, authenticated
using (true);

drop policy if exists "Inserir pecas" on public.pecas;
create policy "Inserir pecas"
on public.pecas
for insert
to anon, authenticated
with check (true);

drop policy if exists "Atualizar pecas" on public.pecas;
create policy "Atualizar pecas"
on public.pecas
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Excluir pecas" on public.pecas;
create policy "Excluir pecas"
on public.pecas
for delete
to anon, authenticated
using (true);
