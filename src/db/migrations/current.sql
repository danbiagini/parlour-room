-- Enter migration here
create schema if not exists parlour_public;
create schema if not exists parlour_private;

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- grants
alter default privileges revoke execute on functions from public, parlour_anonymous, parlour_user;
grant usage on schema parlour_public to parlour_anonymous, parlour_user, parlour_postgraphile, parlour_admin, parlour_root;
grant usage on schema parlour_private to parlour_admin, parlour_root, parlour_postgraphile;

drop function if exists parlour_public.set_updated_at cascade;
create or replace function parlour_private.set_updated_at() returns trigger as $$
begin
	new.updated_at := current_timestamp;
	return new;
end;
$$ language plpgsql;

drop function if exists parlour_public.get_current_user() cascade;
create or replace function parlour_public.get_current_user() returns uuid as $$
  select current_setting('parlour.user.uid', true)::uuid;
$$ language sql stable;
grant execute on function parlour_public.get_current_user() to parlour_user, parlour_postgraphile;

drop function if exists parlour_public.check_email() cascade;
create or replace function parlour_public.check_email(email text) returns boolean as $$
  select ((char_length(email) < 320) AND (email ~ '^[a-zA-Z0-9.!#$%&''*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'));
$$ language sql stable;

-- User stuff
drop table if exists parlour_public.users cascade;
create table parlour_public.users (
	uid	uuid primary key default gen_random_uuid(),

  -- https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
	username text not null unique check (((length((username)::text) >= 3) AND (length((username)::text) <= 320) AND (username ~ '^[a-zA-Z0-9.!#$%&''*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'))),
	first_name text check (char_length(first_name) < 80),
	last_name text check (char_length(last_name) < 80),
	email text not null check (parlour_public.check_email(email)),
	about text check (char_length(about) < 2048),
	prof_img_url text check ((char_length(prof_img_url) < 2048) AND (prof_img_url ~ '^https?://[^/]+'::text)),
  email_subscription boolean default false,
  recent_login timestamptz,
	created_at timestamptz not null  default now(),
	updated_at timestamptz not null default now()
);
create index on parlour_public.users(email);

comment on table parlour_public.users is 'Base user table for profiles';
comment on column parlour_public.users.uid is 'System generated account uid';
comment on column parlour_public.users.username is 'User generated, externally used unique identifier';
comment on column parlour_public.users.first_name is 'Optional: first name for profile';
comment on column parlour_public.users.last_name is 'Optional: last name  for profile';
comment on column parlour_public.users.email is 'Optional: email address for profile';
comment on column parlour_public.users.email_subscription is 'Boolean, does the user want email';
comment on column parlour_public.users.about is 'Optional: description / about info for profile';
comment on column parlour_public.users.created_at is 'Time this user was created';
comment on column parlour_public.users.updated_at is 'Time this user was last updated';
comment on column parlour_public.users.recent_login is 'Last time user was seen';

alter table parlour_public.users enable row level security;
drop policy if exists user_policy on users;
create policy user_policy on users to parlour_user
  using (uid = get_current_user());

drop policy if exists admin_user_policy on users;
create policy admin_user_policy on users to parlour_admin, parlour_root
  using (true);

grant select on table parlour_public.users to parlour_user;

drop function if exists parlour_public.users_full_name;
create function parlour_public.users_full_name(pUser parlour_public.users) returns text as $$
	select pUser.first_name || ' ' || pUser.last_name
$$ language sql stable;

comment on function parlour_public.users_full_name is 'A user''s full name';
grant execute on function parlour_public.users_full_name(parlour_public.users) to parlour_anonymous, parlour_user;

drop trigger if exists user_updated_at on parlour_public.users;
create trigger user_updated_at before update
	on parlour_public.users 
	for each row
  when (current_setting('parlour.skip_updated_at', true) <> 'true')
	execute procedure parlour_private.set_updated_at();

drop function if exists parlour_public.whoami;
create function parlour_public.whoami() returns parlour_public.users as $$
  select * from parlour_public.users 
    where uid = current_setting('parlour.user.uid', true)::uuid;
$$ language sql stable;

comment on function parlour_public.whoami is 'Get the user object for logged in user';
grant execute on function parlour_public.whoami to parlour_user;

-- Parlours
drop type if exists parlourRole cascade;
create type parlour_public.parlourRole as enum (
  'member',
  'owner',
  'moderator'
);

drop table if exists parlour_public.parlour cascade;
create table parlour_public.parlour (
	uid uuid primary key default gen_random_uuid(),
	name text not null,
	creator_uid uuid references parlour_public.users(uid) on delete set null,
	description text,
  max_members integer check (max_members >= 0),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
  constraint creator_name unique (creator_uid, name)
);
create index on parlour_public.parlour(creator_uid);

