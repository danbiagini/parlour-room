import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import pp_logo from "../public/pparlour-logo.png";

export const Footer: React.FC = () => {
  return (
    <Navbar fixed="bottom" variant="light" bg="light">
      <Navbar.Brand href="/">
        <img src={pp_logo} />
      </Navbar.Brand>
      <Nav>
        <Nav.Link href="/about">About</Nav.Link>
        <Nav.Link href="/privacy">Privacy</Nav.Link>
      </Nav>
    </Navbar>
  );
};
