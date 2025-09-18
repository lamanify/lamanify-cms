-- Enable realtime for queue_sessions table
ALTER TABLE public.queue_sessions REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_sessions;