comment on table parlour_public.parlour is 'A parlour owned by a uesr that others can join';
comment on column parlour_public.parlour.uid is 'System generated parlour uid';
comment on column parlour_public.parlour.name is 'Name for the parlour';
comment on column parlour_public.parlour.creator_uid is 'The uid of the user who created the parlour';
comment on column parlour_public.parlour.description is 'Description of the parlour';
comment on column parlour_public.parlour.created_at is 'Time this parlour was created';
comment on column parlour_public.parlour.updated_at is 'Time this parlour was last updated';

grant select on table parlour_public.parlour to parlour_user;

drop trigger if exists parlour_updated_at on parlour_public.parlour;
create trigger parlour_updated_at before update
	on parlour_public.parlour 
	for each row
	execute procedure parlour_private.set_updated_at();

drop table if exists parlour_public.parlour_user_join;
create table parlour_public.parlour_user_join (
  parlour_uid uuid not null references parlour_public.parlour(uid) on delete cascade,
  user_uid uuid not null references parlour_public.users(uid) on delete cascade,
  user_role parlourRole not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parlour_user unique (parlour_uid, user_uid)
);
create index on parlour_public.parlour_user_join(parlour_uid);
create index on parlour_public.parlour_user_join(user_uid);

comment on column parlour_public.parlour_user_join.user_uid is 'The uid of the member (user) belonging to parlour';
comment on column parlour_public.parlour_user_join.parlour_uid is 'The uid of the parlour';
comment on column parlour_public.parlour_user_join.user_role is 'User''s role in the parlour';
comment on column parlour_public.parlour_user_join.created_at is 'Time this parlour membership was created';
comment on column parlour_public.parlour_user_join.updated_at is 'Time this parlour membership was last updated';

grant select on table parlour_public.parlour_user_join to parlour_user;

drop function if exists parlour_public.add_parlour_member(
  parlour parlour_public.parlour.uid%TYPE, 
  pUser parlour_public.users.uid%TYPE, 
  pRole parlour_public.parlourRole);

create function parlour_public.add_parlour_member(
  pParlour parlour_public.parlour.uid%TYPE, 
  pUser parlour_public.users.uid%TYPE,
  pRole parlour_public.parlourRole
  ) returns void as $$
declare maxMembers parlour_public.parlour.max_members%TYPE;
declare currentMembers parlour_public.parlour.max_members%TYPE;
begin
  select max_members into maxMembers from parlour_public.parlour where uid = pParlour;
  case 
    when (maxMembers = 0) then raise 'parlour ''%'' can not have any members', pParlour;
    when (maxMembers > 0) then 
      select count(user_uid) into currentMembers from parlour_public.parlour_user_join where parlour_uid = pParlour;
      if currentMemers >= maxMembers then 
        raise 'parlour ''%'' has reached or exceeded max member count ''%'' ', pParlour, currentMembers;
      end if;
    when (maxMembers is null) then currentMembers := 0;
  end case;
  insert into parlour_public.parlour_user_join (parlour_uid, user_uid, user_role) 
    values (pParlour, pUser, pRole);
end
$$ language plpgsql volatile security definer ;

drop function if exists parlour_private.add_parlour_member();
create function parlour_private.add_parlour_member() returns trigger as $$
begin
  if NEW.creator_uid is not null then
    perform parlour_public.add_parlour_member(NEW.uid, NEW.creator_uid, 'owner'::parlour_public.parlourRole);
  end if;
  return null;
end
$$ language plpgsql volatile;

drop trigger if exists parlour_created on parlour_public.parlour;
create trigger parlour_created after insert 
	on parlour_public.parlour 
	for each row
	execute procedure parlour_private.add_parlour_member();

drop function if exists parlour_public.current_user_member_parlour_uids cascade;
create function parlour_public.current_user_member_parlour_uids() returns setof uuid as $$
  select parlour_uid from parlour_public.parlour_user_join 
    where user_uid = parlour_public.get_current_user();
$$ language sql stable security definer ;

grant execute on function parlour_public.current_user_member_parlour_uids to parlour_user;

alter table parlour_public.parlour_user_join enable row level security;
create policy parlour_user_policy on parlour_user_join 
  using (user_uid = get_current_user() or 
          parlour_uid in (select parlour_public.current_user_member_parlour_uids()));

drop policy if exists admin_parlour_user_policy on parlour_user_join;
create policy admin_parlour_user_policy on parlour_user_join to parlour_admin, parlour_root
  using (true);

drop trigger if exists parlour_user_updated_at on parlour_public.parlour_user_join;
create trigger parlour_user_updated_at before update
	on parlour_public.parlour_user_join 
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
	uid uuid primary key references parlour_public.users(uid) on delete cascade,
	idp parlour_public.identityProvider not null,
	id_token text,
	idp_id text not null,
  constraint account_unique unique(uid, idp_id, idp)
);

comment on table parlour_private.account is 'Account secret data';
comment on column parlour_private.account.uid is 'The uid of the user associated with this account';
comment on column parlour_private.account.idp is 'Identity provider for this account';
comment on column parlour_private.account.id_token is 'ID token for OpenID Connect';
comment on column parlour_private.account.idp_id is 'External account identifier in idp';

