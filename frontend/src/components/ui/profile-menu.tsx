'use client';

import * as Avatar from '@radix-ui/react-avatar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Upload, LogOut, User as UserIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient as httpClient } from '@/lib/api/http-client';

export function ProfileMenu() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const handleLogout = async () => {
    try {
      await httpClient.post('/auth/logout');
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      clearSession();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await httpClient.post<{ success: boolean; data: { fileUrl: string } }>('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.data?.fileUrl) {
        const url = response.data.data.fileUrl;
        setAvatarUrl(url);
        
        // Save the avatar to the user profile
        await httpClient.patch('/profile/avatar', { avatarUrl: url });
        
        // Refresh session to get updated user object
        const { performRefresh } = await import('@/lib/api/http-client');
        const session = await performRefresh();
        const { useAuthStore } = await import('@/stores/auth.store');
        useAuthStore.getState().setSession(session);
      }
    } catch (error) {
      console.error('Failed to upload profile picture', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />
      
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-surface border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring transition-transform active:scale-95">
            <Avatar.Root className="inline-flex items-center justify-center w-full h-full rounded-full overflow-hidden align-middle">
              <Avatar.Image
                className="w-full h-full object-cover"
                src={avatarUrl || undefined}
                alt={user?.name || 'User'}
              />
              <Avatar.Fallback
                className="w-full h-full flex items-center justify-center bg-accent text-accent-foreground text-sm font-semibold"
                delayMs={600}
              >
                {initial}
              </Avatar.Fallback>
            </Avatar.Root>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="w-56 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border p-1 mr-4 z-50 overflow-hidden"
            align="end"
            sideOffset={8}
          >
            <div className="px-2 py-2.5 border-b border-border mb-1">
              <p className="font-medium text-sm truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-muted truncate">{user?.email || 'user@example.com'}</p>
            </div>
            
            <DropdownMenu.Item 
              className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-muted/10 outline-none focus:bg-muted/10"
              onSelect={(e) => {
                e.preventDefault();
                fileInputRef.current?.click();
              }}
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item 
              className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-muted/10 outline-none focus:bg-muted/10"
              asChild
            >
              <a href="/settings">
                <UserIcon className="w-4 h-4" />
                <span>Profile Settings</span>
              </a>
            </DropdownMenu.Item>
            
            <DropdownMenu.Separator className="h-px bg-border my-1" />
            
            <DropdownMenu.Item 
              className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-destructive/10 text-destructive focus:bg-destructive/10 outline-none"
              onSelect={() => {
                handleLogout();
              }}
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </>
  );
}
