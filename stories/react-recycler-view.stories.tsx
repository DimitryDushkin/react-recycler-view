import React from 'react';
import { ReactRecyclerView } from '../src/react-recycler-view';

export default {
  title: 'ReactRecyclerView',
};

const items = Array(100)
  .fill(0)
  .map((_, index) => ({
    id: index,
    title: index.toString(),
  }));

const renderItem = ({ title }: { id: number; title: string }) => {
  return <div style={{ height: 40, border: '1px solid red' }}>{title}</div>;
};

export const Base = () => {
  return (
    <div
      style={{
        paddingTop: '110vh',
        paddingBottom: '110vh',
        border: '1px solid blue',
      }}
    >
      <ReactRecyclerView
        items={items}
        renderItem={renderItem}
        itemHeight={40}
      />
    </div>
  );
};
