import { createFileRoute } from '@tanstack/react-router';
import { Form, Spin, App } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { useRequest } from 'ahooks';
import {
  getUserSettingsApi,
  updateNotificationFlagsApi,
  updateReviewRulesApi,
} from '@/apis/settings';
import type { UpdateReviewNotificationSettingsDto } from '@y/interface/settings/dto/update-review-notification-settings.dto.js';
import { UnregisterAccountModal } from './-unregister-account-modal.tsx';
import { useState } from 'react';
import { AccountSettings } from './-account-settings.tsx';
import { NotificationSettings } from './-notification-settings.tsx';
import { ReviewRulesSettings } from './-review-rules-settings.tsx';
import { StudyTimeWindows } from './-study-time-windows.tsx';
import { defaultReviewRules } from '@y/interface/common/constants/review.constants.ts';

export const Route = createFileRoute('/_core/set-up/')({
  component: SettingsComponent,
});

function SettingsComponent() {
  const [form] = Form.useForm<UpdateReviewNotificationSettingsDto>();
  const { message, modal } = App.useApp();

  const { loading: loadingInitialSettings } = useRequest(getUserSettingsApi, {
    onSuccess: (data) => {
      form.setFieldsValue(data);
    },
    onError: (err) => {
      message.error(err.message);
    },
  });

  const { run: saveNotificationFlags, loading: savingNotificationFlags } =
    useRequest(updateNotificationFlagsApi, {
      manual: true,
      onSuccess: () => {
        message.success('通知设置已更新');
      },
      onError: (err) => {
        message.error(err.message);
      },
    });

  const { run: saveReviewRules, loading: savingReviewRules } = useRequest(
    updateReviewRulesApi,
    {
      manual: true,
      onSuccess: () => {
        message.success('提醒规则已保存');
      },
      onError: (err) => {
        message.error(err.message);
      },
    },
  );

  const triggerSaveNotifications = () => {
    // We only need the notificationSettings part of the form
    const notificationSettings = form.getFieldValue('notificationSettings');
    saveNotificationFlags(notificationSettings);
  };

  const triggerSaveReviewRules = () => {
    form
      .validateFields(['reviewRules'])
      .then((values) => {
        // We only need the array, not the wrapper object
        saveReviewRules(values.reviewRules);
      })
      .catch(() => {
        message.error('请检查提醒规则的输入是否有误');
      });
  };

  const handleResetRules = () => {
    const rulesWithIds = defaultReviewRules.map((rule) => ({
      ...rule,
      id: uuidv4(),
    }));
    form.setFieldsValue({ reviewRules: rulesWithIds });
    message.info('规则已重置为默认值，请记得点击保存。');
  };

  const [isUnregisterModalOpen, setIsUnregisterModalOpen] = useState(false);

  const showUnregisterConfirm = () => {
    modal.confirm({
      title: '您确定要注销您的账号吗？',
      content: '此操作不可逆，您的所有数据都将被永久删除。请谨慎操作。',
      okText: '确认注销',
      cancelText: '取消',
      onOk: () => {
        setIsUnregisterModalOpen(true);
      },
    });
  };

  return (
    <Spin spinning={loadingInitialSettings} tip="加载中...">
      <div className="container mx-auto">
        <Form form={form} layout="vertical">
          <AccountSettings
            form={form}
            showUnregisterConfirm={showUnregisterConfirm}
          />
          <NotificationSettings onValueChange={triggerSaveNotifications} />
          <ReviewRulesSettings
            form={form}
            onSave={triggerSaveReviewRules}
            onReset={handleResetRules}
            isSaving={savingReviewRules || savingNotificationFlags}
          />
          <StudyTimeWindows />

          <UnregisterAccountModal
            open={isUnregisterModalOpen}
            onClose={() => setIsUnregisterModalOpen(false)}
          />
        </Form>
      </div>
    </Spin>
  );
}
