-- Data de término do contrato do cliente
alter table clients add column if not exists contract_end_date date;
NOTIFY pgrst, 'reload schema';
