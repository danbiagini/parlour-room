import React from "react";
import pp_logo from "../public/pparlour-logo.png";
import { Box, Header, Heading, Image, Nav, Menu, Avatar } from "grommet";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store/index";
import { signoutIdp } from "../store/actions";
import RoutedButton from "./RoutedButton";
import { User } from "../common/types";
import { auth } from "./Auth";
import { useGoogleLogout } from "react-google-login";
import * as config from "../common/client_config";

interface UserMenuProps {
  logout: () => void;
  profileUrl: string;
}

const UserMenu: React.FC<UserMenuProps> = (props: UserMenuProps) => {
  return (
    <Menu
      dropAlign={{ top: "bottom", right: "right" }}
      icon={false}
      items={[
        {
          label: "Logout",
          onClick: props.logout,
        },
      ]}
      label={<Avatar src={props.profileUrl} />}
    />
  );
};

export const NavBarUI: React.FC = () => {
  const dispatch = useDispatch();
  const user: User = useSelector((state: RootState) => state.user);
  const isSignedIn = user.isSignedIn;
  const { signOut } = useGoogleLogout({
    clientId: config.googleConfig.clientId,
    // onLogoutSuccess: ,
  });

  const logout = () => {
    auth.logOut(() => {
      signOut();
      dispatch(signoutIdp());
    });
  };

  return (
    <Header
      height="120px"
      background="brand"
      pad="xsmall"
      gap="small"
      elevation="none"
      style={{ position: "relative" }}
    >
      <RoutedButton hoverIndicator={true} path="/">
        <Box
          flex={false}
          direction="row"
          align="center"
          margin={{ left: "small" }}
        >
          <Image
            height="110px"
            src={pp_logo}
            margin={{
              left: "small",
              right: "small",
              top: "xsmall",
              bottom: "xsmall",
            }}
          />
          <Heading level="3">Pandemic Parlour</Heading>
        </Box>
      </RoutedButton>
      <Nav direction="row" gap="small" pad="medium" background="brand">
        {isSignedIn ? (
          <UserMenu logout={logout} profileUrl={user.profPicUrl} />
        ) : (
          <Box direction="row" gap="small">
            <RoutedButton path="/signup" label="Sign Up" />
            <RoutedButton path="/login" label="Login" />
          </Box>
        )}
      </Nav>
    </Header>
  );
};
