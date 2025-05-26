import { create, type StateCreator } from 'zustand';
import {
  persist,
  createJSONStorage,
  type PersistOptions,
} from 'zustand/middleware';

// 从后端导入 User 类型
// 假设 prisma.type.ts 导出了名为 User 的类型
import { User as BackendUserType } from '@y/interface/common/prisma.type.ts';

// 使用导入的后端 User 类型，如果需要，可以进行调整或扩展
// interface User extends BackendUserType {
//   // 如果前端需要额外字段，可以在这里扩展
// }
// 为简单起见，直接使用 BackendUserType 并命名为 User
type User = BackendUserType;

interface UserData {
  user: User | null;
  accessToken: string | null;
}

interface UserActions {
  login: (userData: User, token: string) => void;
  logout: () => void;
  setUser: (userData: User | null) => void;
  setToken: (token: string | null) => void;
}

interface UserState extends UserData {
  actions: UserActions;
}

// 定义 persist 中间件的类型，使其与我们的状态兼容
type UserPersistMiddleware = (
  config: StateCreator<UserState, [], []>,
  options: PersistOptions<UserState, UserData>,
) => StateCreator<UserState, [], []>;

export const useUserStore = create<UserState>(
  (persist as UserPersistMiddleware)(
    (set) => ({
      user: null,
      accessToken: null,
      actions: {
        login: (userData: User, token: string) => {
          set({ user: userData, accessToken: token });
        },
        logout: () => {
          set({ user: null, accessToken: null });
        },
        setUser: (userData: User | null) => set({ user: userData }),
        setToken: (token: string | null) => set({ accessToken: token }),
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      // partialize 只选择 user 和 accessToken 进行持久化
      partialize: (state): UserData => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    },
  ),
);

// 方便在非 React 组件中访问 actions (如果需要)
// export const userActions = useUserStore.getState().actions;
// 或者分别导出：
// export const { login, logout, setUser, setToken } = useUserStore.getState().actions;
