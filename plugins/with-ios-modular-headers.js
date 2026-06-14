const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const POD_LINES = [
  "  pod 'GoogleUtilities', :modular_headers => true",
  "  pod 'RecaptchaInterop', :modular_headers => true",
];

function addModularHeaders(src) {
  if (POD_LINES.every((line) => src.includes(line))) {
    return src;
  }

  const marker = "  use_expo_modules!\n";
  if (!src.includes(marker)) {
    throw new Error("Could not find use_expo_modules! in ios/Podfile");
  }

  return src.replace(marker, `${marker}\n${POD_LINES.join("\n")}\n`);
}

module.exports = function withIosModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
      const podfile = fs.readFileSync(podfilePath, "utf8");
      fs.writeFileSync(podfilePath, addModularHeaders(podfile));
      return config;
    },
  ]);
};
