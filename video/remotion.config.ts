import { Config } from "@remotion/cli/config";
Config.setRspack(true);
Config.setVideoImageFormat("png");
Config.setDisableSharedMemoryCapture(true);
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
if (process.env.REMOTION_BROWSER_EXECUTABLE)
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
