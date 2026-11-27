export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { ParagonSpacesOverview } from '@gitroom/frontend/components/new-layout/paragon.spaces';
export const metadata: Metadata = {
  title: 'Paragon Social Spaces',
  description: '',
};
export default async function Index() {
  return <ParagonSpacesOverview />;
}
