"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Send, 
  Users, 
  Settings, 
  Wifi, 
  WifiOff, 
  MessageSquare,
  UserPlus,
  UserMinus,
  Clock,
  AlertCircle
} from "lucide-react";

interface User {
  id: string;
  name?: string;
  email?: string;
  joinedAt: string;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  type: 'chat' | 'notification' | 'system';
}

interface TypingUser {
  userId: string;
  userName: string;
}

export function RealTimeChat() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [currentRoom, setCurrentRoom] = useState("main");
  const [serverInfo, setServerInfo] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const socketInstance = io({
      path: '/api/socketio',
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      setIsJoined(false);
      console.log('Disconnected from WebSocket server');
    });

    socketInstance.on('message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    socketInstance.on('user:list', (data: { users: User[]; totalUsers: number }) => {
      setUsers(data.users);
    });

    socketInstance.on('user:joined', (data: { user: User; totalUsers: number }) => {
      setUsers(prev => [...prev, data.user]);
      setMessages(prev => [...prev, {
        id: 'join-' + Date.now(),
        text: `${data.user.name || data.user.email || 'Someone'} joined the chat`,
        senderId: 'system',
        senderName: 'System',
        timestamp: new Date().toISOString(),
        type: 'notification',
      }]);
    });

    socketInstance.on('user:left', (data: { user: User; totalUsers: number }) => {
      setUsers(prev => prev.filter(u => u.id !== data.user.id));
      setMessages(prev => [...prev, {
        id: 'leave-' + Date.now(),
        text: `${data.user.name || data.user.email || 'Someone'} left the chat`,
        senderId: 'system',
        senderName: 'System',
        timestamp: new Date().toISOString(),
        type: 'notification',
      }]);
    });

    socketInstance.on('typing:start', (data: TypingUser) => {
      setTypingUsers(prev => {
        const exists = prev.some(u => u.userId === data.userId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    });

    socketInstance.on('typing:stop', (data: { userId: string }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    socketInstance.on('connection:info', (info: any) => {
      setServerInfo(info);
    });

    socketInstance.on('server:heartbeat', (data: any) => {
      console.log('Server heartbeat:', data);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleJoin = () => {
    if (!socket || !userName.trim()) return;

    socket.emit('user:join', {
      name: userName.trim(),
      email: userEmail.trim() || undefined,
    });

    setIsJoined(true);
  };

  const handleSendMessage = () => {
    if (!socket || !inputMessage.trim() || !isJoined) return;

    const messageData = {
      text: inputMessage.trim(),
      senderId: socket.id || 'user',
      room: currentRoom,
      type: 'chat' as const,
    };

    socket.emit('message', messageData);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      // Handle typing indicators
      handleTypingStart();
    }
  };

  const handleTypingStart = () => {
    if (!socket || !isJoined) return;

    socket.emit('typing:start', {
      roomId: currentRoom,
      userName: userName,
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 1000);
  };

  const handleTypingStop = () => {
    if (!socket || !isJoined) return;
    
    socket.emit('typing:stop', {
      roomId: currentRoom,
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatJoinTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isJoined) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Join Real-time Chat</span>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              </Badge>
            </CardTitle>
            <CardDescription>
              Enter your details to join the real-time chat room
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name *</label>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                disabled={!isConnected}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email (optional)</label>
              <Input
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Enter your email"
                type="email"
                disabled={!isConnected}
              />
            </div>
            <Button 
              onClick={handleJoin} 
              disabled={!isConnected || !userName.trim()}
              className="w-full"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Join Chat
            </Button>
            {!isConnected && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Connecting to server...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
      {/* Users Sidebar */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users ({users.length})</span>
            </span>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {(user.name || user.email || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name || user.email || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatJoinTime(user.joinedAt)}
                    </p>
                  </div>
                  {user.id === socket?.id && (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {serverInfo && (
            <>
              <Separator />
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>Server: {new Date(serverInfo.serverTime).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Settings className="h-3 w-3" />
                  <span>Socket ID: {serverInfo.socketId?.substring(0, 8)}...</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-3 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Real-time Chat</span>
            </span>
            <Badge variant="outline">Room: {currentRoom}</Badge>
          </CardTitle>
          <CardDescription>
            Connected users can chat in real-time
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Messages Area */}
          <ScrollArea className="flex-1 border rounded-lg p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex space-x-3 ${
                      message.senderId === socket?.id ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.senderId !== socket?.id && message.type !== 'system' && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {message.senderName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        message.senderId === socket?.id
                          ? "bg-primary text-primary-foreground"
                          : message.type === 'system'
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.type !== 'system' && (
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">
                            {message.senderName}
                          </span>
                          <span className="text-xs opacity-70">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">
                        {message.text}
                      </p>
                    </div>
                    {message.senderId === socket?.id && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
              
              {/* Typing indicators */}
              {typingUsers.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                  <span>
                    {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={!isConnected}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!isConnected || !inputMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}