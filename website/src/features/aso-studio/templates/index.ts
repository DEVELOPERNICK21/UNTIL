import type { TemplateId } from '../types';
import { renderMinimalFrame, renderTextOverScreen, type RenderInput } from './renderers';

export const TEMPLATE_META: {
  id: TemplateId;
  name: string;
  blurb: string;
}[] = [
  {
    id: 'text-over-screen',
    name: 'Text over screen',
    blurb: 'Large headline on top; device bleeds off the bottom.',
  },
  {
    id: 'minimal-frame',
    name: 'Minimal frame',
    blurb: 'Centered device with headline above or below.',
  },
];

export function renderTemplate(templateId: TemplateId, input: RenderInput) {
  if (templateId === 'minimal-frame') {
    renderMinimalFrame(input);
  } else {
    renderTextOverScreen(input);
  }
}
