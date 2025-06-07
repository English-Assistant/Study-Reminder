import {
  App,
  Button,
  Card,
  Form,
  List,
  Modal,
  Popconfirm,
  Space,
  TimePicker,
  Typography,
} from 'antd';
import { useRequest } from 'ahooks';
import {
  createStudyTimeWindowApi,
  deleteStudyTimeWindowApi,
  getStudyTimeWindowsApi,
  updateStudyTimeWindowApi,
} from '@/apis/settings.ts';
import { PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import dayjs from 'dayjs';

const TIME_FORMAT = 'HH:mm';

interface StudyTimeWindow {
  id: string;
  startTime: string;
  endTime: string;
}

interface EditModalState {
  open: boolean;
  window?: StudyTimeWindow;
}

export function StudyTimeWindows() {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [editModalState, setEditModalState] = useState<EditModalState>({
    open: false,
  });

  const {
    data: studyTimeWindows,
    loading,
    refresh,
  } = useRequest(getStudyTimeWindowsApi);

  const { run: create, loading: creating } = useRequest(
    createStudyTimeWindowApi,
    {
      manual: true,
      onSuccess: () => {
        message.success('添加成功');
        refresh();
        setEditModalState({ open: false });
      },
    },
  );

  const { run: update, loading: updating } = useRequest(
    updateStudyTimeWindowApi,
    {
      manual: true,
      onSuccess: () => {
        message.success('更新成功');
        refresh();
        setEditModalState({ open: false });
      },
    },
  );

  const { run: remove } = useRequest(deleteStudyTimeWindowApi, {
    manual: true,
    onSuccess: () => {
      message.success('删除成功');
      refresh();
    },
  });

  const handleOpenModal = (window?: StudyTimeWindow) => {
    setEditModalState({ open: true, window });
    if (window) {
      form.setFieldsValue({
        time: [
          dayjs(window.startTime, TIME_FORMAT),
          dayjs(window.endTime, TIME_FORMAT),
        ],
      });
    } else {
      form.resetFields();
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const [startTime, endTime] = values.time;

      const payload = {
        startTime: startTime.format(TIME_FORMAT),
        endTime: endTime.format(TIME_FORMAT),
      };

      if (editModalState.window?.id) {
        update(editModalState.window.id, payload);
      } else {
        create(payload);
      }
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  };

  return (
    <Card
      title="学习时间段"
      className="mb-8"
      extra={
        <Button
          icon={<PlusOutlined />}
          type="primary"
          onClick={() => handleOpenModal()}
        >
          添加时间段
        </Button>
      }
    >
      <Typography.Text type="secondary" className="block mb-4">
        设置您希望接收复习提醒的时间范围。系统将只在这些时间段内发送通知。如果提醒的原始时间点在非学习时段，它将被推迟到下一个有效时间段的开始。
      </Typography.Text>
      <List
        size="small"
        loading={loading}
        dataSource={studyTimeWindows}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            actions={[
              <Button
                key="edit"
                type="link"
                onClick={() => handleOpenModal(item)}
              >
                编辑
              </Button>,
              <Popconfirm
                key="delete"
                title="删除时间段"
                description="您确定要删除这个时间段吗？"
                onConfirm={() => remove(item.id)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" danger>
                  删除
                </Button>
              </Popconfirm>,
            ]}
          >
            <Space>
              <span>{item.startTime}</span>-<span>{item.endTime}</span>
            </Space>
          </List.Item>
        )}
      />
      <Modal
        title={editModalState.window ? '编辑时间段' : '新增时间段'}
        open={editModalState.open}
        onCancel={() => setEditModalState({ open: false })}
        onOk={handleOk}
        confirmLoading={creating || updating}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="time"
            label="时间范围"
            rules={[{ required: true, message: '请选择时间范围' }]}
          >
            <TimePicker.RangePicker format={TIME_FORMAT} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
