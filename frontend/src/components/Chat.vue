<template>
  <div>
    <div v-if="!loading" class="col">
      <div class="bg-primary text-white absolute-top" style="z-index: 1000">
        <q-btn @click="$emit('reset')" style="height: 100%; width: 10%" flat icon="arrow_back"/>
        <q-btn @click="goToProfile(recipientId)" no-caps class="q-mx-sm"
          style="height: 100%" flat>
          <div>
            <q-avatar class="q-mr-md">
              <img :src="'data:image/png;base64, '
              + recipientUser.pictures[recipientUser.picture_id].encrypted_picture">
            </q-avatar>
            <span class="text-h5 q-my-md"> {{recipientUser.first_name}} </span>
          </div>
        </q-btn>
      </div>
      <div style="margin-top: 50px; padding-bottom: 60px"
        class="q-pa-md row scroll justify-center">
        <div class="text-primary text-h5 q-my-xl" v-if="messages.length === 0">
          Its a new match!
        </div>
        <div style="width: 100%;">
          <q-chat-message
            v-for="(message) in messages" :key="message.message_time"
            :ref="'chat'"
            :name="isMe(message) ? 'me' : message.first_name"
            :text="[message.message]"
            :sent="isMe(message)"
            :stamp="message.message_time.slice(0, 10) + ' at ' + message.message_time.slice(11, 16)"
            :text-color="isMe(message) ? 'black' : 'white' "
            :bg-color="isMe(message) ? '' : 'primary'"
            :avatar="isMe(message) ?
            'data:image/png;base64, ' + user.pictures[user.picture_id].encrypted_picture
            : 'data:image/png;base64, '
            + recipientUser.pictures[recipientUser.picture_id].encrypted_picture"/>
        </div>
      </div>
      <div class="bg-secondary absolute-bottom text-white">
        <q-input v-model="text" filled class="bg-white" autogrow autofocus>
          <template #append>
            <q-btn rounded flat color="primary" icon="send"
              @click="send()"/>
          </template>
        </q-input>
      </div>
    </div>
    <div v-else>
      <div class="bg-primary text-white absolute-top" style="z-index: 1000">
        <q-btn @click="$emit('reset')" style="height: 100%; width: 10%" flat icon="arrow_back"/>
      </div>
      <div class="row justify-center">
        <q-circular-progress
          class="vertical-middle q-ma-xl"
          indeterminate
          size="xl"
          color="primary"/>
      </div>
    </div>
  </div>
</template>

<script>
import { api } from 'boot/axios';

export default {
  name: "Chat",
  props: [
    'id',
    'open',
  ],
  data() {
    return {
      messages: [],
      user: {},
      userId: '',
      userName: '',
      recipientId: this.id,
      recipientUser: '',
      loading: true,
      text: '',
      lastMessage: {},
      intervalId: '',
    };
  },
  created() {
    this.userId = this.$store.getters['user/getId'];
    this.userName = this.$store.getters['user/getName'];
    this.fetchMessages(true);
  },
  mounted() {
    this.intervalId = window.setInterval(() => {
      if (!this.loading && this.open) this.fetchMessages(false);
    }, 8000);
  },
  unmounted() {
    window.clearInterval(this.intervalId);
  },
  methods: {
    send() {
      if (this.text !== '') {
        api.post(`/users/${this.userId}/messages/${this.recipientId}`, { message: this.text });
        this.fetchMessages();
        this.text = '';
      }
    },
    fetchMessages(loading) {
      api.get(`users/${this.userId}/messages/${this.recipientId}`)
        .then(({ data }) => {
          this.messages = data.messages;
          if (loading) {
            api.get(`users/${this.userId}`)
              .then((userData) => {
                this.user = userData.data.user;
                api.get(`users/${this.recipientId}`)
                  .then((recipientData) => {
                    this.recipientUser = recipientData.data.user;
                    this.loading = false;
                  });
              });
          }
        });
    },
    isMe(message) {
      if (message.id === this.userId) return (true);
      return (false);
    },
    goToProfile(id) {
      this.$router.push(`user/${id}`);
    },
  },
};
</script>
