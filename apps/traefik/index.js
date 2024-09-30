const http = require("http");
const Docker = require("dockerode");
const express = require("express");
const httpProxy = require("http-proxy");

const docker = new Docker({ socketPath: "/var/run/docker.sock" });
const db = new Map();
const proxy = httpProxy.createProxy({});
docker.getEvents(function (err, stream) {
  if (err) {
    console.error(err);
    return;
  }
  stream.on("data", async (chunk) => {
    if (!chunk) return;
    const event = JSON.parse(chunk.toString());
    if (event.Type === "container" && event.Action === "start") {
      const container = await docker.getContainer(event.id);
      const containerInfo = await container.inspect();
      const containerName = containerInfo.Name.substring(1);
      const ipAddress = containerInfo.NetworkSettings.IPAddress;
      const exposedPorts = Object.keys(containerInfo.Config.ExposedPorts);
      let defaultPort = null;
      if (exposedPorts && exposedPorts.length > 0) {
        const [port, type] = exposedPorts[0].split("/");
        if (type === "tcp") {
          defaultPort = port;
        }
      }
      console.log(
        `registring ${containerName}.localhost --> http://${ipAddress}:${defaultPort}`
      );
      setTimeout(() => {
        db.set(containerName, { containerName, ipAddress, defaultPort });
      }, 1000);
    }
  });
});
const reverseProxyApp = express();
reverseProxyApp.use((req, res) => {
  const hostname = req.hostname;
  const subdomain = hostname.split(".")[0];
  if (!db.has(subdomain)) return res.status(404).send("Not found");
  const { ipAddress, defaultPort } = db.get(subdomain);
  const target = `http://${ipAddress}:${defaultPort}`;
  console.log(`proxying ${hostname} --> ${proxy}`);
  return proxy.web(req, res, {
    target,
    changeOrigin: true,
    ws: true,
  });
});

const reverseProxy = http.createServer(reverseProxyApp);
reverseProxy.on("upgrade", (req, socket, head) => {
  const hostname = req.headers.host;
  const subdomain = hostname.split(".")[0];
  if (!db.has(subdomain)) return res.status(404).send("Not found");
  const { ipAddress, defaultPort } = db.get(subdomain);
  const target = `http://${ipAddress}:${defaultPort}`;
});
const managmentAPI = express();
managmentAPI.use(express.json());
managmentAPI.post("/container", async (req, res) => {
  const { image, tag = "lastest" } = req.body;
  let imageAlreadyExist = false;
  const images = await docker.listImages();
  for (const systemImage of images) {
    for (const systemTag of systemImage.RepoTags) {
      if (systemImage === `${image}:${tag}`) {
        imageAlreadyExist = true;
        break;
      }
    }
    if (imageAlreadyExist) break;
  }
  if (!imageAlreadyExist) {
    await docker.pull(`${image}:${tag}`);
  }
  const container = await docker.createContainer({
    Image: `${image}:${tag}`,
    Tty: false,
    HostConfig: {
      AutoRemove: true,
    },
  });

  await container.start();
  return res.json({
    status: "success",
    container: `${(await container.inspect()).Name}.localhost`,
  });
});

managmentAPI.listen(8080, () => {
  console.log("Listening on port 8080");
});

reverseProxy.listen(80, () => {
  console.log("reverse proxy listening on port 80");
});
