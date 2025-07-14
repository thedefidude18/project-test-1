
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Shield, 
  DollarSign, 
  Bell, 
  Users,
  Clock,
  Lock,
  Globe,
  Database,
  Activity,
  AlertTriangle,
  Save
} from "lucide-react";

interface PlatformSettings {
  id: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  minBetAmount: number;
  maxBetAmount: number;
  platformFeePercentage: number;
  creatorFeePercentage: number;
  withdrawalEnabled: boolean;
  depositEnabled: boolean;
  maxWithdrawalDaily: number;
  maxDepositDaily: number;
  challengeCooldown: number;
  eventCreationEnabled: boolean;
  chatEnabled: boolean;
  maxChatLength: number;
  autoModeration: boolean;
  welcomeMessage: string;
  supportEmail: string;
  termsUrl: string;
  privacyUrl: string;
  updatedAt: string;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Partial<PlatformSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: platformSettings, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    retry: false,
  });

  // Initialize settings when data is loaded
  useEffect(() => {
    if (platformSettings) {
      setSettings(platformSettings);
    }
  }, [platformSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<PlatformSettings>) => {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated ✅",
        description: "Platform settings have been saved successfully",
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: keyof PlatformSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      maintenanceMode: false,
      registrationEnabled: true,
      minBetAmount: 100,
      maxBetAmount: 100000,
      platformFeePercentage: 5,
      creatorFeePercentage: 3,
      withdrawalEnabled: true,
      depositEnabled: true,
      maxWithdrawalDaily: 50000,
      maxDepositDaily: 100000,
      challengeCooldown: 300,
      eventCreationEnabled: true,
      chatEnabled: true,
      maxChatLength: 500,
      autoModeration: true,
      welcomeMessage: "Welcome to BetChat! Start creating events and challenges.",
      supportEmail: "support@betchat.com",
      termsUrl: "/terms",
      privacyUrl: "/privacy",
    };
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
            <p className="text-slate-400">Configure platform behavior and policies</p>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Unsaved Changes
              </Badge>
            )}
            <Button 
              variant="outline" 
              onClick={resetToDefaults}
              className="border-slate-600"
            >
              Reset to Defaults
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!hasChanges || updateSettingsMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* System Status */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-400" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Maintenance Mode</Label>
                <p className="text-sm text-slate-500">Temporarily disable the platform for all users</p>
              </div>
              <Switch
                checked={settings.maintenanceMode || false}
                onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">User Registration</Label>
                <p className="text-sm text-slate-500">Allow new users to register</p>
              </div>
              <Switch
                checked={settings.registrationEnabled || false}
                onCheckedChange={(checked) => handleSettingChange('registrationEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-400" />
              Financial Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Minimum Bet Amount (₦)</Label>
                <Input
                  type="number"
                  value={settings.minBetAmount || 0}
                  onChange={(e) => handleSettingChange('minBetAmount', parseInt(e.target.value))}
                  className="bg-slate-800 border-slate-700 mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-300">Maximum Bet Amount (₦)</Label>
                <Input
                  type="number"
                  value={settings.maxBetAmount || 0}
                  onChange={(e) => handleSettingChange('maxBetAmount', parseInt(e.target.value))}
                  className="bg-slate-800 border-slate-700 mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-300">Platform Fee (%)</Label>
                <Input
                  type="number"
                  value={settings.platformFeePercentage || 0}
                  onChange={(e) => handleSettingChange('platformFeePercentage', parseFloat(e.target.value))}
                  className="bg-slate-800 border-slate-700 mt-1"
                  step="0.1"
                />
              </div>
              <div>
                <Label className="text-slate-300">Creator Fee (%)</Label>
                <Input
                  type="number"
                  value={settings.creatorFeePercentage || 0}
                  onChange={(e) => handleSettingChange('creatorFeePercentage', parseFloat(e.target.value))}
                  className="bg-slate-800 border-slate-700 mt-1"
                  step="0.1"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">Withdrawals Enabled</Label>
                  <p className="text-sm text-slate-500">Allow users to withdraw funds</p>
                </div>
                <Switch
                  checked={settings.withdrawalEnabled || false}
                  onCheckedChange={(checked) => handleSettingChange('withdrawalEnabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">Deposits Enabled</Label>
                  <p className="text-sm text-slate-500">Allow users to deposit funds</p>
                </div>
                <Switch
                  checked={settings.depositEnabled || false}
                  onCheckedChange={(checked) => handleSettingChange('depositEnabled', checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Max Daily Withdrawal (₦)</Label>
                <Input
                  type="number"
                  value={settings.maxWithdrawalDaily || 0}
                  onChange={(e) => handleSettingChange('maxWithdrawalDaily', parseInt(e.target.value))}
                  className="bg-slate-800 border-slate-700 mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-300">Max Daily Deposit (₦)</Label>
                <Input
                  type="number"
                  value={settings.maxDepositDaily || 0}
                  onChange={(e) => handleSettingChange('maxDepositDaily', parseInt(e.target.value))}
                  className="bg-slate-800 border-slate-700 mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Features */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-400" />
              Platform Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Event Creation</Label>
                <p className="text-sm text-slate-500">Allow users to create new events</p>
              </div>
              <Switch
                checked={settings.eventCreationEnabled || false}
                onCheckedChange={(checked) => handleSettingChange('eventCreationEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Chat System</Label>
                <p className="text-sm text-slate-500">Enable platform-wide chat functionality</p>
              </div>
              <Switch
                checked={settings.chatEnabled || false}
                onCheckedChange={(checked) => handleSettingChange('chatEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Auto Moderation</Label>
                <p className="text-sm text-slate-500">Automatically moderate chat messages</p>
              </div>
              <Switch
                checked={settings.autoModeration || false}
                onCheckedChange={(checked) => handleSettingChange('autoModeration', checked)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Challenge Cooldown (seconds)</Label>
                <Input
                  type="number"
                  value={settings.challengeCooldown || 0}
                  onChange={(e) => handleSettingChange('challengeCooldown', parseInt(e.target.value))}
                  className="bg-slate-800 border-slate-700 mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-300">Max Chat Message Length</Label>
                <Input
                  type="number"
                  value={settings.maxChatLength || 0}
                  onChange={(e) => handleSettingChange('maxChatLength', parseInt(e.target.value))}
                  className="bg-slate-800 border-slate-700 mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Content */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Globe className="w-5 h-5 mr-2 text-purple-400" />
              Platform Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">Welcome Message</Label>
              <Textarea
                value={settings.welcomeMessage || ''}
                onChange={(e) => handleSettingChange('welcomeMessage', e.target.value)}
                className="bg-slate-800 border-slate-700 mt-1"
                rows={3}
                placeholder="Enter welcome message for new users..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-300">Support Email</Label>
                <Input
                  type="email"
                  value={settings.supportEmail || ''}
                  onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                  className="bg-slate-800 border-slate-700 mt-1"
                  placeholder="support@example.com"
                />
              </div>
              <div>
                <Label className="text-slate-300">Terms of Service URL</Label>
                <Input
                  value={settings.termsUrl || ''}
                  onChange={(e) => handleSettingChange('termsUrl', e.target.value)}
                  className="bg-slate-800 border-slate-700 mt-1"
                  placeholder="/terms"
                />
              </div>
              <div>
                <Label className="text-slate-300">Privacy Policy URL</Label>
                <Input
                  value={settings.privacyUrl || ''}
                  onChange={(e) => handleSettingChange('privacyUrl', e.target.value)}
                  className="bg-slate-800 border-slate-700 mt-1"
                  placeholder="/privacy"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-red-900/20 border-red-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <h3 className="text-red-400 font-medium">Security Notice</h3>
                <p className="text-red-300 text-sm mt-1">
                  Changes to financial settings and security policies will affect all users immediately. 
                  Please review all changes carefully before saving.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
