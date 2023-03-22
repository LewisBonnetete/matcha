const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("pages/Profile.vue") },
      { path: "home", component: () => import("pages/Home.vue") },
      { path: "profile", component: () => import("pages/Profile.vue") },
      { path: ":id", component: () => import("pages/UserPage.vue") },
      { path: "likes", component: () => import("pages/Likes.vue") },
      { path: "settings", component: () => import("pages/Settings.vue") },
      { path: "login", component: () => import("pages/Login.vue") },
      { path: "resetPassword/:token", component: () => import("pages/ForgotPassword.vue"), name: "ForgotPassword" },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/Error404.vue"),
  },
];

export default routes;
