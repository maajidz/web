create table "public"."user_profiles" (
    "id" uuid not null default gen_random_uuid(),
    "phone_number" text not null,
    "first_name" text,
    "last_name" text,
    "email" text,
    "profile_type" text,
    "bio" text,
    "profile_pic_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "profile_picture_url" text
);


alter table "public"."user_profiles" enable row level security;

CREATE UNIQUE INDEX user_profiles_email_key ON public.user_profiles USING btree (email);

CREATE UNIQUE INDEX user_profiles_phone_number_key ON public.user_profiles USING btree (phone_number);

CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);

alter table "public"."user_profiles" add constraint "user_profiles_pkey" PRIMARY KEY using index "user_profiles_pkey";

alter table "public"."user_profiles" add constraint "user_profiles_email_key" UNIQUE using index "user_profiles_email_key";

alter table "public"."user_profiles" add constraint "user_profiles_phone_number_key" UNIQUE using index "user_profiles_phone_number_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_modified_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant references on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant trigger on table "public"."user_profiles" to "anon";

grant truncate on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

grant insert on table "public"."user_profiles" to "authenticated";

grant references on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "authenticated";

grant trigger on table "public"."user_profiles" to "authenticated";

grant truncate on table "public"."user_profiles" to "authenticated";

grant update on table "public"."user_profiles" to "authenticated";

grant delete on table "public"."user_profiles" to "service_role";

grant insert on table "public"."user_profiles" to "service_role";

grant references on table "public"."user_profiles" to "service_role";

grant select on table "public"."user_profiles" to "service_role";

grant trigger on table "public"."user_profiles" to "service_role";

grant truncate on table "public"."user_profiles" to "service_role";

grant update on table "public"."user_profiles" to "service_role";

create policy "Insert policy for verified users"
on "public"."user_profiles"
as permissive
for insert
to public
with check (true);


create policy "Users can update own profile"
on "public"."user_profiles"
as permissive
for update
to public
using (((auth.uid())::text = (id)::text))
with check (((auth.uid())::text = (id)::text));


create policy "Users can view all profiles"
on "public"."user_profiles"
as permissive
for select
to public
using (true);


CREATE TRIGGER update_user_profiles_modtime BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();


