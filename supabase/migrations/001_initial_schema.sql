create extension if not exists "pgcrypto";

create type public.app_role as enum ('owner', 'manager', 'worker', 'vet', 'accountant', 'viewer');
create type public.animal_status as enum ('alive', 'to_be_sold', 'to_be_culled', 'missing', 'stolen', 'sold', 'dead', 'reserved', 'in_transit', 'quarantine', 'sick');
create type public.animal_origin as enum ('bred_on_farm', 'purchased', 'marketplace_purchase', 'imported', 'donated');
create type public.gender as enum ('female', 'male', 'unknown');
create type public.billing_interval as enum ('monthly', 'annual');
create type public.transfer_status as enum ('draft', 'seller_ready', 'awaiting_collection', 'in_transit', 'delivered', 'received', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  account_role text not null default 'buyer' check (account_role in ('buyer', 'seller', 'admin', 'super_admin')),
  account_type_selected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.farms (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  owner_name text,
  owner_phone text,
  location text,
  province text,
  country text,
  gps_latitude numeric(10, 7),
  gps_longitude numeric(10, 7),
  size_hectares numeric(12, 2),
  farm_type text,
  facilities text[] not null default '{}',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.farm_members (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null default 'viewer',
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (farm_id, user_id)
);

create table public.species (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  young_name text not null,
  adult_female_name text not null,
  adult_male_name text not null,
  adult_age_threshold_months int not null,
  gestation_period_days int,
  default_breeding_terms text,
  is_default boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.farm_species (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  species_id uuid not null references public.species(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (farm_id, species_id)
);

create table public.camps (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  section_name text,
  size_hectares numeric(12, 2),
  notes text,
  created_at timestamptz not null default now()
);

create table public.herds (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  camp_id uuid references public.camps(id) on delete set null,
  name text not null,
  species_id uuid references public.species(id),
  purpose text,
  created_at timestamptz not null default now()
);

create table public.animals (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  camp_id uuid references public.camps(id) on delete set null,
  herd_id uuid references public.herds(id) on delete set null,
  species_id uuid not null references public.species(id),
  animal_code text not null,
  passport_id text not null unique,
  qr_code_payload text,
  tag_number text,
  rfid_nfc_tag text,
  breed text,
  gender public.gender not null default 'unknown',
  date_of_birth date,
  age_category text,
  current_weight_kg numeric(10, 2),
  status public.animal_status not null default 'alive',
  origin public.animal_origin not null default 'bred_on_farm',
  sire_id uuid references public.animals(id),
  dam_id uuid references public.animals(id),
  public_passport_enabled boolean not null default false,
  notes text,
  sold_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (farm_id, animal_code)
);

create table public.weight_records (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals(id) on delete cascade,
  weight_kg numeric(10, 2) not null,
  measured_at date not null,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.animal_media (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals(id) on delete cascade,
  media_type text not null check (media_type in ('photo', 'video')),
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table public.animal_documents (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals(id) on delete cascade,
  title text not null,
  storage_path text not null,
  document_type text,
  created_at timestamptz not null default now()
);

create table public.product_inventory (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  category text not null,
  batch_number text,
  quantity numeric(12, 2) not null default 0,
  unit text,
  expiry_date date,
  withdrawal_period_days int,
  created_at timestamptz not null default now()
);

create table public.health_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid references public.animals(id) on delete cascade,
  herd_id uuid references public.herds(id) on delete set null,
  record_type text not null check (record_type in ('vaccination', 'treatment', 'deworming', 'dipping', 'vet_record')),
  product_id uuid references public.product_inventory(id),
  product_name text,
  batch_number text,
  dosage text,
  withdrawal_period_days int,
  administered_at date not null,
  due_at date,
  reminder_email boolean not null default true,
  reminder_in_app boolean not null default true,
  reminder_push_ready boolean not null default true,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.breeding_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  female_animal_id uuid not null references public.animals(id) on delete cascade,
  male_animal_id uuid references public.animals(id) on delete set null,
  record_type text not null check (record_type in ('mating', 'exposure', 'pregnancy_check', 'birth', 'weaning')),
  event_date date not null,
  pregnancy_status text,
  expected_birth_date date,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.birth_records (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  dam_id uuid not null references public.animals(id) on delete cascade,
  sire_id uuid references public.animals(id) on delete set null,
  birth_date date not null,
  offspring_count int not null default 1,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid references public.animals(id) on delete set null,
  transaction_type text not null check (transaction_type in ('sale', 'expense', 'feed_purchase', 'medication_cost', 'transport_cost', 'labour_cost', 'valuation', 'payment')),
  amount numeric(14, 2) not null,
  currency text not null default 'ZAR',
  description text not null,
  invoice_number text,
  paid_at date,
  due_at date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_farm_id uuid not null references public.farms(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  title text not null,
  description text,
  price numeric(14, 2) not null,
  currency text not null default 'ZAR',
  province text,
  town text,
  approximate_location text,
  reveal_gps_after_approval boolean not null default true,
  status text not null default 'active' check (status in ('draft', 'active', 'reserved', 'sold', 'removed')),
  created_at timestamptz not null default now()
);

create table public.marketplace_offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(14, 2) not null,
  currency text not null default 'ZAR',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  message text,
  created_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.marketplace_listings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.ownership_transfers (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals(id) on delete cascade,
  seller_farm_id uuid not null references public.farms(id),
  buyer_farm_id uuid references public.farms(id),
  buyer_user_id uuid references public.profiles(id),
  status public.transfer_status not null default 'draft',
  delivery_method text check (delivery_method in ('collect', 'delivery')),
  seller_ready_at timestamptz,
  in_transit_at timestamptz,
  delivered_at timestamptz,
  received_at timestamptz,
  certificate_path text,
  invoice_path text,
  animal_history_pdf_path text,
  created_at timestamptz not null default now()
);

create table public.ownership_history (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals(id) on delete cascade,
  farm_id uuid not null references public.farms(id),
  owner_user_id uuid references public.profiles(id),
  acquired_at timestamptz not null default now(),
  released_at timestamptz,
  transfer_id uuid references public.ownership_transfers(id)
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  animal_limit int,
  feature_limits jsonb not null default '{}',
  stripe_price_monthly_id text,
  stripe_price_annual_id text,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  stripe_customer_id text,
  stripe_subscription_id text,
  billing_interval public.billing_interval not null default 'monthly',
  status text not null default 'trialing',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid references public.ownership_transfers(id) on delete cascade,
  listing_id uuid references public.marketplace_listings(id) on delete cascade,
  opened_by uuid references public.profiles(id),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'closed')),
  summary text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger companies_set_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger farms_set_updated_at before update on public.farms for each row execute function public.set_updated_at();
create trigger animals_set_updated_at before update on public.animals for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

create or replace function public.set_animal_age_category()
returns trigger
language plpgsql
as $$
declare
  species_record record;
  age_months int;
begin
  select young_name, adult_female_name, adult_male_name, adult_age_threshold_months
  into species_record
  from public.species
  where id = new.species_id;

  if new.date_of_birth is null or species_record is null then
    return new;
  end if;

  age_months := (
    date_part('year', age(current_date, new.date_of_birth))::int * 12
    + date_part('month', age(current_date, new.date_of_birth))::int
  );

  if age_months < species_record.adult_age_threshold_months then
    new.age_category = species_record.young_name;
  elsif new.gender = 'female' then
    new.age_category = species_record.adult_female_name;
  elsif new.gender = 'male' then
    new.age_category = species_record.adult_male_name;
  else
    new.age_category = 'Adult';
  end if;

  return new;
end;
$$;

create trigger animals_set_age_category before insert or update of species_id, gender, date_of_birth on public.animals for each row execute function public.set_animal_age_category();

create or replace function public.is_farm_member(target_farm_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.farm_members
    where farm_id = target_farm_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.has_farm_role(target_farm_id uuid, allowed_roles public.app_role[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.farm_members
    where farm_id = target_farm_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.farms enable row level security;
alter table public.farm_members enable row level security;
alter table public.species enable row level security;
alter table public.farm_species enable row level security;
alter table public.camps enable row level security;
alter table public.herds enable row level security;
alter table public.animals enable row level security;
alter table public.weight_records enable row level security;
alter table public.animal_media enable row level security;
alter table public.animal_documents enable row level security;
alter table public.product_inventory enable row level security;
alter table public.health_records enable row level security;
alter table public.breeding_records enable row level security;
alter table public.birth_records enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.marketplace_offers enable row level security;
alter table public.chat_messages enable row level security;
alter table public.ownership_transfers enable row level security;
alter table public.ownership_history enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.disputes enable row level security;

create policy "Users can read own profile" on public.profiles for select using (id = auth.uid());
create policy "Users can update own profile" on public.profiles for update using (id = auth.uid());
create policy "Users can insert own profile" on public.profiles for insert with check (id = auth.uid());

create policy "Company owners can manage companies" on public.companies for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Farm members can read companies" on public.companies for select using (
  exists (
    select 1 from public.farms f
    join public.farm_members fm on fm.farm_id = f.id
    where f.company_id = companies.id and fm.user_id = auth.uid()
  )
);

create policy "Farm members can read farms" on public.farms for select using (public.is_farm_member(id));
create policy "Owners and managers can update farms" on public.farms for update using (public.has_farm_role(id, array['owner','manager']::public.app_role[]));
create policy "Company owners can create farms" on public.farms for insert with check (
  exists (select 1 from public.companies where id = company_id and owner_id = auth.uid())
);

create policy "Members can read farm memberships" on public.farm_members for select using (public.is_farm_member(farm_id));
create policy "Owners manage farm memberships" on public.farm_members for all using (public.has_farm_role(farm_id, array['owner']::public.app_role[])) with check (public.has_farm_role(farm_id, array['owner']::public.app_role[]));
create policy "Company owners create first farm owner membership" on public.farm_members for insert with check (
  role = 'owner'
  and user_id = auth.uid()
  and exists (
    select 1
    from public.farms f
    join public.companies c on c.id = f.company_id
    where f.id = farm_id and c.owner_id = auth.uid()
  )
);

create policy "Anyone authenticated can read species" on public.species for select to authenticated using (true);
create policy "Authenticated users can add custom species" on public.species for insert to authenticated with check (created_by = auth.uid() or is_default = false);

create policy "Farm members can read farm species" on public.farm_species for select using (public.is_farm_member(farm_id));
create policy "Owners and managers manage farm species" on public.farm_species for all using (public.has_farm_role(farm_id, array['owner','manager']::public.app_role[])) with check (public.has_farm_role(farm_id, array['owner','manager']::public.app_role[]));

create policy "Farm members read camps" on public.camps for select using (public.is_farm_member(farm_id));
create policy "Managers manage camps" on public.camps for all using (public.has_farm_role(farm_id, array['owner','manager']::public.app_role[])) with check (public.has_farm_role(farm_id, array['owner','manager']::public.app_role[]));

create policy "Farm members read herds" on public.herds for select using (public.is_farm_member(farm_id));
create policy "Managers manage herds" on public.herds for all using (public.has_farm_role(farm_id, array['owner','manager']::public.app_role[])) with check (public.has_farm_role(farm_id, array['owner','manager']::public.app_role[]));

create policy "Farm members read animals" on public.animals for select using (public.is_farm_member(farm_id) or public_passport_enabled = true);
create policy "Workers and above manage animals" on public.animals for all using (public.has_farm_role(farm_id, array['owner','manager','worker','vet']::public.app_role[])) with check (public.has_farm_role(farm_id, array['owner','manager','worker','vet']::public.app_role[]));

create policy "Farm members read weight records" on public.weight_records for select using (exists (select 1 from public.animals a where a.id = animal_id and public.is_farm_member(a.farm_id)));
create policy "Workers manage weight records" on public.weight_records for all using (exists (select 1 from public.animals a where a.id = animal_id and public.has_farm_role(a.farm_id, array['owner','manager','worker','vet']::public.app_role[]))) with check (exists (select 1 from public.animals a where a.id = animal_id and public.has_farm_role(a.farm_id, array['owner','manager','worker','vet']::public.app_role[])));

create policy "Farm members read animal media" on public.animal_media for select using (exists (select 1 from public.animals a where a.id = animal_id and public.is_farm_member(a.farm_id)));
create policy "Workers manage animal media" on public.animal_media for all using (exists (select 1 from public.animals a where a.id = animal_id and public.has_farm_role(a.farm_id, array['owner','manager','worker','vet']::public.app_role[]))) with check (exists (select 1 from public.animals a where a.id = animal_id and public.has_farm_role(a.farm_id, array['owner','manager','worker','vet']::public.app_role[])));

create policy "Farm members read animal documents" on public.animal_documents for select using (exists (select 1 from public.animals a where a.id = animal_id and public.is_farm_member(a.farm_id)));
create policy "Managers manage animal documents" on public.animal_documents for all using (exists (select 1 from public.animals a where a.id = animal_id and public.has_farm_role(a.farm_id, array['owner','manager','vet']::public.app_role[]))) with check (exists (select 1 from public.animals a where a.id = animal_id and public.has_farm_role(a.farm_id, array['owner','manager','vet']::public.app_role[])));

create policy "Farm members read inventory" on public.product_inventory for select using (public.is_farm_member(farm_id));
create policy "Managers and vets manage inventory" on public.product_inventory for all using (public.has_farm_role(farm_id, array['owner','manager','vet']::public.app_role[])) with check (public.has_farm_role(farm_id, array['owner','manager','vet']::public.app_role[]));

create policy "Farm members read health" on public.health_records for select using (public.is_farm_member(farm_id));
create policy "Workers and vets manage health" on public.health_records for all using (public.has_farm_role(farm_id, array['owner','manager','worker','vet']::public.app_role[])) with check (public.has_farm_role(farm_id, array['owner','manager','worker','vet']::public.app_role[]));

create policy "Farm members read breeding" on public.breeding_records for select using (public.is_farm_member(farm_id));
create policy "Managers manage breeding" on public.breeding_records for all using (public.has_farm_role(farm_id, array['owner','manager','worker','vet']::public.app_role[])) with check (public.has_farm_role(farm_id, array['owner','manager','worker','vet']::public.app_role[]));

create policy "Farm members read births" on public.birth_records for select using (public.is_farm_member(farm_id));
create policy "Managers manage births" on public.birth_records for all using (public.has_farm_role(farm_id, array['owner','manager','worker','vet']::public.app_role[])) with check (public.has_farm_role(farm_id, array['owner','manager','worker','vet']::public.app_role[]));

create policy "Farm accountants read finance" on public.finance_transactions for select using (public.has_farm_role(farm_id, array['owner','manager','accountant']::public.app_role[]));
create policy "Farm accountants manage finance" on public.finance_transactions for all using (public.has_farm_role(farm_id, array['owner','manager','accountant']::public.app_role[])) with check (public.has_farm_role(farm_id, array['owner','manager','accountant']::public.app_role[]));

create policy "Public can read active marketplace listings" on public.marketplace_listings for select using (status = 'active');
create policy "Seller farms manage listings" on public.marketplace_listings for all using (public.has_farm_role(seller_farm_id, array['owner','manager']::public.app_role[])) with check (public.has_farm_role(seller_farm_id, array['owner','manager']::public.app_role[]));

create policy "Offer participants read offers" on public.marketplace_offers for select using (
  buyer_id = auth.uid() or exists (
    select 1 from public.marketplace_listings ml
    where ml.id = listing_id and public.has_farm_role(ml.seller_farm_id, array['owner','manager']::public.app_role[])
  )
);
create policy "Authenticated buyers create offers" on public.marketplace_offers for insert to authenticated with check (buyer_id = auth.uid());

create policy "Chat participants read messages" on public.chat_messages for select using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "Chat participants send messages" on public.chat_messages for insert to authenticated with check (sender_id = auth.uid());

create policy "Transfer participants read transfers" on public.ownership_transfers for select using (
  public.is_farm_member(seller_farm_id) or public.is_farm_member(buyer_farm_id) or buyer_user_id = auth.uid()
);
create policy "Owners and managers manage transfers" on public.ownership_transfers for all using (
  public.has_farm_role(seller_farm_id, array['owner','manager']::public.app_role[]) or public.has_farm_role(buyer_farm_id, array['owner','manager']::public.app_role[])
) with check (
  public.has_farm_role(seller_farm_id, array['owner','manager']::public.app_role[]) or public.has_farm_role(buyer_farm_id, array['owner','manager']::public.app_role[])
);

create policy "Farm members read ownership history" on public.ownership_history for select using (public.is_farm_member(farm_id));

create policy "Authenticated users read plans" on public.subscription_plans for select to authenticated using (true);
create policy "Company owners read subscriptions" on public.subscriptions for select using (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid()));
create policy "Company owners manage subscriptions" on public.subscriptions for all using (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())) with check (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid()));

create policy "Dispute participants read disputes" on public.disputes for select using (
  opened_by = auth.uid()
  or exists (
    select 1 from public.marketplace_listings ml
    where ml.id = listing_id and public.has_farm_role(ml.seller_farm_id, array['owner','manager']::public.app_role[])
  )
);
create policy "Authenticated users open disputes" on public.disputes for insert to authenticated with check (opened_by = auth.uid());

create index farms_company_id_idx on public.farms(company_id);
create index farm_members_user_id_idx on public.farm_members(user_id);
create index animals_farm_id_idx on public.animals(farm_id);
create index animals_species_id_idx on public.animals(species_id);
create index health_records_due_at_idx on public.health_records(due_at);
create index breeding_records_expected_birth_date_idx on public.breeding_records(expected_birth_date);
create index marketplace_listings_status_idx on public.marketplace_listings(status);
