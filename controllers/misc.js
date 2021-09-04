"use strict";

const config = require("../lib/config");
const aws = require('aws-sdk');

const S3_BUCKET_NAME = config.S3_BUCKET_NAME;

aws.config.region = config.AWS_REGION;

/* eslint-disable max-lines-per-function */
module.exports = {

  async generateManifest(req, res) {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let event = await store.getEvent(eventId);

    if (!event.logourl) event.logourl = "/images/thrsqrlogo.png";

    let eventManifest = "";

    if (event) eventManifest = `{
"name": "${event.title}",
"short_name": "${event.title}",
"icons": [
    {
        "src": "${event.logourl}",
        "sizes": "192x192, 512x512"
    }
],
"theme_color": "#c8f3c8",
"background_color": "#174117",
"display": "standalone",
"start_url": "/event/${event.id}",
"scope": "/event/${event.id}",
"description": "ThrSqr - Your RSVP tracker for weekly events and friendly people."
}`;

    res.append("Content-Type", "text/html").send(eventManifest);
  },

  async unsubscribeAll(req, res) {
    let store = res.locals.store;
    let endpoint = req.body.endpoint;

    await store.unsubscribeAll(endpoint);

    res.sendStatus(200);
  },

  getS3Request(req, res) {
    const s3 = new aws.S3();

    let eventId = req.query.eventId;
    let fileType = req.query.fileType;

    let s3params = {
      Bucket: S3_BUCKET_NAME,
      Key: `logos/${eventId}-logo`,
      Expires: 60,
      ContentType: fileType,
      ACL: "public-read"
    };

    s3.getSignedUrl("putObject", s3params, (err, data) => {
      if (err) {
        console.log("Could not get S3 URL:\n", err);
        return res.end();
      }

      let returnData = {
        s3request: data,
        url: `https://${S3_BUCKET_NAME}.s3.amazonaws.com/logos/${eventId}-logo`
      };

      res.write(JSON.stringify(returnData));
      return res.end();
    });
  }
};