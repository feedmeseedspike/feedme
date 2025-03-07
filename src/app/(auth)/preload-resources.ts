'use client';

import ReactDOM from 'react-dom';

export const PreloadResource = () => {
  ReactDOM.preload('/images/loginBanner.jpeg', { as: 'image' });

  return null;
};
