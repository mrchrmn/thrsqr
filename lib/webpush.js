const config = require("./config");
const webPush = require("web-push");
const { countGoing } = require("./thrsqr");

const vapidKeys = {
  publicKey: "BJlwITZQd9mrnKedh07Tze13WtSSaqfTzeKT5xx4qpDFzxhHgS4vqbGm_XlAELasf1cCuAU5L9us46GkhOHOyOU",
  privateKey: config.VAPID_PRIVATE_KEY
};

webPush.setVapidDetails(
  "mailto:thrsqr-web-push@hrmn.dev",
  vapidKeys.publicKey,
  vapidKeys.privateKey);


async function triggerPushMessage(subscription, payload, store) {
  try {
    return await webPush.sendNotification(subscription, payload);
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      let endpoint = JSON.parse(subscription).endpoint;
      await store.unsubscribeAll(endpoint);
      return null;
    } else {
      console.log(`Could not push to subscription ${subscription}:\n`, error);
      return null;
    }
  }
}


function constructSubString(subData) {
  let sub = {
    endpoint: subData.endpoint,
    expirationTime: subData.expirationTime,
    keys: {
      p256dh: subData.p256dh,
      auth: subData.auth
    }
  };
  return JSON.stringify(sub);
}


function compilePayload(title, language, going, notGoing, username, there) {
  let load = {
    title,
    language,
    going,
    notGoing,
    username,
    there
  };
  return JSON.stringify(load);
}


module.exports = {

  async notifySubscribers(store, eventId, username, there) {
    let event = await store.getEvent(eventId);
    let responses = await store.getResponses(eventId);
    let eventSubData = await store.getEventSubscriptions(eventId);
    let going = countGoing(responses);
    let notGoing = responses.length - going;

    eventSubData.forEach(async subData => {
      let sub = constructSubString(subData);
      let payload = compilePayload(event.title,
                                   subData.language,
                                   going,
                                   notGoing,
                                   username,
                                   there);

      await triggerPushMessage(sub, payload, store);
    });
  }
};