import * as React from "react";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Image,
  Stack,
  Text,
  CardFooter,
  Button,
} from "grommet";
import { FormCheckmark, FormClose, FormView } from "grommet-icons";
import { ParlourFieldsFragment, Parlourrole } from "../generated/graphql";
import parlourPic from "../public/victorian1.jpg";

interface ParlourCardProps {
  parlour: ParlourFieldsFragment;
  role?: Parlourrole;
}

export const ParlourCard: React.FC<ParlourCardProps> = (
  props: ParlourCardProps
) => {
  const p = props.parlour;

  const footer = (
    <CardFooter
      pad={{ horizontal: "small", vertical: "none" }}
      // https://gist.github.com/lopspower/03fb1cc0ac9f32ef38f4#all-hex-value-from-100-to-0-alpha
      background="#000000A0"
      width="medium"
      justify="start"
      round={{ size: "small", corner: "bottom" }}
    >
      <Button icon={<FormCheckmark />} hoverIndicator />
      <Button icon={<FormView />} hoverIndicator />
      <Button icon={<FormClose />} hoverIndicator />
    </CardFooter>
  );

  return (
    <Card height="xlarge" width="medium" elevation="medium" key={p.uid}>
      {/* Stacked CardBody and CardHeader on top of each other 
              in that order */}
      <Stack anchor="top-left">
        <CardBody height="medium">
          <Image fit="cover" src={parlourPic} a11yTitle="Grandma's Parlour" />
        </CardBody>
        <CardHeader
          pad={{ horizontal: "small", vertical: "small" }}
          // https://gist.github.com/lopspower/03fb1cc0ac9f32ef38f4#all-hex-value-from-100-to-0-alpha
          background="#000000A0"
          width="medium"
          justify="start"
        >
          <Box>
            <Heading level="3" margin="none">
              {p.name}
            </Heading>
            <Text size="small">{p.description}</Text>
          </Box>
        </CardHeader>
      </Stack>
      {footer}
    </Card>
  );
};
