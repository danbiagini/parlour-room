import React from "react";
import { Box, Heading, Paragraph } from "grommet";

export default function About() {
  return (
    <Box
      as="main"
      fill="vertical"
      background="light-1"
      gap="medium"
      pad="large"
      overflow="scroll"
      align="center"
      flex="grow"
    >
      <Heading level={3}>
        A Place for families and friends to stay connected
      </Heading>

      <Heading level={4}>Why Pandemic Parlour?</Heading>
      <Paragraph>
        I decided to build Pandemic Parlour for a couple reasons. I&#039;ve
        always had a desire to create and build using technology while also
        providing something useful to others. When the COVID pandemic and
        quarantining began I noticed a few challenges with keeping connected
        with families and friends. What we needed was way to have the
        &quot;inner parlour&quot; for families and friends to congregate,
        especially for younger kids who don&lsquo;t sit still long enough for a
        video chat. Pandemic Parlour is a place to chat, play games and
        generally interact. It is designed to be kid safe, and ultimately a way
        to bridge the technology gap between family members of all ages.
      </Paragraph>
      <Heading level={4}>What&#039;s a Parlour?</Heading>
      <Paragraph>
        A <b>parlour</b> (or <b>parlor</b>) is a reception room or public space.
        In Medieval Christian Europe, the &quot;outer parlour&quot; was the room
        where the monks or nuns conducted business with those outside the
        monastery and the &quot;inner parlour&quot; was used for necessary
        conversation between resident members. In the English-speaking world of
        the 18th and 19th century, having a parlour room was evidence of social
        status.
      </Paragraph>
    </Box>
  );
}
