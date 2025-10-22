import Pusher from 'pusher-js';

const pusherClient = new Pusher("72cb3b6362c5dc77cc6e", {
  cluster: "ap2"
});

export default pusherClient;