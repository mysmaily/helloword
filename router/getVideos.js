"use strict";

const getDriveProxy = require("../GetDriveProxy");
const extractVideos = require("../GetVideoInfo");
const createProxyVideo = require("../Proxy");
const handleError = require("../HandleError");

const redis = require("redis");

const port_redis = process.env.REDIS_PORT || 6379;
const redis_client = redis.createClient(port_redis);

var fs = require("fs");

function getProxy() {
  var data = fs.readFileSync(process.env.PROXY_LIST, "utf8");
  var obj = JSON.parse(data);
  var proxy = obj[Math.floor(Math.random() * obj.length)];
  return "http://" + proxy.auth + "@" + proxy.ip + ":" + proxy.port;
}

const isValidProvider = (provider) => {
  const allowed = ["drive"];
  return Boolean(allowed.indexOf(provider.toLowerCase()) !== -1);
};

module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf8");

  if (isValidProvider(req.params.provider) === false) {
    throw new Error("provider invalid");
  }
  redis_client.get(req.params.id, (err, data, text) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    }
    if (data != null) {
      res.end(JSON.parse(data));
    } else {
      const proxy = getProxy();
      getDriveProxy(req.params.id, proxy)
        .then((response) => ({
          videos: extractVideos(response.body),
          driveCookieHeader: response.headers["set-cookie"],
        }))
        .then(({ videos, driveCookieHeader }) => {
          const proxied = videos.map((video) =>
            createProxyVideo(video, driveCookieHeader)
          );
          const result = JSON.stringify({
            status: "OK",
            title: proxied[0]["title"],
            data: [...proxied].map((video) => {
              delete video.title;
              delete video.originSrc;
              return video;
            }),
          });
          redis_client.setex(req.params.id, 3600, JSON.stringify(result));
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json; charset=utf8");
          return res.end(result);
        })
        .catch((err) => {
          handleError(err);
          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              status: "FAIL",
              reason: err.toString(),
            })
          );
        });
    }
  });
};
