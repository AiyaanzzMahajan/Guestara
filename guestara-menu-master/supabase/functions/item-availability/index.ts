import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const itemId = pathParts[pathParts.length - 2];
    const dateParam = url.searchParams.get("date");

    if (!dateParam) {
      return new Response(
        JSON.stringify({ error: "Date parameter is required (YYYY-MM-DD)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Fetching availability for item: ${itemId}, date: ${dateParam}`);

    const { data: item, error: itemError } = await supabase
      .from("menu_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      return new Response(
        JSON.stringify({ error: "Item not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!item.is_bookable) {
      return new Response(
        JSON.stringify({ error: "This item is not bookable" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestDate = new Date(dateParam);
    const dayOfWeek = requestDate.getDay();

    const { data: availabilitySlots } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("item_id", itemId)
      .eq("day_of_week", dayOfWeek);

    if (!availabilitySlots || availabilitySlots.length === 0) {
      return new Response(
        JSON.stringify({ 
          available: false, 
          message: "No availability on this day",
          slots: [] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("item_id", itemId)
      .eq("booking_date", dateParam)
      .in("status", ["pending", "confirmed"]);

    const bookedTimes = (existingBookings || []).map((b: any) => ({
      start: b.start_time,
      end: b.end_time,
    }));

    const generateSlots = (startTime: string, endTime: string, intervalMinutes: number = 60) => {
      const slots: Array<{ start_time: string; end_time: string; available: boolean }> = [];
      
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);
      
      let currentMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      while (currentMinutes + intervalMinutes <= endMinutes) {
        const slotStartHour = Math.floor(currentMinutes / 60);
        const slotStartMin = currentMinutes % 60;
        const slotEndMinutes = currentMinutes + intervalMinutes;
        const slotEndHour = Math.floor(slotEndMinutes / 60);
        const slotEndMin = slotEndMinutes % 60;

        const slotStart = `${slotStartHour.toString().padStart(2, "0")}:${slotStartMin.toString().padStart(2, "0")}`;
        const slotEnd = `${slotEndHour.toString().padStart(2, "0")}:${slotEndMin.toString().padStart(2, "0")}`;

        const isBooked = bookedTimes.some(
          (booked: { start: string; end: string }) => 
            slotStart < booked.end && slotEnd > booked.start
        );

        slots.push({
          start_time: slotStart,
          end_time: slotEnd,
          available: !isBooked,
        });

        currentMinutes += intervalMinutes;
      }

      return slots;
    };

    const allSlots: Array<{ start_time: string; end_time: string; available: boolean }> = [];
    
    for (const availability of availabilitySlots) {
      const slots = generateSlots(availability.start_time, availability.end_time);
      allSlots.push(...slots);
    }

    const response = {
      item_id: itemId,
      item_name: item.name,
      date: dateParam,
      day_of_week: dayOfWeek,
      available: allSlots.some(s => s.available),
      slots: allSlots,
    };

    console.log("Availability calculated:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
