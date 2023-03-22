import { api } from 'boot/axios';

export async function fetchUserInfo({ commit }, userId) {
  const infos = await api.get(`users/${userId}`).then(({ data }) => {
    commit('setUserInfo', data.user);
    return (data.user[0]);
  });
  return (infos);
}

export async function fetchUserNotifications({ commit }, userId) {
  await api.get(`users/${userId}/notifications`).then(({ data }) => {
    commit('setUserNotifs', data.notifications);
    return (data.notifications);
  });
}

export async function loginUser({ commit }, payload) {
  payload.email = payload.email.toLowerCase().trim();
  let error = '';
  return api.post('/auth', payload)
    .then(({ data }) => {
      if (data.data.user[0].valid) {
        api.defaults.headers.common.Authorization = `Bearer ${data.data.accessToken}`;
        localStorage.setItem('user-jwt', data.data.accessToken);
        localStorage.setItem('user-logged', true);
        data.data.user[0].jwt = data.data.accessToken;
        localStorage.setItem('user', JSON.stringify(data.data.user[0]));
        api.put(`users/${data.data.user[0].id}/online/true`);
        commit('login', data.data.user[0]);
      } else {
        error = 'Email is not verified';
      }
      return { err: error };
    })
    .catch((err) => {
      localStorage.removeItem('user-id');
      localStorage.removeItem('user-name');
      localStorage.removeItem('user-email');
      localStorage.removeItem('user-jwt');
      localStorage.removeItem('user-logged');
      return { err };
    });
}

export function useLocalStorage({ commit }) {
  if (localStorage.getItem('user-jwt')) {
    const user = JSON.parse(localStorage.getItem('user'));
    commit('login', user);
    api.defaults.headers.common.Authorization = `Bearer ${user.jwt}`;
    api.put(`users/${user.id}/online/true`);
  }
}

export function logoutUser({ commit }, userId) {
  api.put(`users/${userId}/online/false`);
  commit('logout');
  this.$router.push('/login')
  localStorage.removeItem('user-id');
  localStorage.removeItem('user-name');
  localStorage.removeItem('user-email');
  localStorage.removeItem('user-jwt');
  localStorage.removeItem('user-logged');
  localStorage.clear();
}
