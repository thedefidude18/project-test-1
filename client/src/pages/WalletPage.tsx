import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";
import { PaymentTestPanel } from "@/components/PaymentTestPanel";

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);

  const { data: balance = 0 } = useQuery({
    queryKey: ["/api/wallet/balance"],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", "/api/wallet/deposit", { amount });
      return await response.json();
    },
    onSuccess: (data: any) => {
      console.log("Deposit response:", data);
      
      if (data.authorization_url && data.access_code && data.publicKey) {
        // Use Paystack inline popup
        const handler = (window as any).PaystackPop.setup({
          key: data.publicKey,
          email: user?.email,
          amount: parseFloat(depositAmount) * 100, // Amount in kobo
          currency: 'NGN',
          ref: data.reference,
          callback: function(response: any) {
            console.log('Payment response:', response);
            
            // Only show success if payment was actually successful
            if (response.status === 'success') {
              toast({
                title: "Payment Successful",
                description: "Verifying payment... Please wait.",
              });
              
              // Manually verify payment with backend
              setTimeout(async () => {
                try {
                  const verifyResponse = await apiRequest("POST", "/api/wallet/verify-payment", { 
                    reference: response.reference 
                  });
                  
                  if (verifyResponse.ok) {
                    toast({
                      title: "Payment Verified",
                      description: "Your deposit has been credited to your account!",
                    });
                  } else {
                    console.error('Verification failed:', await verifyResponse.text());
                    toast({
                      title: "Verification Failed",
                      description: "Payment successful but verification failed. Contact support.",
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  console.error('Verification error:', error);
                  toast({
                    title: "Verification Error",
                    description: "Payment successful but verification failed. Contact support.",
                    variant: "destructive",
                  });
                }
                
                // Refresh balance and transactions
                queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
                queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
              }, 1000);
              
              setIsDepositDialogOpen(false);
              setDepositAmount("");
            } else {
              toast({
                title: "Payment Failed",
                description: response.message || "Payment was not successful. Please try again.",
                variant: "destructive",
              });
            }
          },
          onClose: function() {
            console.log('Payment popup closed');
            toast({
              title: "Payment Cancelled",
              description: "Payment was cancelled or closed.",
              variant: "destructive",
            });
          }
        });
        
        handler.openIframe();
      } else if (data.authorization_url) {
        // Fallback to redirect if inline doesn't work
        console.log("Fallback: Redirecting to:", data.authorization_url);
        window.location.href = data.authorization_url;
      } else {
        console.log("No payment URL found in response");
        toast({
          title: "Payment Error",
          description: "Unable to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Deposit Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      await apiRequest("POST", "/api/wallet/withdraw", { amount });
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Requested",
        description: "Your withdrawal request is being processed!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setIsWithdrawDialogOpen(false);
      setWithdrawAmount("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return 'fas fa-plus-circle';
      case 'withdrawal': return 'fas fa-minus-circle';
      case 'bet': return 'fas fa-dice';
      case 'win': return 'fas fa-trophy';
      case 'challenge': return 'fas fa-swords';
      case 'referral': return 'fas fa-gift';
      default: return 'fas fa-circle';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'win':
      case 'referral':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'withdrawal':
      case 'bet':
      case 'challenge':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getTransactionPrefix = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'win':
      case 'referral':
        return '+';
      case 'withdrawal':
      case 'bet':
      case 'challenge':
        return '-';
      default:
        return '';
    }
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (amount > 0) {
      depositMutation.mutate(amount);
    }
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    const currentBalance = typeof balance === 'object' ? balance.balance : balance;
    if (amount > 0 && amount <= currentBalance) {
      withdrawMutation.mutate(amount);
    } else {
      toast({
        title: "Invalid Amount",
        description: "Withdrawal amount exceeds your balance.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  const currentBalance = typeof balance === 'object' ? (balance.balance || 0) : (balance || 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Wallet 💰
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your funds and view transaction history
          </p>
        </div>

        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary to-secondary text-white mb-8">
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-primary-100 mb-2">Current Balance</p>
              <h2 className="text-4xl font-bold mb-6">₦{currentBalance.toLocaleString()}</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-white text-primary hover:bg-primary-50">
                      <i className="fas fa-plus mr-2"></i>
                      Deposit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Deposit Funds</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Amount (₦)</label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[500, 1000, 2500, 5000].map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => setDepositAmount(amount.toString())}
                          >
                            ₦{amount}
                          </Button>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsDepositDialogOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleDeposit}
                          disabled={!depositAmount || depositMutation.isPending}
                          className="flex-1 bg-primary text-white hover:bg-primary/90"
                        >
                          {depositMutation.isPending ? "Processing..." : "Deposit"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="bg-primary-700 text-white hover:bg-primary-800">
                      <i className="fas fa-minus mr-2"></i>
                      Withdraw
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Withdraw Funds</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Amount (₦)</label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="mt-1"
                          max={currentBalance}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Available: ₦{currentBalance.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsWithdrawDialogOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleWithdraw}
                          disabled={!withdrawAmount || withdrawMutation.isPending}
                          className="flex-1 bg-primary text-white hover:bg-primary/90"
                        >
                          {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Deposited</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ₦{transactions
                      .filter((t: any) => t.type === 'deposit')
                      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                  <i className="fas fa-arrow-down text-emerald-600 dark:text-emerald-400"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Won</p>
                  <p className="text-2xl font-bold text-amber-600">
                    ₦{transactions
                      .filter((t: any) => t.type === 'win')
                      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                  <i className="fas fa-trophy text-amber-600 dark:text-amber-400"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Spent</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₦{transactions
                      .filter((t: any) => ['bet', 'challenge', 'withdrawal'].includes(t.type))
                      .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <i className="fas fa-arrow-up text-red-600 dark:text-red-400"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Testing (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8">
            <PaymentTestPanel />
          </div>
        )}

        {/* Transactions */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-receipt text-4xl text-slate-400 mb-4"></i>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  No transactions yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Your transaction history will appear here once you start using your wallet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'deposit' || transaction.type === 'win' || transaction.type === 'referral'
                          ? 'bg-emerald-100 dark:bg-emerald-900'
                          : 'bg-red-100 dark:bg-red-900'
                      }`}>
                        <i className={`${getTransactionIcon(transaction.type)} ${getTransactionColor(transaction.type)}`}></i>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                          {transaction.type}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {transaction.description || `${transaction.type} transaction`}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${getTransactionColor(transaction.type)}`}>
                        {getTransactionPrefix(transaction.type)}₦{Math.abs(parseFloat(transaction.amount)).toLocaleString()}
                      </p>
                      <Badge
                        className={
                          transaction.status === 'completed'
                            ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                            : transaction.status === 'pending'
                            ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                            : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <MobileNavigation />
    </div>
  );
}
