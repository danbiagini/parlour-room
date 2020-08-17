import React from "react";
import { useRouteMatch, useHistory } from "react-router";
// import { Link } from "react-router-dom";
import { Button, ButtonProps } from "grommet";

interface RoutedButtonProps extends ButtonProps {
  path: string;
}

const RoutedButton: React.FC<RoutedButtonProps> = (
  props: RoutedButtonProps
) => {
  let history = useHistory();
  let match = useRouteMatch(props.path);

  const onclick = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    history.push(props.path);
  };
  return (
    <Button active={match && match.isExact} {...props} onClick={onclick} />
  );
};

export default RoutedButton;
