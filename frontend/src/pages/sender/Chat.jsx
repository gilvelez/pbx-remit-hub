/**
 * Chat Page - iMessage/Messenger-style 1:1 chat
 * Supports text messages and in-chat PBX payments
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { getConversation, getMessages, sendMessage, sendPaymentInChat } from "../../lib/socialApi";

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // State
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  
  // Payment modal state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentSending, setPaymentSending] = useState(false);

  // Fetch conversation and messages
  const fetchData = useCallback(async () => {
    try {
      const convo = await getConversation(userId);
      setConversation(convo);
      
      const msgs = await getMessages(convo.conversation_id);
      setMessages(msgs.messages || []);
    } catch (error) {
      console.error("Failed to load chat:", error);
      // If not friends, redirect back
      if (error.message.includes("friends")) {
        navigate("/sender/people");
      }
    } finally {
      setLoading(false);
    }
  }, [userId, navigate]);

  useEffect(() => {
    fetchData();
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      if (conversation?.conversation_id) {
        getMessages(conversation.conversation_id).then(data => {
          setMessages(data.messages || []);
        }).catch(console.error);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [fetchData, conversation?.conversation_id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send text message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !conversation) return;
    
    setSending(true);
    try {
      await sendMessage(conversation.conversation_id, newMessage.trim());
      setNewMessage("");
      
      // Refresh messages
      const msgs = await getMessages(conversation.conversation_id);
      setMessages(msgs.messages || []);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Send PBX payment
  const handleSendPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0 || paymentSending) return;
    
    setPaymentSending(true);
    try {
      await sendPaymentInChat(userId, amount, paymentNote || null);
      
      // Close modal and reset
      setShowPayment(false);
      setPaymentAmount("");
      setPaymentNote("");
      
      // Refresh messages
      const msgs = await getMessages(conversation.conversation_id);
      setMessages(msgs.messages || []);
    } catch (error) {
      console.error("Failed to send payment:", error);
      alert(error.message || "Failed to send payment");
    } finally {
      setPaymentSending(false);
    }
  };

  // Format currency
  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format time
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const otherUser = conversation?.other_user;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate("/sender/people")}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          data-testid="back-btn"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A2540] to-[#1a4a7c] flex items-center justify-center text-white font-bold">
          {(otherUser?.display_name || "?")?.[0]?.toUpperCase()}
        </div>
        
        <div className="flex-1">
          <p className="font-semibold text-[#0A2540]">{otherUser?.display_name || "PBX User"}</p>
          {otherUser?.username && (
            <p className="text-sm text-gray-500">@{otherUser.username}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" data-testid="messages-container">
        {messages.map((msg) => {
          const isMe = msg.sender_user_id === session?.token;
          const isSystem = msg.type === "system";
          const isPayment = msg.type === "payment";
          
          if (isSystem) {
            return (
              <div key={msg.message_id} className="text-center">
                <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                  {msg.text}
                </span>
              </div>
            );
          }
          
          if (isPayment) {
            return (
              <div
                key={msg.message_id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    isMe
                      ? "bg-green-100 border border-green-200"
                      : "bg-green-50 border border-green-100"
                  }`}
                  data-testid="payment-bubble"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 text-lg">✓</span>
                    <span className="font-semibold text-green-800">
                      {isMe ? "You sent" : "You received"} {formatAmount(msg.payment?.amount_usd)}
                    </span>
                  </div>
                  {msg.text && (
                    <p className="text-sm text-gray-600 mb-2">&ldquo;{msg.text}&rdquo;</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Ref: {msg.payment?.tx_id} • {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          }
          
          // Text message
          return (
            <div
              key={msg.message_id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isMe
                    ? "bg-[#0A2540] text-white rounded-br-md"
                    : "bg-white text-[#0A2540] rounded-bl-md shadow-sm"
                }`}
                data-testid="message-bubble"
              >
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${isMe ? "text-white/60" : "text-gray-400"}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-2 sticky bottom-0">
        <button
          onClick={() => setShowPayment(true)}
          className="p-2.5 bg-[#F6C94B] rounded-full hover:bg-[#F6C94B]/90 transition"
          title="Send PBX"
          data-testid="send-pbx-btn"
        >
          <svg className="w-5 h-5 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        
        <form onSubmit={handleSend} className="flex-1 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message"
            className="flex-1 h-10 px-4 bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-[#0A2540]/20 outline-none"
            data-testid="message-input"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2.5 bg-[#0A2540] rounded-full disabled:opacity-50 transition"
            data-testid="send-message-btn"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>

      {/* Send PBX Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" data-testid="payment-modal">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#0A2540]">Send PBX</h2>
              <button
                onClick={() => setShowPayment(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#0A2540] to-[#1a4a7c] flex items-center justify-center text-white font-bold text-2xl mb-3">
                {(otherUser?.display_name || "?")?.[0]?.toUpperCase()}
              </div>
              <p className="font-semibold text-[#0A2540]">{otherUser?.display_name || "PBX User"}</p>
            </div>
            
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-600 mb-2 block">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">$</span>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  max="5000"
                  step="0.01"
                  className="w-full h-14 pl-10 pr-4 text-2xl font-bold text-center border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                  data-testid="payment-amount-input"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-600 mb-2 block">Note (optional)</label>
              <input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="What's it for?"
                maxLength={100}
                className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none"
                data-testid="payment-note-input"
              />
            </div>
            
            <button
              onClick={handleSendPayment}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || paymentSending}
              className="w-full h-12 bg-[#0A2540] text-white rounded-xl font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2"
              data-testid="confirm-payment-btn"
            >
              {paymentSending ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>Send {paymentAmount ? formatAmount(parseFloat(paymentAmount)) : "$0.00"}</>
              )}
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              ⚡ Instant • Free • Stays in PBX
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
