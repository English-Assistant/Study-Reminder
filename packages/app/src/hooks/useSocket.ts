import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUserStore } from '@/stores/user.store';
import { App } from 'antd';

interface NotificationData {
  title: string;
  body: string;
  tag: string;
  timestamp: string;
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const { notification } = App.useApp();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const user = useUserStore((s) => s.user);
  const token = useUserStore((s) => s.accessToken);

  // 请求浏览器通知权限
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('通知权限:', permission);
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    }
    return false;
  }, []);

  // 显示浏览器通知
  const showBrowserNotification = useCallback((data: NotificationData) => {
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(data.title, {
        body: data.body,
        tag: data.tag,
      });

      // 点击通知时聚焦到当前窗口
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };

      // 自动关闭通知
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }, []);

  // 连接WebSocket
  const connect = useCallback(() => {
    if (!token || !user) {
      console.log('缺少认证信息，无法连接WebSocket');
      return;
    }

    // 如果已经连接，先断开
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }

    console.log('正在连接WebSocket...');

    const socket = io(`/socket.io`, {
      auth: {
        token: token,
      },
      autoConnect: true,
      forceNew: true,
    });

    socketRef.current = socket;

    // 连接成功
    socket.on('connect', () => {
      console.log('WebSocket连接成功:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    // 连接错误
    socket.on('connect_error', (error) => {
      console.error('WebSocket连接错误:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // 断开连接
    socket.on('disconnect', (reason) => {
      console.log('WebSocket断开连接:', reason);
      setIsConnected(false);
    });

    // 认证错误
    socket.on('error', (error) => {
      console.error('WebSocket认证错误:', error);
      setConnectionError(error);
      setIsConnected(false);
    });

    // 接收通知
    socket.on('notification', (data: NotificationData) => {
      console.log('收到通知:', data);

      // 显示Antd通知
      notification.info({
        message: data.title,
        description: data.body,
        placement: 'topRight',
        duration: 4,
      });

      // 显示浏览器通知
      showBrowserNotification(data);
    });
  }, [token, user, notification, showBrowserNotification]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  // 初始化连接
  useEffect(() => {
    if (token && user) {
      connect();
      requestNotificationPermission();
    }

    return () => {
      disconnect();
    };
  }, [token, user, connect, disconnect, requestNotificationPermission]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    requestNotificationPermission,
  };
}
