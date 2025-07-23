import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";

export default function ReferralPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["/api/referrals"],
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

  const referralUrl = `${window.location.origin}?ref=${user?.referralCode}`;

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const shareViaEmail = () => {
    const subject = "Join BetChat and let's challenge each other!";
    const body = `Hey! I've been using BetChat for social betting and challenges. Join me using my referral link and we both get bonus points!\n\n${referralUrl}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const shareViaWhatsApp = () => {
    const message = `Hey! Join me on BetChat for social betting and challenges. We both get bonus points when you sign up! ${referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  const shareViaTwitter = () => {
    const message = `Just joined @BetChat for social betting and challenges! Join me and let's compete 🎯 ${referralUrl}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`);
  };

  if (!user) return null;

  const referralArray = Array.isArray(referrals) ? referrals : [];
  const totalReferrals = referralArray.length;
  const activeReferrals = referralArray.filter((r: any) => r.status === 'active').length;
  const totalRewards = totalReferrals * 100; // Assuming 100 points per referral

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Referral Program 🎁
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Invite friends and earn rewards together
          </p>
        </div>

        {/* Referral Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Referrals</p>
                  <p className="text-2xl font-bold text-primary">{totalReferrals}</p>
                </div>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-primary"></i>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-primary">+{activeReferrals} active this month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Rewards</p>
                  <p className="text-2xl font-bold text-emerald-600">{totalRewards}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                  <i className="fas fa-coins text-emerald-600 dark:text-emerald-400"></i>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-emerald-600">Points earned</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Next Milestone</p>
                  <p className="text-2xl font-bold text-amber-600">{10 - (totalReferrals % 10)}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                  <i className="fas fa-trophy text-amber-600 dark:text-amber-400"></i>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-amber-600">Referrals to bonus</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Share Your Referral Link */}
        <Card className="bg-gradient-to-br from-primary to-secondary text-white mb-8">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Share Your Referral Link</h2>
              <p className="text-primary-100 mb-6">
                Share your unique link with friends and earn 100 points for each successful referral!
              </p>

              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Input
                    value={referralUrl}
                    readOnly
                    className="bg-white text-slate-900 border-0 flex-1"
                  />
                  <Button
                    onClick={copyReferralLink}
                    className="bg-white text-primary hover:bg-primary-50"
                  >
                    {copied ? (
                      <>
                        <i className="fas fa-check mr-2"></i>
                        Copied!
                      </>
                    ) : (
                      <>
                        <i className="fas fa-copy mr-2"></i>
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  onClick={shareViaEmail}
                  className="bg-slate-600 text-white hover:bg-slate-700"
                >
                  <i className="fas fa-envelope mr-2"></i>
                  Email
                </Button>
                <Button
                  onClick={shareViaWhatsApp}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <i className="fab fa-whatsapp mr-2"></i>
                  WhatsApp
                </Button>
                <Button
                  onClick={shareViaTwitter}
                  className="bg-blue-400 text-white hover:bg-blue-500"
                >
                  <i className="fab fa-twitter mr-2"></i>
                  Twitter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-8">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-share-alt text-primary text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2">1. Share Your Link</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Share your unique referral link with friends via email, social media, or direct message.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-user-plus text-emerald-500 text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2">2. Friend Signs Up</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Your friend creates an account using your referral link and verifies their email.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-gift text-amber-500 text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2">3. Earn Rewards</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Both you and your friend receive bonus points when they complete their first bet!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral History */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Your Referrals ({totalReferrals})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading referrals...</p>
              </div>
            ) : referralArray.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-user-friends text-4xl text-slate-400 mb-4"></i>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  No referrals yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Start sharing your referral link to earn rewards!
                </p>
                <Button
                  onClick={copyReferralLink}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  <i className="fas fa-share-alt mr-2"></i>
                  Share Your Link
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {referralArray.map((referral: any) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-10 h-10">
                        <AvatarImage 
                          src={referral.referredUser?.profileImageUrl || undefined} 
                          alt={referral.referredUser?.firstName || 'User'} 
                        />
                        <AvatarFallback>
                          {(referral.referredUser?.firstName?.[0] || 'U').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          {referral.referredUser?.firstName || 'Anonymous User'}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Joined {formatDistanceToNow(new Date(referral.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Badge
                        className={
                          referral.status === 'active'
                            ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                            : referral.status === 'completed'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                        }
                      >
                        {referral.status}
                      </Badge>
                      <span className="text-sm font-medium text-emerald-600">
                        +100 pts
                      </span>
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