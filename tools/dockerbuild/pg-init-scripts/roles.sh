function create_roles() {
  DBURL=$1
	echo " Creating roles for pandemic parlour, database: $DBURL "
	psql -v ON_ERROR_STOP=1 "$DBURL" <<-EOSQL
		drop role if exists parlour_postgraphile;
		create role parlour_postgraphile login password '$POSTGRAPHILE_PASSWORD';
    GRANT TEMPORARY, CONNECT ON DATABASE parlour to parlour_postgraphile;

		drop role if exists parlour_anonymous;
		create role parlour_anonymous;
		grant parlour_anonymous to parlour_postgraphile;

		drop role if exists parlour_user;
		create role parlour_user;
		grant parlour_user to parlour_postgraphile;

		drop role if exists parlour_private;
		create role parlour_private;
		grant parlour_user to parlour_private;
		grant parlour_anonymous to parlour_private;
		grant parlour_postgraphile to parlour_private;
EOSQL
}
if [ -n "$DOCKER_BUILD" ]; then
	create_roles "--username=$POSTGRES_USER"
fi

if [ -n "$GM_DBURL" ]; then
  create_roles $GM_DBURL
fi