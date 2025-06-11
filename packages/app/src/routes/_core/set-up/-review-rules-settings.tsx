import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  List,
  Select,
  Space,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  DownOutlined,
  HolderOutlined,
  PlusOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import type { FormInstance, FormListFieldData } from 'antd';
import type { ReviewRuleDto } from '@y/interface/review-settings/dto/review-rule.dto.js';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

const friendlyReminderUnitOptions = [
  { value: 'MINUTE', label: '分钟后' },
  { value: 'HOUR', label: '小时后' },
  { value: 'DAY', label: '天后' },
];

const repetitionOptions = [
  { value: 'ONCE', label: '仅一次' },
  { value: 'RECURRING', label: '循环' },
];

// 1. 创建一个新的组件来包裹可排序的列表项
const SortableItem = ({
  field,
  index,
  fields,
  remove,
}: {
  field: FormListFieldData;
  index: number;
  fields: FormListFieldData[];
  globalRemindersFormEnabled: boolean;
  remove: (index: number) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.key,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { zIndex: 99, backgroundColor: '#fafafa' } : {}),
  };

  const { key, ...restField } = field;
  return (
    <List.Item
      ref={setNodeRef}
      key={key}
      style={{
        ...style,
        padding: '12px 0',
        borderBottom: index < fields.length - 1 ? '1px solid #f0f0f0' : 'none',
      }}
      {...attributes}
    >
      <Space align="baseline">
        <HolderOutlined {...listeners} style={{ cursor: 'grab' }} />
        <Form.Item
          {...restField}
          name={[field.name, 'value']}
          rules={[
            { required: true, message: '请输入时间值' },
            {
              type: 'number',
              min: 1,
              message: '必须大于0',
            },
          ]}
          noStyle
        >
          <InputNumber placeholder="时间值 (>0)" style={{ width: '120px' }} />
        </Form.Item>
        <Form.Item
          {...restField}
          name={[field.name, 'unit']}
          rules={[{ required: true, message: '请选择单位' }]}
          noStyle
        >
          <Select
            suffixIcon={<DownOutlined />}
            style={{ width: '110px' }}
            options={friendlyReminderUnitOptions}
          />
        </Form.Item>
        <Form.Item
          {...restField}
          name={[field.name, 'mode']}
          rules={[{ required: true, message: '请选择周期' }]}
          noStyle
        >
          <Select
            suffixIcon={<DownOutlined />}
            style={{ width: '110px' }}
            options={repetitionOptions}
          />
        </Form.Item>
        <Form.Item {...restField} name={[field.name, 'note']} noStyle>
          <Input placeholder="规则描述 (可选)" style={{ width: '180px' }} />
        </Form.Item>
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => remove(field.name)}
        >
          删除
        </Button>
      </Space>
    </List.Item>
  );
};

interface ReviewRulesSettingsProps {
  form: FormInstance;
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
}

export function ReviewRulesSettings({
  form,
  onSave,
  onReset,
  isSaving,
}: ReviewRulesSettingsProps) {
  const globalRemindersFormEnabled = Form.useWatch(
    ['notificationSettings', 'globalNotification'],
    form,
  );

  return (
    <Card title="自定义提醒规则" className="mb-8">
      <Typography.Text type="secondary" className="block mb-4">
        在这里定义您的复习周期。例如，您可以设置在学习后1小时、1天、3天和7天分别进行一次复习。系统将根据这些规则自动为您安排复习计划。
      </Typography.Text>
      <Form.List name="reviewRules">
        {(fields, { add, remove, move }) => {
          const onDragEnd = ({ active, over }: DragEndEvent) => {
            if (active.id !== over?.id) {
              const activeIndex = fields.findIndex(
                (field) => field.key === active.id,
              );
              const overIndex = fields.findIndex(
                (field) => field.key === over?.id,
              );
              move(activeIndex, overIndex);
            }
          };
          return (
            <DndContext onDragEnd={onDragEnd}>
              <SortableContext
                items={fields.map((field) => field.key)}
                strategy={verticalListSortingStrategy}
              >
                <List
                  itemLayout="horizontal"
                  dataSource={fields}
                  locale={{
                    emptyText: globalRemindersFormEnabled
                      ? '暂无自定义规则，请添加新的规则。'
                      : '提醒服务已关闭',
                  }}
                  renderItem={(field, index: number) => (
                    <SortableItem
                      key={field.key}
                      field={field}
                      index={index}
                      fields={fields}
                      globalRemindersFormEnabled={globalRemindersFormEnabled}
                      remove={remove}
                    />
                  )}
                />
              </SortableContext>
              <Button
                type="link"
                className="px-0!"
                onClick={() =>
                  add({
                    id: Date.now(),
                    value: 1,
                    unit: 'DAY',
                    mode: 'ONCE',
                    note: '',
                  } satisfies ReviewRuleDto)
                }
                icon={<PlusOutlined />}
                size="large"
              >
                添加新规则
              </Button>
            </DndContext>
          );
        }}
      </Form.List>
      <div className="flex mt-4">
        <div className="flex-1"></div>
        <Space>
          <Button icon={<UndoOutlined />} onClick={onReset}>
            重置规则
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={isSaving}
            style={{ minWidth: '120px' }}
            onClick={onSave}
          >
            保存设置
          </Button>
        </Space>
      </div>
    </Card>
  );
}
