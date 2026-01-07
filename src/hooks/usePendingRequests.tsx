import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminRequest {
  id: string;
  user_id: string;
  email: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export function usePendingRequests() {
  const queryClient = useQueryClient();

  const { data: pendingRequests = [], ...queryResult } = useQuery({
    queryKey: ["pending-admin-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AdminRequest[];
    },
    refetchInterval: 30000, // Background refresh every 30 seconds
  });

  // Set up realtime subscription for new requests
  useEffect(() => {
    const channel = supabase
      .channel("admin-requests-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_requests",
        },
        (payload) => {
          // Show toast notification for new request
          const newRequest = payload.new as AdminRequest;
          toast.info(`New admin request from ${newRequest.email}`, {
            description: "Review the request in the Admins page",
            duration: 5000,
          });
          // Refetch to update the count
          queryClient.invalidateQueries({ queryKey: ["pending-admin-requests"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "admin_requests",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pending-admin-requests"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "admin_requests",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pending-admin-requests"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    pendingRequests,
    pendingCount: pendingRequests.length,
    ...queryResult,
  };
}
