<template>
  <q-layout view="hHh LpR fFf">
    <q-header
      reveal
      elevated
      class="bg-primary row text-white"
      height-hint="98"
    >
      <q-toolbar class="col">
        <q-toolbar-title> Matcha </q-toolbar-title>
      </q-toolbar>

      <q-tabs class="col-auto">
        <q-route-tab
          v-if="logged"
          style="height: 100%; width: 200px"
          :ripple="false"
          to="/Home"
          flat
          icon="whatshot"
        />
        <q-route-tab
          v-if="logged"
          style="height: 100%; width: 200px"
          :ripple="false"
          to="/profile"
          flat
          icon="person"
        />
        <q-route-tab
          v-if="logged"
          style="height: 100%; width: 200px"
          :ripple="false"
          to="/likes"
          flat
          icon="favorite"
        />
        <q-route-tab
          v-if="logged"
          style="height: 100%; width: 200px"
          :ripple="false"
          to="/settings"
          flat
          icon="settings"
        />
        <q-btn
          v-if="logged"
          style="height: 100%; width: 200px"
          :ripple="false"
          flat
          @click="logout"
          icon="logout"
        />
        <q-btn
          v-if="$route.name"
          style="height: 100%; width: 200px"
          :ripple="false"
          flat
          to="/login"
          icon="logout"
        />
      </q-tabs>
    </q-header>

    <q-drawer v-if="logged" :width="450" v-model="chatsOpen" side="left" bordered>
      <Chats :open="chatsOpen" />
    </q-drawer>

    <q-page-container  class="justify-center">
      <router-view />
    </q-page-container>

    <q-footer
      elevated
      class="
        bg-secondary
        text-white
        row
        justify-between
        items-start
        content-start
      "
      height-hint="98">
      <q-btn
        v-if="logged"
        style="height: 100%; width: 450px"
        @click="chatsOpen = !chatsOpen"
        :ripple="false"
        flat
        color="accent"
        icon="chat"/>
      <div>
        <q-dialog v-if="logged" v-model="notificationsOpen" seamless position="bottom">
          <Notifications @update="fetchNotifs()" :notifs="notifs"
            :notificationsOpen="notificationsOpen" />
        </q-dialog>
      </div>
      <q-btn
        v-if="logged"
        style="height: 100%; width: 300px"
        @click="notificationsOpen = !notificationsOpen"
        :ripple="false"
        flat
        color="primary"
        icon="notifications">
          <q-badge v-if="unreadNotifs > 0" style="z-index: 1000;
          transform: translate(-130px, 5px)" color="red" floating>
            {{ unreadNotifs }}
          </q-badge>
      </q-btn>
    </q-footer>
  </q-layout>
</template>

<script>
import Chats from "components/Chats";
import Notifications from "components/Notifications";
import { ref } from "vue";

export default {
  components: {
    Chats,
    Notifications,
  },
  data() {
    return {
      notificationsOpen: ref(false),
      chatsOpen: ref(false),
      notifs: [],
      setIntervalId: '',
      unreadNotifs: 0,
    };
  },
  mounted() {
    this.fetchNotifs();
    this.intervalId = window.setInterval(() => {
      this.fetchNotifs();
    }, 8000);
  },
  methods: {
    logout() {
      this.notifs = [];
      this.notificationsOpen = false;
      this.$store.dispatch('user/logoutUser', this.$store.getters['user/getId']);
      this.$router.push('Login');
      this.$q.notify({ type: 'positive', message: 'Logged out' });
    },
    fetchNotifs() {
      if (this.$store.getters['user/getId']) {
        this.$api.get(`users/${this.$store.getters['user/getId']}/notifications`).then(({ data }) => {
          this.notifs = data.notifications.reverse();
          this.getUnreadNotifs();
        });
      }
    },
    getUnreadNotifs() {
      let i = 0;
      this.notifs.forEach((notif) => {
        if (!notif.read) i += 1;
      });
      this.unreadNotifs = i;
    },
  },
  computed: {
    logged() {
      return this.$store.getters['user/getLogged'];
    },
  },
};
</script>
