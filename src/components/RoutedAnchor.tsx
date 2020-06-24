import React from "react";
import { useHistory } from "react-router";
import { Anchor, AnchorProps } from "grommet";
// import { useRouteMatch } from "react-router-dom";

interface RoutedAnchorProps extends AnchorProps {
  href: string;
}

// A simple component that shows the pathname of the current location
const RoutedAnchor: React.FC<RoutedAnchorProps> = (
  props: RoutedAnchorProps
) => {
  const history = useHistory();

  const onClick = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    history.push(props.href);
  };

  // const pathMatch = useRouteMatch(props.path);
  return <Anchor {...props} onClick={onClick} />;
};

export default RoutedAnchor;
