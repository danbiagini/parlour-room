import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import pp_logo from "../public/pparlour-logo.png";

export const Footer: React.FC = () => {
  return (
    <Navbar fixed="bottom" variant="light" bg="light">
      <Navbar.Brand href="/">
        <img src={pp_logo} />
      </Navbar.Brand>
      <Nav>
        <LinkContainer to="/about">
          <Nav.Link>About</Nav.Link>
        </LinkContainer>
        <LinkContainer to="privacy">
          <Nav.Link href="/privacy">Privacy</Nav.Link>
        </LinkContainer>
      </Nav>
    </Navbar>
  );
};
