// Expo config plugin for Orun Voice Tile (Quick Settings)
// Adds the VoiceTileService to AndroidManifest.xml

const { withAndroidManifest, createRunOncePlugin } = require("@expo/config-plugins");

function withVoiceTile(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Ensure 'application' exists
    if (!manifest.application) {
      manifest.application = [{}];
    }

    const app = manifest.application[0];

    // Ensure 'service' array exists
    if (!app.service) {
      app.service = [];
    }

    // Add VoiceTileService if not already present
    const alreadyHas = app.service.some(
      (s) => s.$["android:name"] === "com.orun.os.voicetile.VoiceTileService"
    );

    if (!alreadyHas) {
      app.service.push({
        $: {
          "android:name": "com.orun.os.voicetile.VoiceTileService",
          "android:exported": "true",
          "android:permission": "android.permission.BIND_QUICK_SETTINGS_TILE",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name":
                    "android.service.quicksettings.action.QS_TILE",
                },
              },
            ],
          },
        ],
      });
    }

    // Ensure permissions exist
    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }

    const perms = manifest["uses-permission"].map(
      (p) => p.$["android:name"]
    );

    const needed = [
      "android.permission.BIND_QUICK_SETTINGS_TILE",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_MICROPHONE",
    ];

    for (const perm of needed) {
      if (!perms.includes(perm)) {
        manifest["uses-permission"].push({
          $: { "android:name": perm },
        });
      }
    }

    return config;
  });
}

module.exports = function (config) {
  return withVoiceTile(config);
};
