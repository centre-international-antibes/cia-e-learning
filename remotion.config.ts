/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// Cloud container: use the pre-installed headless Chromium (no download at render time).
// Override with REMOTION_BROWSER=/path/to/chrome when rendering elsewhere.
import fs from "node:fs";
const shell = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const browser = process.env.REMOTION_BROWSER ?? (fs.existsSync(shell) ? shell : null);
if (browser) {
  Config.setBrowserExecutable(browser);
}
Config.setChromiumOpenGlRenderer("swangle");
