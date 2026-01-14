import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingRequest {
  item_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: BookingRequest = await req.json();
    
    const { item_id, booking_date, start_time, end_time, customer_name, customer_email, customer_phone, notes } = body;

    if (!item_id || !booking_date || !start_time || !end_time || !customer_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: item_id, booking_date, start_time, end_time, customer_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (customer_name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Customer name cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bookingDateObj = new Date(booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDateObj < today) {
      return new Response(
        JSON.stringify({ error: "Cannot book for past dates" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Creating booking for item: ${item_id}, date: ${booking_date}, time: ${start_time}-${end_time}`);

    const { data: item, error: itemError } = await supabase
      .from("menu_items")
      .select("*")
      .eq("id", item_id)
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

    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("item_id", item_id)
      .eq("booking_date", booking_date)
      .in("status", ["pending", "confirmed"]);

    const hasConflict = (existingBookings || []).some((booking: any) => {
      return start_time < booking.end_time && end_time > booking.start_time;
    });

    if (hasConflict) {
      return new Response(
        JSON.stringify({ error: "This time slot is already booked" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: newBooking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        item_id,
        booking_date,
        start_time,
        end_time,
        customer_name: customer_name.trim(),
        customer_email: customer_email?.trim() || null,
        customer_phone: customer_phone?.trim() || null,
        notes: notes?.trim() || null,
        status: "confirmed",
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Booking error:", bookingError);
      return new Response(
        JSON.stringify({ error: "Failed to create booking" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Booking created:", newBooking);

    return new Response(
      JSON.stringify({
        success: true,
        booking: newBooking,
        message: "Booking confirmed successfully",
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
