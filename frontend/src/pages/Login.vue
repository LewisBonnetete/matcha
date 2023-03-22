<template>
  <q-page padding>
    <div class="row justify-center text-center">
      <div  v-if="!isSignIn && !isSignUp">
        <div class="text-primary text-h1 q-ma-xl">
          Welcome to Matcha
        </div>
        <div class="q-ma-xl">
          <q-btn outline @click="isSignIn = true"
            color="primary" label="Login" />
          <q-btn color="primary"
            @click="isSignUp = true" label="Sign Up" class="q-ml-sm" />
        </div>
      </div>
      <div v-if="isSignIn" class="q-pa-md" style="width: 70em">
        <q-input label="Email" type="email" v-model="payload.email"
          :rules="[val => (!!val && validateEmail(val))
          || 'Field is required and has to be an email']"/>
        <q-input label="Password" type="password" v-model="payload.password"
          :rules="[val => !!val
          || 'Field is required and needs to be at least 6 characters']"/>
          <div style="cursor: pointer" @click="forgotPassword" class="q-my-md text-primary text-underline">
            Forgot password ?
          </div>
        <q-btn color="primary" outline
            @click="isSignUp = false; isSignIn = false"
            :disable="pending" label="Back" class="q-ml-sm" />
        <q-btn color="primary"
          @click="login" :disable="pending" label="Login" class="q-ml-sm" />
      </div>
    </div>
    <div v-if="isSignUp" class="q-pa-md row justify-center">
      <q-stepper
        flat
        style="width: 70em"
        v-model="step"
        ref="stepper"
        color="primary"
        animated
      >
        <q-step
          :name="1"
          style="height: 45em"
          title="Profile"
          icon="person"
          active-icon="person"
          :done="step > 1">
          <q-input label="First name" v-model="payload.first_name"
            :rules="[val => !!val || 'Field is required']"/>
          <q-input label="Last name" v-model="payload.last_name"
            :rules="[val => !!val || 'Field is required']"/>
          <q-select label="Age" v-model="payload.age" :options="ageOptions"
            :rules="[val => !!val || 'Field is required']"/>
          <q-input label="Bio" autogrow v-model="payload.bio"
          :rules="[val => val.length <= 200 || '200 letters max']"/>
        </q-step>

        <q-step
          :name="2"
          style="height: 45em"
          title="Infos"
          icon="edit"
          active-icon="edit"
          :done="step > 2">
          <q-input label="Email" type="email" v-model="payload.email"
            :rules="[val => (!!val && validateEmail(val))
            || 'Field is required and has to be an email']"/>
          <q-input label="Password" type="password" v-model="payload.password"
            :rules="[val => (!!val && val.length > 6)
            || 'Field is required and needs to be at least 6 characters']"/>
          <q-select label="Identify has" v-model="payload.gender" :options="sexOptions"
            :rules="[val => !!val || 'Field is required']"/>
          <q-select label="Attracted by" multiple
            v-model="this.sexOrientation" :options="sexOptions"
            :rules="[val => !!val || 'Field is required']"/>
        </q-step>

        <template v-slot:navigation>
          <q-stepper-navigation class="q-pa-md row justify-center">

            <q-btn v-if="step === 1" outline color="primary" class="q-mx-sm"
              @click="isSignUp = false; isSignIn = false" label="Back"/>

            <q-btn v-if="step > 1" outline color="primary" class="q-mx-sm"
              @click="$refs.stepper.previous()" label="Back"/>

            <q-btn v-if="step != 2" :disable="step1Done()" @click="$refs.stepper.next()"
              color="primary" label="Continue" />

            <q-btn v-else :disable="step2Done()" @click="signUp"
              color="primary" label="Sign up" />

          </q-stepper-navigation>
        </template>
      </q-stepper>
    </div>
  </q-page>
</template>

<script>
import axios from 'axios';
import { api } from 'boot/axios';


const options = [];
for (let i = 18; i < 100; i += 1) {
  options.push(i);
}

