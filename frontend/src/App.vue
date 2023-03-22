<template>
  <router-view />
</template>
<script>
import { defineComponent } from 'vue';
import { isJwtExpired } from 'jwt-check-expiration';

export default defineComponent({
  name: 'App',
  created() {
    this.$store.dispatch('user/useLocalStorage');
    if (this.$store.getters['user/getJwt']) {
      if (isJwtExpired(this.$store.getters['user/getJwt'])) {
        this.$store.dispatch('user/logoutUser');
        this.$router.push('Login');
      }
    }
  },
});
</script>
