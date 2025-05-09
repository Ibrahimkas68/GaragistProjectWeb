import { useState, useEffect, useRef, useCallback } from "react";

interface WebSocketHookOptions {
  reconnectInterval?: number;
  reconnectAttempts?: number;
  onOpen?: (event: WebSocketEventMap["open"]) => void;
  onClose?: (event: WebSocketEventMap["close"]) => void;
  onError?: (event: WebSocketEventMap["error"]) => void;
}

interface Message {
  data: string;
  timestamp: Date;
}

export function useWebSocket(
  channel: string,
  onMessage?: (data: any) => void,
  options: WebSocketHookOptions = {}
) {
  const {
    reconnectInterval = 3000,
    reconnectAttempts = 5,
    onOpen,
    onClose,
    onError,
  } = options;

  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const channelRef = useRef(channel);
  
  // Update channel ref if channel changes
  useEffect(() => {
    channelRef.current = channel;
  }, [channel]);

  const connect = useCallback(() => {
    // Clean up existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    try {
      // Create new WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host || "localhost:5000";
      const wsUrl = `${protocol}//${host}/ws`;
      
      const socket = new WebSocket(wsUrl);
      
      // Update ready state
      socket.onopen = (event) => {
        setReadyState(socket.readyState);
        reconnectCountRef.current = 0;
        
        // Send subscription message to subscribe to the channel
        socket.send(
          JSON.stringify({
            type: "subscribe",
            channels: [channelRef.current],
          })
        );
        
        if (onOpen) onOpen(event);
      };
      
      // Handle incoming messages
      socket.onmessage = (event) => {
        // Create message object with received data and timestamp
        const message: Message = {
          data: event.data,
          timestamp: new Date(),
        };
        
        setLastMessage(message);
        
        // Parse message and call onMessage callback if provided
        try {
          const parsedData = JSON.parse(event.data);
          if (
            parsedData.channel === channelRef.current && 
            onMessage
          ) {
            onMessage(parsedData);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      // Handle connection close
      socket.onclose = (event) => {
        setReadyState(socket.readyState);
        
        // Attempt to reconnect if not closed manually
        if (event.code !== 1000) {
          if (reconnectCountRef.current < reconnectAttempts) {
            const timeout = setTimeout(() => {
              reconnectCountRef.current++;
              connect();
            }, reconnectInterval);
            
            return () => clearTimeout(timeout);
          }
        }
        
        if (onClose) onClose(event);
      };
      
      // Handle errors
      socket.onerror = (event) => {
        console.error("WebSocket error:", event);
        if (onError) onError(event);
      };
      
      socketRef.current = socket;
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
    }
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [reconnectInterval, reconnectAttempts, onOpen, onClose, onError, onMessage]);

  // Connect when component mounts or reconnect parameters change
  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  // Manual send function
  const sendMessage = useCallback((data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  return {
    sendMessage,
    lastMessage,
    readyState,
    CONNECTING: WebSocket.CONNECTING,
    OPEN: WebSocket.OPEN,
    CLOSING: WebSocket.CLOSING,
    CLOSED: WebSocket.CLOSED,
  };
}
