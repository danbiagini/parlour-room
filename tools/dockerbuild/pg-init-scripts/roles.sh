function create_roles() {
	echo " Creating roles for pandemic parlour "
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
		drop role if exists parlour_postgraphile;
		create role parlour_postgraphile login password '$POSTGRAPHILE_PASSWORD';

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
if [ -n "$CREATE_ROLES" ]; then
	create_roles
fi
