import React, { Fragment, RefObject, useEffect, useRef, useState } from 'react';

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
    container.style.height = `${containerHeight}px`;
    container.style.position = 'relative';

    const itemsLayout: { top: number; item: T }[] = [];
    for (let i = 0; i < items.length; i++) {
      itemsLayout.push({
        top: i * itemHeight,
        item: items[i],
      });
    }

    const renderItems = () => {
      const { top, bottom } = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const overscanMarginTop = overscanWindow * viewportHeight;
      const overscanMarginBottom = overscanWindow * viewportHeight;
      const isVisible =
        top - (window.innerHeight + overscanMarginTop) < 0 &&
        bottom + overscanMarginBottom >= 0;

      console.log('top, bottom');
      console.log(top, bottom);

      if (!isVisible) {
        return;
      }

      // @TODO: перевести все в какую-то одну систему координат
      const visibleFrom =
        viewportHeight - top < 0
          ? 0
          : Math.max(0, Math.abs(top) - overscanMarginTop);
      const visibleTo = Math.abs(top) + viewportHeight + overscanMarginBottom;
      const itemsToRender: { top: number; item: T }[] = [];
      console.log('visibleFrom, visibleTo');
      console.log(visibleFrom, visibleTo);

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
