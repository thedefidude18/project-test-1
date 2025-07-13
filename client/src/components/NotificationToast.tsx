import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface NotificationData {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  createdAt: string;
}

export function NotificationToast() {
  // Simplified component - notifications are now handled by useNotifications hook
  return null;
}