import Docker from "dockerode";
import express from "express";
import cors from "cors";
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

async function listStopAndRemoveCloudIdeContainers() {
  const containers = await docker.listContainers({ all: true });
  const cloudIdeContainers = containers.filter((container) =>
    container.Image.startsWith("cloud-ide")
  );
  for (const containerInfo of cloudIdeContainers) {
    const container = docker.getContainer(containerInfo.Id);
    if (containerInfo.State === "running") {
      console.log(`Stopping running container: ${containerInfo.Names[0]}`);
      await container.stop();
    }
    console.log(`Removing container: ${containerInfo.Names[0]}`);
    await container.remove();
  }
  console.log("All 'cloud-ide' containers have been stopped and removed.");
}
listStopAndRemoveCloudIdeContainers()
  .then(() => console.log("Process completed successfully."))
  .catch((err) => console.error("Error during container cleanup: ", err));

const managementAPI = express();
managementAPI.use(cors());
managementAPI.use(express.json());

managementAPI.post("/start", async (req, res): Promise<any> => {
  const image = "cloud-ide";
  const tag = "latest";

  let imageAlreadyExist = false;

  const images = await docker.listImages();
  for (const systemImage of images) {
    for (const systemTag of systemImage.RepoTags || []) {
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

  try {
    const existingContainer = docker.getContainer(`${req.body.userId}`);
    const info = await existingContainer.inspect();
    if (!info.State.Running) {
      await existingContainer.start();
    }
    return res.json({
      status: "success",
      container: `${info.Name.substring(1)}.localhost`,
    });
  } catch (error: any) {
    if (error.statusCode !== 404) {
      console.error(error);
      return res.status(500).json({ error: "Failed to inspect container" });
    }
  }

  try {
    const container = await docker.createContainer({
      Image: `${image}:${tag}`,
      Tty: false,
      name: `${req.body.userId}`,
      Labels: {
        "traefik.enable": "true",
        [`traefik.http.routers.${req.body.userId}.rule`]: `Host(\`${req.body.userId}.localhost\`)`,
        [`traefik.http.routers.${req.body.userId}.entrypoints`]: "web",
        [`traefik.http.routers.${req.body.userId}.service`]: `${req.body.userId}`,
        [`traefik.http.services.${req.body.userId}.loadbalancer.server.port`]: "9000",

        [`traefik.http.routers.${req.body.userId}-3000.rule`]: `Host(\`3000-${req.body.userId}.localhost\`)`,
        [`traefik.http.routers.${req.body.userId}-3000.entrypoints`]: "web",
        [`traefik.http.routers.${req.body.userId}-3000.service`]: `${req.body.userId}-3000`,
        [`traefik.http.services.${req.body.userId}-3000.loadbalancer.server.port`]: "3000",

        [`traefik.http.routers.${req.body.userId}-3001.rule`]: `Host(\`3001-${req.body.userId}.localhost\`)`,
        [`traefik.http.routers.${req.body.userId}-3001.entrypoints`]: "web",
        [`traefik.http.routers.${req.body.userId}-3001.service`]: `${req.body.userId}-3001`,
        [`traefik.http.services.${req.body.userId}-3001.loadbalancer.server.port`]: "3001",

        [`traefik.http.routers.${req.body.userId}-8080.rule`]: `Host(\`8080-${req.body.userId}.localhost\`)`,
        [`traefik.http.routers.${req.body.userId}-8080.entrypoints`]: "web",
        [`traefik.http.routers.${req.body.userId}-8080.service`]: `${req.body.userId}-8080`,
        [`traefik.http.services.${req.body.userId}-8080.loadbalancer.server.port`]: "8080",
      },
    });

    await container.start();
    return res.json({
      status: "success",
      container: `${(await container.inspect()).Name.substring(1)}.localhost`,
    });
  } catch (error: any) {
    if (error.statusCode === 409) {
      const existingContainer = docker.getContainer(`${req.body.userId}`);
      const info = await existingContainer.inspect();
      if (!info.State.Running) {
        await existingContainer.start();
      }
      return res.json({
        status: "success",
        container: `${info.Name.substring(1)}.localhost`,
      });
    }
    console.error("Failed to create container:", error);
    return res.status(500).json({ error: "Failed to create container" });
  }
});

managementAPI.post("/running", async (req, res): Promise<any> => {
  const { userId } = req.body;
  const containers = await docker.listContainers({ all: false });
  const isRunning = containers.some((container) =>
    container.Names.includes(`/${userId}`)
  );

  return res.json({
    running: isRunning,
  });
});

managementAPI.post("/stop", async (req, res): Promise<any> => {
  const { userId } = req.body;
  const container = await docker.getContainer(`${userId}`);
  await container.stop();
  await container.remove();
  return res.json({
    status: "success",
  });
});

managementAPI.listen(8080, () => {
  console.log("Management API listening on port 8080");
});
