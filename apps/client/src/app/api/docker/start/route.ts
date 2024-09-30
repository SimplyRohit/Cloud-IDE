//sec/apps/api/docker/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import Docker from "dockerode";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const id = data.userId;
    const containerOptions = {
      Image: "cloud-ide:latest",
      name: `${id}`,
      AutoRemove: true,
    };

    setTimeout(async () => {
      try {
        console.log(`Stopping container: ${id}`);
        const container = docker.getContainer(id);
        await container.stop();
        await container.remove();
        console.log(`Container stopped and removed: ${id}`);
      } catch (err) {
        console.error(`Error stopping container: ${err}`);
      }
    }, 10000);

    const container = await docker.createContainer(containerOptions);

    await container.start();

    return NextResponse.json({
      message: "Docker container started",
    });
  } catch (error) {
    console.error("Error starting Docker container:", error);
    return NextResponse.json(
      { message: "Failed to start Docker container", error },
      { status: 500 }
    );
  }
}
