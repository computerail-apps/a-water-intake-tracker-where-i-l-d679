import { useState } from 'react';
import { Nav, NavLink } from '@/lib/ui/Nav';
import { Container } from '@/lib/ui/Container';
import { Droplets, CalendarDays } from 'lucide-react';
import { TodayPage } from '@/pages/TodayPage';
import { WeeklyPage } from '@/pages/WeeklyPage';

type View = 'today' | 'weekly';

export default function App() {
  const [view, setView] = useState<View>('today');

  return (
    <div className="min-h-screen">
      <Nav
        brand={
          <span className="inline-flex items-center gap-2">
            <Droplets size={20} className="text-primary" />
            Waterline
          </span>
        }
      >
        <NavLink href="#" active={view === 'today'} onClick={() => setView('today')}>
          <Droplets size={14} className="mr-2" />
          Today
        </NavLink>
        <NavLink href="#" active={view === 'weekly'} onClick={() => setView('weekly')}>
          <CalendarDays size={14} className="mr-2" />
          Weekly
        </NavLink>
      </Nav>
      <main className="py-8">
        <Container>
          {view === 'today' ? <TodayPage /> : <WeeklyPage />}
        </Container>
      </main>
    </div>
  );
}
