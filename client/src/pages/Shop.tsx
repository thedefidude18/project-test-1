
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatBalance } from "@/utils/currencyUtils";
import { PlayfulLoading } from "@/components/ui/playful-loading";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Coins, Gift, ShoppingCart, Star, Zap, Crown } from "lucide-react";

export default function Shop() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customAmount, setCustomAmount] = useState("");
  const [giftAmount, setGiftAmount] = useState("");
  const [giftRecipient, setGiftRecipient] = useState("");
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isGiftDialogOpen, setIsGiftDialogOpen] = useState(false);

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

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });

  const coinPackages = [
    { 
      coins: 1000, 
      price: 100, 
      bonus: 0, 
      popular: false,
      icon: Coins,
      color: "bg-blue-500"
    },
    { 
      coins: 2500, 
      price: 200, 
      bonus: 500, 
      popular: false,
      icon: Star,
      color: "bg-green-500"
    },
    { 
      coins: 5000, 
      price: 400, 
      bonus: 1500, 
      popular: true,
      icon: Zap,
      color: "bg-purple-500"
    },
    { 
      coins: 10000, 
      price: 750, 
      bonus: 4000, 
      popular: false,
      icon: Crown,
      color: "bg-yellow-500"
    },
  ];

  const purchaseCoinsMutation = useMutation({
    mutationFn: async ({ coins, nairaAmount }: { coins: number; nairaAmount: number }) => {
      return await apiRequest("POST", "/api/shop/purchase-coins", { coins, nairaAmount });
    },
    onSuccess: (data) => {
      toast({
        title: "Coins Purchased! 🪙",
        description: `You received ${data.coins} coins!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setIsPurchaseDialogOpen(false);
      setCustomAmount("");
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
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const giftCoinsMutation = useMutation({
    mutationFn: async ({ recipientId, coins }: { recipientId: string; coins: number }) => {
      return await apiRequest("POST", "/api/shop/gift-coins", { recipientId, coins });
    },
    onSuccess: (data) => {
      toast({
        title: "Gift Sent! 🎁",
        description: `You gifted ${data.coins} coins to ${data.recipientName}!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setIsGiftDialogOpen(false);
      setGiftAmount("");
      setGiftRecipient("");
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
        title: "Gift Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePurchasePackage = (pkg: any) => {
    const currentBalance = typeof balance === 'object' ? balance.balance : balance;
    if (currentBalance < pkg.price) {
      toast({
        title: "Insufficient Balance",
        description: "Please deposit more Naira to purchase this package.",
        variant: "destructive",
      });
      return;
    }

    const totalCoins = pkg.coins + pkg.bonus;
    purchaseCoinsMutation.mutate({ 
      coins: totalCoins, 
      nairaAmount: pkg.price 
    });
  };

  const handleCustomPurchase = () => {
    const nairaAmount = parseFloat(customAmount);
    const currentBalance = typeof balance === 'object' ? balance.balance : balance;
    
    if (!nairaAmount || nairaAmount < 50) {
      toast({
        title: "Invalid Amount",
        description: "Minimum purchase is ₦50",
        variant: "destructive",
      });
      return;
    }

    if (currentBalance < nairaAmount) {
      toast({
        title: "Insufficient Balance",
        description: "Please deposit more Naira to purchase coins.",
        variant: "destructive",
      });
      return;
    }

    // Exchange rate: 1 Naira = 10 coins
    const coins = nairaAmount * 10;
    purchaseCoinsMutation.mutate({ coins, nairaAmount });
  };

  const handleGiftCoins = () => {
    const coins = parseInt(giftAmount);
    const currentCoins = typeof balance === 'object' ? balance.coins || 0 : 0;
    
    if (!coins || coins < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum gift is 100 coins",
        variant: "destructive",
      });
      return;
    }

    if (currentCoins < coins) {
      toast({
        title: "Insufficient Coins",
        description: "You don't have enough coins to gift.",
        variant: "destructive",
      });
      return;
    }

    const recipient = users.find((u: any) => 
      u.username === giftRecipient || u.firstName === giftRecipient || u.id === giftRecipient
    );

    if (!recipient) {
      toast({
        title: "User Not Found",
        description: "Please enter a valid username or user ID.",
        variant: "destructive",
      });
      return;
    }

    giftCoinsMutation.mutate({ recipientId: recipient.id, coins });
  };

  if (!user) return null;

  const currentBalance = typeof balance === 'object' ? (balance.balance || 0) : (balance || 0);
  const currentCoins = typeof balance === 'object' ? (balance.coins || 0) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      {/* Mobile-first design */}
      <div className="max-w-md mx-auto md:max-w-7xl px-4 py-6">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Coin Shop 🪙
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Buy coins to bet in events and challenges
          </p>
        </div>

        {/* Balance Display */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-white dark:bg-gray-800 rounded-2xl border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-naira-sign text-green-600 dark:text-green-400"></i>
              </div>
              <p className="text-xs text-gray-500 mb-1">Naira Balance</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatBalance(currentBalance)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-2xl border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Coins className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-xs text-gray-500 mb-1">Coins Balance</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {currentCoins.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Coin Packages */}
        <Card className="bg-white dark:bg-gray-800 rounded-3xl border-0 shadow-sm mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Coin Packages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {coinPackages.map((pkg, index) => {
              const IconComponent = pkg.icon;
              return (
                <div
                  key={index}
                  className={`relative p-4 rounded-2xl border-2 ${
                    pkg.popular 
                      ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/20' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-2 left-4 bg-purple-500 text-white">
                      Most Popular
                    </Badge>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${pkg.color} rounded-xl flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {pkg.coins.toLocaleString()} coins
                        </h3>
                        {pkg.bonus > 0 && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            +{pkg.bonus.toLocaleString()} bonus coins!
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatBalance(pkg.price)}
                      </p>
                      <Button
                        onClick={() => handlePurchasePackage(pkg)}
                        disabled={purchaseCoinsMutation.isPending || currentBalance < pkg.price}
                        className="mt-2 h-8 text-xs bg-blue-600 text-white rounded-xl"
                      >
                        {purchaseCoinsMutation.isPending ? "..." : "Buy"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Custom Purchase */}
        <Card className="bg-white dark:bg-gray-800 rounded-3xl border-0 shadow-sm mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Custom Purchase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Input
                  type="number"
                  placeholder="Enter Naira amount (min ₦50)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="h-12 text-center border-gray-200 rounded-xl"
                  min="50"
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  Exchange rate: ₦1 = 10 coins
                </p>
                {customAmount && (
                  <p className="text-sm text-center mt-1 font-medium text-blue-600">
                    You'll receive: {(parseFloat(customAmount) * 10).toLocaleString()} coins
                  </p>
                )}
              </div>
              
              <AnimatedButton
                onClick={handleCustomPurchase}
                disabled={!customAmount || purchaseCoinsMutation.isPending}
                isLoading={purchaseCoinsMutation.isPending}
                loadingText="Processing..."
                className="w-full h-12 bg-blue-600 text-white rounded-xl font-medium"
              >
                Purchase Coins
              </AnimatedButton>
            </div>
          </CardContent>
        </Card>

        {/* Gift Coins */}
        <Card className="bg-white dark:bg-gray-800 rounded-3xl border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Gift className="w-5 h-5 mr-2 text-pink-500" />
              Gift Coins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isGiftDialogOpen} onOpenChange={setIsGiftDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-medium">
                  <Gift className="w-4 h-4 mr-2" />
                  Send Gift
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-center text-xl">Gift Coins 🎁</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Enter username or user ID"
                      value={giftRecipient}
                      onChange={(e) => setGiftRecipient(e.target.value)}
                      className="h-12 border-gray-200 rounded-xl"
                    />
                  </div>
                  
                  <div>
                    <Input
                      type="number"
                      placeholder="Enter coin amount (min 100)"
                      value={giftAmount}
                      onChange={(e) => setGiftAmount(e.target.value)}
                      className="h-12 text-center border-gray-200 rounded-xl"
                      min="100"
                    />
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Your balance: {currentCoins.toLocaleString()} coins
                    </p>
                  </div>

                  <AnimatedButton
                    onClick={handleGiftCoins}
                    disabled={!giftAmount || !giftRecipient || giftCoinsMutation.isPending}
                    isLoading={giftCoinsMutation.isPending}
                    loadingText="Sending..."
                    className="w-full h-12 bg-pink-500 text-white rounded-xl font-medium"
                  >
                    Send Gift
                  </AnimatedButton>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <MobileNavigation />
    </div>
  );
}
