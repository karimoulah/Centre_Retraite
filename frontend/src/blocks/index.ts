import { AboutSplitBlock } from './aboutSplit/config';
import { ContactCardsBlock } from './contactCards/config';
import { ContentBlock } from './content/config';
import { FeatureRowsBlock } from './featureRows/config';
import { FeatureSplitBlock } from './featureSplit/config';
import { HeroBlock } from './hero/config';
import { LogoStripBlock } from './logoStrip/config';
import { ServicesListBlock } from './servicesList/config';
import { StatsBlock } from './stats/config';
import { TestimonialCarouselBlock } from './testimonialCarousel/config';
import { TestimonialsVideoGridBlock } from './testimonialsVideoGrid/config';
import { UpcomingActivitiesBlock } from './upcomingActivities/config';

/** Every block an administrator can place on a page, in the order of the mockup. */
export const pageBlocks = [
  HeroBlock,
  StatsBlock,
  LogoStripBlock,
  AboutSplitBlock,
  UpcomingActivitiesBlock,
  FeatureSplitBlock,
  ServicesListBlock,
  FeatureRowsBlock,
  TestimonialsVideoGridBlock,
  TestimonialCarouselBlock,
  ContactCardsBlock,
  ContentBlock,
];
