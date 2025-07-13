import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/AdminLayout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { formatBalance } from "@/utils/currencyUtils";
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Edit,
  Trash2,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Shield,
  AlertTriangle,
  Settings,
  Crown,
  Star,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  level: number;
  points: number;
  balance: string;
  streak: number;
  createdAt: string;
  lastLogin?: string;
  status?: string;
  isAdmin?: boolean;
  profileImageUrl?: string;
}

export default function AdminUsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'ban' | 'unban' | 'admin' | 'balance' | 'message'>('ban');
  const [actionValue, setActionValue] = useState("");
  const [actionReason, setActionReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const usersPerPage = 20;

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users", { limit: 1000 }],
    retry: false,
  });

  const { data: userStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  // Filter users based on search and filters
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || user.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesLevel = levelFilter === "all" || user.level.toString() === levelFilter;
    
    return matchesSearch && matchesStatus && matchesLevel;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  // User action mutations
  const userActionMutation = useMutation({
    mutationFn: async ({ userId, action, value, reason }: { userId: string; action: string; value?: string; reason?: string }) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/action`, {
        action,
        value,
        reason
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: `User ${variables.action} action completed successfully`,
      });
      setShowActionDialog(false);
      setActionValue("");
      setActionReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUserAction = (user: User, action: 'ban' | 'unban' | 'admin' | 'balance' | 'message') => {
    setSelectedUser(user);
    setActionType(action);
    setShowActionDialog(true);
  };

  const executeUserAction = () => {
    if (!selectedUser) return;

    userActionMutation.mutate({
      userId: selectedUser.id,
      action: actionType,
      value: actionValue,
      reason: actionReason,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'offline': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'banned': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'suspended': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getUserLevel = (level: number) => {
    if (level >= 50) return { label: "Master", color: "text-purple-600", icon: <Crown className="w-4 h-4" /> };
    if (level >= 25) return { label: "Expert", color: "text-orange-600", icon: <Star className="w-4 h-4" /> };
    if (level >= 10) return { label: "Advanced", color: "text-blue-600", icon: <TrendingUp className="w-4 h-4" /> };
    return { label: "Beginner", color: "text-green-600", icon: <UserCheck className="w-4 h-4" /> };
  };

  if (usersLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              User Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage users, permissions, and account settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Users className="w-4 h-4 mr-1" />
              {userStats.totalUsers || 0} Total Users
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <UserCheck className="w-4 h-4 mr-1" />
              {userStats.activeUsers || 0} Active
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="1">Level 1-5</SelectItem>
                  <SelectItem value="10">Level 10+</SelectItem>
                  <SelectItem value="25">Level 25+</SelectItem>
                  <SelectItem value="50">Level 50+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user: User) => {
                    const levelInfo = getUserLevel(user.level);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                              <span className="text-white font-medium">
                                {user.firstName?.[0] || user.username?.[0] || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {user.firstName || user.username || 'Unknown'}
                                {user.isAdmin && <Shield className="w-4 h-4 text-amber-500 ml-1 inline" />}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                @{user.username} • {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={levelInfo.color}>
                              {levelInfo.icon}
                            </div>
                            <span className="font-medium">
                              {user.level}
                            </span>
                            <span className="text-sm text-slate-500">
                              ({levelInfo.label})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-right">
                            {formatBalance(parseFloat(user.balance))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status || 'offline')}>
                            {user.status || 'Offline'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDetails(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction(user, 'message')}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction(user, 'balance')}
                            >
                              <DollarSign className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserAction(user, user.status === 'banned' ? 'unban' : 'ban')}
                              className={user.status === 'banned' ? 'text-green-600' : 'text-red-600'}
                            >
                              {user.status === 'banned' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-xl font-medium">
                      {selectedUser.firstName?.[0] || selectedUser.username?.[0] || 'U'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">
                    {selectedUser.firstName || selectedUser.username || 'Unknown'}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">@{selectedUser.username}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Level</Label>
                    <p className="text-2xl font-bold text-blue-600">{selectedUser.level}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Balance</Label>
                    <p className="text-2xl font-bold text-green-600">
                      {formatBalance(parseFloat(selectedUser.balance))}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Points</Label>
                    <p className="text-lg font-semibold">{selectedUser.points.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Streak</Label>
                    <p className="text-lg font-semibold">{selectedUser.streak} days</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedUser.status || 'offline')}>
                    {selectedUser.status || 'Offline'}
                  </Badge>
                </div>

                <div>
                  <Label className="text-sm font-medium">Joined</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {formatDistanceToNow(new Date(selectedUser.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Action Dialog */}
        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {actionType === 'ban' && 'Ban User'}
                {actionType === 'unban' && 'Unban User'}
                {actionType === 'admin' && 'Set Admin Status'}
                {actionType === 'balance' && 'Adjust Balance'}
                {actionType === 'message' && 'Send Message'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {actionType === 'balance' && (
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={actionValue}
                    onChange={(e) => setActionValue(e.target.value)}
                  />
                </div>
              )}
              
              {actionType === 'message' && (
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter message"
                    value={actionValue}
                    onChange={(e) => setActionValue(e.target.value)}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for this action"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowActionDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={executeUserAction}
                  disabled={userActionMutation.isPending}
                  className={actionType === 'ban' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  {userActionMutation.isPending ? 'Processing...' : 'Confirm'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}