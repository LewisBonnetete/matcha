<template>
  <q-page-sticky position="bottom-right">
    <q-card class="my-card">
      <q-card-section
        style="padding: 0"
        class="bg-primary text-white fit row wrap
          justify-between items-start content-start">
        <q-card-section class="text-h7">Notifications</q-card-section>
        <q-card-actions>
          <q-btn flat v-close-popup size="md" icon="close" />
        </q-card-actions>
      </q-card-section>
      <q-card-section style="padding: 0px" v-if="notifs.length > 0">
        <q-virtual-scroll style="max-height: 40vh" :items="notifs" separator>
          <template v-slot="{ item, index }">
            <q-item :class="[item.read? '' : newClass()]" :key="index">
              <q-item-section  v-if="item.type === message">
                <div class="row justify-between">
                  {{item.first_name}} sent you a message
                  <q-icon size="sm" flat round color="accent" name="chat" />
                </div>
              </q-item-section>
              <q-item-section v-if="item.type === like">
                <div class="row justify-between">
                  {{item.first_name}} liked your profile
                  <q-icon size="sm" flat round color="positive" name="favorite" />
                </div>
              </q-item-section>
              <q-item-section v-if="item.type === visit">
                <div class="row justify-between">
                  {{item.first_name}} visited your profile
                  <q-icon size="sm" flat round color="accent" name="visibility" />
                </div>
              </q-item-section>
              <q-item-section v-if="item.type === dislike">
                <div class="row justify-between">
                  {{item.first_name}} disliked your profile
                  <q-icon size="sm" flat round color="negative" name="close" />
                </div>
              </q-item-section>
              <q-item-section v-if="item.type === match">
                <div class="row justify-between">
                  You've matched {{item.first_name}}
                  <q-icon size="sm" flat round color="accent" name="bolt" />
                </div>
              </q-item-section>
            </q-item>
          </template>
        </q-virtual-scroll>
      </q-card-section>
      <q-card-section v-else>
        <div class="row justify-center">
          Nothing to see here...
        </div>
      </q-card-section>
    </q-card>
  </q-page-sticky>
</template>

<style lang="sass" scoped>
.my-card
  width: 300px

.newClass
  background-color: $info
</style>

<script>
export default {
  name: "Notifications",
  props: ["notificationsOpen", 'notifs'],
  data() {
    return {
      dislike: 5,
      match: 4,
      like: 3,
      visit: 2,
      message: 1,
    };
  },
  methods: {
    newClass() {
      return { newClass: true };
    },
    hasUnread(notifs) {
      return notifs.some(el => el.read === false);
    },
  },
  unmounted() {
    if (this.notifs.length > 0) {
      if(this.hasUnread(this.notifs)) {
        this.$api.put(`users/${this.$store.getters['user/getId']}/notifications`)
          .then(() => this.$emit('update'));
      }
    }
  },
};
</script>
