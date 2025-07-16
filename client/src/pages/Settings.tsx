import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeProvider";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { settings: notificationSettings, updateSetting, isUpdating } = useNotificationSettings();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    soundEffects: true,
    autoRefresh: true,
    compactView: false,
    showOnlineStatus: true,
    language: 'english',
    currency: 'NGN',
    dataUsage: 'standard',
  });

  const updateNotificationPreferences = useMutation({
    mutationFn: async (preferences: any) => {
      const response = await apiRequest("PATCH", "/api/user/notifications", preferences);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification Settings Updated",
        description: "Your notification preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: keyof typeof settings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Setting Updated",
      description: "Your preference has been saved.",
    });
  };

  const clearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast({
      title: "Cache Cleared",
      description: "Application cache has been cleared successfully.",
    });
  };

  const exportData = () => {
    const userData = {
      profile: user,
      settings: settings,
      timestamp: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `betchat-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Data Exported",
      description: "Your data has been downloaded successfully.",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-20 md:pb-0">
      <Navigation />
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-slate-800 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            <i className="fas fa-arrow-left text-slate-600 dark:text-slate-300"></i>
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h1>
          <div className="w-10"></div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Desktop Header */}
        <div className="hidden md:block mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Settings ⚙️
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Customize your BetChat experience
          </p>
        </div>

        <div className="space-y-4 md:space-y-8">
          {/* Notification Preferences */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl flex items-center">
                <i className="fas fa-bell mr-2 text-blue-500"></i>
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-6">
              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Email Notifications</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Push Notifications</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Receive push notifications in your browser
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                  disabled={isUpdating}
                />
              </div>

              <Separator className="md:block hidden" />

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Challenge Notifications</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Get notified about new challenges and results
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.challengeNotifications}
                  onCheckedChange={(checked) => updateSetting('challengeNotifications', checked)}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Event Notifications</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Get notified about event updates and endings
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.eventNotifications}
                  onCheckedChange={(checked) => updateSetting('eventNotifications', checked)}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Friend Notifications</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Get notified about friend requests and activities
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.friendNotifications}
                  onCheckedChange={(checked) => updateSetting('friendNotifications', checked)}
                  disabled={isUpdating}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl flex items-center">
                <i className="fas fa-palette mr-2 text-purple-500"></i>
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-6">
              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Dark Mode</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Toggle between light and dark themes
                  </p>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Compact View</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Use a more compact layout to fit more content
                  </p>
                </div>
                <Switch
                  checked={settings.compactView}
                  onCheckedChange={(checked) => handleSettingChange('compactView', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Language</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Choose your preferred language
                  </p>
                </div>
                <Select 
                  value={settings.language} 
                  onValueChange={(value) => handleSettingChange('language', value)}
                >
                  <SelectTrigger className="w-24 md:w-32 text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Español</SelectItem>
                    <SelectItem value="french">Français</SelectItem>
                    <SelectItem value="german">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Performance & Data */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl flex items-center">
                <i className="fas fa-tachometer-alt mr-2 text-green-500"></i>
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-6">
              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Auto Refresh</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Automatically refresh content every 30 seconds
                  </p>
                </div>
                <Switch
                  checked={settings.autoRefresh}
                  onCheckedChange={(checked) => handleSettingChange('autoRefresh', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Sound Effects</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Play sounds for notifications and actions
                  </p>
                </div>
                <Switch
                  checked={settings.soundEffects}
                  onCheckedChange={(checked) => handleSettingChange('soundEffects', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Data Usage</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Control how much data the app uses
                  </p>
                </div>
                <Select 
                  value={settings.dataUsage} 
                  onValueChange={(value) => handleSettingChange('dataUsage', value)}
                >
                  <SelectTrigger className="w-24 md:w-32 text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="md:block hidden" />

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Clear Cache</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Clear stored data to free up space
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={clearCache} className="text-xs md:text-sm px-3 md:px-4">
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl flex items-center">
                <i className="fas fa-shield-alt mr-2 text-red-500"></i>
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-6">
              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Show Online Status</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Let friends see when you're online
                  </p>
                </div>
                <Switch
                  checked={settings.showOnlineStatus}
                  onCheckedChange={(checked) => handleSettingChange('showOnlineStatus', checked)}
                />
              </div>

              <Separator className="md:block hidden" />

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Export Data</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Download a copy of your data
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={exportData} className="text-xs md:text-sm px-3 md:px-4">
                  <i className="fas fa-download mr-1 md:mr-2 text-xs"></i>
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Account Settings</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Manage your account and profile
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/profile/settings'}
                  className="text-xs md:text-sm px-3 md:px-4"
                >
                  <i className="fas fa-user-cog mr-1 md:mr-2 text-xs"></i>
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Regional */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl flex items-center">
                <i className="fas fa-globe mr-2 text-orange-500"></i>
                Regional Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-6">
              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <Label className="text-sm md:text-base font-medium">Currency</Label>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                    Your preferred currency for display
                  </p>
                </div>
                <Select 
                  value={settings.currency} 
                  onValueChange={(value) => handleSettingChange('currency', value)}
                >
                  <SelectTrigger className="w-20 md:w-24 text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">₦ NGN</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                    <SelectItem value="GBP">£ GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl flex items-center">
                <i className="fas fa-info-circle mr-2 text-indigo-500"></i>
                About BetChat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between py-1">
                <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400">Version</span>
                <span className="text-xs md:text-sm font-medium">1.0.0</span>
              </div>
              
              <div className="flex items-center justify-between py-1">
                <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400">Build</span>
                <span className="text-xs md:text-sm font-medium">2025.01.16</span>
              </div>

              <Separator className="md:block hidden" />

              <div className="space-y-1 md:space-y-2">
                <Button variant="ghost" className="w-full justify-start text-xs md:text-sm h-8 md:h-10 px-2 md:px-4">
                  <i className="fas fa-file-alt mr-1 md:mr-2 text-xs"></i>
                  Terms of Service
                </Button>
                <Button variant="ghost" className="w-full justify-start text-xs md:text-sm h-8 md:h-10 px-2 md:px-4">
                  <i className="fas fa-shield-alt mr-1 md:mr-2 text-xs"></i>
                  Privacy Policy
                </Button>
                <Button variant="ghost" className="w-full justify-start text-xs md:text-sm h-8 md:h-10 px-2 md:px-4">
                  <i className="fas fa-question-circle mr-1 md:mr-2 text-xs"></i>
                  Help & Support
                </Button>
                <Button variant="ghost" className="w-full justify-start text-xs md:text-sm h-8 md:h-10 px-2 md:px-4">
                  <i className="fas fa-bug mr-1 md:mr-2 text-xs"></i>
                  Report a Bug
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}
