import { createFileRoute } from '@tanstack/react-router';
import {
  Layout,
  Typography,
  Input,
  Row,
  Col,
  Card,
  Space,
  Button,
  Modal as AntModal,
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import CourseFormModal from './-CourseFormModal';
import type { CourseFormData } from './-CourseFormModal';

const { Content } = Layout;
const { Title, Text } = Typography;

export const Route = createFileRoute('/_core/manage-courses/')({
  component: ManageCoursesComponent,
});

interface DisplayCourse extends CourseFormData {
  id: string;
}

const initialCourses: DisplayCourse[] = [
  {
    id: '1',
    name: '高等数学',
    description: '学习微积分、线性代数等基础数学知识',
    color: '#2563EB',
  },
  {
    id: '2',
    name: '大学物理',
    description: '探索力学、热学、电磁学等物理原理',
    color: '#7C3AED',
  },
  {
    id: '3',
    name: '程序设计',
    description: '掌握编程基础和算法设计方法',
    color: '#059669',
  },
  {
    id: '4',
    name: '数据结构',
    description: '学习常见数据结构和算法实现',
    color: '#DC2626',
  },
  {
    id: '5',
    name: '计算机网络',
    description: '理解网络协议和系统架构',
    color: '#EA580C',
  },
  {
    id: '6',
    name: '操作系统',
    description: '深入学习操作系统原理和实现',
    color: '#D97706',
  },
];

function ManageCoursesComponent() {
  const [courses, setCourses] = useState<DisplayCourse[]>(initialCourses);
  const [searchText, setSearchText] = useState('');
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<DisplayCourse | null>(
    null,
  );

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourseData, setEditingCourseData] =
    useState<DisplayCourse | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  const showDeleteModal = (course: DisplayCourse) => {
    setCourseToDelete(course);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (courseToDelete) {
      setCourses(courses.filter((course) => course.id !== courseToDelete.id));
      alert(`${courseToDelete.name} 已删除`);
    }
    setIsDeleteModalVisible(false);
    setCourseToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false);
    setCourseToDelete(null);
  };

  const handleOpenAddCourseModal = () => {
    setEditingCourseData(null);
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourseModal = (course: DisplayCourse) => {
    setEditingCourseData(course);
    setIsCourseModalOpen(true);
  };

  const handleCourseFormSubmit = (values: CourseFormData) => {
    if (editingCourseData) {
      setCourses(
        courses.map((c) =>
          c.id === editingCourseData.id
            ? { ...editingCourseData, ...values }
            : c,
        ),
      );
      alert(`${values.name} 已更新`);
    } else {
      const newCourse: DisplayCourse = {
        id: Date.now().toString(),
        ...values,
      };
      setCourses([...courses, newCourse]);
      alert(`${values.name} 已添加`);
    }
    setIsCourseModalOpen(false);
    setEditingCourseData(null);
  };

  return (
    <Layout style={{ background: '#fff' }}>
      <Content style={{ padding: '0 48px' }}>
        <style>
          {`
            .course-grid-container {
              display: grid;
              gap: 24px;
              grid-template-columns: repeat(1, 1fr); /* xs: 1 column */
            }
            @media (min-width: 576px) { /* sm: 2 columns */
              .course-grid-container {
                grid-template-columns: repeat(2, 1fr);
              }
            }
            @media (min-width: 768px) { /* md: 3 columns */
              .course-grid-container {
                grid-template-columns: repeat(3, 1fr);
              }
            }
            @media (min-width: 1200px) { /* xl: 4 columns */
              .course-grid-container {
                grid-template-columns: repeat(4, 1fr);
              }
            }
          `}
        </style>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginTop: '24px', marginBottom: '0px' }}
        >
          <Col>
            <Title
              level={2}
              style={{
                color: '#1E293B',
                margin: 0,
                fontSize: '28px',
                lineHeight: '42px',
              }}
            >
              课程管理
            </Title>
          </Col>
          <Col>
            <Input
              style={{ width: '256px', borderRadius: '6px' }}
              placeholder="搜索课程..."
              prefix={<SearchOutlined style={{ color: '#64748B' }} />}
              onChange={handleSearch}
              value={searchText}
            />
          </Col>
        </Row>

        <Row style={{ marginTop: '0px', marginBottom: '24px' }}>
          <Col>
            <Text
              style={{ color: '#64748B', fontSize: '16px', lineHeight: '24px' }}
            >
              管理您的所有课程，添加新课程或编辑现有课程
            </Text>
          </Col>
        </Row>

        <div className="course-grid-container">
          <Card
            hoverable
            style={{
              borderRadius: '8px',
              border: '2px dashed #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              height: '100%',
            }}
            styles={{
              body: {
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              },
            }}
            onClick={handleOpenAddCourseModal}
          >
            <div
              style={{
                background: '#F1F5F9',
                borderRadius: '9999px',
                padding: '12px',
                display: 'inline-flex',
                marginBottom: '12px',
              }}
            >
              <PlusOutlined style={{ fontSize: '24px', color: '#64748B' }} />
            </div>
            <Text
              style={{
                color: '#64748B',
                fontSize: '16px',
                lineHeight: '24px',
              }}
            >
              添加新课程
            </Text>
          </Card>

          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              style={{
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                height: '100%',
              }}
              styles={{
                body: {
                  padding: 0,
                },
              }}
            >
              <div style={{ height: '8px', background: course.color }} />
              <div style={{ padding: '24px' }}>
                <Title
                  level={4}
                  style={{
                    color: '#1E293B',
                    fontSize: '18px',
                    lineHeight: '28px',
                    marginBottom: '8px',
                  }}
                >
                  {course.name}
                </Title>
                <Text
                  style={{
                    color: '#64748B',
                    lineHeight: '20px',
                    display: 'block',
                    minHeight: '40px',
                  }}
                >
                  {course.description}
                </Text>
                <Space
                  style={{
                    marginTop: '16px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleOpenEditCourseModal(course)}
                    style={{ border: 'none' }}
                    title={`编辑 ${course.name}`}
                  />
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={() => showDeleteModal(course)}
                    danger
                    style={{ border: 'none' }}
                    title={`删除 ${course.name}`}
                  />
                </Space>
              </div>
            </Card>
          ))}
        </div>
      </Content>

      <AntModal
        title="确认删除"
        open={isDeleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>
          您确定要删除课程 &ldquo;{courseToDelete?.name}&rdquo;
          吗？此操作无法撤销。
        </p>
      </AntModal>

      <CourseFormModal
        open={isCourseModalOpen}
        onClose={() => {
          setIsCourseModalOpen(false);
          setEditingCourseData(null);
        }}
        onSubmit={handleCourseFormSubmit}
        initialData={editingCourseData}
      />
    </Layout>
  );
}
