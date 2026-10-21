import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { Ember } from '../desktop/src/ember/Ember';

jest.mock('../desktop/src/ember/ember.css', () => ({}));

/**
 * Tapping Ember bumps two counters used as React keys (the hop wrapper and the sparkle burst).
 * They went up together, so the two siblings shared a key and React kept the old copy: every tap
 * stacked another Ember on the widget, the floating bar and the panel.
 */
describe('desktop Ember taps', () => {
  type Rendered = ReactTestRenderer.ReactTestRendererJSON;

  /** Everything that is really drawn. Not the component tree: a leaked old copy is gone from that tree but still on screen. */
  function drawn(tree: ReactTestRenderer.ReactTestRenderer): Rendered[] {
    const out: Rendered[] = [];
    const walk = (node: Rendered | Rendered[] | null) => {
      if (!node) return;
      if (Array.isArray(node)) return node.forEach(walk);
      out.push(node);
      (node.children ?? []).forEach(
        child => typeof child !== 'string' && walk(child),
      );
    };
    walk(tree.toJSON() as Rendered | Rendered[] | null);
    return out;
  }

  function render() {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      tree = ReactTestRenderer.create(
        <Ember progress={0.4} size={56} interactive />,
      );
    });
    const hosts = (className: string) =>
      drawn(tree).filter(
        n => n.type === 'div' && n.props.className === className,
      );
    const tap = () => {
      const root = tree.root.findAll(
        n =>
          n.type === 'div' &&
          String(n.props.className).startsWith('ember ember-live'),
      )[0];
      act(() => root.props.onClick());
    };
    const svgCount = () => drawn(tree).filter(n => n.type === 'svg').length;
    return { tree, hosts, tap, svgCount };
  }

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps exactly one Ember however many times it is tapped', () => {
    const { hosts, tap } = render();
    expect(hosts('ember-hop')).toHaveLength(1);

    for (let i = 1; i <= 8; i += 1) {
      tap();
      expect(hosts('ember-hop')).toHaveLength(1);
      expect(hosts('ember-burst')).toHaveLength(1);
    }
  });

  it('draws one SVG before and after the taps', () => {
    const { tap, svgCount } = render();
    expect(svgCount()).toBe(1);
    tap();
    tap();
    tap();
    expect(svgCount()).toBe(1);
  });
});
