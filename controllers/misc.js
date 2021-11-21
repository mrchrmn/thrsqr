"use strict";

const config = require("../lib/config");
const aws = require('aws-sdk');
const { getResizedLogoURL } = require("../lib/thrsqr");

const S3_BUCKET_NAME = config.S3_BUCKET_NAME;

aws.config.region = config.AWS_REGION;

/* eslint-disable max-lines-per-function */
module.exports = {

  generateManifest(req, res) {
    let eventManifest = "";
    let event = req.session.event;

    if (event) {
      eventManifest = `{
"name": "${event.title}",
"short_name": "${event.title}",
"icons": [
  {
    "src": "${event.logourl.startsWith("https") === true ?
              getResizedLogoURL(S3_BUCKET_NAME, event.id, 144) :
              '/images/thrsqrlogo-250.png'}",
    "sizes": "144x144",
    "type": "image/png"
  },
  {
    "src": "${event.logourl.startsWith("https") === true ?
              getResizedLogoURL(S3_BUCKET_NAME, event.id, 192) :
              '/images/thrsqrlogo-250.png'}",
    "sizes": "192x192",
    "type": "image/png"
  },
  {
    "src": "${event.logourl.startsWith("https") === true ?
              getResizedLogoURL(S3_BUCKET_NAME, event.id, 256) :
              '/images/thrsqrlogo-250.png'}",
    "sizes": "256x256",
    "type": "image/png"
  },
  {
    "src": "${event.logourl.startsWith("https") === true ?
              getResizedLogoURL(S3_BUCKET_NAME, event.id, 512) :
              '/images/thrsqrlogo-250.png'}",
    "sizes": "512x512",
    "type": "image/png"
  }
],
"theme_color": "#FFFEE4",
"background_color": "#FFFEE4",
"display": "standalone",
"start_url": "/event/${event.id}",
"scope": "/event/${event.id}",
"description": "ThrSqr - Your RSVP tracker for weekly events and friendly people."
}`;
    }

    res.append("Content-Type", "application/manifest+json").send(eventManifest);
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
  },

  async getTimezoneAbbrev(req, res) {
    let store = res.locals.store;
    let timezone = req.body.timezone;

    let abbrev = await store.getTimezoneAbbreviation(timezone);

    res.end(abbrev);
  }
};