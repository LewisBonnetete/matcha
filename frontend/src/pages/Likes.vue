<template>
  <q-page padding>
    <q-list>
      <q-item v-for="(profile, key) in result" clickable v-ripple :key="key">
        <q-item-section style="max-width: 50px" v-if="profile.type === like">
          <q-icon color="positive" name="favorite" />
        </q-item-section>
        <q-item-section style="max-width: 50px" v-if="profile.type === visit">
          <q-icon color="accent" name="visibility" />
        </q-item-section>
        <q-item-section style="max-width: 50px" v-if="profile.type === match">
          <q-icon color="primary" name="bolt" />
        </q-item-section>
        <q-item-section style="max-width: 50px" v-if="profile.type === message">
          <q-icon color="accent" name="chat" />
        </q-item-section>
        <q-item-section style="max-width: 50px" v-if="profile.type === dislike">
          <q-icon color="negative" name="close" />
        </q-item-section>
        <q-item-section @click="goTo(profile.user_id)" style="max-width: 350px" v-if="profile.type === like">
          {{ profile.first_name }} liked your profile. <span class="text-caption">{{ profile.time.slice(0, 10) }}</span>
        </q-item-section>
        <q-item-section @click="goTo(profile.user_id)" style="max-width: 350px" v-if="profile.type === visit">
          {{ profile.first_name }} visited your profile. <span class="text-caption">{{ profile.time.slice(0, 10) }}</span>
        </q-item-section>
        <q-item-section @click="goTo(profile.user_id)" style="max-width: 350px" v-if="profile.type === match">
          You've matched {{ profile.first_name }}. <span class="text-caption">{{ profile.time.slice(0, 10) }}</span>
        </q-item-section>
        <q-item-section @click="goTo(profile.user_id)" style="max-width: 350px" v-if="profile.type === dislike">
          {{ profile.first_name }} doesn't like you anymore. <span class="text-caption">{{ profile.time.slice(0, 10) }}</span>
        </q-item-section>
        <q-item-section @click="goTo(profile.user_id)" style="max-width: 350px" v-if="profile.type === message">
          {{ profile.first_name }} messaged you. <span class="text-caption">{{ profile.time.slice(0, 10) }}</span>
        </q-item-section>
      </q-item>
    </q-list>

  </q-page>
</template>

<script>
import { api } from 'boot/axios';

export default {
  name: "Likes",
  data() {
    return {
      result: [],
      dislike: 5,
      match: 4,
      like: 3,
      visit: 2,
      message: 1,
    };
  },
  created() {
    api.get(`/users/${this.$store.getters['user/getId']}/matches`)
      .then(({ data }) => {
        this.result = data.result;
      });
  },
  methods: {
    goTo(id) {
      this.$router.push(`user/${id}`);
    },
  }
};
</script>
