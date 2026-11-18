import { AboutSplitBlockComponent } from './aboutSplit/Component';
import { ContactCardsBlockComponent } from './contactCards/Component';
import { ContentBlockComponent } from './content/Component';
import { FeatureRowsBlockComponent } from './featureRows/Component';
import { FeatureSplitBlockComponent } from './featureSplit/Component';
import { HeroBlockComponent } from './hero/Component';
import { LogoStripBlockComponent } from './logoStrip/Component';
import { ServicesListBlockComponent } from './servicesList/Component';
import { StatsBlockComponent } from './stats/Component';
import { TestimonialCarouselBlockComponent } from './testimonialCarousel/Component';
import { TestimonialsVideoGridBlockComponent } from './testimonialsVideoGrid/Component';
import type { LayoutBlock } from './types';
import { UpcomingActivitiesBlockComponent } from './upcomingActivities/Component';

/* eslint-disable @typescript-eslint/no-explicit-any -- each entry receives its own block type */
const components: Record<LayoutBlock['blockType'], (props: any) => React.ReactNode | Promise<React.ReactNode>> = {
  hero: HeroBlockComponent,
  stats: StatsBlockComponent,
  logoStrip: LogoStripBlockComponent,
  aboutSplit: AboutSplitBlockComponent,
  upcomingActivities: UpcomingActivitiesBlockComponent,
  featureSplit: FeatureSplitBlockComponent,
  servicesList: ServicesListBlockComponent,
  featureRows: FeatureRowsBlockComponent,
  testimonialsVideoGrid: TestimonialsVideoGridBlockComponent,
  testimonialCarousel: TestimonialCarouselBlockComponent,
  contactCards: ContactCardsBlockComponent,
  content: ContentBlockComponent,
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Renders the sections an administrator assembled for a page, in order. */
export function RenderBlocks({ blocks }: { blocks: LayoutBlock[] | null | undefined }) {
  return (
    <>
      {(blocks ?? []).map((block, index) => {
        const Component = components[block.blockType];
        if (!Component) return null;
        const anchor = 'anchor' in block && block.anchor ? block.anchor : null;
        // The anchor wraps the section so /page#anchor scrolls to it, below the header.
        return anchor ? (
          <div key={block.id ?? index} id={anchor} className="scroll-mt-6">
            <Component {...block} />
          </div>
        ) : (
          <Component key={block.id ?? index} {...block} />
        );
      })}
    </>
  );
}
