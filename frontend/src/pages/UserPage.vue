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
              :name="index"
              :img-src="'data:image/png;base64, ' + picture.encrypted_picture"/>
          </q-carousel>
        </div>
        <div class="fit row wrap justify-between items-start content-start">
          <q-btn @click="postDislike()" size="xl" flat round color="negative" icon="close" />
          <!-- <q-btn size="xl" flat round color="accent" icon="bolt" /> -->
          <q-btn @click="postLike()" size="xl" flat round color="positive" icon="favorite" />
        </div>
      </div>
      <div style="width: 50%" class="q-my-lg">
        <span class="text-h4 q-ma-sm">{{user.first_name}}</span>
        <span class="text-h3 q-ma-sm">{{user.age}}</span>
        <q-icon v-show="likesUser" size="md" color="primary" name="favorite"/>
        <span v-if="user.online" class="text-positive">online</span>
        <span v-else>last seen: {{user.last_seen.slice(0,10)}}</span>
        <div>
          <q-btn @click="postBlock" flat round color="negative" icon="block">
            <q-tooltip>
              block
            </q-tooltip>
          </q-btn>
          <q-btn @click="postReport" flat round color="negative" icon="report_gmailerrorred">
            <q-tooltip>
              report
            </q-tooltip>
          </q-btn>
        </div>
        <div class="row q-my-lg">
          <q-chip v-for="tag in this.user.tags" :key="tag.name" dense size="lg" :label="tag.name" />
        </div>
        <div class="text-h5 q-my-xl">
          {{user.bio}}
        </div>
      </div>
      <div style="width: 10%">
        <q-circular-progress
          size="1000%"
          class="text-positive"
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
import { api } from 'boot/axios';
import { ref } from "vue";

export default {
  name: "Profile",
  data() {
    return {
      user: {},
      id: 0,
      loading: true,
    };
  },
  created() {
    this.id = this.$route.params.id;
    this.fetch();
  },
  setup() {
    return {
      slide: ref(1),
    };
  },
  methods: {
    fetch() {
      if (this.id) {
        api.get(`/users/${this.id}`)
          .then(({ data }) => {
            this.user = data.user;
            this.loading = false;
            this.postVisit();
          });
      }
    },
    postVisit() {
      if (this.id !== this.$store.getters['user/getId']){
        api.post(`users/${this.$store.getters['user/getId']}/visit/${this.id}`);
      }
    },
    postLike() {
      api.post(`users/${this.$store.getters['user/getId']}/like/${this.id}`);
    },
    postDislike() {
      api.post(`users/${this.$store.getters['user/getId']}/dislike/${this.id}`);
    },
    postBlock() {
      api.post(`users/${this.$store.getters['user/getId']}/block/${this.id}`);
      this.$router.push('/');
    },
    postReport() {
      api.post(`users/${this.$store.getters['user/getId']}/report/${this.id}`);
      this.$router.push('/');
    },
  },
  computed: {
    likesUser() {
      let res = false;
      if (this.user) {
        this.user.likes.forEach((like) => {
          if (like.liked_id === this.$store.getters['user/getId']) {
            res = true
          }
        });
      }
      return res;
    },
  },
  watch: {
    $route(to, from) {
      if (to.params.id !== from.params.id) {
        this.id = to.params.id;
        this.fetch();
      }
    },
  },
};
</script>
