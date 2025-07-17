import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import { MobileHeader } from "@/components/MobileHeader";
import { EventCard } from "@/components/EventCard";
import { OnboardingTooltip } from "@/components/OnboardingTooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { PlayfulLoading } from "@/components/ui/playful-loading";
import { AnimatedButton } from "@/components/ui/animated-button";
import { SkeletonCard } from "@/components/ui/loading-states";

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  entryFee: z.string().min(1, "Entry fee is required"),
  endDate: z.string().min(1, "End date is required"),
  isPrivate: z.boolean().default(false),
  maxParticipants: z.string().default("100"),
});

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [visibleEvents, setVisibleEvents] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Check if user should see onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenEventsOnboarding');
    if (!hasSeenOnboarding && user) {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenEventsOnboarding', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingClose = () => {
    localStorage.setItem('hasSeenEventsOnboarding', 'true');
    setShowOnboarding(false);
  };

  const form = useForm<z.infer<typeof createEventSchema>>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      entryFee: "",
      endDate: "",
      isPrivate: false,
      maxParticipants: "100",
    },
  });

  const { data: events = [], isLoading, error: eventsError } = useQuery({
    queryKey: ["/api/events"],
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
      } else {
        console.error("Error loading events:", error);
        toast({
          title: "Error",
          description: "Failed to load events. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createEventSchema>) => {
      await apiRequest("POST", "/api/events", data);
    },
    onSuccess: () => {
      toast({
        title: "Event Created",
        description: "Your event has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setIsCreateDialogOpen(false);
      form.reset();
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

  const categories = [
    { value: "crypto", label: "Crypto", icon: "fab fa-bitcoin" },
    { value: "sports", label: "Sports", icon: "fas fa-football-ball" },
    { value: "gaming", label: "Gaming", icon: "fas fa-gamepad" },
    { value: "music", label: "Music", icon: "fas fa-music" },
    { value: "politics", label: "Politics", icon: "fas fa-landmark" },
  ];

  const filteredEvents = useMemo(() => {
    return events.filter((event: any) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        event.title.toLowerCase().includes(searchLower) ||
        (event.description || '').toLowerCase().includes(searchLower) ||
        event.category.toLowerCase().includes(searchLower);
      const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [events, searchTerm, categoryFilter]);

  const displayedEvents = filteredEvents.slice(0, visibleEvents);
  const hasMoreEvents = visibleEvents < filteredEvents.length;

  const loadMoreEvents = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleEvents(prev => Math.min(prev + 12, filteredEvents.length));
      setIsLoadingMore(false);
    }, 500);
  };

  const onSubmit = (data: z.infer<typeof createEventSchema>) => {
    createEventMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition">
      <Navigation />
      <MobileHeader />

      <div className="max-w-7xl mx-auto px-3 md:px-4 sm:px-6 lg:px-8 py-3 md:py-8">


        {/* Category Navigation Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Categories</h3>
            <div className="flex-1 max-w-md ml-4">
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="flex overflow-x-auto pb-2 gap-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <button className="flex-shrink-0 flex flex-col items-center p-3 rounded-2xl transition-all bg-primary text-white shadow-lg hover:bg-primary/90">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-2">
                    <i className="fas fa-plus text-white text-lg"></i>
                  </div>
                  <span className="text-xs font-medium">Create</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    🎁 Earn 1000 Points for creating an event!
                  </p>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter event title..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your event..." 
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  <div className="flex items-center space-x-2">
                                    <i className={category.icon}></i>
                                    <span>{category.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="entryFee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Entry Fee (₦)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxParticipants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Participants</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="100" min="2" max="1000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field}
                              min={new Date().toISOString().slice(0, 16)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isPrivate"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Private Event</FormLabel>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Require approval to join
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-2 pt-4 sticky bottom-0 bg-white dark:bg-slate-800 pb-2 border-t border-slate-200 dark:border-slate-700 mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <AnimatedButton
                        type="submit"
                        disabled={createEventMutation.isPending}
                        isLoading={createEventMutation.isPending}
                        loadingText="Creating..."
                        className="flex-1 bg-primary text-white hover:bg-primary/90"
                        icon={<i className="fas fa-plus"></i>}
                      >
                        Create Event (+1000 Points)
                      </AnimatedButton>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <button
              onClick={() => setCategoryFilter("all")}
              className={`flex-shrink-0 flex flex-col items-center p-3 rounded-2xl transition-all ${
                categoryFilter === "all" 
                  ? "bg-primary text-white shadow-lg" 
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-2">
                <i className="fas fa-th-large text-white text-lg"></i>
              </div>
              <span className="text-xs font-medium">All</span>
            </button>

            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setCategoryFilter(category.value)}
                className={`flex-shrink-0 flex flex-col items-center p-3 rounded-2xl transition-all ${
                  categoryFilter === category.value 
                    ? "bg-primary text-white shadow-lg" 
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                  category.value === 'crypto' ? 'bg-gradient-to-br from-orange-400 to-yellow-500' :
                  category.value === 'sports' ? 'bg-gradient-to-br from-green-400 to-blue-500' :
                  category.value === 'gaming' ? 'bg-gradient-to-br from-purple-400 to-pink-500' :
                  category.value === 'music' ? 'bg-gradient-to-br from-red-400 to-pink-500' :
                  category.value === 'politics' ? 'bg-gradient-to-br from-blue-600 to-indigo-700' :
                  'bg-gradient-to-br from-slate-400 to-slate-600'
                }`}>
                  <i className={`${category.icon} text-white text-lg`}></i>
                </div>
                <span className="text-xs font-medium">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <PlayfulLoading 
            type="events" 
            title="Loading Events" 
            description="Finding exciting prediction challenges..."
            className="py-12"
          />
        ) : filteredEvents.length === 0 ? (
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="text-center py-12">
              <i className="fas fa-calendar-times text-4xl text-slate-400 mb-4"></i>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No events found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {searchTerm || categoryFilter !== "all" 
                  ? "Try adjusting your filters to see more events."
                  : "Be the first to create an event!"
                }
              </p>
              {!searchTerm && categoryFilter === "all" && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Create First Event
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div id="events-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {displayedEvents.map((event: any, index: number) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  featured={false}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMoreEvents && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={loadMoreEvents}
                  disabled={isLoadingMore}
                  className="bg-primary text-white hover:bg-primary/90 px-8 py-3 rounded-2xl"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus mr-2"></i>
                      Load More Events ({filteredEvents.length - visibleEvents} remaining)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <MobileNavigation />

      {/* Onboarding Tooltip */}
      <OnboardingTooltip
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}