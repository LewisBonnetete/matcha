<template>
  <q-page padding>
    <div class="q-pa-md " style="width: 30em">
      <q-input class="q-ma-md row justify-center" label="Password"  type="password" v-model="password"
        :rules="[val => (!!val && val.length > 6)
        || 'Field is required and needs to be at least 6 characters']"/>
      <q-btn @click="postPassword" class="q-ma-md row justify-center" color="primary" outline label="Reset password" />
    </div>
  </q-page>
</template>

<script>
export default {
  name: "ForgotPassword",
  data() {
    return {
      token: '',
      password: '',
    }
  },
  created() {
    this.token = this.$route.params.token;
  },
  methods: {
    postPassword() {
    this.$api.post(`mail/changeForgottenPassword/${this.token}`, { password: this.password })
      .then(() => {
        this.$router.push('/login');
        this.$q.notify({ type: 'positive', message: 'Password updated' });
      })
      .catch(() => this.$q.notify({ type: 'negative', message: 'Something went wrong...' }));
    }
  }
};
</script>
