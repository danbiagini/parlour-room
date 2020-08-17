import React from "react";
import { Box, Button, Layer } from "grommet";
import { FormClose } from "grommet-icons";

export interface AlertProps {
  background: string;
  onClose: { (event: React.MouseEvent): void };
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = (props: AlertProps) => {
  return (
    <Layer>
      <Box
        align="center"
        direction="row"
        gap="small"
        justify="between"
        round="medium"
        elevation="medium"
        pad={{ vertical: "xsmall", horizontal: "small" }}
        background={props.background}
      >
        <Box align="center" direction="row" gap="xsmall">
          {props.children}
        </Box>
        <Button icon={<FormClose />} onClick={props.onClose} plain />
      </Box>
    </Layer>
  );
};
