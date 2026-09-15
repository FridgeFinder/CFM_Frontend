import React from 'react';
import { Metadata } from 'next';
import { PageHero } from 'components/layout';
import { PamphletParagraph } from 'features/marketing';

const pageContent = {
  pageHero: {
    img: {
      src: '/hero/donate_to_a_fridge.webp',
      alt: 'Volunteer hosting a bake sale to raise money for a community fridge',
    },
  },
  content: [
    {
      variant: 'h1' as const,
      title: 'Donate to a fridge',
      body: ['Give your time, food, or funds to make a big impact!'],
    },
    {
      variant: 'h2' as const,
      title: 'When donating time',
      body: [
        'Most fridges are accessible 24/7, and these locations can use your support. Every community fridge has their own volunteer process, which can be found by contacting that fridge individually. As a general principle, we encourage everyone investing time into this project to treat others with kindness and respect.',
      ],
      button: {
        title: 'Volunteer',
        to: '/contact?subject=Volunteer%20Interest',
        'aria-label': 'Volunteer',
        variant: 'contained' as const,
      },
    },
    {
      variant: 'h2' as const,
      title: 'When donating food',
      body: [
        'Food should be great quality, fresh, and sealed in airtight containers. Label donated meals with ingredients and date. Do not leave items outside of the fridges. Before donating, read our best practices.',
      ],
      button: {
        title: 'Best Practices',
        to: '/pamphlet/best-practices',
        'aria-label': 'Best Practices',
        variant: 'contained' as const,
      },
    },
    {
      variant: 'h2' as const,
      title: 'When donating funds',
      body: [
        'Fridges should be cleaned daily. If you see trash at a fridge location, take the trash with you to dispose of it properly. If the fridge is in need of a repair, you can alert our community on Fridge Finder by submitting a status report for that fridge. Do you have repair skills that can fix broken refrigerators? Can you help build fridge shelters? Contact us.',
      ],
      button: {
        title: 'Contact Us',
        to: '/contact',
        'aria-label': 'Contact us',
        variant: 'contained' as const,
      },
    },
  ],
};

export const metadata: Metadata = {
  title: 'Fridge Finder: Donate to a fridge',
};

export default function DonateToAFridgePage(): React.ReactElement {
  const { pageHero, content } = pageContent;
  return (
    <div>
      <PageHero {...pageHero} />

      {content.map((paragraph, index) => (
        <PamphletParagraph
          {...paragraph}
          key={index + '_DonateToAFridgePage'}
          hasDivider={index > 0}
        />
      ))}
    </div>
  );
}
