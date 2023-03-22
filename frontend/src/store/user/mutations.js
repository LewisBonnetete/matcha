export function login(state, user) {
  state.id = user.id;
  state.name = user.first_name;
  state.email = user.email;
  state.logged = true;
  state.jwt = user.jwt;
}

export function setEmail(state, email) {
  state.email = email;
}

export function setName(state, name) {
  state.name = name;
}

export function setId(state, id) {
  state.id = id;
}

export function setPending(state, bool) {
  state.pending = bool;
}

export function setLogged(state, logged) {
  state.logged = logged;
}

export function setUserInfo(state, userInfo) {
  state.userInfo = userInfo;
}

export function setUserNotifs(state, userNotifs) {
  state.userNotifs = userNotifs;
}

export function errorLoadingUser(state, err) {
  state.status = err;
}

export function logout(state) {
  state.profiles = [];
  state.jwt = null;
  state.id = '';
  state.name = '';
  state.email = '';
  state.logged = false;
  state.userNotifs = [];
  state.userInfo = '';
}
