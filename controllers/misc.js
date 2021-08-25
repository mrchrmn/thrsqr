module.exports = {

  async generateManifest(req, res) {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let event = await store.getEvent(eventId);

    let eventManifest = "";

    if (event) eventManifest = `{
"name": "${event.title}",
"short_name": "${event.title}",
"icons": [
    {
        "src": "/android-chrome-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
    },
    {
        "src": "/android-chrome-512x512.png",
        "sizes": "512x512",
        "type": "image/png"
    }
],
"theme_color": "#c8f3c8",
"background_color": "#174117",
"display": "standalone",
"start_url": "/event/${event.id}",
"description": "ThrSqr - Your RSVP tracker for weekly events and friendly people."
}`;

    res.append("Content-Type", "text/html").send(eventManifest);
  }

}