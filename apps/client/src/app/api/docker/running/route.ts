// //sec/apps/api/docker/running/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import Docker from "dockerode";

// const docker = new Docker({ socketPath: "/var/run/docker.sock" });

// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = await req.json();

//     const containers = await docker.listContainers({ all: false });

//     const isRunning = containers.some((container) =>
//       container.Names.includes(`${userId}`)
//     );

//     return NextResponse.json({
//       running: isRunning,
//     });
//   } catch (error) {
//     console.error("Error checking running Docker container:", error);
//     return NextResponse.json(
//       { message: "Failed to check running Docker container", error },
//       { status: 500 }
//     );
//   }
// }
