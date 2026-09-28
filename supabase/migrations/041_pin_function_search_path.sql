-- 041: pin search_path on the remaining public functions flagged by the
-- Security Advisor (function_search_path_mutable). `public` is how these
-- functions already resolve names, so behaviour is unchanged; pinning it
-- stops a caller-controlled search_path from redirecting object lookups.
alter function public.automatic_seller_status(boolean, boolean) set search_path = public;
alter function public.automatic_seller_status(boolean, boolean, text, text, text) set search_path = public;
alter function public.marketplace_distance_km(double precision, double precision, double precision, double precision) set search_path = public;
alter function public.set_animal_age_category() set search_path = public;
alter function public.set_updated_at() set search_path = public;
alter function public.touch_seller_verifications_updated_at() set search_path = public;
