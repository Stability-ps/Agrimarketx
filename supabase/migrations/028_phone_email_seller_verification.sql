alter table public.seller_verifications
add column if not exists phone_verified boolean not null default false,
add column if not exists phone_verified_at timestamptz,
add column if not exists email_verified boolean not null default false,
add column if not exists email_verified_at timestamptz;

create index if not exists seller_verifications_phone_verified_idx on public.seller_verifications(phone_verified);
create index if not exists seller_verifications_email_verified_idx on public.seller_verifications(email_verified);
