import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Booking } from '@/types/menu';

export function useBookingsForItem(itemId: string, date: string) {
  return useQuery({
    queryKey: ['bookings', itemId, date],
    queryFn: async (): Promise<Booking[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('item_id', itemId)
        .eq('booking_date', date)
        .in('status', ['pending', 'confirmed']);

      if (error) throw error;
      return (data || []) as Booking[];
    },
    enabled: !!itemId && !!date,
  });
}

interface CreateBookingParams {
  item_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateBookingParams): Promise<Booking> => {
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('item_id', params.item_id)
        .eq('booking_date', params.booking_date)
        .in('status', ['pending', 'confirmed']);

      const hasConflict = existingBookings?.some(booking => {
        const existingStart = booking.start_time;
        const existingEnd = booking.end_time;
        const newStart = params.start_time;
        const newEnd = params.end_time;

        return (newStart < existingEnd && newEnd > existingStart);
      });

      if (hasConflict) {
        throw new Error('This time slot is already booked');
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          ...params,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Booking;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['bookings', variables.item_id, variables.booking_date],
      });
    },
  });
}
