<template>
  <q-page padding>
    <div v-if="loading" class="row justify-center">
      <q-circular-progress
        indeterminate
        size="xl"
        color="primary"
        class="q-ma-md"/>
    </div>
    <div v-else class="row justify-around">
      <div class="carousel">
        <div>
          <q-carousel
            height="75vh"
            animated
            v-model="slide"
            arrows
            navigation
            infinite
            class="rounded-borders">
            <q-carousel-slide
              v-for="(picture, index) in this.user.pictures"
              :key="picture.encrypted_picture"
              :name="index + 1"
              :img-src="'data:image/png;base64, ' + picture.encrypted_picture"/>
          </q-carousel>
        </div>
      </div>
      <div style="width: 50%" class="q-my-lg">
        <span class="text-h4 q-ma-sm">{{user.first_name}}</span>
        <span class="text-h3 q-ma-sm">{{user.age}}</span>
        <span v-if="user.online" class="text-positive">online</span>
        <span v-else>{{user.last_seen}}</span>
        <div class="row q-my-lg">
          <q-chip v-for="tag in this.user.tags" :key="tag.name" dense size="lg" :label="tag.name" />
        </div>
        <div class="text-h5 q-my-xl">
          {{user.bio}}
        </div>
      </div>
      <div style="width: 10%">
        <q-circular-progress
          class="text-positive"
          size="1000%"
          show-value
          :value="Math.round(user.score)"
          color="positive"
        />
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.carousel {
  width: 30%;
  max-width: 700px;
  min-width: 300px;
  margin-right: 10px;
}
</style>

<script>
import { ref } from "vue";
import { api } from 'boot/axios';

export default {
  name: "Profile",
  data() {
    return {
      user: {},
      loading: true,
    };
  },
  created() {
    if (!this.logged) this.$router.push("Login");
    if (this.$store.getters['user/getId']) {
      api.get(`/users/${this.$store.getters['user/getId']}`)
        .then(({ data }) => {
          this.user = data.user;
          this.loading = false;
        });
    }
  },
  setup() {
    return {
      slide: ref(1),
    };
  },
  computed: {
    logged() {
      return this.$store.getters['user/getLogged'];
    },
  },
};
</script>
