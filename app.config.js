export default {
  expo: {
    name: "RoomMate Pro",
    slug: "roommate-pro",
    version: "1.0.0",
    orientation: "portrait",
    icon: "https://via.placeholder.com/1024x1024/5D5FEF/FFFFFF?text=RP",
    userInterfaceStyle: "light",
    splash: {
      image: "https://via.placeholder.com/1284x2778/5D5FEF/FFFFFF?text=RoomMate%20Pro",
      resizeMode: "contain",
      backgroundColor: "#5D5FEF"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.roommatepro.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "https://via.placeholder.com/1024x1024/5D5FEF/FFFFFF?text=RP",
        backgroundColor: "#5D5FEF"
      },
      package: "com.roommatepro.app"
    },
    web: {
      favicon: "https://via.placeholder.com/32x32/5D5FEF/FFFFFF?text=RP",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      [
        "expo-dev-client",
        {
          "addGeneratedScheme": false
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    scheme: "roommatepro",
    newArchEnabled: false,
    updates: {
      enabled: false
    },
    // Better development experience
    developer: {
      tool: "expo-cli"
    },
    // Optimize for development
    packagerOpts: {
      config: "metro.config.js"
    }
  }
};