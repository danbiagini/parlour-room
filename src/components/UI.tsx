import React from "react";
// import { connect } from "react-redux";
import { Navbar, Nav } from "react-bootstrap";
import "./UI.scss";
import pp_logo from "../public/pparlour-logo.png";
import { LinkContainer } from "react-router-bootstrap";

interface IProps {
  isSignedIn: boolean;
}

export class UI extends React.Component<IProps, {}> {
  constructor(props: IProps) {
    super(props);
  }

  render() {
    let identityElements = (
      <Nav className="ml-auto">
        <LinkContainer to="/account">
          <Nav.Link>Account</Nav.Link>
        </LinkContainer>
      </Nav>
    );

    if (!this.props.isSignedIn) {
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
      <Navbar collapseOnSelect variant="light" expand="lg" bg="light">
        <Navbar.Brand href="/"><img src={pp_logo}/>Pandemic Parlour</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">{identityElements}</Navbar.Collapse>
      </Navbar>
    );
  }
}
