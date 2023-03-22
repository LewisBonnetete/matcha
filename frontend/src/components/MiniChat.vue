<template>
  <q-item v-if="!loading"
    @click="$emit('click', recipientId)" clickable v-ripple>
    <q-item-section avatar>
      <q-avatar>
        <img :src="'data:image/png;base64, ' + user.pictures[user.picture_id].encrypted_picture">
      </q-avatar>
    </q-item-section>
    <q-item-section>
      <q-item-label>{{ user.first_name }}</q-item-label>
      <q-item-label v-if="item.message !== ''" caption>
        {{ `${isMe(item.user_id) ? 'Me' : item.first_name} : ${item.message}` }}
      </q-item-label>
      <q-badge v-if="user.online" style="z-index: 1000;
          transform: translate(-10px, 23px)"
          rounded floating color="positive"/>
    </q-item-section>
  </q-item>
</template>

<style lang="sass" scoped>
.newClass
  background-color: $info
</style>

<script>
import { api } from 'boot/axios';

export default {
  name: 'MiniChat',
  props: [
    'item',
    'index',
  ],
  data() {
    return {
      user: {},
      loading: true,
      id: '',
      recipientId: '',
    };
  },
  created() {
    if (this.isMe(this.item.recipient_id)) {
      this.id = this.item.recipient_id;
      this.recipientId = this.item.user_id;
    }
    if (this.isMe(this.item.user_id)) {
      this.id = this.item.user_id;
      this.recipientId = this.item.recipient_id;
    }
    api.get(`users/${this.recipientId}`)
      .then(({ data }) => {
        this.user = data.user;
        this.loading = false;
      });
  },
  methods: {
    isMe(id) {
      if (id === this.$store.getters['user/getId']) return (true);
      return (false);
    },
    newClass() {
      return { newClass: true };
    },
  },
};
</script>