export default {
  name: 'Login',
  data() {
    return {
      isSignUp: false,
      isSignIn: false,
      ageOptions: options,
      sexOrientation: [],
      step: 1,
      sexOptions: [
        'Male',
        'Female',
        'Agender',
        'Bigender',
        'Gender Fluid',
      ],
      pending: false,
      payload: {
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        age: '',
        gender: '',
        sexual_orientation: '3',
        bio: '',
        longitude: '',
        latitude: '',
      },
    };
  },
  created() {
    if (this.logged) this.$router.push("Home");
    this.locate();
  },
  methods: {
    signUp() {
      this.payload.sexual_orientation = 3;
      if (this.sexOrientation.length === 1 && this.gender === 'Male') {
        if (this.sexOrientation[0] === "Female") {
          this.payload.sexual_orientation = 1;
        } else if (this.sexOrientation[0] === "Male") {
          this.payload.sexual_orientation = 2;
        }
      } else if (this.sexOrientation.length === 1 && this.gender === 'Female') {
        if (this.sexOrientation[0] === "Male") {
          this.payload.sexual_orientation = 1;
        } else if (this.sexOrientation[0] === "Female") {
          this.payload.sexual_orientation = 2;
        }
      }
      this.$api.post('auth/users', this.payload)
        .then((res) => {
          if (res.err === "email already exist") {
            this.$q.notify({ type: 'negative', message: 'Email already exists' })
            this.isSignUp = false;
            this.isSignin = true;
          } else {
            this.$q.notify({ type: 'positive', message: 'Welcome, verify your email!' })
            this.isSignUp = false;
            this.isSignin = true;
          }
        })
        .catch((res) => {
          if (res.err === "email already exist") {
            this.isSignUp = false;
            this.isSignin = true;
            this.$q.notify({ type: 'negative', message: 'Email already exists' });
          } else {
            this.$q.notify({ type: 'negative', message: 'Email could already exists or something went wrong...' });
          }
        });
    },
    login() {
      this.pending = true;
      if (this.validateEmail(this.payload.email) && this.payload.email.length > 5 && this.payload.password.length > 5) {
        this.$store.dispatch('user/loginUser', this.payload)
          .then((res) => {
            this.pending = false;
            if (res.err === 'Email is not verified') this.$q.notify({ type: 'negative', message: res.err });
            else if (res.err !== '') this.$q.notify({ type: 'negative', message: 'Something went wrong...' });
            else {
              this.$q.notify({ type: 'positive', message: 'Logged in' });
              this.$router.push('/');
            }
          });
      } else {
        this.$q.notify({ type: 'negative', message: 'Some fields are wrong' });
        this.pending = false;
      }
    },
    forgotPassword() {
      if (this.validateEmail(this.payload.email) && this.payload.email.length > 5) {
        this.$api.post('mail/forgotPassword', this.payload)
        .then(() => {
          this.$q.notify({ type: 'positive', message: 'Email sent' });
        })
        .catch(() => {
          this.$q.notify({ type: 'negative', message: 'Email doesn\'t exists or something went wrong...' });

        });
      } else {
        this.$q.notify({ type: 'negative', message: 'Please fill the email input' });
      }
    },
    locate() {
      axios.get('http://ip-api.com/json').then(({ data }) => {
        this.payload.latitude = data.lat;
        this.payload.longitude = data.lon;
      });
    },
    validateEmail(email) {
      // eslint-disable-next-line
      return String(email)
        .toLowerCase()
        .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    },
    step1Done() {
      return !(this.payload.first_name.length > 3
        && this.payload.last_name.length > 2
        && this.payload.age >= 18
        && this.payload.bio.length <= 200
      );
    },
    step2Done() {
      return !(this.validateEmail(this.payload.email)
        && this.payload.email.length > 3
        && this.payload.password.length > 6
        && this.payload.gender !== ''
        && this.sexOrientation.length > 0
      );
    },
  },
  computed: {
    logged() {
      return this.$store.getters['user/getLogged'];
    },
  },
};
</script>
