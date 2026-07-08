import { Hono } from "hono";
import { adminMiddleware } from "../middleware/auth";
import { prisma } from "../utils";
import webpush from "web-push";
import { env } from "../config/env";

const notificationRoutes = new Hono();

const pushEnabled = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);

if (pushEnabled) {
  webpush.setVapidDetails(
    `mailto:${env.ADMIN_EMAIL}`,
    env.VAPID_PUBLIC_KEY!,
    env.VAPID_PRIVATE_KEY!
  );
} else {
  console.warn("⚠️ VAPID keys not provided. Web push notifications are disabled.");
}

notificationRoutes.use("*", adminMiddleware);

notificationRoutes.post("/subscribe", async (c) => {
  if (!pushEnabled) return c.json({ error: "Notifications désactivées" }, 503);

  const payload = c.get("jwtPayload") as { id: number };
  const subscription = await c.req.json();

  await prisma.utilisateurs.update({
    where: { id: payload.id },
    data: {
      push_subscription: JSON.stringify(subscription),
    },
  });

  return c.json({ success: true });
});

notificationRoutes.post("/test", async (c) => {
  if (!pushEnabled) return c.json({ error: "Notifications désactivées" }, 503);

  const payload = c.get("jwtPayload") as { id: number };
  const user = await prisma.utilisateurs.findUnique({
    where: { id: payload.id },
  });

  if (!user?.push_subscription) {
    return c.json({ error: "No subscription found" }, 400);
  }

  try {
    const subscription = JSON.parse(user.push_subscription);
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: "Test Vignebbk",
        body: "Ceci est une notification de test !",
        url: "/admin/orders",
      })
    );
    return c.json({ success: true });
  } catch (error) {
    console.error("Error sending notification:", error);
    return c.json({ error: "Failed to send notification" }, 500);
  }
});

export default notificationRoutes;
