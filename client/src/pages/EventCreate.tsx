import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import MobileLayout, { MobileCard, MobileButton } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function EventCreate() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [entryFee, setEntryFee] = useState("");

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const endDateTime = new Date(`${endDate}T${endTime}`);
      return await apiRequest("POST", "/api/events", {
        ...eventData,
        endDate: endDateTime.toISOString(),
        entryFee: parseFloat(entryFee),
      });
    },
    onSuccess: () => {
      toast({
        title: "Event Created!",
        description: "Your event has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      // Navigate back to events page
      window.location.href = "/events";
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
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category || !endDate || !endTime || !entryFee) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createEventMutation.mutate({
      title,
      description,
      category,
      entryFee: parseFloat(entryFee),
    });
  };

  const categories = [
    { value: "crypto", label: "Crypto", icon: "/assets/cryptosvg.svg" },
    { value: "sports", label: "Sports", icon: "/assets/sportscon.svg" },
    { value: "politics", label: "Politics", icon: "/assets/poltiii.svg" },
    { value: "entertainment", label: "Entertainment", icon: "/assets/popcorn.svg" },
    { value: "gaming", label: "Gaming", icon: "/assets/gamessvg.svg" },
    { value: "news", label: "News", icon: "/assets/news.svg" },
  ];

  if (!user) return null;

  return (
    <MobileLayout>
      <Navigation />

      <div className="max-w-2xl mx-auto">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-700"
          >
            <i className="fas fa-arrow-left text-slate-600 dark:text-slate-300"></i>
          </button>
          <div className="w-10"></div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create New Event</h1>
          <p className="text-slate-600 dark:text-slate-400">Set up a new prediction event for the community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <MobileCard className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-slate-700 dark:text-slate-300">Event Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="What will people predict?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide details about the event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-[80px]"
                required
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-sm font-medium text-slate-700 dark:text-slate-300">Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center space-x-2">
                        <img src={cat.icon} alt={cat.label} className="w-4 h-4" />
                        <span>{cat.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </MobileCard>

          <MobileCard className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endDate" className="text-sm font-medium text-slate-700 dark:text-slate-300">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endTime" className="text-sm font-medium text-slate-700 dark:text-slate-300">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="entryFee" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Entry Fee (₦) *
              </Label>
              <Input
                id="entryFee"
                type="number"
                placeholder="100"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                className="mt-1"
                min="1"
                step="1"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                All participants will bet exactly this amount
              </p>
            </div>
          </MobileCard>

          {/* Fixed Button Container */}
          <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 -mx-4 mt-6">
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                className="flex-1 h-12 border-slate-300 dark:border-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEventMutation.isPending}
                className="flex-1 h-12 bg-primary text-white hover:bg-primary/90 font-semibold"
              >
                {createEventMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus mr-2"></i>
                    Create Event
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

    </MobileLayout>
  );
}