-- Enter migration here
create schema if not exists parlour_public;
create schema if not exists parlour_private;

create extension if not exists "pgcrypto";

-- grants
alter default privileges revoke execute on functions from public;
grant usage on schema parlour_public to parlour_anonymous, parlour_user;

drop function if exists parlour_public.set_updated_at cascade;
create or replace function parlour_private.set_updated_at() returns trigger as $$
begin
	new.updated_at := current_timestamp;
	return new;
end;
$$ language plpgsql;

-- User stuff
drop table if exists parlour_public.user cascade;
create table parlour_public.user (
	uid	uuid primary key default gen_random_uuid(),
	username text not null unique,
	first_name text check (char_length(email) < 80),
	last_name text check (char_length(email) < 80),
	email text check (char_length(email) < 80),
	about text check (char_length(email) < 1024),
	created_at timestamp not null  default now(),
	updated_at timestamp not null default now()
);

comment on table parlour_public.user is 'Base user table for profiles';
comment on column parlour_public.user.uid is 'System generated account uid';
comment on column parlour_public.user.username is 'User generated, externally used unique identifier';
comment on column parlour_public.user.first_name is 'Optional: first name for profile';
comment on column parlour_public.user.last_name is 'Optional: last name  for profile';
comment on column parlour_public.user.email is 'Optional: email address for profile';
comment on column parlour_public.user.about is 'Optional: description / about info for profile';
comment on column parlour_public.user.created_at is 'Time this user was created';
comment on column parlour_public.user.updated_at is 'Time this user was last updated';

grant select on table parlour_public.user to parlour_anonymous, parlour_user;
grant update, delete on table parlour_public.user to parlour_user;

drop function if exists parlour_public.user_full_name;
create function parlour_public.user_full_name(pUser parlour_public.user) returns text as $$
	select pUser.first_name || ' ' || pUser.last_name
$$ language sql stable;

comment on function parlour_public.user_full_name is 'A user''s full name';
grant execute on function parlour_public.user_full_name(parlour_public.user) to parlour_anonymous, parlour_user;

drop trigger if exists user_updated_at on parlour_public.user;
create trigger user_updated_at before update
	on parlour_public.user 
	for each row
	execute procedure parlour_private.set_updated_at();

-- Parlours
drop table if exists parlour_public.parlour cascade;
create table parlour_public.parlour (
	uid uuid primary key default gen_random_uuid(),
	name text not null,
	owner_uid uuid not null references parlour_public.user(uid),
	description text,
	created_at timestamp not null default now(),
	updated_at timestamp not null default now()
);
create index on parlour_public.parlour(owner_uid);

comment on table parlour_public.parlour is 'A parlour owned by a uesr that others can join';
comment on column parlour_public.parlour.uid is 'System generated parlour uid';
comment on column parlour_public.parlour.name is 'Name for the parlour';
comment on column parlour_public.parlour.owner_uid is 'The uid of the owner user';
comment on column parlour_public.parlour.description is 'Description of the parlour';
comment on column parlour_public.parlour.created_at is 'Time this parlour was created';
comment on column parlour_public.parlour.updated_at is 'Time this parlour was last updated';

grant select on table parlour_public.parlour to parlour_anonymous, parlour_user;
grant insert, update, delete on table parlour_public.parlour to parlour_user;

drop trigger if exists parlour_updated_at on parlour_public.parlour;
create trigger parlour_updated_at before update
	on parlour_public.parlour 
	for each row
	execute procedure parlour_private.set_updated_at();


-- Authentication
drop type if exists parlour_public.identityProvider cascade;
create type parlour_public.identityProvider as enum (
	'none',
	'google.com'
);

drop table if exists parlour_private.account cascade;
create table parlour_private.account (
	uid uuid primary key references parlour_public.user(uid) on delete cascade,
	idp parlour_public.identityProvider not null,
	id_token text,
	external_id text not null
);

comment on table parlour_private.account is 'Account secret data';
comment on column parlour_private.account.uid is 'The uid of the user associated with this account';
comment on column parlour_private.account.idp is 'Identity provider for this account';
comment on column parlour_private.account.id_token is 'ID token for OpenID Connect';
comment on column parlour_private.account.external_id is 'External account identifier in idp';

drop function if exists parlour_public.register_user;
create function parlour_public.register_user(
	username text,
	last_name text,
	first_name text,
	email text,
	about text,
	idp parlour_public.identityProvider,
	external_id text
) returns parlour_public.user as $$
declare
	newUser parlour_public.user;
begin 
	insert into parlour_public.user (username, first_name, last_name, email, about) values
	(username, first_name, last_name, email, about)
	returning * into newUser;

	insert into parlour_private.account (uid, idp, external_id) values
	(newUser.uid, idp, external_id);

	return newUser;
end;
$$ language plpgsql volatile security definer ;

comment on function parlour_public.register_user
	(text, text, text, text, text, parlour_public.identityProvider, text) is 'Register a single user and creates an account';

grant execute on function parlour_public.register_user(text, text, text, text, text, parlour_public.identityProvider, text) to parlour_anonymous;

drop type if exists parlour_public.jwt_token cascade;
create type parlour_public.jwt_token as (
	role text,
	user_uid uuid,
	exp bigint
);
