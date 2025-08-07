import { Metadata } from 'next';
import OffersAdminClient from './OffersAdminClient';

export const metadata: Metadata = {
  title: 'Manage Offers | Admin Dashboard',
  description: 'Manage special offers and group buying deals',
};

export default function AdminOffersPage() {
  return <OffersAdminClient />;
}