import * as React from "react";
import { Box, Carousel } from "grommet";
import { MyParloursAndInvitesQuery, Parlourrole } from "../generated/graphql";
import { ParlourCard } from "./ParlourCard";

interface ParlourCarouselProps {
  parlours: MyParloursAndInvitesQuery;
}

export const ParlourCarousel: React.FC<ParlourCarouselProps> = (
  props: ParlourCarouselProps
) => {
  const cards = props.parlours.getCurrentUserInvites.nodes.map((p) => {
    return (
      <ParlourCard
        role={Parlourrole.None}
        key={p.parlourByParlourUid.uid}
        parlour={p.parlourByParlourUid}
      />
    );
  });

  return (
    <Box>
      <Carousel fill controls="arrows">
        {cards}
      </Carousel>
    </Box>
  );
};
