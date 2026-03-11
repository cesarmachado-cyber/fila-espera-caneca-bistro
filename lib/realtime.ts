'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeChannel(channelName: string, onMessage: () => void) {
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel(channelName).on('broadcast', { event: '*' }, onMessage).subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [channelName, onMessage]);
}

export async function broadcastUpdate(channelName: string, event: string) {
  if (!supabase) return;

  await supabase.channel(channelName).send({
    type: 'broadcast',
    event,
    payload: { updatedAt: new Date().toISOString() },
  });
}
