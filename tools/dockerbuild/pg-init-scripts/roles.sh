function create_roles() {
  DBURL=$1
	echo " Creating roles for pandemic parlour, database: $DBURL "
	psql -v ON_ERROR_STOP=1 "$DBURL" <<-EOSQL
    -- server
		drop role if exists parlour_postgraphile;
		create role parlour_postgraphile login password '$POSTGRAPHILE_PASSWORD';
    GRANT TEMPORARY, CONNECT ON DATABASE parlour to parlour_postgraphile;

    -- not logged in 
		drop role if exists parlour_anonymous;
		create role parlour_anonymous;
		grant parlour_anonymous to parlour_postgraphile;

    -- logged in users
		drop role if exists parlour_user;
		create role parlour_user;
		grant parlour_user to parlour_postgraphile;

    -- admins and express-session 
		drop role if exists parlour_admin;
		create role parlour_admin;
		grant parlour_admin to parlour_postgraphile;

    -- for migrations and superuser
		drop role if exists parlour_root;
		create role parlour_root login password '$PARLOUR_ROOT_PASSWORD';
    GRANT ALL PRIVILEGES ON DATABASE parlour to parlour_root;

		grant parlour_user to parlour_root;
		grant parlour_anonymous to parlour_root;
		grant parlour_postgraphile to parlour_root;
    grant parlour_admin to parlour_root;
EOSQL
}
if [ -n "$DOCKER_BUILD" ]; then
	create_roles "--username=$POSTGRES_USER"
fi

if [ -n "$GM_DBURL" ]; then
  create_roles $GM_DBURL
fi