import React from "react";
import { Box, FormField, Text, FormFieldProps } from "grommet";

export interface FormFieldLabelProps extends FormFieldProps {
  required?: boolean;
  label: string;
}

export const FormFieldLabel: React.FC<FormFieldLabelProps> = (
  props: FormFieldLabelProps
) => {
  const { required, label, ...rest } = props;
  return (
    <FormField
      label={
        required ? (
          <Box direction="row">
            <Text>{label}</Text>
            <Text color="status-critical">{"*"}</Text>
          </Box>
        ) : (
          label
        )
      }
      required={required}
      {...rest}
    />
  );
};

FormFieldLabel.defaultProps = {
  required: false,
};
