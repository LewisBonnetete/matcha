<template>
  <q-page padding class="row content-start">
    <div class="col content-end absolute-right q-ma-xl q-pa-sm"
      style="position: fixed; z-index: 100">
        <div class="col">
          <q-btn class="row q-mt-xl"
            @click="displayFilters = !displayFilters"
            round color="primary" icon="filter_alt"/>
          <q-btn class="row q-mt-md"
            @click="filterByAge()"
            round color="primary" icon="schedule"/>
          <q-btn class="row q-mt-md"
            @click="filterByDistance()"
            round color="primary" icon="social_distance"/>
          <q-btn class="row q-mt-md"
            @click="filterByScore()"
            round color="primary" icon="score"/>
        </div>
        <q-card class="col" v-if="displayFilters"
          style="position: fixed; z-index: 100; width: 300px;
          transform: translate(-310px, -213px)">
            <q-card-section class="q-pa-md">
              <div class="text-primary q-pb-xl row justify-center">
                Distance
              </div>
              <q-slider
                v-model="distanceFilter"
                :min="1"
                :max="100"
                :label-value="distanceFilter + ' km'"
                label-always
                color="primary"/>
            </q-card-section>
            <q-card-section class="q-pa-md">
              <div class="text-primary q-pb-xl row justify-center">
                Age
              </div>
              <q-range
                v-model="ageFilter"
                :left-label-value="ageFilter.min + ' yo'"
                :right-label-value="ageFilter.max + ' yo'"
                :min="18"
                :max="100"
                label-always/>
            </q-card-section>
            <q-card-section class="q-pa-md">
              <div class="text-primary q-pb-xl row justify-center">
                Score
              </div>
              <q-slider
                v-model="scoreFilter"
                :min="1"
                :max="100"
                reverse
                :label-value="(scoreFilter - 100)* -1"
                label-always
                color="primary"/>
            </q-card-section>
            <q-card-section class="q-pa-md">
              <q-select
                label="Tags"
                v-model="tagsFilter"
                use-input
                use-chips
                multiple
                input-debounce="0"
                :options="filterOptions"
                @filter="filterFn"
                style="width: 250px"/>
            </q-card-section>
            <q-card-section class="q-pa-md row justify-center">
              <q-btn v-if="apply && !loading"
                color="primary"
                @click="handleApply" label="Apply"/>
              <q-circular-progress
                v-if="loading"
                indeterminate
                size="xl"
                color="primary"
                class="q-ma-md"/>
            </q-card-section>
        </q-card>
    </div>
    <div v-if="userIncomplete()">
      Please complete your profile.
    </div>
    <div v-else style="width: 100%"
        class="q-layout-padding row justify-center q-ma-xl">
      <div v-if="profiles.length === 0">
        <q-circular-progress
          v-if="loading"
          indeterminate
          size="xl"
          color="primary"
          class="q-ma-md"/>
        <div v-else>
          No profile to show...
        </div>
      </div>
      <div v-else
        class="q-page q-layout-padding row content-start">
        <div v-for="(profile, index) in profiles" :key="`${profile.id}${index}`">
          <ProfileCard :profile="profile"
            @update="pop($event)"
            v-if="filterProfile(profile)"/>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import ProfileCard from "components/ProfileCard";

export default {
  name: "Home",
  data() {
    return {
      user: {},
      profiles: [],
      distanceFilter: 5,
      fetchDistanceFilter: 5,
      scoreFilter: 50,
      tagsFilter: [],
      loading: true,
      displayFilters: false,
      ageFilter: {
        min: 18,
        max: 100,
      },
      tagsOptions: [],
      filterOptions: [],
      apply: false,
      filter: '',
      filtered: false,
    };
  },
  components: { ProfileCard },
  created() {
    if (!this.logged) this.$router.push("Login");
    this.getUser();
    this.search();
  },
  computed: {
    logged() {
      return this.$store.getters['user/getLogged'];
    },
  },
  methods: {
    getUser() {
      if (this.$store.getters['user/getId']) {
        this.$api.get(`/users/${this.$store.getters['user/getId']}`)
          .then(({ data }) => {
            this.user = data.user;
          });
      }
    },
    userIncomplete() {
      if (Object.keys(this.user).length === 0) return false;
      if (this.user.tags.length === 0 || this.user.pictures.length === 0 || this.user.bio.length === 0) return true;
    },
    filterByAge() {
      if (this.filter === 'age') {
        this.profiles.sort((a, b) => (this.filtered ? (a.age - b.age) : (b.age - a.age)));
        this.filtered = !this.filtered;
      } else {
        this.profiles.sort((a, b) => a.age - b.age);
        this.filter = 'age';
      }
    },
    filterByDistance() {
      if (this.filter === 'distance') {
        this.profiles
          .sort((a, b) => (this.filtered ? (a.distance - b.distance) : (b.distance - a.distance)));
        this.filtered = !this.filtered;
      } else {
        this.profiles.sort((a, b) => a.distance - b.distance);
        this.filter = 'distance';
      }
    },
    filterByScore() {
      if (this.filter === 'score') {
        this.profiles.sort((a, b) => (this.filtered ? (a.score - b.score) : (b.score - a.score)));
        this.filtered = !this.filtered;
      } else {
        this.profiles.sort((a, b) => a.score - b.score);
        this.filter = 'score';
      }
    },
    handleApply() {
      this.search();
      this.apply = false;
    },
    pop(id) {
      this.profiles = this.profiles.filter((profile) => profile.id !== id);
    },
    search() {
      const tags = [];
      let tmp = [];
      this.loading = true;
      this.$api.get(`/users/${this.$store.getters['user/getId']}/search/${this.fetchDistanceFilter * 1000}`)
        .then(({ data }) => {
          this.profiles = data.result;
          this.profiles.forEach((profile) => {
            tags.push(...profile.tags);
          });
          tmp = tags.map((tag) => tag.name);
          this.tagsOptions = tmp.filter((item, pos, self) => self.indexOf(item) === pos).sort();
          this.loading = false;
        });
    },
    profileHasTag(profile, tag) {
      let res = false;
      profile.tags.forEach((pTag) => {
        if (pTag.name === tag) res = true;
      });
      return res;
    },
    filterProfile(profile) {
      let hasTag = true;

      if (this.tagsFilter.length > 0) {
        this.tagsFilter.forEach((tag) => {
          if (!this.profileHasTag(profile, tag)) {
            hasTag = false;
          }
        });
      }
      return (hasTag && profile.age <= this.ageFilter.max && profile.age >= this.ageFilter.min
          && profile.distance <= this.distanceFilter * 1000
          && profile.score <= this.scoreFilter);
    },
    filterFn(val, update) {
      update(() => {
        if (val === '') {
          this.filterOptions = this.tagsOptions;
        } else {
          const needle = val.toLowerCase();
          this.filterOptions = this.tagsOptions
            .filter((v) => v.toLowerCase().indexOf(needle) > -1);
        }
      });
    },
  },
  watch: {
    distanceFilter() {
      if (this.distanceFilter > this.fetchDistanceFilter) {
        this.apply = true;
      }
      this.fetchDistanceFilter = this.distanceFilter;
    },
  },
};
</script>
