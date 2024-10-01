const http = require("http");
const Docker = require("dockerode");
const express = require("express");
const httpProxy = require("http-proxy");

const docker = new Docker({ socketPath: "/var/run/docker.sock" });
const db = new Map();
const proxy = httpProxy.createProxy({});

async function cleanupContainers() {
  const containers = await docker.listContainers({ all: true });
  
  for (const container of containers) {
    if (container.Image.includes("cloud-ide")) {
      const containerInstance = await docker.getContainer(container.Id);
      await containerInstance.stop();
      await containerInstance.remove();
      console.log(`Stopped and removed container: ${container.Names[0]}`);
    }
  }
}

cleanupContainers().then(() => {
  console.log("Cleanup completed: All 'cloud-ide' containers stopped and removed.");
}).catch(err => {
  console.error("Error during cleanup:", err);
});

docker.getEvents(function (err, stream) {
  if (err) {
    console.error(err);
    return;
  }

  stream.on("data", async (chunk) => {
    try {
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

        console.log(`registering ${containerName}.localhost --> http://${ipAddress}:${defaultPort}`);
        setTimeout(() => {
          db.set(containerName, { containerName, ipAddress, defaultPort });
        }, 1000);
      }

      if (event.Type === "container" && event.Action === "stop") {
        const container = await docker.getContainer(event.id);
        const containerInfo = await container.inspect();
        const containerName = containerInfo.Name.substring(1);

        if (db.has(containerName)) {
          console.log(`Removing ${containerName} from proxy list`);
          db.delete(containerName);
        }
      }
    } catch (err) {
      console.error(err);
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
  console.log(`proxying ${hostname} --> ${target}`);

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

  if (!db.has(subdomain)) {
    socket.destroy(); 
    return;
  }

  const { ipAddress, defaultPort } = db.get(subdomain);
  const target = `http://${ipAddress}:${defaultPort}`;
  console.log(`proxying WebSocket ${hostname} --> ${target}`);

  return proxy.ws(req, socket, head, {
    target,
    ws: true,
  });
});


const managmentAPI = express();
managmentAPI.use(express.json());


managmentAPI.post("/container", async (req, res) => {
  const image = "cloud-ide"; 
  const tag = "latest"; 
  
  let imageAlreadyExist = false;

  const images = await docker.listImages();
  for (const systemImage of images) {
    for (const systemTag of systemImage.RepoTags) {
      if (systemTag === `${image}:${tag}`) {
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

managmentAPI.post("/start", async (req, res) => {
  const { userId } = req.body;
  const containerOptions = {
    Image: "cloud-ide",
    name: `${userId}`,
    AutoRemove: true,
  };

  const container = await docker.createContainer(containerOptions);
  await container.start();

  setTimeout(async () => {
    await container.stop();
    await container.remove();
    console.log(`Container stopped and removed: ${userId}`);
  }, 60000);

  return res.json({
    status: "success",
    container: `${(await container.inspect()).Name}.localhost`,
  });
});

managmentAPI.post("/running", async (req, res) => {
  const { userId } = req.body;
  const containers = await docker.listContainers({ all: false });
  const isRunning = containers.some((container) =>
    container.Names.includes(`/${userId}`)
  );

  return res.json({
    running: isRunning,
  });
});

managmentAPI.post("/stop", async (req, res) => {
  const { userId } = req.body;
  const container = await docker.getContainer(`${userId}`);
  await container.stop();
  await container.remove();
  return res.json({
    status: "success",
  });
});

managmentAPI.listen(8080, () => {
  console.log("Management API listening on port 8080");
});

reverseProxy.listen(80, () => {
  console.log("Reverse proxy listening on port 80");
});