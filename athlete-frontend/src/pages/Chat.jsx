import React, { useState, useEffect, useRef } from 'react';
import api from '../api';

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const role = sessionStorage.getItem('user_role');
  const myUsername = sessionStorage.getItem('user_name');
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    
    // Check if we came from dashboard with a conversation ID
    const urlParams = new URLSearchParams(window.location.search);
    const convId = urlParams.get('conversationId');
    if (convId) {
      // It will be selected once conversations are fetched
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const convId = urlParams.get('conversationId');
    if (convId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === parseInt(convId));
      if (conv) setActiveChat(conv);
    }
  }, [conversations]);

  // Listen for real-time messages via WebSocket
  useEffect(() => {
    let ws;
    if (activeChat) {
      // 1. Fetch initial history
      fetchMessages(activeChat.id);

      // 2. Open WebSocket
      const wsUrl = `ws://127.0.0.1:8000/ws/chat/${activeChat.id}/`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.message) {
          setMessages(prev => {
            // Prevent duplicate messages if REST API just fetched it
            if (prev.find(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          setTimeout(scrollToBottom, 100);
        }
      };

      ws.onclose = () => console.log('WebSocket disconnected');
    }

    return () => {
      if (ws) ws.close();
    };
  }, [activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('conversations/');
      setConversations(response.data.results || response.data);
    } catch (error) { console.error("Error fetching conversations", error); }
  };

  const fetchMessages = async (convId) => {
    try {
      const response = await api.get(`messages/?conversation=${convId}`);
      setMessages(response.data.results || response.data);
      setTimeout(scrollToBottom, 100);
    } catch (error) { console.error("Error fetching messages", error); }
  };



  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      await api.post('messages/', {
        conversation: activeChat.id,
        content: newMessage
      });
      setNewMessage('');
      fetchMessages(activeChat.id);
      fetchConversations(); // Update latest message in sidebar
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  const getChatPartner = (conv) => {
    return role === 'ATHLETE' ? conv.professional : conv.athlete;
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-64px)] flex bg-white border-l border-r border-slate-200 shadow-sm">
      
      {/* Sidebar: Conversations List */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Messages</h2>
          {/* <button className="text-amber-600 font-bold">+</button> */}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No active conversations.</div>
          ) : (
            conversations.map(conv => {
              const partner = getChatPartner(conv);
              const isActive = activeChat?.id === conv.id;
              return (
                <div 
                  key={conv.id} 
                  onClick={() => setActiveChat(conv)}
                  className={`p-4 border-b border-slate-100 cursor-pointer transition ${isActive ? 'bg-amber-50 border-l-4 border-l-amber-500' : 'hover:bg-slate-100 border-l-4 border-l-transparent'}`}
                >
                  <h3 className="font-bold text-slate-800">{partner?.username || 'Unknown User'}</h3>
                  <p className="text-sm text-slate-500 truncate">
                    {conv.latest_message ? conv.latest_message.content : 'No messages yet'}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-2/3 flex flex-col bg-white">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-slate-200 bg-white shadow-sm z-10 flex items-center">
              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-xl mr-3">
                {getChatPartner(activeChat)?.username.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-slate-800">{getChatPartner(activeChat)?.username}</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, index) => {
                const isMe = msg.sender.username === myUsername;
                const showAvatar = !isMe && (index === 0 || messages[index - 1].sender.username !== msg.sender.username);
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end mb-4`}>
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm mr-2 flex-shrink-0">
                        {showAvatar ? msg.sender.username.charAt(0).toUpperCase() : ''}
                      </div>
                    )}
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 relative shadow-sm ${
                      isMe 
                        ? 'bg-amber-600 text-white rounded-br-sm' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-amber-200' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="flex space-x-3 items-center">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 px-5 py-3 bg-slate-100 border-transparent rounded-full focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="bg-amber-600 text-white h-12 w-12 rounded-full flex items-center justify-center font-bold hover:bg-amber-700 disabled:opacity-50 transition shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
            <div className="text-slate-300 text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">Your Messages</h2>
            <p className="text-slate-500 text-center max-w-md">
              Select a conversation from the left to start chatting with your coach or athlete.
            </p>
          </div>
        )}
      </div>
      
    </div>
  );
}
