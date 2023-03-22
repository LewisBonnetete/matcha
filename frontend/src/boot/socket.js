import { boot } from 'quasar/wrappers'
import io from 'socket.io-client'
// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
const socket = io('http://localhost:8000/');

export default boot(async ( app ) => {

  app.config.globalProperties.$socket = socket;
  
})
