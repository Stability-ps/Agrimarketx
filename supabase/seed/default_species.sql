insert into public.species (
  name,
  young_name,
  adult_female_name,
  adult_male_name,
  adult_age_threshold_months,
  gestation_period_days,
  default_breeding_terms,
  is_default
) values
('Cattle', 'Calf', 'Cow', 'Bull', 24, 283, 'Natural service or AI, pregnancy check 45-90 days after exposure.', true),
('Goats', 'Kid', 'Doe', 'Buck', 12, 150, 'Controlled exposure, kidding expected around 150 days.', true),
('Sheep', 'Lamb', 'Ewe', 'Ram', 12, 147, 'Ram exposure groups, lambing expected around 147 days.', true),
('Poultry', 'Chick', 'Hen', 'Rooster', 5, 21, 'Egg incubation and hatch tracking.', true),
('Rabbits', 'Kit', 'Doe', 'Buck', 6, 31, 'Nest box checks and litter tracking.', true),
('Pigs', 'Piglet', 'Sow', 'Boar', 8, 114, 'Service records with farrowing expected around 114 days.', true),
('Horses', 'Foal', 'Mare', 'Stallion', 48, 340, 'Cover records with foaling window tracking.', true),
('Donkeys', 'Foal', 'Jenny', 'Jack', 48, 365, 'Long gestation tracking with late-pregnancy reminders.', true)
on conflict (name) do update set
  young_name = excluded.young_name,
  adult_female_name = excluded.adult_female_name,
  adult_male_name = excluded.adult_male_name,
  adult_age_threshold_months = excluded.adult_age_threshold_months,
  gestation_period_days = excluded.gestation_period_days,
  default_breeding_terms = excluded.default_breeding_terms,
  is_default = excluded.is_default;

insert into public.subscription_plans (name, animal_limit, feature_limits)
values
('Starter', 150, '{"marketplace": false, "pdf_exports": true, "farms": 1}'::jsonb),
('Professional', 2000, '{"marketplace": true, "pdf_exports": true, "farms": 5}'::jsonb),
('Enterprise', null, '{"marketplace": true, "pdf_exports": true, "farms": null, "admin": true}'::jsonb)
on conflict (name) do update set
  animal_limit = excluded.animal_limit,
  feature_limits = excluded.feature_limits;
