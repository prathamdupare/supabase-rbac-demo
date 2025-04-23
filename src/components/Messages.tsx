
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export default function Messages({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) alert(error.message);
        else setMessages(data as Message[]);
      });
  }, []);

  const handleSend = async () => {
    if (!newMessage) return;
    const { error } = await supabase.from('messages').insert([
      {
        user_id: userId,
        content: newMessage,
      },
    ]);
    if (error) {
      alert(error.message);
    } else {
      setNewMessage('');
      // Refresh messages
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });
      setMessages(data as Message[]);
    }
  };

  return (
    <div>
      <h2>Your Messages</h2>
      <ul>
        {messages.map((msg) => (
          <li key={msg.id}>
            {msg.content} <span style={{ color: '#888' }}>{msg.created_at}</span>
          </li>
        ))}
      </ul>
      <input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
