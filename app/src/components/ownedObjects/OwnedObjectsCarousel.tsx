import React from "react";
import { SuiObjectCard } from "./SuiObjectCard";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { GeneralSuiObject } from "@/types/GeneralSuiObject";
import { useIsMobile } from "@/hooks/useIsMobile";

interface OwnedObjectsCarouselProps {
  data: GeneralSuiObject[];
}

export const OwnedObjectsCarousel = ({ data }: OwnedObjectsCarouselProps) => {
  const { isMobile } = useIsMobile();
  return (
    <div className="flex flex-col space-y-2 w-[100%]">
      <Slider
        rows={1}
        slidesToShow={Math.min(data.length, isMobile ? 1 : 3)}
        slidesToScroll={1}
        className="w-[calc(100%-50px)]"
      >
        {data.map((item, index) => (
          <SuiObjectCard key={index} {...item} />
        ))}
      </Slider>
    </div>
  );
};
