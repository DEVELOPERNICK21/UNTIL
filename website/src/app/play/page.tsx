import { ClockSlingshot } from '@/components/play/ClockSlingshot';
import { SITE_CONFIG } from '@/domain';

export const metadata = {
  title: `Knock time back · ${SITE_CONFIG.appName}`,
  description: '60 seconds, a slingshot and a clock. The clock always wins.',
};

export default function PlayPage() {
  return <ClockSlingshot />;
}
