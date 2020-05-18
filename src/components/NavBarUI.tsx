import React from "react";
import { Navbar, Nav } from "react-bootstrap";
// import "./NavBarUI.scss";
import pp_logo from "../public/pparlour-logo.png";
import { LinkContainer } from "react-router-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../store/index";

export const NavBarUI: React.FC = () => {
  const isSignedIn = useSelector((state: RootState) => {
    return (state.isSignedIn);
  });

  let identityElements = (
    <Nav className="ml-auto">
      <LinkContainer to="/account">
        <Nav.Link>Account</Nav.Link>
      </LinkContainer>
      <LinkContainer to="/logout">
        <Nav.Link>Logout</Nav.Link>
      </LinkContainer>
    </Nav>
  );

  if (!isSignedIn) {
    identityElements = (
      <Nav className="ml-auto">
        <LinkContainer to="/signup">
          <Nav.Link>Signup</Nav.Link>
        </LinkContainer>
        <LinkContainer to="/login">
          <Nav.Link>Login</Nav.Link>
        </LinkContainer>
      </Nav>
    );
  }

  return (
    <Navbar collapseOnSelect variant="light" expand="lg" bg="light" sticky="top">
      <Navbar.Brand href="/">
        <img src={pp_logo} />
        Pandemic Parlour
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav">{identityElements}</Navbar.Collapse>
    </Navbar>
  );
};
