<template>
  <q-page padding>
    <div v-if="!loading" class="row justify-between">
      <q-form class="q-gutter-md">

        <q-input style="width: 250px" dense label="Name" v-model="name"
          lazyrules :rules="[ val => val.length >= 3 || 'Please use at least 3 characters']"/>
        <q-input style="width: 250px" dense label="Country" v-model="country"
          lazyrules :rules="[ val => val.length >= 3 || 'Please use at least 3 characters']"/>
        <q-input style="width: 150px" dense label="ZipCode" v-model="zipCode"
          lazyrules :rules="[ val => val.length === 5 || 'Please enter a valid Zipcode']"/>
        <div class="row">
          <q-select
            class="q-mr-sm"
            dense
            v-model="gender"
            :options="options"
            label="Gender"
            style="width: 250px"/>
          <q-select
            dense
            v-model="lookingFor"
            multiple
            :options="options"
            label="Looking for"
            style="width: 250px"/>
        </div>

        <q-select v-model="tags" multiple :options="tagsOptions" label="Passions"/>

        <q-input
          style="width: 350px"
          v-model="bio"
          lazyrules
          :rules="[ val => val.length <= 100 || 'Please use less than 100 characters']"
          autogrow/>

        <div class="row text-center">
          <div class="text-center q-ma-md">Choose your profile picture: </div>
          <q-select style="max-width: 100px" v-model="this.payload.picture_id" :options="picturesOptions"/>
        </div>
        <q-btn @click="updateProfile" label="Update profile"/>
        <q-file
          class="q-mt-xl"
          style="max-width: 300px"
          v-model="filesImages"
          label="Restricted to images"
          multiple
          accept=".png"
          @rejected="onRejected"/>
        <span v-if="pictures.length >= 5" class="text-primary"> Max 5 photos </span>
        <q-btn :disable="pictures.length >= 5" @click="postPicture" label="Upload Photo"/>

        <div class="row text-center">
          <div class="text-center q-ma-md">Choose a picture to delete: </div>
          <q-select style="max-width: 100px" v-model="this.pictureToDelete" :options="picturesOptions"/>
        </div>
        <q-btn label="delete picture" @click="deletePicture" />

      </q-form>
      <div>
        <q-input style="width: 250px" type="password" dense label="Old Password" v-model="oldPassword"
            lazyrules :rules="[ val => val.length >= 5 || 'Please use at least 5 characters']"/>
        <q-input style="width: 250px" type="password" dense label="New Password" v-model="newPassword"
          lazyrules :rules="[ val => val.length >= 5 || 'Please use at least 5 characters']"/>
        <q-btn :disable="newPassword.length < 6 || oldPassword.length < 6" @click="updatePassword" label="Update Password"/>
      </div>
    </div>
    <div class="q-layout-padding row justify-center q-ma-xl">
      <q-circular-progress
        v-if="loading"
        indeterminate
        size="xl"
        color="primary"
        class="q-ma-md"/>
    </div>
  </q-page>
</template>

<script>
import { ref } from 'vue';
import { api } from 'boot/axios';

export default {
  name: 'Settings',
  data() {
    return {
      name: ref(null),
      country: ref(null),
      zipCode: ref(null),
      single: ref(null),
      gender: ref(null),
      lookingFor: ref(null),
      bio: ref(null),
      pictureToDelete: '',
      loading: true,
      filesImages: [],
      tagsOptions: [],
      picturesOptions: [],
      tags: [],
      pictures: [],
      oldPassword: '',
      newPassword: '',
      options: [
        'Male',
        'Female',
        'Agender',
        'Bigender',
        'Gender Fluid',
      ],
      payload: {
        picture_id: '',
        first_name: '',
        gender: '',
        sexual_orientation: '',
        bio: '',
        tags: [],
        longitude: '',
        latitude: '',
      },
    };
  },
  created() {
    if (!this.logged) this.$router.push("/");
    api.get(`users/${this.$store.getters['user/getId']}`)
      .then(({ data }) => {
        this.pictures = data.user.pictures;
        this.pictures.forEach((el, index) => {
          this.picturesOptions.push(index);
        });
        this.name = data.user.first_name;
        this.payload.picture_id = data.user.picture_id;
        this.gender = data.user.gender;
        this.bio = data.user.bio;
        data.user.tags.forEach(element => {
          this.tags.push(element.name);
        });
        this.loading = false;
      });
    api.get('users/tags/list').then(({ data }) => {
      data.tags.forEach(element => {
        this.tagsOptions.push(element.name);
      });
    });
  },
  methods: {
    buildPayload() {
      if ( this.lookingFor && this.gender) {
        this.payload.sexual_orientation = 3;
        if (this.lookingFor.length === 1 && this.gender === 'Male') {
          if (this.lookingFor[0] === "Female") {
            this.payload.sexual_orientation = 1;
          } else if (this.lookingFor[0] === "Male") {
            this.payload.sexual_orientation = 2;
          }
        } else if (this.lookingFor.length === 1 && this.gender === 'Female') {
          if (this.lookingFor[0] === "Male") {
            this.payload.sexual_orientation = 1;
          } else if (this.lookingFor[0] === "Female") {
            this.payload.sexual_orientation = 2;
          }
        }
      }
      this.payload.tags = [];
      this.tagsOptions.forEach((el, index) => {
        if (this.tags.includes(el)) {
          this.payload.tags.push(index + 1);
        }
      })
      this.payload.bio = this.bio;
      this.payload.gender = this.gender;
      this.payload.first_name = this.name;
      if (this.zipCode && this.country) {
        this.geolocation()
          .then(({ data }) => {
            this.payload.longitude = data.results[0].locations[0].displayLatLng.lng;
            this.payload.latitude = data.results[0].locations[0].displayLatLng.lat;
            this.postUser();
          });
      } else {
        this.postUser();
      }
    },
    updateProfile() {
      this.buildPayload();
    },
    updatePassword() {
      api.put(`users/${this.$store.getters['user/getId']}/password`, { oldPassword: this.oldPassword, newPassword: this.newPassword });
      this.$router.push('/');
    },
    postUser() {
      api.put(`users/${this.$store.getters['user/getId']}`, this.payload)
        .then(() => {
          this.filesImages = [];
          this.$q.notify({ type: 'positive', message: 'Profile updated' });
          this.$router.push('/');
        })
        .catch(() => this.$q.notify({ type: 'negative', message: 'Something went wrong...' }));
    },
    deletePicture() {
      if (this.pictureToDelete !== '') {
        api.post(`users/delPicture`, { picture_id: this.pictures[this.pictureToDelete].id });
        this.$router.push('/');
      }
    },
    postPicture() {
      if (this.filesImages[0]) {
        const reader = this.encodeImageFileAsURL(this.filesImages[0]);
      }
    },
    encodeImageFileAsURL(img) {
      var file = img;
      var reader = new FileReader();
      var id = this.$store.getters['user/getId'];
      reader.onloadend = function() {
        var data = reader.result.split(',')
        api.post(`/users/${id}/picture`, { picture: data[1] });
      }
      reader.readAsDataURL(file);
      return reader;
    },
    geolocation() {
      return (this.$axios
        .get(`http://www.mapquestapi.com/geocoding/v1/address?key=NjEL4zYSQgM1I3stZbEooPnjty6t1dba&location=${this.country},${this.zipCode}`));
    },
    onRejected() {
      this.$q.notify({ type: 'negative', message: 'Something went wrong...' });
    },
  },
  computed: {
    logged() {
      return this.$store.getters['user/getLogged'];
    },
  },
};
</script>
