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
  App as AntApp,
  Spin,
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import CourseFormModal from './-CourseFormModal';
import type { CreateCourseDto } from '@y/interface/courses/dto/create-course.dto.ts';
import type { UpdateCourseDto } from '@y/interface/courses/dto/update-course.dto.ts';
import { useRequest } from 'ahooks';
import {
  getAllCoursesApi,
  createCourseApi,
  updateCourseApi,
  deleteCourseApi,
} from '@/apis/courses';
import type { Course as PrismaCourse } from '@y/interface/common/prisma.type.ts';

const { Content } = Layout;
const { Title, Text } = Typography;

export const Route = createFileRoute('/_core/courses/')({
  component: ManageCoursesComponent,
});

function ManageCoursesComponent() {
  const { message } = AntApp.useApp();

  const {
    data: courses,
    loading: loadingCourses,
    refresh: refreshCourses,
  } = useRequest<PrismaCourse[], []>(getAllCoursesApi, {
    onError(e) {
      message.error(e.message || '获取课程失败');
    },
  });

  const [searchText, setSearchText] = useState('');
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<PrismaCourse | null>(
    null,
  );

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourseData, setEditingCourseData] =
    useState<PrismaCourse | null>(null);

  const { run: runCreateCourse, loading: loadingCreate } = useRequest(
    createCourseApi,
    {
      manual: true,
      onSuccess: (result) => {
        message.success(`课程 "${result.name}" 已成功添加!`);
        refreshCourses();
        setIsCourseModalOpen(false);
      },
      onError: (error) => {
        message.error(error.message || '添加课程失败');
      },
    },
  );

  const { run: runUpdateCourse, loading: loadingUpdate } = useRequest(
    updateCourseApi,
    {
      manual: true,
      onSuccess: (result) => {
        message.success(`课程 "${result.name}" 已成功更新!`);
        refreshCourses();
        setIsCourseModalOpen(false);
        setEditingCourseData(null);
      },
      onError: (error) => {
        message.error(error.message || '更新课程失败');
      },
    },
  );

  const { run: runDeleteCourse, loading: loadingDelete } = useRequest(
    deleteCourseApi,
    {
      manual: true,
      onSuccess: () => {
        if (courseToDelete) {
          message.success(`课程 "${courseToDelete.name}" 已成功删除!`);
        }
        refreshCourses();
        setIsDeleteModalVisible(false);
        setCourseToDelete(null);
      },
      onError: (error) => {
        message.error(error.message || '删除课程失败');
      },
    },
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const showDeleteModal = (course: PrismaCourse) => {
    setCourseToDelete(course);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (courseToDelete) {
      runDeleteCourse(courseToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false);
    setCourseToDelete(null);
  };

  const handleOpenAddCourseModal = () => {
    setEditingCourseData(null);
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourseModal = (course: PrismaCourse) => {
    setEditingCourseData(course);
    setIsCourseModalOpen(true);
  };

  const handleCourseFormSubmit = (values: PrismaCourse) => {
    if (editingCourseData) {
      const updateDto: UpdateCourseDto = {
        name: values.name,
        note: values.note === null ? undefined : values.note,
        color: values.color,
      };
      runUpdateCourse(editingCourseData.id, updateDto);
    } else {
      const createDto: CreateCourseDto = {
        name: values.name,
        note: values.note === null ? undefined : values.note,
        color: values.color,
      };
      runCreateCourse(createDto);
    }
  };

  const displayedCourses = courses || [];

  const filteredCourses = displayedCourses.filter((course) =>
    course.name.toLowerCase().includes(searchText.toLowerCase()),
  );
  return (
    <>
      <Spin spinning={loadingCourses} tip="加载中...">
        <Layout className="bg-#fff container mx-auto">
          <Content className="p-6 pt-0">
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
                  style={{
                    color: '#64748B',
                    fontSize: '16px',
                    lineHeight: '24px',
                  }}
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
                  cursor:
                    loadingCreate || loadingUpdate || loadingDelete
                      ? 'not-allowed'
                      : 'pointer',
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
                onClick={() => {
                  if (loadingCreate || loadingUpdate || loadingDelete) return;
                  handleOpenAddCourseModal();
                }}
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
                  <PlusOutlined
                    style={{ fontSize: '24px', color: '#64748B' }}
                  />
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
                      {course.note}
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
                        aria-label="编辑课程"
                      />
                      <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => showDeleteModal(course)}
                        aria-label="删除课程"
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
            okButtonProps={{ danger: true, loading: loadingDelete }}
            confirmLoading={loadingDelete}
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
      </Spin>
    </>
  );
}