drop function if exists parlour_private.register_user;
create function parlour_private.register_user(
	username text,
	last_name text,
	first_name text,
	email text,
  email_subscription boolean,
	about text,
	prof_url text,
	idp parlour_public.identityProvider,
	idp_id text
) returns parlour_public.users as $$
declare
	newUser parlour_public.users;
begin 
	insert into parlour_public.users (username, first_name, last_name, email, about, prof_img_url, email_subscription, recent_login) values
	(username, first_name, last_name, email, about, prof_url, email_subscription, now())
	returning * into newUser;

	insert into parlour_private.account (uid, idp, idp_id) values
	(newUser.uid, idp, idp_id);

	return newUser;
end;
$$ language plpgsql volatile security definer ;

grant execute on function parlour_private.register_user(text, text, text, text, boolean, text, text, parlour_public.identityProvider, text) to parlour_postgraphile;
comment on function parlour_private.register_user
	(text, text, text, text, boolean, text, text, parlour_public.identityProvider, text) is 'Register a single user and creates an account';

drop function if exists parlour_private.login_user;
create function parlour_private.login_user(
	f_idp_id parlour_private.account.idp_id%TYPE, 
	f_idp parlour_public.identityProvider) returns parlour_public.users as $$
declare user_row parlour_public.users%ROWTYPE;
begin
  select u.* into strict user_row from parlour_public.users as u inner join parlour_private.account as a
		on u.uid = a.uid
		where a.idp_id = f_idp_id and a.idp = f_idp;
  update parlour_public.users set recent_login = now();
  perform set_config('parlour.skip_updated_at', 'true', false);
  return user_row;
exception
    when NO_DATA_FOUND then
      raise exception 'idp_id not found';
    when TOO_MANY_ROWS then
      raise exception 'idp_id ''%'' not unique', f_idp_id;

end;
$$ language plpgsql security definer;

grant execute on function parlour_private.login_user(parlour_private.account.idp_id%TYPE, parlour_public.identityProvider) to parlour_postgraphile;
comment on function parlour_private.login_user(parlour_private.account.idp_id%TYPE, parlour_public.identityProvider) is 'Login a user based on idp identity.  REQUIRES the identity was already verified!';

drop table if exists parlour_private.login_session cascade;
create table parlour_private.login_session (
  sid varchar primary key NOT NULL,
  sess json NOT NULL,
	created_at timestamptz not null  default now(),
	updated_at timestamptz not null default now(),
  expire timestamptz NOT NULL
);
create index ON parlour_private.login_session(expire);

drop trigger if exists login_session_updated_at on parlour_private.login_session;
create trigger login_session_updated_at before update
	on parlour_private.login_session 
	for each row
	execute procedure parlour_private.set_updated_at();


-- invitations
drop table if exists parlour_public.invitation cascade;
create table parlour_public.invitation (
	uid uuid primary key default gen_random_uuid(),
	email text not null default '' check (email = '' or parlour_public.check_email(email)),
  parlour_uid uuid not null references parlour_public.parlour(uid) on delete cascade,
  creator_uid uuid default get_current_user() references parlour_public.users(uid) on delete cascade,
  requires_uid boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz,
  description text
);
create unique index ON parlour_public.invitation(email, parlour_uid);
create index ON parlour_public.invitation(parlour_uid);

comment on table parlour_public.invitation is 'Invitations to join a parlour or register with the site';
comment on column parlour_public.invitation.uid is 'The uid of the invitation';
comment on column parlour_public.invitation.email is 'Email address of the invited user';
comment on column parlour_public.invitation.parlour_uid is 'Invite for which Parlour';
comment on column parlour_public.invitation.created_at is 'Invite create time';
comment on column parlour_public.invitation.updated_at is 'Invite last update time';
comment on column parlour_public.invitation.expires_at is 'Invite expire time';
comment on column parlour_public.invitation.description is 'Invite description or information to display';
comment on column parlour_public.invitation.requires_uid is 'Does invite acceptance require the uid';

drop trigger if exists invitation_updated_at on parlour_public.invitation;
create trigger invitation_updated_at before update
	on parlour_public.invitation 
	for each row
	execute procedure parlour_private.set_updated_at();

grant select on parlour_public.invitation to parlour_user, parlour_postgraphile;
alter table parlour_public.invitation enable row level security;
create policy invitations_policy on parlour_public.invitation 
  using (email in (select email from parlour_public.users where uid = get_current_user()) or 
          parlour_uid in (select parlour_public.current_user_member_parlour_uids()) or 
          email = '');

drop policy if exists admin_invitations_policy on parlour_public.invitation;
create policy admin_invitations_policy on parlour_public.invitation to parlour_admin, parlour_root, parlour_postgraphile
  using (true);

-- this might need to be on the bottom of all migrations...
grant all on all tables in schema parlour_public TO parlour_root, parlour_admin ;
grant all on all tables in schema parlour_private TO parlour_root, parlour_admin ;
grant all on all functions in schema parlour_private TO parlour_root, parlour_admin ;
grant all on all functions in schema parlour_public TO parlour_root, parlour_admin ;
  