'use client';

import { ArrowUpRight } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type Item = { id?: string | null; title: string; content: string };

/** Numbered list (01, 02…) that unfolds, as in the mockup. */
export function AboutAccordion({ items }: { items: Item[] }) {
  return (
    <Accordion type="single" collapsible className="mt-8 border-t border-border">
      {items.map((item, index) => (
        <AccordionItem key={item.id ?? item.title} value={item.id ?? String(index)} className="border-border">
          <AccordionTrigger className="min-h-14 items-center gap-6 text-base hover:no-underline [&>svg]:hidden">
            <span className="w-8 text-text-muted tabular-nums">{String(index + 1).padStart(2, '0')}</span>
            <span className="flex-1 text-left font-medium">{item.title}</span>
            <ArrowUpRight aria-hidden className="size-5 shrink-0 transition-transform [[data-state=open]_&]:rotate-90" />
          </AccordionTrigger>
          <AccordionContent className="pl-14 text-base text-text-muted">{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
