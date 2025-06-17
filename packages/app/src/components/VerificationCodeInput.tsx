import { useState, useEffect } from 'react';
import { Input, Button, Typography } from 'antd';

const { Text } = Typography;

interface VerificationCodeInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onResend: () => void;
  loading?: boolean;
  email: string;
  placeholder?: string;
  maxLength?: number;
  extra?: React.ReactNode;
  disabled?: boolean;
  autoStartCountdown?: boolean; // 是否在首次渲染时自动开始倒计时
  tipText?: string; // 自定义提示文字，默认显示"验证码已发送至 {email}"
}

export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  value,
  onChange,
  onResend,
  loading = false,
  email,
  placeholder = '请输入6位验证码',
  maxLength = 6,
  extra,
  disabled = false,
  autoStartCountdown = false,
  tipText,
}) => {
  const [countdown, setCountdown] = useState(autoStartCountdown ? 60 : 0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [countdown]);

  const handleResend = () => {
    if (countdown > 0 || loading) return;
    setCountdown(60); // 60秒倒计时
    onResend();
  };

  const isDisabled = countdown > 0 || loading;

  return (
    <div>
      {extra && <div className="mb-2">{extra}</div>}
      <div className="flex">
        <Input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
        />
        <Button
          type="link"
          onClick={handleResend}
          disabled={isDisabled}
          style={{ minWidth: '100px' }}
        >
          {countdown > 0 ? `${countdown}s后重发` : '重新发送'}
        </Button>
      </div>
      <div className="mt-2">
        <Text type="secondary">{tipText || `验证码已发送至 ${email}`}</Text>
      </div>
    </div>
  );
};

export default VerificationCodeInput;
