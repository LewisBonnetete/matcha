<template>
  <div style="height: 100%">
    <div v-if="!loading">
      <div v-if="messages.length === 0"
        class="q-layout-padding row justify-center q-ma-xl">
        No match yet...
      </div>
      <div v-else>
        <q-virtual-scroll v-if="nav === 'chats'" :items="messages" separator>
          <template v-slot="{ item, index }">
              <MiniChat @click="handleClick" :item="item" :key="index"/>
          </template>
        </q-virtual-scroll>
        <Chat :open="open" @reset="reset()" v-if="nav === 'chat'" :id="id"/>
      </div>
    </div>
    <div v-else>
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
import Chat from "components/Chat";
import MiniChat from "components/MiniChat";
import { api } from 'boot/axios';

export default {
  name: "Chats",
  components: {
    Chat,
    MiniChat,
  },
  props: [
    'open',
  ],
  data() {
    return {
      nav: 'chats',
      id: 0,
      messages: [],
      loading: true,
      intervalId: '',
    };
  },
  created() {
    this.fetchMessages(true);
  },
  mounted() {
    this.intervalId = window.setInterval(() => {
      if (this.open && this.nav === 'chats' && !this.loading) this.fetchMessages(false);
    }, 8000);
  },
  unmounted() {
    window.clearInterval(this.intervalId);
  },
  methods: {
    handleClick(recipientId) {
      if (typeof recipientId === 'number') {
        this.id = recipientId;
        this.nav = 'chat';
      }
    },
    fetchMessages(loading) {
      if (loading) this.loading = true;
      api.get(`users/${this.$store.getters['user/getId']}/messages`)
        .then(({ data }) => {
          this.messages = data.messages;
          if (loading) this.loading = false;
        });
    },
    reset() {
      this.nav = 'chats';
      this.fetchMessages();
    },
  },
};
</script>
