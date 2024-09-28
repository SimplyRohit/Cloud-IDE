import { NextRequest, NextResponse } from "next/server";
import Docker from "dockerode";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const id = data.userId;
    const containerOptions = {
      Image: "cloud-ide2",
      name: `container-${id}`,
      HostConfig: {
        PortBindings: {
          "9000/tcp": [
            {
              HostPort: "9000",
            },
          ],
        },
        Binds: [`${process.cwd()}/user:/usr/src/app/user`],
      },
      AutoRemove: true,
    };

    const container = await docker.createContainer(containerOptions);

    await container.start();

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
    }, 100000);

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
