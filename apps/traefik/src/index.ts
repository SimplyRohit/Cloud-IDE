import Docker from "dockerode";
import express from "express";

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

  const container = await docker.createContainer({
    Image: `${image}:${tag}`,
    Tty: false,
    name: `${req.body.userId}`,
    Labels: {
      "traefik.enable": "true",
      "traefik.http.routers.userId.rule": `Host(\`${req.body.userId}.localhost\`)`,
      "traefik.http.routers.userId.entrypoints": "web",
      "traefik.http.services.userId.loadbalancer.server.port": "9000",
    },
  });

  await container.start();
  return res.json({
    status: "success",
    container: `${(await container.inspect()).Name}.localhost`,
  });
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
