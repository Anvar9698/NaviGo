import React from 'react';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { LeftDock } from './components/LeftDock';
import { LeftPanel } from './components/LeftPanel';
import { MapContainer } from './components/MapContainer';
import { MobileBottomSheet } from './components/MobileBottomSheet';
import { ReportModal } from './components/ReportModal';
import { MyReportsModal } from './components/MyReportsModal';
import { SupportChatModal } from './components/SupportChatModal';
import { LegendModal } from './components/LegendModal';
import { AuthModal } from './components/AuthModal';
import { AdminConsole } from './components/AdminConsole';
import { EditorWorkspace } from './components/EditorWorkspace';
import { AnalystWorkspace } from './components/AnalystWorkspace';
import { SettingsModal } from './components/SettingsModal';
import { ListAlternativeModal } from './components/ListAlternativeModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AmbulanceApp } from './ambulance/AmbulanceApp';

export const MainLayout: React.FC = () => {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-outerBg dark:bg-darkOuter p-2 sm:p-4">
      {/* Outer App Panel Container with 32px radius (Part 4.1) */}
      <div className="w-full h-full flex flex-col bg-appPanel dark:bg-darkPanel rounded-panel shadow-float border border-yolBorder dark:border-darkBorder overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Workspace Body Area */}
        <div className="flex-1 flex overflow-hidden p-2 sm:p-4 gap-4 relative">
          {/* Desktop Left Rail Dock */}
          <LeftDock />

          {/* Desktop Left Card Panel */}
          <LeftPanel />

          {/* Interactive Map */}
          <main className="flex-1 h-full relative" aria-label="Interactive Map Area">
            <MapContainer />
          </main>
        </div>

        {/* Mobile Bottom Sheet & Nav Bar */}
        <MobileBottomSheet />

        {/* Interactive Modals and Workspaces */}
        <ReportModal />
        <MyReportsModal />
        <SupportChatModal />
        <LegendModal />
        <AuthModal />
        <AdminConsole />
        <EditorWorkspace />
        <AnalystWorkspace />
        <SettingsModal />
        <ListAlternativeModal />
        <NotificationsModal />
      </div>
    </div>
  );
};

export function App() {
  const [route, setRoute] = React.useState(window.location.hash);

  React.useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isEmergencyRoute = [
    '#/ambulance',
    '#/police',
    '#/fire',
    '#/gas',
    '#/rescue',
    '#/103',
    '#/102',
    '#/101',
    '#/104',
    '#/1050'
  ].includes(route);

  return (
    <AppProvider>
      {isEmergencyRoute ? <AmbulanceApp /> : <MainLayout />}
    </AppProvider>
  );
}

export default App;
