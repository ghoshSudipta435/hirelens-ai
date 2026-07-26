import { ThemeToggle } from '../ui/theme-toggle';
import { NotificationBell } from '../ui/notification-bell';
import { ProfileMenu } from '../ui/profile-menu';

export function TopNav() {
  return (
    <div className="flex items-center gap-4 bg-background px-6 py-4 border-b border-border shadow-sm">
      <div className="flex-1">
        {/* Logo or page title could go here */}
      </div>
      
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationBell />
        <ProfileMenu />
      </div>
    </div>
  );
}
