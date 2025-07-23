import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";
import { formatBalance } from "@/utils/currencyUtils";
import { PlayfulLoading } from "@/components/ui/playful-loading";
import { AnimatedButton } from "@/components/ui/animated-button";
import { ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);

  const { data: balance = { balance: 0, coins: 0 } } = useQuery({
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
      return response;
    },
    onSuccess: (data: any) => {
      console.log("Deposit response:", data);

      if (data.authorization_url && data.access_code && data.publicKey) {
        const handler = (window as any).PaystackPop.setup({
          key: data.publicKey,
          email: user?.email,
          amount: parseFloat(depositAmount) * 100,
          currency: 'NGN',
          ref: data.reference,
          callback: function(response: any) {
            console.log('Payment response:', response);

            if (response.status === 'success') {
              toast({
                title: "Payment Successful",
                description: "Verifying payment... Please wait.",
              });

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
      case 'deposit': return 'fas fa-arrow-down';
      case 'withdrawal': return 'fas fa-arrow-up';
      case 'bet': return 'fas fa-dice';
      case 'win': return 'fas fa-trophy';
      case 'challenge': return 'fas fa-handshake';
      case 'referral': return 'fas fa-gift';
      default: return 'fas fa-circle';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'win':
      case 'referral':
        return 'text-green-500';
      case 'withdrawal':
      case 'bet':
      case 'challenge':
        return 'text-red-500';
      default:
        return 'text-gray-500';
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
  const currentCoins = typeof balance === 'object' ? (balance.coins || 0) : 0;

  // Debug logging to help identify the issue
  console.log('Balance data:', balance);
  console.log('Current balance:', currentBalance);
  console.log('Current coins:', currentCoins);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      {/* Mobile-first design */}
      <div className="max-w-md mx-auto md:max-w-7xl px-4 py-6">

        {/* Balance Section - Card Style */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6 shadow-sm">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Naira Balance</p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {formatBalance(currentBalance)}
            </h1>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 mb-6">
              <p className="text-yellow-600 dark:text-yellow-400 text-sm mb-1">Coins Balance</p>
              <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {currentCoins.toLocaleString()} coins
              </h2>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Use coins to bet in events and challenges
              </p>
              <Button
                onClick={() => navigate('/shop')}
                className="mt-3 w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl h-10"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy More Coins
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 font-medium">
                    <i className="fas fa-plus mr-2"></i>
                    Add Money
                  </Button>
                </DialogTrigger>
                <DialogContent className="mx-4 rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-center text-xl">Add Money</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    <div>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="h-14 text-lg text-center border-gray-200 rounded-2xl"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[500, 1000, 2500, 5000].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          onClick={() => setDepositAmount(amount.toString())}
                          className="h-12 rounded-xl border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                        >
                          ₦{amount}
                        </Button>
                      ))}
                    </div>
                    <AnimatedButton
                      onClick={handleDeposit}
                      disabled={!depositAmount || depositMutation.isPending}
                      isLoading={depositMutation.isPending}
                      loadingText="Processing..."
                      className="w-full h-14 bg-blue-600 text-white rounded-2xl text-lg font-medium"
                    >
                      Continue
                    </AnimatedButton>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex-1 border-gray-300 text-gray-700 dark:text-gray-300 rounded-2xl h-12 font-medium hover:bg-gray-50"
                  >
                    <i className="fas fa-arrow-up mr-2"></i>
                    Send
                  </Button>
                </DialogTrigger>
                <DialogContent className="mx-4 rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-center text-xl">Withdraw Money</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    <div>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="h-14 text-lg text-center border-gray-200 rounded-2xl"
                        max={currentBalance}
                      />
                      <p className="text-sm text-gray-500 text-center mt-2">
                        Available: {formatBalance(currentBalance)}
                      </p>
                    </div>
                    <AnimatedButton
                      onClick={handleWithdraw}
                      disabled={!withdrawAmount || withdrawMutation.isPending}
                      isLoading={withdrawMutation.isPending}
                      loadingText="Processing..."
                      className="w-full h-14 bg-blue-600 text-white rounded-2xl text-lg font-medium"
                    >
                      Withdraw
                    </AnimatedButton>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-white dark:bg-gray-800 rounded-2xl border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-arrow-down text-green-600 dark:text-green-400"></i>
              </div>
              <p className="text-xs text-gray-500 mb-1">Deposited</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatBalance(transactions
                  .filter((t: any) => t.type === 'deposit')
                  .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0))}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-2xl border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-trophy text-yellow-600 dark:text-yellow-400"></i>
              </div>
              <p className="text-xs text-gray-500 mb-1">Won</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatBalance(transactions
                  .filter((t: any) => t.type === 'win')
                  .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0))}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-2xl border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-xl flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-arrow-up text-red-600 dark:text-red-400"></i>
              </div>
              <p className="text-xs text-gray-500 mb-1">Spent</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatBalance(transactions
                  .filter((t: any) => ['bet', 'challenge', 'withdrawal'].includes(t.type))
                  .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0))}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="bg-white dark:bg-gray-800 rounded-3xl border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>

            {isLoading ? (
              <PlayfulLoading 
                type="wallet" 
                title="Loading Transactions" 
                description="Getting your transaction history..."
                className="py-8"
              />
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-receipt text-gray-400 text-xl"></i>
                </div>
                <h4 className="text-gray-900 dark:text-white font-medium mb-1">No transactions yet</h4>
                <p className="text-gray-500 text-sm">Your transaction history will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 10).map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-2xl transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'deposit' || transaction.type === 'win' || transaction.type === 'referral'
                          ? 'bg-green-100 dark:bg-green-900'
                          : 'bg-red-100 dark:bg-red-900'
                      }`}>
                        <i className={`${getTransactionIcon(transaction.type)} ${getTransactionColor(transaction.type)} text-sm`}></i>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white capitalize text-sm">
                          {transaction.type}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${getTransactionColor(transaction.type)}`}>
                        {getTransactionPrefix(transaction.type)}{formatBalance(Math.abs(parseFloat(transaction.amount)))}
                      </p>
                      <Badge
                        className={`text-xs ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}
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

      </div>
  );
}