// pages/api/docker/stop.js
import { NextRequest, NextResponse } from "next/server";
import Docker from "dockerode";
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    const containerName = `container-${userId}`;
    const container = docker.getContainer(containerName);

    setTimeout(async () => {
      try {
        await container.stop();
        await container.remove();

        return NextResponse.json({
          message: "Docker container stopped and removed successfully!",
        });
      } catch (err) {
        console.error("Error during container stop/remove:", err);
        return NextResponse.json(
          { message: "Failed to stop Docker container", error: err },
          { status: 500 }
        );
      }
    }, 10000);

    return NextResponse.json({
      message: "Stopping the Docker container. Please wait...",
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { message: "Failed to process request", error },
      { status: 500 }
    );
  }
}
