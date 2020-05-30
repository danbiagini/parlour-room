drop role if exists parlour_postgraphile;
create role parlour_postgraphile login password '$POSTGRAPHILE_PASSWORD';

drop role if exists parlour_anonymous;
create role parlour_anonymous;
grant parlour_anonymous to parlour_postgraphile;

drop role if exists parlour_user;
create role parlour_user;
grant parlour_user to parlour_postgraphile;