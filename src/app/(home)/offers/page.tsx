import { Metadata } from 'next';
import OffersClient from './OffersClient';

export const metadata: Metadata = {
  title: 'Special Offers | FeedMe',
  description: 'Browse our special offers and group buying deals with slot-based purchasing.',
};

export default function OffersPage() {
  return <OffersClient />;
}