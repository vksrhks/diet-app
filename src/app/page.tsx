import DashboardClient from './DashboardClient';
import { getDashboardData } from '@/app/actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  const data = await getDashboardData();
  return <DashboardClient initialData={data} />;
}
