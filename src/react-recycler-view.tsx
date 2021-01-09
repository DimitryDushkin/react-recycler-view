import React, { Fragment, RefObject, useEffect, useRef, useState } from 'react';
import { clamp } from './utils';

type ItemGeneric = { id: string | number };

type Props<T extends ItemGeneric> = {
  items: T[];
  itemHeight: number;
  overscanWindow?: number; // 1 === 100vh
  renderItem: (item: T) => React.ReactElement;
};

export function ReactRecyclerView<T extends ItemGeneric>({
  items,
  itemHeight,
  overscanWindow,
  renderItem,
}: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsToRender = useRecycler(
    items,
    itemHeight,
    overscanWindow,
    containerRef
  );

  return (
    <div ref={containerRef}>
      {itemsToRender.map(({ top, item }) => {
        const el = renderItem(item);
        return (
          <Fragment key={item.id}>
            {React.cloneElement(renderItem(item), {
              style: {
                ...el.props.style,
                position: 'absolute',
                top,
              },
            })}
          </Fragment>
        );
      })}
    </div>
  );
}

function useRecycler<T>(
  items: T[],
  itemHeight: number,
  overscanWindow = 1,
  containerRef: RefObject<HTMLDivElement>
) {
  const [itemsToRender, setItemsToRender] = useState<
    { top: number; item: T }[]
  >([]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const containerHeight = items.length * itemHeight;
    container.style.minHeight = `${containerHeight}px`;
    container.style.position = 'relative';

    const itemsLayout: { top: number; item: T }[] = [];
    for (let i = 0; i < items.length; i++) {
      // TODO: support absence of item's height
      // intoduce two step model:
      // 1. visbility: hidden render to measure height
      // 2. save height, render only visible
      // do it in batch, algorithm for selecting next batch is needed
      itemsLayout.push({
        top: i * itemHeight,
        item: items[i],
      });
    }

    const renderItems = () => {
      const { top, height } = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const overscanMarginTop = overscanWindow * viewportHeight;
      const overscanMarginBottom = overscanWindow * viewportHeight;
      const clamper = clamp(0, height);
      const visibleFrom = clamper(-top - overscanMarginTop);
      const visibleTo = clamper(-top + viewportHeight + overscanMarginBottom);
      const isVisible = visibleTo !== visibleFrom;

      if (!isVisible) {
        return;
      }

      const itemsToRender: { top: number; item: T }[] = [];

      // TODO: add more effective way to get items to render (interval tree)
      for (const itemLayout of itemsLayout) {
        if (itemLayout.top > visibleFrom && itemLayout.top < visibleTo) {
          itemsToRender.push(itemLayout);
        }
      }

      setItemsToRender(itemsToRender);
    };

    renderItems();

    window.addEventListener('scroll', renderItems, { passive: true });
    return () => {
      window.removeEventListener('scroll', renderItems);
    };
  }, [items, itemHeight]);

  return itemsToRender;
}
