<template>
  <q-card class="my-card">
    <q-img
      style="cursor: pointer"
      @click="goToProfile"
      height="270px"
      fit="cover"
      :src="'data:image/png;base64, ' + profile?.pictures[profile.picture_id]?.encrypted_picture">
      <div class="transparent text-black absolute-top-right">
        <q-circular-progress
          size="300%"
          show-value
          class="text-positive"
          color="positive"
          :value="Math.round(profile.score)"/>
      </div>
      <div class="absolute-bottom row">
        <div margin class="col-auto">
          <div class="text-h6">
            {{ profile.first_name }}
            <q-badge v-if="profile.online" rounded color="positive"/>
          </div>
          <div class="text-h9">{{ profile.age }}</div>
        </div>
        <div class="col row justify-end">
          <q-chip v-for="(tag, key) in profile.tags" :key="key" dense size="sm" :label="tag.name"/>
        </div>
      </div>
    </q-img>
    <q-card-actions class="row wrap justify-between items-start content-start">
      <q-btn @click="dislike" size="xl" flat round color="negative" icon="close" />
      <!-- <q-btn size="xl" flat round color="accent" icon="bolt" /> -->
      <q-btn @click="like" size="xl" flat round color="positive" icon="favorite" />
    </q-card-actions>
  </q-card>
</template>

<style lang="sass" scoped>
.my-card
  width: 270px
  height: 350px
  margin: 10px
</style>

<script>
import { api } from 'boot/axios';

export default {
  name: "ProfileCard",
  props: [
    'profile',
  ],
  methods: {
    goToProfile() {
      this.$router.push(`${this.profile.id}`);
    },
    like() {
      this.$emit('update', this.profile.id);
      api.post(`/users/${this.$store.getters['user/getId']}/like/${this.profile.id}`);
    },
    dislike() {
      this.$emit('update', this.profile.id);
      api.post(`/users/${this.$store.getters['user/getId']}/dislike/${this.profile.id}`);
    },
  },
};
</script>
